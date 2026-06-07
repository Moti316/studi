/**
 * scripts/generate-questions.ts — מנוע יצירת-שאלות-MCQ מעוגן-חקיקה (creator · Gemini-Flash).
 *
 * קורא נוסחי-חקיקה .md פר-scope → Gemini מחולל MCQ (4 מסיחים + תשובה + הסבר + ציטוט) →
 * **שער-אנטי-הזיה**: sourceQuote חייב להופיע מילולית בנוסח (אחרת drop) → upsert אידמפוטנטי.
 * status='מוסקנא' (נוצר-מכונה · לא 'מאומת' עד content-verifier). ⚠️ עולה כסף (אישור-מוטי).
 *
 *   tsx scripts/generate-questions.ts --dry-run            # אומדן, ללא Gemini/DB
 *   tsx scripts/generate-questions.ts --execute [--limit 10] [--per 4] [--scope 2.3]
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { geminiGenerateJSON, GeminiClientError } from '../src/lib/ai/client';
import { isTransientGeminiError, backoffMs } from '../src/lib/ai/retry';
import {
  GENERATED_MCQ_SCHEMA,
  buildQuestionRow,
  type GeneratedMCQ,
  type StatuteSource,
} from '../src/lib/import/generated-mcq';
import {
  GENERATE_QUESTION_SYSTEM,
  buildGenerateQuestionPrompt,
} from '../src/lib/ai/prompts/generate-question';
import { BUDGET } from './import-content.config';
import type { NewQuestion } from '../drizzle/schema';

const LEGI_DIR = join(process.cwd(), 'courses', 'safety-officer', 'sources', 'legislation');
const SKIP_FILES = new Set(['README.md', 'INDEX.md']);
const MIN_INTERVAL_MS = 4000; // RPM של generation נמוך מ-embeddings
let lastCallMs = 0;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

function parseFrontmatter(raw: string): { fm: Record<string, string>; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: raw };
  const fm: Record<string, string> = {};
  for (const line of (m[1] ?? '').split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv && kv[1]) fm[kv[1]] = (kv[2] ?? '').replace(/^['"]|['"]$/g, '').trim();
  }
  return { fm, body: (m[2] ?? '').trim() };
}
function* walkMd(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walkMd(p);
    else if (e.name.endsWith('.md') && !SKIP_FILES.has(e.name)) yield p;
  }
}
function loadStatutes(): StatuteSource[] {
  const out: StatuteSource[] = [];
  for (const path of walkMd(LEGI_DIR)) {
    const { fm, body } = parseFrontmatter(readFileSync(path, 'utf8'));
    if (!body || !fm.scope_id) continue;
    out.push({
      scopeId: fm.scope_id,
      title: fm.title ?? relative(LEGI_DIR, path).split(sep).join('/'),
      depth: fm.depth,
      body,
    });
  }
  return out.sort((a, b) => a.scopeId.localeCompare(b.scopeId, undefined, { numeric: true }));
}

async function generateForStatute(statute: StatuteSource, n: number): Promise<GeneratedMCQ[]> {
  for (let attempt = 0; attempt <= 6; attempt++) {
    const gap = Date.now() - lastCallMs;
    if (gap < MIN_INTERVAL_MS) await sleep(MIN_INTERVAL_MS - gap);
    lastCallMs = Date.now();
    try {
      const res = await geminiGenerateJSON<{ questions: GeneratedMCQ[] }>({
        system: GENERATE_QUESTION_SYSTEM,
        prompt: buildGenerateQuestionPrompt(statute, n),
        schema: GENERATED_MCQ_SCHEMA,
      });
      return Array.isArray(res?.questions) ? res.questions : [];
    } catch (err) {
      if (isTransientGeminiError(err) && attempt < 6) {
        const backoff = backoffMs(attempt);
        console.log(
          `  …זמני (429/5xx) — backoff ${Math.round(backoff / 1000)}s (${attempt + 1}/6)`,
        );
        await sleep(backoff);
        continue;
      }
      throw new GeminiClientError(`generate failed (scope=${statute.scopeId})`, err);
    }
  }
  return [];
}

async function main(): Promise<void> {
  const mode = process.argv.includes('--execute') ? 'execute' : 'dry-run';
  const per = Math.max(1, Number(arg('--per') ?? 4));
  const limit = arg('--limit') ? Math.max(1, Number(arg('--limit'))) : undefined;
  const scope = arg('--scope');

  let statutes = loadStatutes();
  if (scope) statutes = statutes.filter((s) => s.scopeId === scope);
  if (limit) statutes = statutes.slice(0, limit);

  const calls = statutes.length;
  const estUsd = calls * BUDGET.estUsdPerGeminiCall;
  console.log(`[generate] mode=${mode} · statutes=${calls} · per=${per} · ~${calls * per} MCQ`);
  console.log(
    `[generate] budget: ${calls}/${BUDGET.maxGeminiCalls} calls · est ≤ $${estUsd.toFixed(3)} (cap $${BUDGET.totalUsdHardCap})`,
  );
  if (calls === 0) throw new Error('no statutes selected');
  if (calls > BUDGET.maxGeminiCalls || estUsd > BUDGET.totalUsdHardCap) {
    throw new Error('budget exceeded — refusing to run (default-deny)');
  }

  if (mode === 'dry-run') {
    for (const s of statutes)
      console.log(
        `  · ${s.scopeId.padEnd(7)} ${s.title} (${s.body.length}B · depth=${s.depth ?? '?'})`,
      );
    console.log('[generate] dry-run: no Gemini calls, no DB writes.');
    return;
  }

  // upsert פר-נוסח (לא צבירה-לסוף): קריסה באמצע אינה מאבדת התקדמות/כסף, וכל נוסח
  // נשמר אידמפוטנטית מיד. נוסח שנכשל-קשות (אחרי מיצוי-retry) מדולג, לא-קטלני לכלל-הריצה.
  const { upsertQuestions } = await import('../src/lib/import/upsert-questions');
  let totalValid = 0;
  let totalDropped = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let failedStatutes = 0;
  for (const s of statutes) {
    let mcqs: GeneratedMCQ[];
    try {
      mcqs = await generateForStatute(s, per);
    } catch (err) {
      failedStatutes++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${s.scopeId.padEnd(7)} generation נכשל (מדולג): ${msg}`);
      continue;
    }
    const rows: NewQuestion[] = [];
    for (const mcq of mcqs) {
      const sourceRef = `gen:${s.scopeId}:${createHash('sha256').update(mcq.prompt).digest('hex').slice(0, 16)}`;
      const row = buildQuestionRow(mcq, s, sourceRef);
      if (row) rows.push(row);
      else totalDropped++;
    }
    totalValid += rows.length;
    let inserted = 0;
    let skipped = 0;
    if (rows.length > 0) ({ inserted, skipped } = await upsertQuestions(rows));
    totalInserted += inserted;
    totalSkipped += skipped;
    console.log(
      `  ✓ ${s.scopeId.padEnd(7)} ${rows.length}/${mcqs.length} MCQ (ציטוט-מאומת) → +${inserted} (${skipped} כבר-קיים)`,
    );
  }

  console.log(
    `[generate] done: valid ${totalValid} · dropped ${totalDropped} (הזיה/פסול) · inserted ${totalInserted} · skipped ${totalSkipped} (idempotent) · נוסחים-שנכשלו ${failedStatutes}/${statutes.length}.`,
  );
  // יציאה-כושלת רק אם כל-הריצה הייתה אובדן-מוחלט (0 הוכנסו ולפחות-נוסח-אחד נכשל); אחרת
  // הצלחה-חלקית = הצלחה (resume: הרצה-חוזרת ממשיכה למלא נוסחים-שנכשלו).
  if (totalInserted === 0 && failedStatutes > 0) {
    throw new Error(`all ${failedStatutes} statute(s) failed — no questions inserted`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[generate] FAILED:', err);
    process.exit(1);
  });

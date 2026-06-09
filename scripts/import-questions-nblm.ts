#!/usr/bin/env tsx
/**
 * scripts/import-questions-nblm.ts — מייבא שאלות רב-סוגיות (NotebookLM) ל-DB.
 *
 * קורא .cache/notebooklm/questions/<file>.json (מ-generate-questions-nblm), מנתב
 * פר-סוג → buildQuestionRow (mcq) / buildMatchingRow (matching) / buildOpenRow (open)
 * — כולם מפעילים שער-G3 (quoteAppearsInBody) ומפילים הזיות. כותב אידמפוטנטית
 * (sourceRef=nbq:<scope>:<type>:<hash>). dry-run כברירת-מחדל.
 *
 * שימוש:
 *   tsx scripts/import-questions-nblm.ts            # dry-run (דו"ח G3 פר-סוג)
 *   tsx scripts/import-questions-nblm.ts --execute  # כתיבה ל-DB
 *   tsx scripts/import-questions-nblm.ts --file questions-nblm --execute
 *
 * ⚠️ Phase 1.3 יוסיף שכבת אימות-סמנטי (citation-fit) לפני הכתיבה.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

import { loadStatutes } from './lib/load-statutes';
import {
  buildQuestionRow,
  type GeneratedMCQ,
  type StatuteSource,
} from '../src/lib/import/generated-mcq';
import { buildMatchingRow, buildOpenRow } from '../src/lib/import/map-nblm-question';
import {
  buildVerificationGroups,
  parseExcludeRefs,
  filterExcluded,
  type BuiltMatch,
} from '../src/lib/import/question-verification-io';
import type { FlatMatchingPair, FlatOpenQa } from '../src/lib/notebooklm/adapt-flat-questions';
import type { NewQuestion } from '../drizzle/schema';

const CACHE_DIR = resolve('.cache', 'notebooklm', 'questions');
const DEFAULT_FILE = 'questions-nblm';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
const hash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

type CacheItem = { scopeId: string; type: 'mcq' | 'matching' | 'open'; items: unknown[] };

interface TypeStat {
  built: number;
  dropped: number;
}

async function main(): Promise<void> {
  const mode = process.argv.includes('--execute') ? 'execute' : 'dry-run';
  const fileArg = arg('--file') ?? DEFAULT_FILE;
  const cachePath = join(CACHE_DIR, `${fileArg}.json`);

  if (!existsSync(cachePath)) {
    console.error(
      `[import-questions] קובץ-cache לא נמצא: ${cachePath}\n  הרץ קודם: pnpm questions:generate`,
    );
    process.exit(1);
  }

  let cache: { items: CacheItem[] };
  try {
    cache = JSON.parse(readFileSync(cachePath, 'utf8')) as { items: CacheItem[] };
    if (!Array.isArray(cache.items)) throw new Error('חסר items[]');
  } catch (err) {
    console.error(
      `[import-questions] פרסור-cache נכשל: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  // אינדקס נוסחים לפי scope. scopeId יחיד עשוי למפות למספר נוסחים (4.3×3 · 2.8×2 ·
  // 2.10×2) — לכן רשימה, וה-G3 בוחר את הנוסח-שאליו הציטוט מעוגן (מונע אובדן-תשואה).
  const statutesByScope = new Map<string, StatuteSource[]>();
  for (const s of loadStatutes()) {
    const arr = statutesByScope.get(s.scopeId);
    if (arr) arr.push(s);
    else statutesByScope.set(s.scopeId, [s]);
  }

  const built: BuiltMatch[] = [];
  const stats: Record<string, TypeStat> = {
    mcq: { built: 0, dropped: 0 },
    matching: { built: 0, dropped: 0 },
    open: { built: 0, dropped: 0 },
  };
  let noStatute = 0;

  /** מנסה לבנות שורה מול כל נוסח-מועמד; מחזיר את ההתאמה-הראשונה שעברה G3 (או null). */
  function tryMatch(
    candidates: StatuteSource[],
    build: (st: StatuteSource) => NewQuestion | null,
  ): BuiltMatch | null {
    for (const st of candidates) {
      const row = build(st);
      if (row) return { row, statute: st };
    }
    return null;
  }

  for (const item of cache.items) {
    const candidates = statutesByScope.get(item.scopeId);
    if (!candidates || candidates.length === 0) {
      noStatute++;
      continue;
    }
    const st = stats[item.type]!;

    if (item.type === 'mcq') {
      for (const mcq of item.items as GeneratedMCQ[]) {
        const ref = `nbq:${item.scopeId}:mcq:${hash(mcq.prompt ?? '')}`;
        const m = tryMatch(candidates, (s) => buildQuestionRow(mcq, s, ref));
        if (m) {
          built.push(m);
          st.built++;
        } else st.dropped++;
      }
    } else if (item.type === 'matching') {
      const pairs = item.items as FlatMatchingPair[];
      const key = hash(pairs.map((p) => p.term).join('|'));
      const ref = `nbq:${item.scopeId}:matching:${key}`;
      const m = tryMatch(candidates, (s) => buildMatchingRow(pairs, s, ref));
      if (m) {
        built.push(m);
        st.built++;
      } else st.dropped++;
    } else {
      for (const qa of item.items as FlatOpenQa[]) {
        const ref = `nbq:${item.scopeId}:open:${hash(qa.prompt ?? '')}`;
        const m = tryMatch(candidates, (s) => buildOpenRow(qa, s, ref));
        if (m) {
          built.push(m);
          st.built++;
        } else st.dropped++;
      }
    }
  }

  const rows: NewQuestion[] = built.map((b) => b.row);

  console.log(
    `[import-questions] mode=${mode} · file=${fileArg} · cache-items=${cache.items.length}`,
  );
  console.log('──── דו"ח G3 פר-סוג (built = מעוגן · dropped = הזיה/לא-verbatim) ────');
  for (const t of ['mcq', 'matching', 'open']) {
    console.log(`  ${t.padEnd(9)} built=${stats[t]!.built} · dropped=${stats[t]!.dropped}`);
  }
  if (noStatute > 0) console.log(`  ⚠️ ${noStatute} cache-items ללא-נוסח-תואם (דולגו)`);
  console.log(`  סה"כ שורות-מוכנות (G3): ${rows.length}`);

  // ── sidecar לאימות-Workflow: קבוצות פר-נוסח (גוף-החוק + שאלותיו) ──
  // נכתב תמיד (dry+execute) → ה-Workflow (Claude · citation-fit) צורך אותו ומפיק
  // <file>.held.json שמוזן בחזרה דרך --exclude.
  const builtPath = join(CACHE_DIR, `${fileArg}.built.json`);
  const groups = buildVerificationGroups(built);
  writeFileSync(
    builtPath,
    JSON.stringify(
      { file: fileArg, generatedAt: new Date().toISOString(), totalQuestions: rows.length, groups },
      null,
      2,
    ),
    'utf8',
  );
  console.log(`  📋 sidecar-אימות: ${groups.length} קבוצות → ${builtPath}`);

  // ── סינון held (מ-Workflow אימות · --exclude <name>) — לפני כתיבה ל-DB ──
  let toWrite = rows;
  const excludeArg = arg('--exclude');
  if (excludeArg) {
    const excludePath = join(CACHE_DIR, `${excludeArg}.json`);
    if (existsSync(excludePath)) {
      const refs = parseExcludeRefs(readFileSync(excludePath, 'utf8'));
      const { kept, excluded } = filterExcluded(toWrite, refs);
      console.log(
        `[import-questions] exclude=${excludeArg} · השמטו ${excluded.length} (held) · נותרו ${kept.length}`,
      );
      toWrite = kept;
    } else {
      console.warn(`[import-questions] ⚠️ קובץ-exclude לא נמצא: ${excludePath} (ממשיך ללא-סינון)`);
    }
  }

  // ── שלב אימות-סמנטי (אופציונלי · --semantic · Gemini · citation-fit) ──
  if (process.argv.includes('--semantic') && toWrite.length > 0) {
    const { verifyQuestionsSemantically } =
      await import('../src/lib/import/semantic-verify-questions');
    const { geminiVerifyQuestion } =
      await import('../src/lib/ai/prompts/semantic-verify-questions');
    console.log(
      `[import-questions] אימות-סמנטי (${toWrite.length} שאלות · Gemini · citation-fit/עברית/scope)...`,
    );
    const { passed, held } = await verifyQuestionsSemantically(toWrite, geminiVerifyQuestion);
    console.log(`  סמנטי: ${passed.length} עברו · ${held.length} מוחזקים`);
    for (const h of held.slice(0, 12)) {
      console.log(
        `   · held [${h.row.type}] ${String(h.row.prompt).slice(0, 48)} — ${h.reasons.join('; ')}`,
      );
    }
    toWrite = passed;
  }

  if (mode === 'dry-run') {
    console.log(
      `[import-questions] dry-run — 0 נכתבו (${toWrite.length} היו נכתבים). הוסף --execute.`,
    );
    return;
  }

  if (toWrite.length === 0) {
    console.log('[import-questions] אין שורות לכתיבה.');
    return;
  }

  const { upsertQuestions } = await import('../src/lib/import/upsert-questions');
  const { inserted, skipped } = await upsertQuestions(toWrite);
  console.log(`[import-questions] done: inserted=${inserted} · skipped=${skipped} (אידמפוטנטי).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[import-questions] FAILED:', err);
    process.exit(1);
  });

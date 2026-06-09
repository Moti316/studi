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

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

import { loadStatutes } from './lib/load-statutes';
import {
  buildQuestionRow,
  type GeneratedMCQ,
  type StatuteSource,
} from '../src/lib/import/generated-mcq';
import { buildMatchingRow, buildOpenRow } from '../src/lib/import/map-nblm-question';
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

  // אינדקס נוסחים לפי scope (לגוף-G3).
  const statuteByScope = new Map<string, StatuteSource>();
  for (const s of loadStatutes()) statuteByScope.set(s.scopeId, s);

  const rows: NewQuestion[] = [];
  const stats: Record<string, TypeStat> = {
    mcq: { built: 0, dropped: 0 },
    matching: { built: 0, dropped: 0 },
    open: { built: 0, dropped: 0 },
  };
  let noStatute = 0;

  for (const item of cache.items) {
    const statute = statuteByScope.get(item.scopeId);
    if (!statute) {
      noStatute++;
      continue;
    }
    const st = stats[item.type]!;

    if (item.type === 'mcq') {
      for (const mcq of item.items as GeneratedMCQ[]) {
        const row = buildQuestionRow(
          mcq,
          statute,
          `nbq:${item.scopeId}:mcq:${hash(mcq.prompt ?? '')}`,
        );
        if (row) {
          rows.push(row);
          st.built++;
        } else st.dropped++;
      }
    } else if (item.type === 'matching') {
      const pairs = item.items as FlatMatchingPair[];
      const key = hash(pairs.map((p) => p.term).join('|'));
      const row = buildMatchingRow(pairs, statute, `nbq:${item.scopeId}:matching:${key}`);
      if (row) {
        rows.push(row);
        st.built++;
      } else st.dropped++;
    } else {
      for (const qa of item.items as FlatOpenQa[]) {
        const row = buildOpenRow(qa, statute, `nbq:${item.scopeId}:open:${hash(qa.prompt ?? '')}`);
        if (row) {
          rows.push(row);
          st.built++;
        } else st.dropped++;
      }
    }
  }

  console.log(
    `[import-questions] mode=${mode} · file=${fileArg} · cache-items=${cache.items.length}`,
  );
  console.log('──── דו"ח G3 פר-סוג (built = מעוגן · dropped = הזיה/לא-verbatim) ────');
  for (const t of ['mcq', 'matching', 'open']) {
    console.log(`  ${t.padEnd(9)} built=${stats[t]!.built} · dropped=${stats[t]!.dropped}`);
  }
  if (noStatute > 0) console.log(`  ⚠️ ${noStatute} cache-items ללא-נוסח-תואם (דולגו)`);
  console.log(`  סה"כ שורות-מוכנות (G3): ${rows.length}`);

  // ── שלב אימות-סמנטי (אופציונלי · --semantic · Gemini · citation-fit) ──
  let toWrite = rows;
  if (process.argv.includes('--semantic') && rows.length > 0) {
    const { verifyQuestionsSemantically } =
      await import('../src/lib/import/semantic-verify-questions');
    const { geminiVerifyQuestion } =
      await import('../src/lib/ai/prompts/semantic-verify-questions');
    console.log(
      `[import-questions] אימות-סמנטי (${rows.length} שאלות · Gemini · citation-fit/עברית/scope)...`,
    );
    const { passed, held } = await verifyQuestionsSemantically(rows, geminiVerifyQuestion);
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

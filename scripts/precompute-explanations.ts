#!/usr/bin/env tsx
/**
 * scripts/precompute-explanations.ts — מטמיע "הסבר לעומק" מראש ב-questions.explanation.
 *
 * מטרה: **לבטל את תלות-ה-Gemini בזמן-ריצה** — מייצר את הסבר-ה-RAG פעם-אחת (offline,
 * כאן יש מפתח + retry שרוכב על סערות-503), שומר ב-DB, וה-runtime מציג מה-DB.
 *
 * idempotent + resume: מעבד רק שאלות עם explanation=NULL (in_scope). per-item UPDATE
 * + backoff-ארוך + per-item try/catch (שאלה שנכשלת מדולגת, לא-קטלנית). הרצה-חוזרת
 * ממשיכה את מה שלא הושלם. ⚠️ עולה כסף (Gemini · ~2 קריאות לשאלה).
 *
 *   tsx scripts/precompute-explanations.ts --dry-run            # ספירה בלבד
 *   tsx scripts/precompute-explanations.ts --execute [--limit N]
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import type { RetryOptions } from '../src/lib/ai/retry';

/** backoff-ארוך לריצת-offline (רוכב על סערות-503/429 של free-tier). */
const OFFLINE_RETRY: RetryOptions = { maxRetries: 6, baseMs: 4_000, capMs: 60_000 };
/** תקרת-בטיחות (default-deny על runaway). ~2 קריאות/שאלה. */
const MAX_QUESTIONS = 2000;
const EST_USD_PER_Q = 0.0016;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const mode = process.argv.includes('--execute') ? 'execute' : 'dry-run';
  const limit = arg('--limit') ? Math.max(1, Number(arg('--limit'))) : undefined;

  const { sql } = await import('drizzle-orm');
  const { db } = await import('../src/lib/db');

  // resume: רק שאלות ללא-הסבר (in_scope). per-item UPDATE → הרצה-חוזרת ממשיכה.
  const pending = await db.execute(
    sql`SELECT id, prompt, correct_answer FROM questions
        WHERE explanation IS NULL AND in_scope = true
        ORDER BY created_at ASC`,
  );
  const all = pending as unknown as Array<{ id: string; prompt: unknown; correct_answer: unknown }>;
  const rows = limit ? all.slice(0, limit) : all;

  const estUsd = rows.length * EST_USD_PER_Q;
  console.log(
    `[precompute] mode=${mode} · pending(explanation=NULL)=${all.length} · this-run=${rows.length} · est ≤ $${estUsd.toFixed(3)}`,
  );
  if (rows.length > MAX_QUESTIONS)
    throw new Error(`refusing: ${rows.length} > cap ${MAX_QUESTIONS}`);
  if (mode === 'dry-run') {
    console.log('[precompute] dry-run: no Gemini calls, no DB writes.');
    return;
  }

  const { buildDeepExplanation } = await import('../src/lib/rag/deep-explanation-core');

  let done = 0;
  let failed = 0;
  for (const q of rows) {
    const ca: unknown = q.correct_answer;
    const correctAnswer =
      typeof ca === 'string'
        ? ca
        : ca &&
            typeof ca === 'object' &&
            'text' in ca &&
            typeof (ca as { text?: unknown }).text === 'string'
          ? (ca as { text: string }).text
          : null;
    try {
      const { explanation, sources } = await buildDeepExplanation(
        { prompt: String(q.prompt), correctAnswer },
        OFFLINE_RETRY,
      );
      const srcLine = sources.length
        ? `\n\nמקורות: ${sources
            .map((s) => (s.scopeIds.length ? `${s.title} (§${s.scopeIds.join(', ')})` : s.title))
            .join(' · ')}`
        : '';
      const stored = `${explanation.trim()}${srcLine}`;
      await db.execute(sql`UPDATE questions SET explanation = ${stored} WHERE id = ${q.id}`);
      done++;
      if (done % 10 === 0) console.log(`  …${done}/${rows.length} הוטמעו`);
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${q.id} נכשל (מדולג): ${msg}`);
    }
  }

  console.log(`[precompute] done: ${done} הוטמעו · ${failed} נכשלו (resume בהרצה-חוזרת).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[precompute] FAILED:', err);
    process.exit(1);
  });

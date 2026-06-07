#!/usr/bin/env tsx
/**
 * scripts/import-qa-bank.ts — ייבוא בנק-שו"ת-פתוח (PDF מצגת) ל-`questions`.
 *
 * נתיב **דטרמיניסטי לחלוטין — אפס Gemini, אפס הזיה**: PDF → parsePdfQa (חילוץ
 * שאלה+תשובת-מודל) → mapQuestion ('open' → 'explanation' · התשובה ב-correct_answer:{text})
 * → upsert אידמפוטנטי (source_ref = qa:<fileId>:<hash>). מתאים לבנק-הוועדה (570 שאלות).
 *
 * הקובץ נקרא מ-cache (.cache/drive/<id>.pdf); אם חסר — מורד מ-Drive (creator-gated).
 * status='מוסקנא' (לא 'מאומת' עד content-verifier). scope_refs=[] (תיוג-scope = follow-up).
 *
 *   tsx scripts/import-qa-bank.ts --dry-run            # פרסור + דגימה, ללא DB
 *   tsx scripts/import-qa-bank.ts --execute [--file <driveId>] [--limit N]
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { createHash } from 'node:crypto';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parsePdfQa } from './parsers/parse-pdf-qa';
import { mapQuestion } from '../src/lib/import/map-question';
import type { NewQuestion } from '../drizzle/schema';

/** ברירת-מחדל: "מאגר שאלות הכנה לוועדה - כללי - ספטמבר 2025" (570 שאלות). */
const DEFAULT_FILE_ID = '1BA9XpSDVNx-MVbiyQZCndeyMVROTZ0aG';
const CACHE_DIR = resolve('.cache', 'drive');

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

/** מחזיר נתיב-cache מקומי ל-PDF; מוריד מ-Drive אם חסר. */
async function ensurePdf(fileId: string): Promise<string> {
  const cachePath = join(CACHE_DIR, `${fileId}.pdf`);
  if (existsSync(cachePath)) return cachePath;
  mkdirSync(CACHE_DIR, { recursive: true });
  const { downloadFile } = await import('../src/lib/drive/client');
  const buf = await downloadFile(fileId);
  writeFileSync(cachePath, buf);
  return cachePath;
}

async function main(): Promise<void> {
  const mode = process.argv.includes('--execute') ? 'execute' : 'dry-run';
  const fileId = arg('--file') ?? DEFAULT_FILE_ID;
  const limit = arg('--limit') ? Math.max(1, Number(arg('--limit'))) : undefined;

  const pdfPath = await ensurePdf(fileId);
  const parsed = await parsePdfQa(pdfPath);
  let questions = parsed.questions;
  if (limit) questions = questions.slice(0, limit);

  console.log(
    `[qa-import] mode=${mode} · file=${fileId} · parsed=${parsed.totalQuestions} MCQ-פתוח`,
  );

  // עיצוב ל-rows (אפס-Gemini): source_ref מבוסס-תוכן → אידמפוטנטי.
  const rows: NewQuestion[] = questions.map((pq) => {
    const ref = `qa:${fileId}:${createHash('sha256').update(pq.question).digest('hex').slice(0, 16)}`;
    return mapQuestion(pq, ref);
  });

  if (mode === 'dry-run') {
    for (const r of rows.slice(0, 5)) {
      const ca: unknown = r.correctAnswer;
      const ans =
        ca && typeof ca === 'object' && 'text' in ca ? (ca as { text: string }).text : '?';
      console.log(`  · [${r.status}] ${r.prompt.slice(0, 60)} → ${String(ans).slice(0, 60)}`);
    }
    console.log(`[qa-import] dry-run: ${rows.length} rows valid, no DB writes.`);
    return;
  }

  const { upsertQuestions } = await import('../src/lib/import/upsert-questions');
  const { inserted, skipped } = await upsertQuestions(rows);
  console.log(
    `[qa-import] done: ${rows.length} rows · inserted ${inserted} · skipped ${skipped} (idempotent).`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[qa-import] FAILED:', err);
    process.exit(1);
  });

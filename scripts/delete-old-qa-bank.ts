#!/usr/bin/env tsx
/**
 * scripts/delete-old-qa-bank.ts — מחיקה-בטוחה של בנק-השו"ת הישן (qa:%) מ-DB.
 *
 * WHY: מיני-קורס השו"ת עובר לשאלות-NotebookLM רב-סוגיות (nbq:%) מקורפוס-החקיקה;
 * ~460 שאלות-הבנק הישנות (source_ref LIKE 'qa:%' · type='explanation' · ללא-FK)
 * מוחלפות. הסקריפט מוחק רק את ה-qa:% (לא נוגע ב-nbq:% / gen:% / scn:%).
 *
 * זהיר: dry-run כברירת-מחדל (מונים בלבד). מחיקה רק תחת --execute.
 * רצף-מומלץ: questions:import (--execute) → smoke /lesson/practice → רק-אז qa:delete.
 *
 * שימוש:
 *   tsx scripts/delete-old-qa-bank.ts            # dry-run (מונה)
 *   tsx scripts/delete-old-qa-bank.ts --execute  # מחיקה
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

const QA_LIKE = 'qa:%';

async function main(): Promise<void> {
  const execute = process.argv.includes('--execute');
  const { sql } = await import('drizzle-orm');
  const { db } = await import('../src/lib/db');

  const countRows = (await db.execute(
    sql`SELECT count(*)::int AS n FROM questions WHERE source_ref LIKE ${QA_LIKE}`,
  )) as unknown as Array<{ n: number }>;
  const n = countRows[0]?.n ?? 0;

  console.log(`[delete-qa-bank] mode=${execute ? 'EXECUTE' : 'dry-run'}`);
  console.log(`  questions (source_ref LIKE 'qa:%'):  ${n}`);

  if (!execute) {
    console.log('[delete-qa-bank] dry-run — לא נמחק דבר. הוסף --execute למחיקה.');
    return;
  }
  if (n === 0) {
    console.log('[delete-qa-bank] אין שאלות-בנק-ישנות למחיקה.');
    return;
  }

  await db.execute(sql`DELETE FROM questions WHERE source_ref LIKE ${QA_LIKE}`);
  const afterRows = (await db.execute(
    sql`SELECT count(*)::int AS n FROM questions WHERE source_ref LIKE ${QA_LIKE}`,
  )) as unknown as Array<{ n: number }>;
  console.log(`[delete-qa-bank] נמחקו · נותרו qa:%: ${afterRows[0]?.n ?? -1} (ציפייה: 0)`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[delete-qa-bank] FAILED:', err);
    process.exit(1);
  });

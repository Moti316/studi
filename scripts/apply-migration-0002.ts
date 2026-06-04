/**
 * scripts/apply-migration-0002.ts — מחיל את מיגרציה 0002 (questions.source_ref + index)
 * על ה-DB החי, **אידמפוטנטית** (IF NOT EXISTS). חד-פעמי: ה-DB נוצר מ-0001 ישן
 * (לפני ש-source_ref נוסף לסכמה) ו-0002 מעולם לא הוחל ב-Supabase → ייבוא-T1 נכשל
 * ב-`column "source_ref" does not exist`. ראה supabase/migrations/0002_add_questions_source_ref.sql.
 *
 * הרצה: tsx scripts/apply-migration-0002.ts
 */
// dotenv ראשון — db/index.ts קורא process.env.DATABASE_URL בעת-import (לכן db מיובא דינמית).
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

async function main(): Promise<void> {
  const { sql } = await import('drizzle-orm');
  const { db } = await import('../src/lib/db');

  const statements = [
    `ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "source_ref" text`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "idx_questions_source_ref" ON "questions" USING btree ("source_ref")`,
  ];
  for (const stmt of statements) {
    await db.execute(sql.raw(stmt));
    console.log('✓', stmt.slice(0, 78));
  }
  console.log('[apply-0002] done — questions.source_ref + idx_questions_source_ref ensured.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[apply-0002] FAILED:', err);
    process.exit(1);
  });

/**
 * scripts/apply-migration-0003.ts — מחיל את מיגרציה 0003 (unique-index על
 * scenarios.source_ref) על ה-DB החי, **אידמפוטנטית** (IF NOT EXISTS).
 *
 * WHY: טבלת scenarios נושאת source_ref (מ-0001) אך מעולם לא אונדקס (בניגוד ל-questions
 * ב-0002). מנוע-ייבוא-התרחישים (NotebookLM · Stage 1) דורש ON CONFLICT (source_ref)
 * אידמפוטנטי. ראה supabase/migrations/0003_add_scenarios_source_ref_index.sql.
 *
 * הרצה: tsx scripts/apply-migration-0003.ts
 */
// dotenv ראשון — db/index.ts קורא process.env.DATABASE_URL בעת-import (לכן db מיובא דינמית).
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

async function main(): Promise<void> {
  const { sql } = await import('drizzle-orm');
  const { db } = await import('../src/lib/db');

  const statements = [
    `CREATE UNIQUE INDEX IF NOT EXISTS "idx_scenarios_source_ref" ON "scenarios" USING btree ("source_ref")`,
  ];
  for (const stmt of statements) {
    await db.execute(sql.raw(stmt));
    console.log('✓', stmt.slice(0, 78));
  }
  console.log('[apply-0003] done — idx_scenarios_source_ref ensured.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[apply-0003] FAILED:', err);
    process.exit(1);
  });

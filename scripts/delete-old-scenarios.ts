#!/usr/bin/env tsx
/**
 * scripts/delete-old-scenarios.ts — מחיקה-בטוחה של תרחישי-ה-import הישנים מ-DB.
 *
 * WHY: רגנרציה ל-4-חלקים משתמשת באותם source_ref (scn:scenarios-expand:N), ו-import
 * הוא `ON CONFLICT (source_ref) DO NOTHING` → בלי מחיקת-הישנים, הייבוא-החדש מדלג.
 * הסקריפט מוחק רק את התרחישים-המיובאים (source_ref LIKE 'scn:scenarios-expand:%')
 * + שאלות-הליווי שלהם (scenario_walkthrough · לפי scenario_id) — לא נוגע בבנק-השו"ת/MCQ.
 *
 * זהיר: dry-run כברירת-מחדל (מונים בלבד). מחיקה רק תחת --execute.
 * סדר: questions לפי scenario_id (FK) → scenarios.
 *
 * שימוש:
 *   tsx scripts/delete-old-scenarios.ts            # dry-run (מונים)
 *   tsx scripts/delete-old-scenarios.ts --execute  # מחיקה בפועל
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

const SCN_LIKE = 'scn:scenarios-expand:%';

async function main(): Promise<void> {
  const execute = process.argv.includes('--execute');
  const { sql } = await import('drizzle-orm');
  const { db } = await import('../src/lib/db');

  // 1) מזהי-התרחישים-הישנים
  const idRows = (await db.execute(
    sql`SELECT id FROM scenarios WHERE source_ref LIKE ${SCN_LIKE}`,
  )) as unknown as Array<{ id: string }>;
  const ids = idRows.map((r) => r.id);

  // 2) ספירת שאלות-ליווי שמצביעות על תרחישים-אלה
  const qCountRows = (await db.execute(
    sql`SELECT count(*)::int AS n FROM questions WHERE source_ref LIKE 'scnq:scenarios-expand:%'`,
  )) as unknown as Array<{ n: number }>;
  const qCount = qCountRows[0]?.n ?? 0;

  console.log(`[delete-old-scenarios] mode=${execute ? 'EXECUTE' : 'dry-run'}`);
  console.log(`  scenarios (scn:scenarios-expand:%):      ${ids.length}`);
  console.log(`  companion questions (scnq:...):          ${qCount}`);

  if (!execute) {
    console.log('[delete-old-scenarios] dry-run — לא נמחק דבר. הוסף --execute למחיקה.');
    return;
  }

  if (ids.length === 0) {
    console.log('[delete-old-scenarios] אין תרחישים-ישנים למחיקה.');
    return;
  }

  // 3) מחק שאלות-ליווי (כל שאלה שמצביעה על תרחיש-ישן · FK-safe) — לפי scenario_id.
  const delQ = (await db.execute(
    sql`DELETE FROM questions WHERE scenario_id IN (
          SELECT id FROM scenarios WHERE source_ref LIKE ${SCN_LIKE}
        )`,
  )) as unknown as { count?: number };
  // 4) מחק את התרחישים-הישנים.
  const delS = (await db.execute(
    sql`DELETE FROM scenarios WHERE source_ref LIKE ${SCN_LIKE}`,
  )) as unknown as { count?: number };

  // 5) אימות
  const afterRows = (await db.execute(
    sql`SELECT count(*)::int AS n FROM scenarios WHERE source_ref LIKE ${SCN_LIKE}`,
  )) as unknown as Array<{ n: number }>;
  const after = afterRows[0]?.n ?? -1;

  console.log(
    `[delete-old-scenarios] נמחקו: questions≈${delQ.count ?? '?'} · scenarios≈${delS.count ?? '?'}`,
  );
  console.log(`[delete-old-scenarios] נותרו תרחישי-import: ${after} (ציפייה: 0)`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[delete-old-scenarios] FAILED:', err);
    process.exit(1);
  });

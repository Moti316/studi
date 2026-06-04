/**
 * scripts/verify-questions.ts — בדיקת-שפיות (read-only) על טבלת questions אחרי ייבוא:
 * סה"כ · in_scope · התפלגות-סטטוס · התפלגות-scope · דגימת-prompt.
 * הרצה: tsx scripts/verify-questions.ts
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

async function main(): Promise<void> {
  const { sql } = await import('drizzle-orm');
  const { db } = await import('../src/lib/db');

  const total = await db.execute(sql`SELECT count(*)::int AS c FROM questions`);
  const inScope = await db.execute(
    sql`SELECT count(*)::int AS c FROM questions WHERE in_scope = true`,
  );
  const byStatus = await db.execute(
    sql`SELECT status, count(*)::int AS c FROM questions GROUP BY status ORDER BY c DESC`,
  );
  const byScope = await db.execute(
    sql`SELECT jsonb_array_elements(scope_refs)->>'id' AS scope, count(*)::int AS c FROM questions GROUP BY 1 ORDER BY c DESC`,
  );
  const sample = await db.execute(
    sql`SELECT type, in_scope, scope_refs, left(prompt, 70) AS prompt FROM questions ORDER BY created_at DESC LIMIT 5`,
  );

  console.log('── questions verify ──');
  console.log('total       :', total[0]?.c);
  console.log('in_scope    :', inScope[0]?.c);
  console.log('by status   :', byStatus);
  console.log('by scope    :', byScope);
  console.log('sample (5)  :');
  for (const r of sample) console.log('  ·', JSON.stringify(r));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[verify-questions] FAILED:', err);
    process.exit(1);
  });

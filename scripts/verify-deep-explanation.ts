/**
 * scripts/verify-deep-explanation.ts — אימות end-to-end של ה-RAG הסבר-לעומק:
 * שולף שאלה in_scope אמיתית → מריץ את ה-Server Action → מדפיס הסבר+מקורות.
 * ⚠️ קורא ל-Gemini (embed+generate) ⇒ עולה כסף זעום. הרצה: tsx scripts/verify-deep-explanation.ts
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

async function main(): Promise<void> {
  const { sql } = await import('drizzle-orm');
  const { db } = await import('../src/lib/db');
  const { generateDeepExplanation } =
    await import('../src/features/lesson-player/deep-explanation.action');

  const chunkRows = await db.execute(sql`SELECT count(*)::int AS c FROM chunks`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.log('[verify-dx] chunks embedded:', (chunkRows as any[])[0]?.c);

  const rows = await db.execute(
    sql`SELECT id::text AS id, left(prompt, 70) AS p FROM questions WHERE in_scope = true ORDER BY created_at LIMIT 1`,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = (rows as any[])[0];
  if (!q) throw new Error('no in_scope question found');
  console.log('[verify-dx] question:', q.p);

  const res = await generateDeepExplanation(q.id);
  console.log('\n[verify-dx] EXPLANATION:\n' + res.explanation);
  console.log('\n[verify-dx] SOURCES:', JSON.stringify(res.sources, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[verify-dx] FAILED:', err);
    process.exit(1);
  });

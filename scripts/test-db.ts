#!/usr/bin/env tsx
/**
 * DB connection sanity test.
 *
 * Usage:  npx tsx scripts/test-db.ts   (or add a `db:test` script)
 *
 * Verifies DATABASE_URL works end-to-end: connects to Supabase Postgres,
 * checks the coverage_tracker view (expected 57 rows) and lists public tables.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes('PASTE_')) {
    console.error('❌ DATABASE_URL is not set (still a placeholder) in .env.local');
    process.exit(1);
  }

  console.log('🔍 DB connection test\n');
  const sql = postgres(url, { prepare: false });

  try {
    const countRows = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM coverage_tracker`;
    console.log(`  ✅ coverage_tracker rows: ${countRows[0]?.count}  (expected 57)`);

    const tables = await sql<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name`;
    console.log(
      `  ✅ public tables (${tables.length}): ${tables.map((t) => t.table_name).join(', ')}`,
    );

    console.log('\n✅ DB connection works.');
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('❌ DB test failed:', err.message);
  process.exit(1);
});

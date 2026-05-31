/**
 * src/lib/import/upsert-questions.ts — idempotent bulk insert of imported
 * questions into the `questions` table via Drizzle.
 *
 * ⚠️ SERVER-ONLY (imports `@/lib/db`, which reads DATABASE_URL from process.env
 * and opens a Postgres connection). Never import into a client bundle. Called
 * by the import orchestrator (`scripts/import-content.ts`) under `--execute`.
 *
 * Idempotency: the row's `source_ref` is a deterministic provenance key
 * (hash of file-id + question index). We `ON CONFLICT (source_ref) DO NOTHING`,
 * so re-running the import never duplicates and never overwrites a row that may
 * have been hand-curated after the first import. A conflicting row is reported
 * as `skipped`, an actually-written row as `inserted`.
 *
 * NOTE: this relies on the UNIQUE index `idx_questions_source_ref` declared in
 * drizzle/schema.ts. Postgres treats NULLs as distinct, but every row from this
 * pipeline carries a non-null source_ref, so the conflict target is meaningful.
 *
 * Rows are chunked to keep parameter counts well under Postgres' 65535-bind
 * limit and to bound memory on a large import.
 */

import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { questions, type NewQuestion } from '../../../drizzle/schema';

/** Max rows per INSERT statement (each row binds ~11 columns ⇒ safe margin). */
const INSERT_CHUNK_SIZE = 500;

export interface UpsertResult {
  /** Rows actually written (no pre-existing source_ref). */
  inserted: number;
  /** Rows skipped because their source_ref already existed (idempotent re-run). */
  skipped: number;
}

/**
 * Insert questions idempotently, keyed on `source_ref`.
 *
 * @param rows  NewQuestion rows. Every row SHOULD carry a non-null `sourceRef`
 *              (rows without one cannot be de-duplicated and are rejected to
 *              avoid silent duplicates — parse, don't validate).
 * @returns counts of inserted vs. skipped (conflicting) rows.
 */
export async function upsertQuestions(rows: NewQuestion[]): Promise<UpsertResult> {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  // Guard: a row without a source_ref cannot participate in the conflict target
  // and would silently duplicate on re-run. Reject early with context.
  const missing = rows.findIndex((r) => !r.sourceRef || String(r.sourceRef).trim().length === 0);
  if (missing !== -1) {
    throw new Error(
      `upsertQuestions: row at index ${missing} has no source_ref; ` +
        'every imported question must carry a deterministic source_ref for idempotency.',
    );
  }

  let inserted = 0;

  for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
    const batch = rows.slice(i, i + INSERT_CHUNK_SIZE);

    // ON CONFLICT (source_ref) DO NOTHING + RETURNING id ⇒ returned rows are the
    // ones actually inserted; the rest were skipped as duplicates.
    const returned = await db
      .insert(questions)
      .values(batch)
      .onConflictDoNothing({ target: questions.sourceRef })
      .returning({ id: questions.id });

    inserted += returned.length;
  }

  return { inserted, skipped: rows.length - inserted };
}

/**
 * Optional helper: count how many of the given source_refs already exist. Useful
 * for `--dry-run` reporting (how many would be skipped) without writing. Kept
 * server-side alongside the upsert so the orchestrator has one DB module here.
 */
export async function countExistingSourceRefs(sourceRefs: string[]): Promise<number> {
  const refs = sourceRefs.filter((r) => typeof r === 'string' && r.trim().length > 0);
  if (refs.length === 0) return 0;

  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions)
    .where(sql`${questions.sourceRef} = ANY(${refs})`);

  return rows[0]?.count ?? 0;
}

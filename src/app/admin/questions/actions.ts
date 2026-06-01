'use server';

/**
 * src/app/admin/questions/actions.ts — Server Actions for the question-tagging UI.
 *
 * ⚠️ SERVER-ONLY (`'use server'`; imports `@/lib/db`, which reads DATABASE_URL
 * and opens a Postgres connection). The creator-only tagging screen
 * (`/admin/questions`) calls these to read the tagging queue and persist a
 * reviewer's scope decisions onto a question row.
 *
 * Security: StudiBuilder is creator-gated. EVERY action calls `requireCreator()`
 * first — a state-changing endpoint without a server-side authz check is a
 * red-line. We never trust the client for authorisation, validation, or the
 * shape of the patch.
 *
 * Data: written against the schema-as-is (`drizzle/schema.ts` `questions`):
 *   - `scope_refs`  jsonb  — `{ id, confidence }[]`
 *   - `in_scope`    boolean
 *   - `status`      content_status enum ('מאומת' | 'מוסקנא' | 'לא ידוע')
 */

import { eq, asc, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { questions, type Question } from '../../../../drizzle/schema';
import { isValidScopeId } from '@/lib/db/constants/scope-refs';
import type { ScopeStatus } from '@/lib/import/scope-tagger';
import { requireCreator } from '@/lib/auth/creator';
import { logError } from '@/lib/auth/telemetry';

/** Path revalidated after a write so the tagging queue reflects the change. */
const TAGGING_PATH = '/admin/questions';

/** The three valid `content_status` values (mirrors the DB enum + ScopeStatus). */
const VALID_STATUSES: readonly ScopeStatus[] = ['מאומת', 'מוסקנא', 'לא ידוע'];

/** Default page size for the tagging queue (bounded to protect the DB). */
const DEFAULT_LIMIT = 100;
/** Hard upper bound on a single page (defence against an absurd `limit`). */
const MAX_LIMIT = 500;

export interface ListQuestionsOptions {
  /** Max rows to return. Clamped to [1, MAX_LIMIT]; defaults to DEFAULT_LIMIT. */
  limit?: number;
  /**
   * When true (default), untagged questions surface first: a row counts as
   * "untagged" when its `status = 'לא ידוע'` OR its `scope_refs` jsonb is empty.
   * This is the reviewer's work-queue ordering.
   */
  untaggedFirst?: boolean;
}

/**
 * A single `{ id, confidence }` scope-ref entry as stored in the `scope_refs`
 * jsonb column.
 */
export interface ScopeRefEntry {
  id: string;
  confidence: number;
}

export interface UpdateQuestionTagsPatch {
  /** Replacement scope-refs (validated: only known IDs, confidence clamped). */
  scope_refs?: ScopeRefEntry[];
  /** Whether the question is inside the committee scope. */
  in_scope?: boolean;
  /** Verification status — one of the three `content_status` values. */
  status?: ScopeStatus;
}

/**
 * "untagged-first" priority expression: 0 for rows still needing review
 * (status 'לא ידוע' OR empty scope_refs), 1 otherwise. Ordering ASC on this
 * puts the work-queue at the top. `jsonb_array_length(... )` is safe here
 * because `scope_refs` is `NOT NULL DEFAULT '[]'` in the schema.
 */
const untaggedPriority = sql<number>`CASE
  WHEN ${questions.status} = 'לא ידוע'
    OR coalesce(jsonb_array_length(${questions.scopeRefs}), 0) = 0
  THEN 0 ELSE 1 END`;

/**
 * List questions for the tagging UI (creator-only).
 *
 * @param opts.limit         page size (default 100, clamped to 1..500).
 * @param opts.untaggedFirst when true (default) untagged rows surface first.
 * @returns the page of `Question` rows, ordered for the tagging queue.
 */
export async function listQuestionsForTagging(opts?: ListQuestionsOptions): Promise<Question[]> {
  await requireCreator(TAGGING_PATH);

  const untaggedFirst = opts?.untaggedFirst ?? true;
  const limit = clampLimit(opts?.limit);

  // Stable secondary order so pagination/output is deterministic across calls:
  // newest-first within each priority bucket.
  const orderBy = untaggedFirst
    ? [asc(untaggedPriority), desc(questions.createdAt)]
    : [desc(questions.createdAt)];

  try {
    return await db
      .select()
      .from(questions)
      .orderBy(...orderBy)
      .limit(limit);
  } catch (err) {
    // Errors are a planned state — surface to telemetry before the page-level
    // error UI renders (page.tsx catches the rethrow).
    throw logError(err, { scope: 'admin.listQuestionsForTagging' });
  }
}

/**
 * Persist a reviewer's tagging decision onto one question (creator-only).
 *
 * Only the provided fields are written (partial patch). The patch is validated
 * server-side — "parse, don't validate":
 *   - `scope_refs`: must be an array; entries with unknown IDs are dropped and
 *     confidences clamped to [0,1]. An empty/garbage array becomes `[]`.
 *   - `status`: must be one of the three `content_status` values.
 *   - `in_scope`: coerced to a boolean.
 * An empty patch is a no-op write-guard (rejected) so we never issue a
 * `SET`-nothing UPDATE.
 *
 * @throws if `id` is missing/blank, or the patch carries no writable field.
 * @returns `{ ok: true }` on success.
 */
export async function updateQuestionTags(
  id: string,
  patch: UpdateQuestionTagsPatch,
): Promise<{ ok: true }> {
  await requireCreator(TAGGING_PATH);

  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('updateQuestionTags: a non-empty question id is required.');
  }
  if (typeof patch !== 'object' || patch === null) {
    throw new Error('updateQuestionTags: patch must be an object.');
  }

  // Build the SET object from only the provided keys (partial update).
  const set: Partial<Pick<Question, 'scopeRefs' | 'inScope' | 'status'>> = {};

  if (patch.scope_refs !== undefined) {
    set.scopeRefs = sanitizeScopeRefs(patch.scope_refs);
  }
  if (patch.in_scope !== undefined) {
    set.inScope = patch.in_scope === true;
  }
  if (patch.status !== undefined) {
    if (!VALID_STATUSES.includes(patch.status)) {
      throw new Error(`updateQuestionTags: invalid status "${String(patch.status)}".`);
    }
    set.status = patch.status;
  }

  if (Object.keys(set).length === 0) {
    // No writable field ⇒ refuse a SET-nothing UPDATE (parse, don't validate).
    throw new Error('updateQuestionTags: patch contains no updatable fields.');
  }

  try {
    await db.update(questions).set(set).where(eq(questions.id, id));
  } catch (err) {
    // Errors are a planned state — record before rethrowing so a DB/connection
    // failure on the write path is observable (telemetry/Sentry), not silent.
    throw logError(err, { scope: 'admin.updateQuestionTags', meta: { id } });
  }

  // Refresh the tagging queue so the reviewer sees the row move/disappear.
  revalidatePath(TAGGING_PATH);

  return { ok: true };
}

/** Clamp a requested limit into [1, MAX_LIMIT]; non-numbers fall back to default. */
function clampLimit(limit?: number): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(limit)));
}

/**
 * Validate scope-refs from the client: drop entries with unknown scope IDs,
 * clamp confidences to [0,1]. The model/UI never gets to inject an unknown ID.
 */
function sanitizeScopeRefs(refs: unknown): ScopeRefEntry[] {
  if (!Array.isArray(refs)) return [];
  const out: ScopeRefEntry[] = [];
  for (const r of refs) {
    if (typeof r !== 'object' || r === null) continue;
    const ref = r as Record<string, unknown>;
    if (typeof ref.id !== 'string' || !isValidScopeId(ref.id)) continue;
    const confidence = typeof ref.confidence === 'number' ? clamp01(ref.confidence) : 0;
    out.push({ id: ref.id, confidence });
  }
  return out;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

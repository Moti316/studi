/**
 * src/lib/import/map-question.ts — map a parser `ParsedQuestion` onto the
 * actual DB `NewQuestion` insert shape (schema-in-practice: drizzle/schema.ts).
 *
 * ⚠️ Pure mapping. No I/O, no secrets, no AI. Deterministic: same input +
 * sourceRef → same output. The scope-tagging (`tagScope`, which DOES call
 * Gemini) and persistence (`upsertQuestions`) are separate, downstream steps —
 * this function only normalises shape and applies safe defaults.
 *
 * Mapping rules (per the import brief + the questions table):
 * - type: parser `'open'` → DB `'explanation'`; `'mcq_long'`/`'mcq_short'`
 *   pass through (both are valid `question_type` enum members).
 * - options: ParsedQuestion.options → `options` jsonb (array of strings), or
 *   `null` when the question has no options (open/explanation).
 * - correctAnswer: a present `correctIndex` (MCQ) → `{ index: n }`; an open
 *   question with only `correctAnswerText` → `{ text }`; otherwise `null`.
 * - scope_refs: ALWAYS defaults to `[]` here. Real scope tagging happens later
 *   in the pipeline (tagScope → re-write scope_refs/in_scope/status before
 *   insert) — mapping must not invent scope.
 * - in_scope / status — DEFAULT-DENY: a question with no usable answer key is
 *   untrusted → `in_scope:false`, `status:'לא ידוע'`. A question that has an
 *   answer key is provisionally `in_scope:true` with `status:'מוסקנא'`
 *   (inferred, pending content-verifier / scope-tagger). We NEVER emit 'מאומת'
 *   from a raw parser mapping.
 * - source_ref: the caller-supplied deterministic provenance key (enables the
 *   idempotent ON CONFLICT (source_ref) upsert).
 */

import type { NewQuestion } from '../../../drizzle/schema';
import type { ParsedQuestion } from '../../../scripts/parsers/types';

/** DB question_type values relevant to imported (non-scenario) questions. */
type DbQuestionType = NewQuestion['type'];

/** The JSONB `correct_answer` shape this pipeline writes. */
export type CorrectAnswer = { index: number } | { text: string };

/** Map the parser's type onto the DB enum ('open' → 'explanation'). */
function mapType(type: ParsedQuestion['type']): DbQuestionType {
  switch (type) {
    case 'open':
      return 'explanation';
    case 'mcq_long':
      return 'mcq_long';
    case 'mcq_short':
      return 'mcq_short';
    default: {
      // Exhaustiveness guard: a new parser type must be handled explicitly
      // rather than silently mis-mapped.
      const _never: never = type;
      throw new Error(`mapQuestion: unsupported parsed question type: ${String(_never)}`);
    }
  }
}

/**
 * Build the `correct_answer` jsonb value, validating the index against the
 * resolved options (M6 default-deny — never persist an unanswerable key).
 * - MCQ with an IN-RANGE index (0 ≤ index < options.length) → `{ index }`.
 * - Open with answer text → `{ text }`.
 * - Otherwise (no options / out-of-range index / no text) → `null`
 *   ⇒ the question is default-denied (in_scope:false, status:'לא ידוע').
 */
function mapCorrectAnswer(
  parsed: ParsedQuestion,
  options: string[] | null,
): CorrectAnswer | null {
  if (typeof parsed.correctIndex === 'number' && Number.isInteger(parsed.correctIndex)) {
    // An index is only a usable MCQ key if it points at a real option.
    if (Array.isArray(options) && parsed.correctIndex >= 0 && parsed.correctIndex < options.length) {
      return { index: parsed.correctIndex };
    }
    // Index present but out-of-range / no options ⇒ NOT a usable key; fall
    // through (do not persist an unanswerable {index}).
  }
  const text = parsed.correctAnswerText?.trim();
  if (text) return { text };
  return null;
}

/**
 * Map a parsed question to a DB insert row.
 *
 * @param parsed     The parser output (one question).
 * @param sourceRef  Deterministic provenance key (hash of file-id + index),
 *                   used as the idempotency key for the upsert. Required and
 *                   must be non-empty (parse, don't validate).
 * @returns NewQuestion ready for `upsertQuestions` (after optional scope-tagging
 *          overwrites scope_refs/in_scope/status).
 */
export function mapQuestion(parsed: ParsedQuestion, sourceRef: string): NewQuestion {
  if (typeof sourceRef !== 'string' || sourceRef.trim().length === 0) {
    throw new Error('mapQuestion: source_ref must be a non-empty string');
  }

  const type = mapType(parsed.type);

  // Options only for MCQ; null for explanation/open.
  const options =
    type === 'explanation'
      ? null
      : Array.isArray(parsed.options) && parsed.options.length > 0
        ? parsed.options
        : null;

  // correctAnswer is validated against `options` (bounds-checked), and `keyed`
  // is derived from it — so an MCQ whose index is out-of-range (or whose options
  // are missing) has NO usable key and is default-denied, not marked in-scope.
  const correctAnswer = mapCorrectAnswer(parsed, options);
  const keyed = correctAnswer !== null;

  // Default-deny: no usable answer key ⇒ untrusted ⇒ blocked, 'לא ידוע'.
  // Has key ⇒ provisional in-scope, 'מוסקנא' (inferred; verified later).
  const inScope = keyed;
  const status: NewQuestion['status'] = keyed ? 'מוסקנא' : 'לא ידוע';

  return {
    type,
    prompt: parsed.question,
    options,
    correctAnswer,
    // explanation: parsers don't extract a separate rationale; leave null.
    explanation: null,
    // scope_refs always start empty — tagScope rewrites them downstream.
    scopeRefs: [],
    inScope,
    status,
    sourceRef,
  };
}

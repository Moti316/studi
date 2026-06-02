/**
 * Shared contract types for lesson-player question components.
 *
 * Every question component reports its outcome through the same uniform
 * `QuestionResult` shape so the lesson-orchestrator can stay type-agnostic.
 *
 * Schema-as-is (drizzle/schema.ts):
 * - `questions.type`           → 'mcq_long' | 'mcq_short' | 'matching' | ...
 * - `questions.prompt`         → text
 * - `questions.options`        → jsonb, for MCQ = string[]
 * - `questions.correctAnswer`  → jsonb, for MCQ = { index: number }
 */

import type { Question } from '../../../../drizzle/schema';

/** Uniform outcome reported by every question component. */
export type QuestionResult = {
  correct: boolean;
  /** Index of the option the learner chose (MCQ). Omitted for non-index types. */
  selectedIndex?: number;
};

/** Uniform props for every question component. */
export type QuestionComponentProps = {
  question: Question;
  onResult: (result: QuestionResult) => void;
  /** Render the loading skeleton instead of the question (data still streaming). */
  isLoading?: boolean;
};

/** Shape of a valid MCQ `correct_answer` jsonb payload. */
export type McqCorrectAnswer = { index: number };

/** Type-guard: a parsed `correct_answer` jsonb is a valid MCQ answer. */
export function isMcqCorrectAnswer(value: unknown): value is McqCorrectAnswer {
  return (
    typeof value === 'object' &&
    value !== null &&
    'index' in value &&
    typeof (value as { index: unknown }).index === 'number'
  );
}

/** Type-guard: `options` jsonb is a non-empty array of strings. */
export function isStringOptions(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/**
 * One matching pair as stored for a `type='matching'` question.
 *
 * Schema-as-is: a matching question keeps its pairs in the `options` jsonb
 * column as `{ left, right }[]` (mirrors the `<MatchingPairs>` prop shape and
 * the `lesson-matching.md` spec). `correct_answer` is not used for matching —
 * the pairing itself encodes the correct answer.
 */
export type MatchingQuestionPair = { left: string; right: string };

/** Type-guard: `options` jsonb is a non-empty array of `{ left, right }` pairs. */
export function isMatchingPairs(value: unknown): value is MatchingQuestionPair[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (v) =>
        typeof v === 'object' &&
        v !== null &&
        typeof (v as { left: unknown }).left === 'string' &&
        typeof (v as { right: unknown }).right === 'string',
    )
  );
}

/**
 * One rubric criterion for a `scenario_walkthrough` question.
 *
 * Schema-as-is (drizzle/schema.ts): the `scenarios.rubric` jsonb holds the
 * grading criteria as `{ criterion, points }[]`. Used by <ScenarioWalkthrough>
 * for self-assessment (and later by the Gemini-rubric evaluator — D4).
 */
export type RubricCriterion = { criterion: string; points: number };

/** Type-guard: a `scenarios.rubric` jsonb is a non-empty array of `{criterion, points}`. */
export function isRubric(value: unknown): value is RubricCriterion[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (v) =>
        typeof v === 'object' &&
        v !== null &&
        typeof (v as { criterion: unknown }).criterion === 'string' &&
        typeof (v as { points: unknown }).points === 'number',
    )
  );
}

/**
 * Case-study input for <ScenarioWalkthrough> (schema-as-is: `scenarios` table).
 * A scenario question links to a `scenarios` row via `questions.scenario_id`.
 */
export type ScenarioInput = {
  title: string;
  background: string;
  /** Optional supporting data (measurements, layout, readings). */
  data?: string | null;
  task: string;
  /** Expert model-answer revealed after the learner attempts the task. */
  solution: string;
  rubric: RubricCriterion[];
};

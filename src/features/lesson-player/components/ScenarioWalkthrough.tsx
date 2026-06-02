'use client';

/**
 * <ScenarioWalkthrough> — player for the `scenario_walkthrough` question type
 * (type-5). The committee exam is scenario-based (תרחיש → ניתוח → המלצות), so this
 * is the core practice mode for it.
 *
 * A scenario is a case-study (schema-as-is: `scenarios` table): title · background ·
 * data · task · solution · rubric[]. The learner walks through three phases:
 *
 *   1. work   — read the situation + write their own analysis (free-text scratchpad).
 *   2. review — reveal the expert solution + self-mark the rubric criteria they covered.
 *   3. done   — see the per-criterion breakdown (covered ✓ / missed ✗) + score.
 *
 * Grading is rubric self-assessment (deterministic, no LLM): the attempt counts as
 * "correct" when the learner covered ≥ `passThreshold` of the rubric points. The
 * automated Gemini-rubric evaluator (free-text → score) is a separate step (D4);
 * this component is designed to swap that in without changing its public contract.
 *
 * Contract: onResult({ correct }) is reported exactly once, on finishing review.
 * RTL-first (dir="rtl", logical props), a11y (labelled regions, native checkboxes),
 * design-tokens only. Reference: COURSE-DESIGN.md (3 learning modes) · FINAL-PROJECT.md.
 */

import { useId, useReducer } from 'react';
import type { QuestionResult, RubricCriterion, ScenarioInput } from './types';
import { isRubric } from './types';

export type ScenarioWalkthroughProps = {
  scenario: ScenarioInput;
  /** Reported once, when the learner finishes the review (self-assessment). */
  onResult: (result: QuestionResult) => void;
  /** Fraction of rubric points (0–1) at/above which the attempt is "correct". Default 0.6. */
  passThreshold?: number;
  /** Render the loading skeleton instead of the scenario. */
  isLoading?: boolean;
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Phase = 'work' | 'review' | 'done';

type State = {
  phase: Phase;
  /** Per-rubric-criterion self-assessment marks (index-aligned with the rubric). */
  checked: boolean[];
};

type Action = { type: 'REVEAL' } | { type: 'TOGGLE'; index: number } | { type: 'FINISH' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'REVEAL':
      return state.phase === 'work' ? { ...state, phase: 'review' } : state;
    case 'TOGGLE': {
      if (state.phase !== 'review') return state;
      if (action.index < 0 || action.index >= state.checked.length) return state;
      const checked = state.checked.slice();
      checked[action.index] = !checked[action.index];
      return { ...state, checked };
    }
    case 'FINISH':
      return state.phase === 'review' ? { ...state, phase: 'done' } : state;
    default:
      return state;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScenarioWalkthrough({
  scenario,
  onResult,
  passThreshold = 0.6,
  isLoading,
}: ScenarioWalkthroughProps) {
  const rubric: RubricCriterion[] = isRubric(scenario.rubric) ? scenario.rubric : [];
  const [state, dispatch] = useReducer(reducer, {
    phase: 'work',
    checked: rubric.map(() => false),
  });

  const headingId = useId();
  const scratchpadId = useId();

  const totalPoints = rubric.reduce((sum, c) => sum + c.points, 0);
  const earnedPoints = rubric.reduce((sum, c, i) => (state.checked[i] ? sum + c.points : sum), 0);
  // No rubric → treat the read-through itself as passing (nothing to self-grade).
  const fraction = totalPoints > 0 ? earnedPoints / totalPoints : 1;
  const passed = fraction >= passThreshold;

  function handleFinish() {
    if (state.phase !== 'review') return;
    onResult({ correct: passed });
    dispatch({ type: 'FINISH' });
  }

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div
        dir="rtl"
        data-testid="scenario-loading"
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="flex flex-col gap-3 font-hebrew"
      >
        <span className="sr-only">טוען תרחיש…</span>
        <div className="h-6 w-2/3 animate-pulse rounded-card bg-quiz-border" aria-hidden="true" />
        <div className="h-24 w-full animate-pulse rounded-card bg-quiz-border" aria-hidden="true" />
        <div className="h-12 w-full animate-pulse rounded-card bg-quiz-border" aria-hidden="true" />
      </div>
    );
  }

  return (
    <section
      dir="rtl"
      aria-labelledby={headingId}
      data-testid="scenario-walkthrough"
      data-phase={state.phase}
      className="flex flex-col gap-4 font-hebrew text-quiz-text-primary"
    >
      {/* ── Scenario brief (always visible) ── */}
      <header className="flex flex-col gap-1">
        <span className="text-xs font-bold text-accent-600">תרחיש · הכנה לוועדה</span>
        <h2
          id={headingId}
          data-testid="scenario-title"
          className="text-xl font-extrabold leading-snug"
        >
          {scenario.title}
        </h2>
      </header>

      <div
        data-testid="scenario-background"
        className="rounded-card border border-quiz-border bg-quiz-bg px-4 py-3 text-start text-sm leading-relaxed text-quiz-text-primary"
      >
        {scenario.background}
      </div>

      {scenario.data && (
        <dl
          data-testid="scenario-data"
          className="rounded-card bg-quiz-explanation px-4 py-3 text-start text-sm leading-relaxed text-quiz-text-secondary"
        >
          <dt className="mb-1 font-bold text-quiz-text-primary">נתוני-שטח</dt>
          <dd>{scenario.data}</dd>
        </dl>
      )}

      <div
        data-testid="scenario-task"
        className="rounded-card border-2 border-quiz-primary-active/40 bg-quiz-bg px-4 py-3 text-start text-base font-bold leading-relaxed"
      >
        <span className="text-accent-600">המשימה: </span>
        {scenario.task}
      </div>

      {/* ── Phase: work — learner's own analysis + reveal ── */}
      {state.phase === 'work' && (
        <div className="flex flex-col gap-3">
          <label htmlFor={scratchpadId} className="text-sm font-bold text-quiz-text-secondary">
            הניתוח שלך (טיוטה — לא נשמר, לתרגול-עצמי):
          </label>
          <textarea
            id={scratchpadId}
            data-testid="scenario-scratchpad"
            rows={6}
            placeholder="זהה מפגעים → הערך סיכון (חומרה × סבירות) → המלץ על מדרג-בקרות → הפנה לתקנות…"
            className="w-full resize-y rounded-card border border-quiz-border bg-white px-4 py-3 text-start text-sm leading-relaxed text-quiz-text-primary placeholder:text-quiz-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
          />
          <button
            type="button"
            data-testid="reveal-button"
            onClick={() => dispatch({ type: 'REVEAL' })}
            className="w-full select-none rounded-pill bg-quiz-primary-active py-4 text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
          >
            הצג פתרון-מומחה ומחוון
          </button>
        </div>
      )}

      {/* ── Phase: review/done — expert solution (revealed) ── */}
      {state.phase !== 'work' && (
        <div
          data-testid="scenario-solution"
          className="flex flex-col gap-1 rounded-card border border-quiz-success-border bg-quiz-success-bg px-4 py-3 text-start text-sm leading-relaxed"
        >
          <span className="font-bold text-success">פתרון-מומחה</span>
          <p className="text-quiz-text-primary">{scenario.solution}</p>
        </div>
      )}

      {/* ── Phase: review — self-assessment against the rubric ── */}
      {state.phase === 'review' && rubric.length > 0 && (
        <div className="flex flex-col gap-3">
          <fieldset
            data-testid="rubric"
            className="flex flex-col gap-2 rounded-card border border-quiz-border px-4 py-3"
          >
            <legend className="px-1 text-sm font-bold text-quiz-text-primary">
              מחוון — סמן אילו קריטריונים כיסית בתשובתך:
            </legend>
            {rubric.map((c, i) => (
              <label
                key={i}
                data-testid={`rubric-item-${i}`}
                className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-start text-sm leading-snug text-quiz-text-primary hover:bg-quiz-bg"
              >
                <input
                  type="checkbox"
                  checked={state.checked[i] ?? false}
                  onChange={() => dispatch({ type: 'TOGGLE', index: i })}
                  data-testid={`rubric-checkbox-${i}`}
                  className="mt-0.5 h-5 w-5 flex-shrink-0 accent-quiz-primary-active"
                />
                <span className="flex-1">{c.criterion}</span>
                <span aria-hidden="true" className="text-xs font-bold text-quiz-text-secondary">
                  {c.points} נק׳
                </span>
              </label>
            ))}
          </fieldset>
          <button
            type="button"
            data-testid="finish-button"
            onClick={handleFinish}
            className="w-full select-none rounded-pill bg-quiz-primary-active py-4 text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
          >
            סיים והערך
          </button>
        </div>
      )}

      {/* review with no rubric → a simple "read it" finish */}
      {state.phase === 'review' && rubric.length === 0 && (
        <button
          type="button"
          data-testid="finish-button"
          onClick={handleFinish}
          className="w-full select-none rounded-pill bg-quiz-primary-active py-4 text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
        >
          סיימתי לעבור על הפתרון
        </button>
      )}

      {/* ── Phase: done — per-criterion breakdown + score ── */}
      {state.phase === 'done' && (
        <div
          data-testid="scenario-result"
          role="status"
          aria-live="polite"
          className="flex flex-col gap-3 rounded-card border border-quiz-border bg-quiz-bg px-4 py-4"
        >
          <p className="text-base font-extrabold">
            {passed ? '✅ עברת את התרחיש' : '➖ כדאי לחזור על התרחיש'} —{' '}
            <span data-testid="scenario-score">
              {earnedPoints}/{totalPoints}
            </span>{' '}
            נקודות-מחוון
          </p>
          {rubric.length > 0 && (
            <ul className="flex flex-col gap-1.5" role="list" aria-label="פירוט-מחוון">
              {rubric.map((c, i) => {
                const covered = state.checked[i] ?? false;
                return (
                  <li
                    key={i}
                    data-testid={`result-item-${i}`}
                    className="flex items-start gap-2 text-start text-sm text-quiz-text-primary"
                  >
                    <span
                      aria-hidden="true"
                      className={covered ? 'text-success' : 'text-quiz-text-secondary'}
                    >
                      {covered ? '✓' : '✗'}
                    </span>
                    <span className={covered ? '' : 'text-quiz-text-secondary'}>{c.criterion}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

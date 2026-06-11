'use client';

/**
 * <LessonPlayer> — client orchestrator for a lesson run.
 *
 * Receives a ready list of `Question`s and drives the whole lesson loop:
 *   1. Routes each question to the right component by `question.type`
 *      (mcq_long → <MCQLong> · mcq_short → <MCQShort> · matching → <MatchingPairs>
 *      · anything else → a simple read-only fallback).
 *   2. Owns the sequence, score and accumulated XP, and feeds <LessonHeader>.
 *   3. Renders the feedback itself (children only report a result):
 *        - correct → XP floater (gamification V20) + auto "המשך"
 *        - wrong   → bottom-sheet (V6) + backdrop + mascot (V7) + staggered
 *                    answer-list (V8) showing the correct answer + "המשך"
 *   4. On the last "המשך" → a summary screen with the total XP.
 *
 * Spec: docs/screens-spec/lesson-mcq-long.md · lesson-feedback.md · lesson-matching.md
 * Animations: src/lib/animations (V6 bottomSheet · V7 mascotPop · V8 answerList
 *   · V20 xpFloater · gamification) all wrapped in respectReducedMotion.
 * RTL-first: dir="rtl", logical props (ps-/pe-/text-start), a11y throughout.
 *
 * Contract with question components (components/types.ts):
 *   - MCQ:      props { question, onResult } · onResult({ correct, selectedIndex }).
 *   - Matching: props { pairs, onComplete } · onComplete(correct) — adapted here.
 */

import React, { useCallback, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  bottomSheetVariants,
  backdropFadeVariants,
  mascotPopVariants,
  xpFloaterVariants,
  respectReducedMotion,
} from '@/lib/animations';
import type { Question } from '../../../drizzle/schema';
import { LessonHeader } from './components/LessonHeader';
import { MCQLong } from './components/MCQLong';
import { MCQShort } from './components/MCQShort';
import { MatchingPairs } from './components/MatchingPairs';
import { ExplanationCard } from './components/ExplanationCard';
import { ScenarioWalkthrough } from './components/ScenarioWalkthrough';
import { DeepExplanationButton } from './components/DeepExplanationButton';
import { TutorChat } from './components/TutorChat';
import type { QuestionResult, ScenarioInput } from './components/types';
import { isMatchingPairs, isMcqCorrectAnswer, isStringOptions } from './components/types';
import type { OpenGrade } from '@/lib/grading/keyword-match';

// ─── Tunables ───────────────────────────────────────────────────────────────

/** XP awarded for a correct answer. */
export const XP_PER_CORRECT = 10;

// ─── Types ────────────────────────────────────────────────────────────────────

export type LessonPlayerProps = {
  /** Ordered list of questions to play. */
  questions: Question[];
  /**
   * Scenario data for `scenario_walkthrough` questions, keyed by question id.
   * Loaded server-side (scenarios joined via scenario_id) and threaded to the
   * <ScenarioWalkthrough> player. Missing entry → graceful read-card fallback.
   */
  scenarios?: Record<string, ScenarioInput>;
  /** Optional callback fired once when the summary screen is reached. */
  onFinish?: (summary: LessonSummary) => void;
};

export type LessonSummary = {
  total: number;
  correct: number;
  xp: number;
};

/** Per-question feedback phase. */
type Phase = 'answering' | 'feedback-correct' | 'feedback-wrong' | 'summary';

type State = {
  /** Index of the current question. */
  index: number;
  /** Interaction phase for the current question. */
  phase: Phase;
  /** Accumulated XP across the lesson. */
  xp: number;
  /** Correct-answer count across the lesson. */
  correctCount: number;
  /** Current consecutive-correct streak (resets to 0 on a wrong answer). */
  streak: number;
  /** Result of the just-answered question (for feedback rendering). */
  lastResult: QuestionResult | null;
  /** Floater retrigger key — bumped on each correct answer. */
  floaterKey: number;
};

type Action =
  | { type: 'ANSWER'; result: QuestionResult }
  | { type: 'ANSWER_OPEN'; grade: OpenGrade; total: number }
  | { type: 'CONTINUE'; total: number };

/** XP חלקי לשו"ת חלקי (חצי מתשובה-נכונה). */
const XP_PER_PARTIAL = Math.round(XP_PER_CORRECT / 2);

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ANSWER': {
      // Ignore any result that arrives outside the answering phase (double-fire guard).
      if (state.phase !== 'answering') return state;
      const correct = action.result.correct;
      return {
        ...state,
        phase: correct ? 'feedback-correct' : 'feedback-wrong',
        lastResult: action.result,
        xp: correct ? state.xp + XP_PER_CORRECT : state.xp,
        correctCount: correct ? state.correctCount + 1 : state.correctCount,
        streak: correct ? state.streak + 1 : 0,
        floaterKey: correct ? state.floaterKey + 1 : state.floaterKey,
      };
    }
    case 'ANSWER_OPEN': {
      // שו"ת-פתוח: כבר חשף ציון-עצמי + תשובת-מודל בכרטיס — מתקדם **ישירות** בלי
      // משוב-MCQ. XP לפי הציון (נכונה=מלא · חלקית=חצי · לא-נכונה=0). אינו פוגע ב-streak.
      if (state.phase !== 'answering') return state;
      const correct = action.grade === 'correct';
      const xpGain =
        action.grade === 'correct'
          ? XP_PER_CORRECT
          : action.grade === 'partial'
            ? XP_PER_PARTIAL
            : 0;
      const advanced = {
        ...state,
        xp: state.xp + xpGain,
        correctCount: correct ? state.correctCount + 1 : state.correctCount,
        streak: correct ? state.streak + 1 : 0,
        lastResult: null,
      };
      const nextIndex = state.index + 1;
      if (nextIndex >= action.total) return { ...advanced, phase: 'summary' };
      return { ...advanced, index: nextIndex, phase: 'answering' };
    }
    case 'CONTINUE': {
      if (state.phase !== 'feedback-correct' && state.phase !== 'feedback-wrong') return state;
      const nextIndex = state.index + 1;
      if (nextIndex >= action.total) {
        return { ...state, phase: 'summary', lastResult: null };
      }
      return { ...state, index: nextIndex, phase: 'answering', lastResult: null };
    }
    default:
      return state;
  }
}

const INITIAL_STATE: State = {
  index: 0,
  phase: 'answering',
  xp: 0,
  correctCount: 0,
  streak: 0,
  lastResult: null,
  floaterKey: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * תשובה-נכונה **מובנית** לחשיפה (לא מחרוזת-רצופה — UX נקי · בקשת-מוטי 2026-06-11):
 *   single — אפשרות-בחירה אחת (MCQ).
 *   pairs  — רשימת-זוגות מונח↔הגדרה (התאמה), כל-זוג כשורה-נפרדת.
 * null = לא-ניתן-לחילוץ (נציג טקסט-גנרי + ההסבר).
 */
type CorrectAnswer =
  | { kind: 'single'; text: string }
  | { kind: 'pairs'; pairs: { term: string; def: string }[] }
  | null;

function deriveCorrectAnswer(question: Question): CorrectAnswer {
  if (question.type === 'mcq_long' || question.type === 'mcq_short') {
    const options = question.options;
    const answer = question.correctAnswer;
    if (isStringOptions(options) && isMcqCorrectAnswer(answer)) {
      const text = options[answer.index];
      return typeof text === 'string' ? { kind: 'single', text } : null;
    }
    return null;
  }
  if (question.type === 'matching') {
    if (isMatchingPairs(question.options)) {
      // החוזה: pairs[i] = {left: מונח, right: הגדרה} → ההתאמה-הנכונה היא left↔right.
      return {
        kind: 'pairs',
        pairs: question.options.map((p) => ({ term: p.left, def: p.right })),
      };
    }
    return null;
  }
  return null;
}

/**
 * <CorrectAnswerReveal> — מציג את התשובה-הנכונה **נקי ומאוורר** (מחליף את ה-dump-הרצוף).
 *   single — כרטיס-בודד עם ✓ + הטקסט.
 *   pairs  — כל-זוג ככרטיס: כותרת-מונח (ירוק · ✓) + ההגדרה מתחת. גליל אם רבים.
 */
function CorrectAnswerReveal({ answer }: { answer: CorrectAnswer }) {
  if (!answer) {
    return (
      <p
        data-testid="correct-answer-text"
        className="rounded-card border border-quiz-border bg-quiz-bg px-3.5 py-3 text-sm leading-relaxed text-quiz-text-secondary"
      >
        עיינו בהסבר לתשובה הנכונה.
      </p>
    );
  }

  if (answer.kind === 'single') {
    return (
      <div
        data-testid="correct-answer-single"
        className="flex items-start gap-2.5 rounded-card border border-quiz-success-border bg-quiz-success-bg px-3.5 py-3"
      >
        <span
          aria-hidden="true"
          className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success text-xs font-bold text-white"
        >
          ✓
        </span>
        <span
          data-testid="correct-answer-text"
          className="text-sm font-medium leading-relaxed text-quiz-text-primary"
        >
          {answer.text}
        </span>
      </div>
    );
  }

  // pairs — כל-זוג כרטיס-נפרד (מונח-ירוק מודגש + הגדרה-מתחת)
  return (
    <ul
      data-testid="correct-answer-pairs"
      aria-label="ההתאמות הנכונות"
      role="list"
      className="flex flex-col gap-2"
    >
      {answer.pairs.map((p, i) => (
        <li
          key={i}
          className="overflow-hidden rounded-card border border-quiz-success-border bg-quiz-bg"
        >
          <div className="flex items-center gap-2 bg-quiz-success-bg px-3 py-1.5">
            <span
              aria-hidden="true"
              className="grid size-4 shrink-0 place-items-center rounded-full bg-success text-[10px] font-bold text-white"
            >
              ✓
            </span>
            <span className="text-sm font-bold text-quiz-text-primary">{p.term}</span>
          </div>
          <p className="px-3 py-2 text-sm leading-relaxed text-quiz-text-secondary">{p.def}</p>
        </li>
      ))}
    </ul>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LessonPlayer({ questions, scenarios, onFinish }: LessonPlayerProps) {
  const total = questions.length;
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const onFinishRef = React.useRef(onFinish);
  React.useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const handleResult = useCallback(
    (result: QuestionResult) => {
      // שו"ת-פתוח (openGrade נוכח) → התקדמות-ישירה בלי משוב-MCQ; אחרת משוב-נכון/שגוי.
      if (result.openGrade) dispatch({ type: 'ANSWER_OPEN', grade: result.openGrade, total });
      else dispatch({ type: 'ANSWER', result });
    },
    [total],
  );

  /** מורה-AI ב-sheet (collapsed · נראוּת לכל סוגי-השאלות — בקשת-מוטי 2026-06-11). */
  const [tutorOpen, setTutorOpen] = React.useState(false);

  const handleContinue = useCallback(() => {
    setTutorOpen(false); // איפוס פר-שאלה
    dispatch({ type: 'CONTINUE', total });
  }, [total]);

  // #7 a11y: ה-sheet של תשובה-שגויה הוא דיאלוג-מודאלי מותאם (לא Radix) —
  // פוקוס-נכנס בפתיחה · מלכודת-Tab · Escape=המשך · שחזור-פוקוס בסגירה.
  const wrongSheetRef = React.useRef<HTMLDivElement | null>(null);
  const sheetOpen = state.phase === 'feedback-wrong';
  React.useEffect(() => {
    if (!sheetOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    // פוקוס ראשוני לתוך הדיאלוג (אחרי אנימציית-הכניסה של framer)
    const t = setTimeout(() => wrongSheetRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      const sheet = wrongSheetRef.current;
      if (!sheet) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handleContinue();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = Array.from(
        sheet.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'));
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === sheet)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (active && !sheet.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      // שחזור-פוקוס למפעיל אם עדיין ב-DOM (השאלה מתחלפת — best-effort)
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [sheetOpen, handleContinue]);

  // Fire onFinish once when the summary phase is reached.
  const reportedRef = React.useRef(false);
  React.useEffect(() => {
    if (state.phase === 'summary' && !reportedRef.current) {
      reportedRef.current = true;
      onFinishRef.current?.({ total, correct: state.correctCount, xp: state.xp });
    }
  }, [state.phase, state.correctCount, state.xp, total]);

  // ── Reduced-motion variants ──
  const safeBottomSheet = respectReducedMotion(bottomSheetVariants);
  const safeBackdrop = respectReducedMotion(backdropFadeVariants);
  const safeMascotPop = respectReducedMotion(mascotPopVariants);
  const safeFloater = respectReducedMotion(xpFloaterVariants);

  // ── Empty state ──
  if (total === 0) {
    return (
      <div
        dir="rtl"
        data-testid="lesson-empty"
        role="status"
        className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-card border border-quiz-border bg-quiz-bg px-6 py-12 text-center font-hebrew text-quiz-text-primary"
      >
        <span aria-hidden="true" className="text-4xl">
          📚
        </span>
        <p className="text-lg font-bold">אין עדיין שאלות לתרגול</p>
        <p className="max-w-xs text-sm text-quiz-text-secondary">
          השאלות יופיעו כאן ברגע שהתוכן ייובא למאגר. נסו שוב בקרוב.
        </p>
      </div>
    );
  }

  // ── Summary screen ──
  if (state.phase === 'summary') {
    return (
      <SummaryScreen
        total={total}
        correct={state.correctCount}
        xp={state.xp}
        safeMascotPop={safeMascotPop}
      />
    );
  }

  const current = questions[state.index];
  if (!current) {
    // Defensive: index out of range should be unreachable, render nothing rather than crash.
    return null;
  }

  const isFeedback = state.phase === 'feedback-correct' || state.phase === 'feedback-wrong';
  const correctAnswer = state.phase === 'feedback-wrong' ? deriveCorrectAnswer(current) : null;

  return (
    <div dir="rtl" className="relative mx-auto flex max-w-2xl flex-col gap-5 font-hebrew">
      {/* ── Header ── */}
      <LessonHeader
        totalQuestions={total}
        currentIndex={state.index}
        xp={state.xp}
        streak={state.streak}
      />

      {/* ── Active question (hidden during the wrong-answer sheet to focus the modal) ── */}
      <div
        aria-hidden={state.phase === 'feedback-wrong'}
        className={state.phase === 'feedback-wrong' ? 'pointer-events-none opacity-40' : undefined}
      >
        <QuestionRenderer
          key={state.index}
          question={current}
          scenario={scenarios?.[current.id]}
          onResult={handleResult}
          disabled={isFeedback}
        />
      </div>

      {/* ── Correct-answer feedback: XP floater + continue ── */}
      <AnimatePresence>
        {state.phase === 'feedback-correct' && (
          <motion.div
            key="correct-feedback"
            data-testid="feedback-correct"
            role="status"
            aria-live="polite"
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            <motion.span
              key={state.floaterKey}
              data-testid="xp-floater"
              aria-hidden="true"
              className="text-xl font-extrabold text-accent-600"
              variants={safeFloater}
              initial="hidden"
              animate="visible"
            >
              +{XP_PER_CORRECT} XP
            </motion.span>
            {/* קורא-מסך: ה-floater dekorativi (aria-hidden) → מכריזים את ה-XP כאן */}
            <span className="sr-only">קיבלת {XP_PER_CORRECT} נקודות</span>
            <p className="text-base font-bold text-success">תשובה נכונה!</p>
            <button
              type="button"
              data-testid="continue-button"
              onClick={handleContinue}
              className="w-full select-none rounded-pill bg-gradient-to-bl from-primary-500 to-primary-600 py-4 text-lg font-bold text-white shadow-button transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
            >
              המשך
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Wrong-answer feedback: backdrop + bottom-sheet (V6/V7/V8) ── */}
      <AnimatePresence>
        {state.phase === 'feedback-wrong' && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-black"
              variants={safeBackdrop}
              initial="hidden"
              animate="visible"
              exit="exit"
              aria-hidden="true"
            />

            <motion.div
              key="wrong-sheet"
              ref={wrongSheetRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label="משוב על תשובה שגויה"
              data-testid="feedback-wrong"
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[88vh] max-w-2xl overflow-y-auto rounded-sheet-top bg-card px-4 pb-8 pt-3 shadow-cardFloat"
              variants={safeBottomSheet}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* drag-handle (affordance ויזואלי) */}
              <div
                aria-hidden="true"
                className="mx-auto mb-3 h-1.5 w-10 rounded-pill bg-quiz-border"
              />

              {/* כותרת — טון-מעודד (לא מאשים) + mascot רגוע */}
              <div className="mb-4 flex items-center gap-3">
                <motion.div
                  variants={safeMascotPop}
                  initial="hidden"
                  animate="visible"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-quiz-error-bg text-2xl ring-1 ring-quiz-error-border"
                  aria-hidden="true"
                  data-testid="feedback-mascot"
                >
                  🤖
                </motion.div>
                <div className="flex flex-col">
                  <p className="text-base font-extrabold text-quiz-text-primary">
                    לא נורא — ככה לומדים
                  </p>
                  <p className="text-xs font-medium text-quiz-text-secondary">הנה התשובה הנכונה:</p>
                </div>
              </div>

              {/* התשובה-הנכונה — מובנית ונקייה (מחליף את ה-dump-הרצוף) */}
              <div className="mb-4">
                <CorrectAnswerReveal answer={correctAnswer} />
              </div>

              {/* הסבר-לעומק מעוגן-חקיקה — מוטמע-מראש (questions.explanation · אפס Gemini ב-runtime) */}
              <div className="mb-3">
                <DeepExplanationButton explanation={current.explanation} />
              </div>

              {/* מורה-AI — נגיש מכל סוג-שאלה (collapsed · בקשת-מוטי 2026-06-11) */}
              <div className="mb-3">
                {tutorOpen ? (
                  <TutorChat
                    questionPrompt={current.prompt}
                    correctAnswer={
                      correctAnswer?.kind === 'single'
                        ? correctAnswer.text
                        : correctAnswer?.kind === 'pairs'
                          ? correctAnswer.pairs.map((p) => `${p.term} — ${p.def}`).join('\n')
                          : undefined
                    }
                  />
                ) : (
                  <button
                    type="button"
                    data-testid="ask-tutor-btn"
                    onClick={() => setTutorOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-primary-100 bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700 transition-colors hover:bg-primary-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
                  >
                    <span aria-hidden="true">🎓</span>
                    שאל את המורה
                  </button>
                )}
              </div>

              <button
                type="button"
                data-testid="continue-button"
                onClick={handleContinue}
                className="w-full select-none rounded-pill bg-gradient-to-bl from-primary-500 to-primary-600 py-4 text-lg font-bold text-white shadow-button transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
              >
                המשך
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Question router ────────────────────────────────────────────────────────

type QuestionRendererProps = {
  question: Question;
  /** Scenario data for a `scenario_walkthrough` question (else undefined). */
  scenario?: ScenarioInput;
  onResult: (result: QuestionResult) => void;
  /** While feedback is showing the active question is locked (no re-answer). */
  disabled: boolean;
};

/**
 * Routes a single question to its component by `type`. Once the orchestrator is
 * in a feedback phase the renderer swallows further results (`disabled`) so a
 * stray callback can't double-score.
 */
function QuestionRenderer({ question, scenario, onResult, disabled }: QuestionRendererProps) {
  const guardedResult = useCallback(
    (result: QuestionResult) => {
      if (disabled) return;
      onResult(result);
    },
    [disabled, onResult],
  );

  switch (question.type) {
    case 'mcq_long':
      return <MCQLong question={question} onResult={guardedResult} />;
    case 'mcq_short':
      return <MCQShort question={question} onResult={guardedResult} />;
    case 'scenario_walkthrough': {
      // ScenarioWalkthrough מנהל ציון-עצמי-מחוון משלו → ממיר ל-openGrade כדי
      // להתקדם **בלי משוב-MCQ** (כמו שו"ת). חוסר-נתוני-תרחיש → read-card fallback.
      if (!scenario) {
        return <ExplanationCard question={question} onResult={guardedResult} disabled={disabled} />;
      }
      return (
        <ScenarioWalkthrough
          scenario={scenario}
          onResult={(r) => guardedResult({ ...r, openGrade: r.correct ? 'correct' : 'incorrect' })}
        />
      );
    }
    case 'matching': {
      if (!isMatchingPairs(question.options)) {
        return <ExplanationCard question={question} onResult={guardedResult} disabled={disabled} />;
      }
      return (
        <MatchingPairs
          pairs={question.options}
          // matching מנהל משוב-עצמאי (תוצאה-inline + "המשך") → openGrade מתקדם **בלי**
          // sheet-MCQ כפול (כמו תרחיש/שו"ת). [בקשת-מוטי 2026-06-11]
          onComplete={(correct) =>
            guardedResult({ correct, openGrade: correct ? 'correct' : 'incorrect' })
          }
        />
      );
    }
    default:
      // explanation / scenario_walkthrough / malformed → read-card עם "הסבר לעומק" + "המשך".
      return <ExplanationCard question={question} onResult={guardedResult} disabled={disabled} />;
  }
}

// ─── Summary screen ───────────────────────────────────────────────────────────

function SummaryScreen({
  total,
  correct,
  xp,
  safeMascotPop,
}: {
  total: number;
  correct: number;
  xp: number;
  safeMascotPop: ReturnType<typeof respectReducedMotion>;
}) {
  const allCorrect = correct === total;
  return (
    <div
      dir="rtl"
      data-testid="lesson-summary"
      role="status"
      aria-live="polite"
      className="relative mx-auto max-w-md overflow-hidden rounded-modal bg-gradient-to-bl from-primary-700 via-primary-600 to-primary-500 px-6 py-12 text-center font-hebrew text-white shadow-button ring-1 ring-primary-700/20"
    >
      {/* glow-orbs לעומק (תבנית-הדשבורד) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-accent-500/30 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/15 blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-4">
        <motion.div
          variants={safeMascotPop}
          initial="hidden"
          animate="visible"
          className="grid size-20 place-items-center rounded-full bg-white/15 text-5xl ring-1 ring-inset ring-white/25 backdrop-blur"
          aria-hidden="true"
          data-testid="summary-mascot"
        >
          {allCorrect ? '🎉' : '🦺'}
        </motion.div>
        <h2 className="text-3xl font-extrabold">{allCorrect ? 'כל הכבוד!' : 'סיימת את השיעור'}</h2>
        <p className="text-base text-white/80">
          ענית נכון על{' '}
          <span data-testid="summary-correct" className="font-extrabold text-white">
            {correct}
          </span>{' '}
          מתוך{' '}
          <span data-testid="summary-total" className="font-extrabold text-white">
            {total}
          </span>{' '}
          שאלות.
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/15 px-4 py-2 text-lg font-extrabold ring-1 ring-inset ring-white/25 backdrop-blur">
          <span aria-hidden="true" className="text-accent-100">
            ⭐
          </span>
          <span data-testid="summary-xp">{xp}</span> XP
        </span>
      </div>
    </div>
  );
}

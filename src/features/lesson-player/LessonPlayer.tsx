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
  answerListContainer,
  answerListItem,
  xpFloaterVariants,
  respectReducedMotion,
} from '@/lib/animations';
import type { Question } from '../../../drizzle/schema';
import { LessonHeader } from './components/LessonHeader';
import { MCQLong } from './components/MCQLong';
import { MCQShort } from './components/MCQShort';
import { MatchingPairs } from './components/MatchingPairs';
import { ExplanationCard } from './components/ExplanationCard';
import { DeepExplanationButton } from './components/DeepExplanationButton';
import type { QuestionResult } from './components/types';
import { isMatchingPairs, isMcqCorrectAnswer, isStringOptions } from './components/types';
import type { OpenGrade } from '@/lib/grading/keyword-match';

// ─── Tunables ───────────────────────────────────────────────────────────────

/** XP awarded for a correct answer. */
export const XP_PER_CORRECT = 10;

// ─── Types ────────────────────────────────────────────────────────────────────

export type LessonPlayerProps = {
  /** Ordered list of questions to play. */
  questions: Question[];
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
 * Produce a short, human-readable "correct answer" line for the wrong-answer
 * sheet, derived from the schema-as-is payload. Returns null when the answer
 * can't be resolved (the sheet then just shows the generic copy).
 */
function deriveCorrectAnswerText(question: Question): string | null {
  if (question.type === 'mcq_long' || question.type === 'mcq_short') {
    const options = question.options;
    const answer = question.correctAnswer;
    if (isStringOptions(options) && isMcqCorrectAnswer(answer)) {
      return options[answer.index] ?? null;
    }
    return null;
  }
  if (question.type === 'matching') {
    if (isMatchingPairs(question.options)) {
      return question.options.map((p) => `${p.right} ← ${p.left}`).join(' · ');
    }
    return null;
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LessonPlayer({ questions, onFinish }: LessonPlayerProps) {
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

  const handleContinue = useCallback(() => {
    dispatch({ type: 'CONTINUE', total });
  }, [total]);

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
  const safeAnswerContainer = respectReducedMotion(answerListContainer);
  const safeAnswerItem = respectReducedMotion(answerListItem);
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
  const correctAnswerText =
    state.phase === 'feedback-wrong' ? deriveCorrectAnswerText(current) : null;

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
            <p className="text-base font-bold text-success">תשובה נכונה!</p>
            <button
              type="button"
              data-testid="continue-button"
              onClick={handleContinue}
              className="w-full select-none rounded-pill bg-quiz-primary-active py-4 text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
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
              role="dialog"
              aria-modal="true"
              aria-label="משוב על תשובה שגויה"
              data-testid="feedback-wrong"
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-2xl rounded-sheet-top bg-quiz-error-drawer px-4 pb-8 pt-6 shadow-cardFloat"
              variants={safeBottomSheet}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Mascot + title */}
              <div className="mb-4 flex items-center gap-3">
                <motion.div
                  variants={safeMascotPop}
                  initial="hidden"
                  animate="visible"
                  className="flex-shrink-0 text-4xl"
                  aria-hidden="true"
                  data-testid="feedback-mascot"
                >
                  🤖
                </motion.div>
                <p className="text-lg font-bold text-quiz-text-primary">תשובה לא נכונה</p>
              </div>

              {/* Correct answer (staggered V8 list) */}
              <motion.ul
                variants={safeAnswerContainer}
                initial="hidden"
                animate="visible"
                className="mb-4 flex flex-col gap-2"
                role="list"
                aria-label="התשובה הנכונה"
                data-testid="correct-answer-list"
              >
                <motion.li
                  variants={safeAnswerItem}
                  className="flex items-start gap-2 rounded-lg border border-quiz-success-border bg-quiz-success-bg px-3 py-2 text-sm text-quiz-text-primary"
                >
                  <span className="text-success" aria-hidden="true">
                    ✓
                  </span>
                  <span data-testid="correct-answer-text">
                    {correctAnswerText ?? 'עיינו בהסבר לתשובה הנכונה.'}
                  </span>
                </motion.li>
              </motion.ul>

              {/* הסבר-לעומק מעוגן-חקיקה — מוטמע-מראש (questions.explanation · אפס Gemini ב-runtime) */}
              <div className="mb-3">
                <DeepExplanationButton explanation={current.explanation} />
              </div>

              <button
                type="button"
                data-testid="continue-button"
                onClick={handleContinue}
                className="w-full select-none rounded-pill bg-quiz-primary-active py-4 text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
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
  onResult: (result: QuestionResult) => void;
  /** While feedback is showing the active question is locked (no re-answer). */
  disabled: boolean;
};

/**
 * Routes a single question to its component by `type`. Once the orchestrator is
 * in a feedback phase the renderer swallows further results (`disabled`) so a
 * stray callback can't double-score.
 */
function QuestionRenderer({ question, onResult, disabled }: QuestionRendererProps) {
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
    case 'matching': {
      if (!isMatchingPairs(question.options)) {
        return <ExplanationCard question={question} onResult={guardedResult} disabled={disabled} />;
      }
      return (
        <MatchingPairs
          pairs={question.options}
          onComplete={(correct) => guardedResult({ correct })}
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
      className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-card border border-quiz-border bg-quiz-bg px-6 py-12 text-center font-hebrew text-quiz-text-primary"
    >
      <motion.div
        variants={safeMascotPop}
        initial="hidden"
        animate="visible"
        className="text-5xl"
        aria-hidden="true"
        data-testid="summary-mascot"
      >
        {allCorrect ? '🎉' : '🤖'}
      </motion.div>
      <h2 className="text-2xl font-extrabold">{allCorrect ? 'כל הכבוד!' : 'סיימת את השיעור'}</h2>
      <p className="text-base text-quiz-text-secondary">
        ענית נכון על{' '}
        <span data-testid="summary-correct" className="font-bold text-quiz-text-primary">
          {correct}
        </span>{' '}
        מתוך{' '}
        <span data-testid="summary-total" className="font-bold text-quiz-text-primary">
          {total}
        </span>{' '}
        שאלות.
      </p>
      <p className="inline-flex items-center gap-1 text-lg font-bold text-accent-600">
        <span aria-hidden="true">⭐</span>
        <span data-testid="summary-xp">{xp}</span> XP
      </p>
    </div>
  );
}

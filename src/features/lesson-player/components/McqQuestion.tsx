'use client';

/**
 * <McqQuestion> — shared engine for MCQ question types.
 *
 * Two public variants wrap it:
 * - <MCQLong>  — full-sentence options, single vertical column (≥56px tall).
 * - <MCQShort> — short-word options, 2×2 grid (4×1 on wide desktop).
 *
 * Both share an identical useReducer state-machine, keyboard model
 * (1-4 select · Enter submit), and the uniform onResult contract.
 *
 * Spec: docs/screens-spec/lesson-mcq-long.md · lesson-mcq-short.md
 * Animations: src/lib/animations (V1 cardTap · V2 cardSelected · V4/V5 submitButton)
 * RTL-first: dir="rtl", logical props (ps-/pe-/text-start).
 */

import React, { useCallback, useEffect, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  cardTap,
  cardSelectedVariants,
  submitButtonVariants,
  submitButtonTap,
  respectReducedMotion,
} from '@/lib/animations';
import type { QuestionComponentProps } from './types';
import { isMcqCorrectAnswer, isStringOptions } from './types';

export type McqVariant = 'long' | 'short';

type McqQuestionProps = QuestionComponentProps & {
  /** 'long' = single vertical column · 'short' = 2×2 grid */
  variant: McqVariant;
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

type McqState = {
  /** Selected option index, null if none chosen yet. */
  selectedIndex: number | null;
  /** Once submitted the component locks and reports exactly once. */
  submitted: boolean;
};

type McqAction =
  | { type: 'SELECT'; index: number }
  | { type: 'SUBMIT' };

function reducer(state: McqState, action: McqAction, optionCount: number): McqState {
  switch (action.type) {
    case 'SELECT': {
      if (state.submitted) return state;
      if (action.index < 0 || action.index >= optionCount) return state;
      return { ...state, selectedIndex: action.index };
    }
    case 'SUBMIT': {
      if (state.submitted || state.selectedIndex === null) return state;
      return { ...state, submitted: true };
    }
    default:
      return state;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function McqQuestion({ question, onResult, isLoading, variant }: McqQuestionProps) {
  const options = question.options;
  const correctAnswer = question.correctAnswer;

  // ── Validate payload (schema-as-is: options=string[], correctAnswer={index}) ──
  const validOptions = isStringOptions(options) ? options : null;
  const hasOptions = validOptions !== null && validOptions.length > 0;
  const correctIndex = isMcqCorrectAnswer(correctAnswer) ? correctAnswer.index : null;
  const isErrored =
    hasOptions && (correctIndex === null || correctIndex < 0 || correctIndex >= validOptions.length);

  const optionCount = validOptions?.length ?? 0;

  const [state, dispatchRaw] = useReducer(
    (s: McqState, a: McqAction) => reducer(s, a, optionCount),
    { selectedIndex: null, submitted: false },
  );

  const handleSubmit = useCallback(() => {
    if (state.submitted || state.selectedIndex === null || correctIndex === null) return;
    const selectedIndex = state.selectedIndex;
    dispatchRaw({ type: 'SUBMIT' });
    onResult({ correct: selectedIndex === correctIndex, selectedIndex });
  }, [state.submitted, state.selectedIndex, correctIndex, onResult]);

  // ── Global keyboard: 1-4 select · Enter submit ──
  useEffect(() => {
    if (isLoading || !hasOptions || isErrored || state.submitted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1;
        if (idx < optionCount) {
          e.preventDefault();
          dispatchRaw({ type: 'SELECT', index: idx });
        }
        return;
      }
      if (e.key === 'Enter' && state.selectedIndex !== null) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    isLoading,
    hasOptions,
    isErrored,
    state.submitted,
    state.selectedIndex,
    optionCount,
    handleSubmit,
  ]);

  // ── Reduced-motion variants ──
  const safeCardSelected = respectReducedMotion(cardSelectedVariants);
  const safeSubmitButton = respectReducedMotion(submitButtonVariants);

  // ── State branches: loading / error / empty ──
  if (isLoading) {
    return (
      <div
        dir="rtl"
        data-testid="mcq-loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="flex flex-col gap-3 font-hebrew"
      >
        <span className="sr-only">טוען שאלה…</span>
        <div className="h-6 w-3/4 animate-pulse rounded-card bg-quiz-border" aria-hidden="true" />
        <div className={variant === 'short' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[56px] animate-pulse rounded-card bg-quiz-border"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isErrored) {
    return (
      <div
        dir="rtl"
        data-testid="mcq-error"
        role="alert"
        className="flex flex-col gap-2 rounded-card border border-quiz-error-border bg-quiz-error-bg px-4 py-6 text-start font-hebrew text-quiz-text-primary"
      >
        <p className="text-base font-bold">לא ניתן להציג את השאלה</p>
        <p className="text-sm text-quiz-text-secondary">
          נתוני התשובה הנכונה אינם תקינים. נסו שאלה אחרת או רעננו את הדף.
        </p>
      </div>
    );
  }

  if (!hasOptions || !validOptions) {
    return (
      <div
        dir="rtl"
        data-testid="mcq-empty"
        role="status"
        className="flex flex-col gap-2 rounded-card border border-quiz-border bg-quiz-bg px-4 py-6 text-start font-hebrew text-quiz-text-primary"
      >
        <p className="text-base font-bold">אין תשובות להצגה</p>
        <p className="text-sm text-quiz-text-secondary">לשאלה זו לא הוגדרו אפשרויות בחירה.</p>
      </div>
    );
  }

  const isSelected = (i: number) => state.selectedIndex === i;
  const showCheckButton = state.selectedIndex !== null && !state.submitted;

  const gridClass =
    variant === 'short'
      ? 'grid grid-cols-2 gap-3 md:grid-cols-4'
      : 'flex flex-col gap-3';

  return (
    <div dir="rtl" className="flex flex-col gap-4 font-hebrew">
      {/* ── Prompt ── */}
      <p
        data-testid="mcq-prompt"
        className="text-start text-lg font-bold leading-relaxed text-quiz-text-primary"
      >
        {question.prompt}
      </p>

      {/* ── Options ── */}
      <div
        role="radiogroup"
        aria-label="אפשרויות תשובה"
        className={gridClass}
      >
        {validOptions.map((opt, i) => {
          const selected = isSelected(i);
          return (
            <motion.div
              key={i}
              role="radio"
              tabIndex={state.submitted ? -1 : 0}
              aria-checked={selected}
              aria-disabled={state.submitted}
              aria-label={`אפשרות ${i + 1}: ${opt}`}
              data-testid={`mcq-option-${i}`}
              onClick={() => {
                if (state.submitted) return;
                dispatchRaw({ type: 'SELECT', index: i });
              }}
              onKeyDown={(e) => {
                if (state.submitted) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  dispatchRaw({ type: 'SELECT', index: i });
                }
              }}
              className={[
                'flex min-h-[56px] cursor-pointer select-none items-center rounded-card border-2 px-4 py-3 text-start font-hebrew font-medium leading-snug text-quiz-text-primary',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active',
                variant === 'short' ? 'justify-center text-center text-base' : 'text-start text-sm',
              ].join(' ')}
              {...cardTap}
              variants={safeCardSelected}
              initial="unselected"
              animate={selected ? 'selected' : 'unselected'}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-pill border border-quiz-border text-xs font-bold text-quiz-text-secondary"
                >
                  {i + 1}
                </span>
                <span>{opt}</span>
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* ── Check-answer button (appears after a selection) ── */}
      <AnimatePresence>
        {showCheckButton && (
          <motion.button
            key="check-answer-button"
            type="button"
            aria-label="בדוק תשובה"
            data-testid="check-answer-button"
            onClick={handleSubmit}
            className="w-full select-none rounded-pill py-4 font-hebrew text-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
            variants={safeSubmitButton}
            initial="disabled"
            animate="enabled"
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            {...submitButtonTap}
          >
            בדוק תשובה
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

/**
 * <MatchingPairs> — Quiz type: match left column to right column.
 *
 * Spec: docs/sources/studiesgo-videos/02-lesson-flow/gemini-response.md
 * Animations: src/lib/animations/ (V1–V8)
 * RTL-first: padding-start/end, dir="rtl", mirrored layout.
 */

import React, { useCallback, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  cardTap,
  cardSelectedVariants,
  matchedPairVariants,
  submitButtonVariants,
  submitButtonTap,
  bottomSheetVariants,
  backdropFadeVariants,
  mascotPopVariants,
  answerListContainer,
  answerListItem,
  respectReducedMotion,
} from '@/lib/animations';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MatchingPair = { left: string; right: string };

export type MatchingPairsProps = {
  pairs: MatchingPair[];
  onComplete: (correct: boolean) => void;
  onDeepExplanation?: () => void;
};

type CardState = 'unselected' | 'selected' | 'matched' | 'error' | 'correct';

type GameState = {
  /** index of the selected right-column card, null if none */
  selectedRight: number | null;
  /** Set of pair indices that have been matched */
  matchedPairs: Set<number>;
  /** phase: idle → checking → result */
  phase: 'idle' | 'result-correct' | 'result-wrong';
  /** Which pairs were correct vs. wrong (only valid in result phases) */
  correctness: boolean[];
};

type Action =
  | { type: 'SELECT_RIGHT'; index: number }
  | { type: 'TRY_MATCH'; leftIndex: number }
  | { type: 'DESELECT' }
  | { type: 'SUBMIT' }
  | { type: 'RESET_TO_WRONG' };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: GameState, action: Action, totalPairs: number): GameState {
  switch (action.type) {
    case 'SELECT_RIGHT': {
      // If same card tapped again → deselect
      if (state.selectedRight === action.index) {
        return { ...state, selectedRight: null };
      }
      return { ...state, selectedRight: action.index };
    }

    case 'TRY_MATCH': {
      const { selectedRight } = state;
      if (selectedRight === null) return state;

      const isCorrect = selectedRight === action.leftIndex;
      if (isCorrect) {
        const newMatched = new Set(state.matchedPairs);
        newMatched.add(selectedRight);
        return { ...state, selectedRight: null, matchedPairs: newMatched };
      }
      // Wrong match — deselect both
      return { ...state, selectedRight: null };
    }

    case 'DESELECT':
      return { ...state, selectedRight: null };

    case 'SUBMIT': {
      if (state.matchedPairs.size < totalPairs) return state;
      const allCorrect = state.matchedPairs.size === totalPairs;
      const correctness = Array.from({ length: totalPairs }, (_, i) => state.matchedPairs.has(i));
      return {
        ...state,
        phase: allCorrect ? 'result-correct' : 'result-wrong',
        correctness,
      };
    }

    case 'RESET_TO_WRONG':
      return { ...state, phase: 'result-wrong' };

    default:
      return state;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MatchingPairs({ pairs, onComplete, onDeepExplanation }: MatchingPairsProps) {
  const totalPairs = pairs.length;

  const [state, dispatchRaw] = useReducer((s: GameState, a: Action) => reducer(s, a, totalPairs), {
    selectedRight: null,
    matchedPairs: new Set<number>(),
    phase: 'idle',
    correctness: [],
  });

  const dispatch = dispatchRaw;

  const allMatched = state.matchedPairs.size === totalPairs;
  const isSubmitEnabled = allMatched;

  // ── Card state helpers ──

  const getRightCardState = useCallback(
    (index: number): CardState => {
      if (state.matchedPairs.has(index)) return 'matched';
      if (state.selectedRight === index) return 'selected';
      return 'unselected';
    },
    [state.matchedPairs, state.selectedRight],
  );

  const getLeftCardState = useCallback(
    (index: number): CardState => {
      if (state.matchedPairs.has(index)) return 'matched';
      return 'unselected';
    },
    [state.matchedPairs],
  );

  // ── Interaction handlers ──

  const handleRightCardClick = (index: number) => {
    if (state.matchedPairs.has(index) || state.phase !== 'idle') return;
    dispatch({ type: 'SELECT_RIGHT', index });
  };

  const handleRightCardKey = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRightCardClick(index);
    }
  };

  const handleLeftCardClick = (index: number) => {
    if (state.matchedPairs.has(index) || state.phase !== 'idle') return;
    if (state.selectedRight === null) return; // no right card selected yet
    dispatch({ type: 'TRY_MATCH', leftIndex: index });
  };

  const handleLeftCardKey = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLeftCardClick(index);
    }
  };

  const handleSubmit = () => {
    if (!isSubmitEnabled || state.phase !== 'idle') return;
    // In this matching exercise all pairs must be matched to submit,
    // so when allMatched===true the result is always correct.
    // The component supports onComplete(true/false) for when partial-matching is introduced.
    dispatch({ type: 'SUBMIT' });
    onComplete(true); // all pairs matched = correct
  };

  const handleSubmitKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── Reduced-motion variants ──

  const safeCardSelected = respectReducedMotion(cardSelectedVariants);
  const safeMatched = respectReducedMotion(matchedPairVariants);
  const safeSubmitButton = respectReducedMotion(submitButtonVariants);
  const safeBottomSheet = respectReducedMotion(bottomSheetVariants);
  const safeBackdrop = respectReducedMotion(backdropFadeVariants);
  const safeMascotPop = respectReducedMotion(mascotPopVariants);
  const safeAnswerContainer = respectReducedMotion(answerListContainer);
  const safeAnswerItem = respectReducedMotion(answerListItem);

  // ── Shared card render helper ──

  const renderCard = ({
    text,
    cardState,
    onClick,
    onKeyDown,
    ariaLabel,
    testId,
  }: {
    text: string;
    cardState: CardState;
    onClick: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    ariaLabel: string;
    testId?: string;
  }) => {
    const isMatched = cardState === 'matched';
    const isSelected = cardState === 'selected';

    return (
      <motion.div
        role="button"
        tabIndex={isMatched ? -1 : 0}
        aria-pressed={isSelected}
        aria-label={ariaLabel}
        aria-disabled={isMatched}
        data-testid={testId}
        onClick={onClick}
        onKeyDown={onKeyDown}
        className="flex min-h-[52px] cursor-pointer select-none items-center rounded-card border px-3 py-3 font-hebrew text-sm font-medium leading-snug text-quiz-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
        {...cardTap}
        variants={isMatched ? safeMatched : safeCardSelected}
        initial={isMatched ? undefined : 'unselected'}
        animate={isMatched ? 'matched' : isSelected ? 'selected' : 'unselected'}
      >
        <span>{text}</span>
      </motion.div>
    );
  };

  // ── Shuffle left column display order (stable per render) ──
  // We show left cards in original pair order but the right column
  // is shuffled so the user must match them.
  // Shuffle is done once at mount via useMemo-like stable seed.
  // For simplicity in this POC we reverse — a real impl uses Fisher-Yates seeded.
  const shuffledRightIndices = React.useMemo(() => {
    const indices: number[] = pairs.map((_, i) => i);
    // Simple stable shuffle: interleave first-half and second-half
    const result: number[] = [];
    const mid = Math.ceil(indices.length / 2);
    for (let i = 0; i < mid; i++) {
      const a = indices[i];
      if (a !== undefined) result.push(a);
      const b = indices[i + mid];
      if (b !== undefined) result.push(b);
    }
    return result;
  }, [pairs]);

  return (
    <div dir="rtl" className="relative flex flex-col gap-4 font-hebrew">
      {/* ── Grid of cards (hidden during result-wrong phase) ── */}
      <AnimatePresence>
        {state.phase !== 'result-wrong' && (
          <motion.div
            key="card-grid"
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {/* Right column — terms (starts selected flow) */}
            <div className="flex flex-col gap-3" role="group" aria-label="עמודת מונחים">
              {shuffledRightIndices.map((pairIndex) => {
                const pair = pairs[pairIndex];
                if (!pair) return null;
                return (
                  <React.Fragment key={`right-${pairIndex}`}>
                    {renderCard({
                      text: pair.right,
                      cardState: getRightCardState(pairIndex),
                      onClick: () => handleRightCardClick(pairIndex),
                      onKeyDown: (e) => handleRightCardKey(e, pairIndex),
                      ariaLabel: `מונח: ${pair.right}`,
                      testId: `right-card-${pairIndex}`,
                    })}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Left column — definitions */}
            <div className="flex flex-col gap-3" role="group" aria-label="עמודת הגדרות">
              {pairs.map((pair, index) => (
                <React.Fragment key={`left-${index}`}>
                  {renderCard({
                    text: pair.left,
                    cardState: getLeftCardState(index),
                    onClick: () => handleLeftCardClick(index),
                    onKeyDown: (e) => handleLeftCardKey(e, index),
                    ariaLabel: `הגדרה: ${pair.left}`,
                    testId: `left-card-${index}`,
                  })}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Submit button ── */}
      {state.phase === 'idle' && (
        <motion.button
          type="button"
          role="button"
          aria-label="בדוק תשובה"
          aria-disabled={!isSubmitEnabled}
          data-testid="submit-button"
          onClick={handleSubmit}
          onKeyDown={handleSubmitKey}
          disabled={!isSubmitEnabled}
          className="pointer-events-auto w-full select-none rounded-pill py-4 font-hebrew text-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active disabled:pointer-events-none"
          variants={safeSubmitButton}
          initial="disabled"
          animate={isSubmitEnabled ? 'enabled' : 'disabled'}
          {...submitButtonTap}
        >
          בדוק תשובה
        </motion.button>
      )}

      {/* ── Success: continue button ── */}
      {state.phase === 'result-correct' && (
        <motion.button
          type="button"
          data-testid="continue-button"
          onClick={() => onComplete(true)}
          className="w-full rounded-pill bg-quiz-primary-active py-4 font-hebrew text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          המשך
        </motion.button>
      )}

      {/* ── Error feedback: bottom-sheet + backdrop ── */}
      <AnimatePresence>
        {state.phase === 'result-wrong' && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-black"
              variants={safeBackdrop}
              initial="hidden"
              animate="visible"
              exit="exit"
              aria-hidden="true"
              onClick={() => {}} // prevent click-through
            />

            {/* Bottom sheet */}
            <motion.div
              key="feedback-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="משוב על תשובה"
              data-testid="feedback-drawer"
              className="fixed inset-x-0 bottom-0 z-50 rounded-sheet-top bg-quiz-error-drawer px-4 pb-8 pt-6 shadow-cardFloat"
              variants={safeBottomSheet}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Mascot + title row */}
              <div className="mb-4 flex items-center gap-3">
                <motion.div
                  variants={safeMascotPop}
                  initial="hidden"
                  animate="visible"
                  className="flex-shrink-0 text-4xl"
                  aria-hidden="true"
                >
                  🤖
                </motion.div>
                <p className="font-hebrew text-lg font-bold text-quiz-text-primary">
                  תשובה לא נכונה
                </p>
              </div>

              {/* Correct answers list (staggered) */}
              <motion.ul
                variants={safeAnswerContainer}
                initial="hidden"
                animate="visible"
                className="mb-4 flex flex-col gap-2"
                role="list"
                aria-label="זוגות נכונים"
              >
                {pairs.map((pair, i) => (
                  <motion.li
                    key={i}
                    variants={safeAnswerItem}
                    className="flex items-center gap-2 rounded-lg border border-quiz-success-border bg-quiz-success-bg px-3 py-2 font-hebrew text-sm text-quiz-text-primary"
                  >
                    <span className="ms-1 text-success" aria-label="תשובה נכונה" role="img">
                      ✓
                    </span>
                    <span className="font-medium">{pair.right}</span>
                    <span className="mx-1 text-quiz-text-secondary">←</span>
                    <span>{pair.left}</span>
                  </motion.li>
                ))}
              </motion.ul>

              {/* Deep-explanation button */}
              {onDeepExplanation && (
                <motion.div
                  className="mb-4 rounded-lg bg-quiz-explanation px-3 py-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.25, duration: 0.15 } }}
                >
                  <button
                    type="button"
                    data-testid="deep-explanation-button"
                    onClick={onDeepExplanation}
                    className="w-full text-start font-hebrew text-sm font-medium text-quiz-primary-active underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
                  >
                    הסבר לעומק
                  </button>
                </motion.div>
              )}

              {/* Continue button */}
              <button
                type="button"
                data-testid="continue-after-wrong"
                onClick={() => onComplete(false)}
                className="w-full rounded-pill bg-quiz-primary-active py-4 font-hebrew text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
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

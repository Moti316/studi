/**
 * Card animations — V1, V2, V3 from gemini-response 02-lesson-flow.
 *
 * Used by: <MatchingPairsCard>, <MCQCard>, <ExplanationCard>
 */

import type { Variants } from 'framer-motion';
import { springs } from './_base';

/**
 * V1 — Tap feedback (whileTap prop).
 * Source: video 02 @ 00:09.500
 *
 * @example
 * <motion.div {...cardTap}>
 */
export const cardTap = {
  whileTap: { scale: 0.96 },
  transition: { ...springs.button, duration: 0.05 },
} as const;

/**
 * V2 — Selected vs unselected card state.
 * Source: video 02 @ 00:09.600
 *
 * @example
 * <motion.div animate={isSelected ? 'selected' : 'unselected'} variants={cardSelectedVariants} />
 */
export const cardSelectedVariants: Variants = {
  unselected: {
    borderColor: '#e6eaf1', // quiz-border — solid white card (B1)
    backgroundColor: '#ffffff',
  },
  selected: {
    borderColor: '#f5a623', // accent-500 amber — selection
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
    transition: { duration: 0 }, // immediate flip
  },
};

/**
 * V3 — Matched-pair fade (satisfaction-of-success).
 * Source: video 02 @ 00:12.600 (T+150ms)
 *
 * Apply when card moves to disabled (matched) state.
 */
export const matchedPairVariants: Variants = {
  matched: {
    opacity: 0.5,
    borderColor: '#E5E7EB',
    transition: { duration: 0.15, ease: 'linear' },
  },
};

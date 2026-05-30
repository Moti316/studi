/**
 * Feedback animations — V16 (screen shake) + supporting variants.
 *
 * Used by: question card on wrong-answer feedback.
 */

import type { Variants } from 'framer-motion';

/**
 * V16 — Screen shake on wrong answer.
 * Source: video 07 deep-dive B1 (T+100ms..T+250ms).
 *
 * Apply to the question card / container when user submits wrong answer.
 */
export const screenShakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -5, 5, 0],
    transition: { duration: 0.25, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
  },
};

/**
 * Subtle red-tinted backdrop for the wrong-answer micro-flash.
 * Source: video 07 deep-dive B1 (T+100ms).
 */
export const wrongAnswerBackdropVariants: Variants = {
  hidden: { backgroundColor: 'rgba(239, 68, 68, 0)' },
  visible: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    transition: { duration: 0.1 },
  },
  exit: {
    backgroundColor: 'rgba(239, 68, 68, 0)',
    transition: { duration: 0.3 },
  },
};

/**
 * Button animations — V4, V5 from gemini-response 02-lesson-flow.
 *
 * Used by: <PrimaryButton>, <SubmitButton>
 */

import type { Variants } from 'framer-motion';
import { springs } from './_base';

/**
 * V4 — Primary-button enable (color shift + pop).
 * Source: video 02 @ 00:22.400 (deep-dive 2.2)
 *
 * Triggered when matchedPairs.length === total → submit button activates.
 *
 * @example
 * <motion.button animate={isEnabled ? 'enabled' : 'disabled'} variants={submitButtonVariants} />
 */
export const submitButtonVariants: Variants = {
  disabled: {
    backgroundColor: '#bcd2f7', // quiz-primary-disabled (B1 brand)
    color: '#FFFFFFCC',
    scale: 1,
  },
  enabled: {
    backgroundColor: '#1b4fd6', // B1 primary-500 ink-blue (brand CTA)
    color: '#FFFFFF',
    scale: [1, 1.04, 1], // pop sequence
    transition: {
      backgroundColor: { duration: 0.15 },
      color: { duration: 0.15 },
      scale: { ...springs.pop, times: [0, 0.5, 1] },
    },
  },
};

/**
 * V5 — Submit-button tap-down.
 * Source: video 02 @ 00:32.100
 */
export const submitButtonTap = {
  whileTap: { scale: 0.95 },
  transition: { ...springs.button, duration: 0.05 },
} as const;

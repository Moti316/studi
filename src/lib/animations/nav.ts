/**
 * Navigation animations — V18 from gemini-response 07-stats-feedback.
 *
 * Used by: <BottomNav>, <ScreenSwap>
 */

import type { Variants } from 'framer-motion';
import { springs } from './_base';

/**
 * V18a — Bottom-nav tab icon: scale-bump on activate.
 * Source: video 07 deep-dive B5.
 */
export const tabIconActiveVariants: Variants = {
  inactive: {
    scale: 1,
    color: '#9CA3AF',
  },
  active: {
    scale: [0.8, 1.2, 1.1],
    color: '#1A56DB',
    transition: { duration: 0.2, times: [0, 0.5, 1] },
  },
};

/**
 * V18b — Screen content cross-fade with X-axis slide.
 * Used when switching tabs — outgoing screen exits left, incoming enters from right.
 *
 * @example
 * <AnimatePresence mode="wait">
 *   <motion.div key={pathname} variants={screenSwapVariants}
 *     initial="enter" animate="active" exit="exit">
 *     ...
 *   </motion.div>
 * </AnimatePresence>
 */
export const screenSwapVariants: Variants = {
  enter: { x: 20, opacity: 0 },
  active: {
    x: 0,
    opacity: 1,
    transition: { ...springs.button, delay: 0.1 },
  },
  exit: {
    x: -20,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

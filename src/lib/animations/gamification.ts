/**
 * Gamification animations — XP counter, streak, progress.
 * Sources: video 01 (quiz-loop), video 05 (status pulse), video 07 (XP).
 *
 * Used by: <XpCounter>, <StreakBadge>, <ProgressDots>, <ProgressBar>
 */

import type { Variants } from 'framer-motion';
import { easings, springs } from './_base';

/**
 * V19 — XP count-up.
 * Source: video 01 @ 00:00.600 (30→40 ב-400ms)
 *
 * Use with `useMotionValue` + `animate()` for the numeric value, plus
 * this color flash on the text element while counting.
 *
 * @example
 * const xp = useMotionValue(start);
 * useEffect(() => animate(xp, end, xpCountUpTransition), [end]);
 */
export const xpCountUpTransition = {
  duration: 0.4,
  ease: easings.out,
} as const;

export const xpCountUpFlashVariants: Variants = {
  idle: { color: '#111827' },
  counting: {
    color: ['#111827', '#F97316', '#111827'],
    transition: { duration: 0.4, times: [0, 0.5, 1] },
  },
};

/**
 * V20 — "+10 XP" floating tag.
 * Source: video 01 @ 00:00.500
 *
 * Appears briefly when user gets points; recommend `key`-cycling to retrigger.
 */
export const xpFloaterVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0, y: 10 },
  visible: {
    scale: 1,
    opacity: 1,
    y: -20,
    transition: { ...springs.pop },
  },
  exit: {
    opacity: 0,
    y: -40,
    transition: { duration: 0.3 },
  },
};

/**
 * V21 — Progress-dot fill (single dot in a dots-bar).
 * Source: video 01 @ 00:00.800
 *
 * Apply to each dot; toggle isActive based on lesson progress.
 */
export const progressDotVariants: Variants = {
  inactive: {
    backgroundColor: '#E5E7EB',
    scale: 1,
  },
  active: {
    backgroundColor: '#F97316',
    scale: [1, 1.2, 1],
    transition: { duration: 0.3, times: [0, 0.5, 1] },
  },
};

/**
 * V22 — Status pulse (loading/active state indicator).
 * Source: video 05 @ 00:35.000+
 *
 * Continuous breathing animation on a "currently processing" indicator.
 */
export const statusPulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: easings.inOut,
    },
  },
};

/**
 * V23 — Progress-bar width fill.
 * Source: video 05 @ 00:35.000-00:49.000 (0% → 5%)
 *
 * Width-based (not transform) since this is a horizontal fill bar.
 *
 * @example
 * <motion.div animate={{ width: `${percent}%` }} transition={progressBarTransition} />
 */
export const progressBarTransition = {
  duration: 0.6,
  ease: easings.out,
} as const;

/**
 * Streak flame pulse — slight bounce on streak increment.
 * Source: video 01 @ 00:00.800 (streak 3 → 4)
 */
export const streakBumpVariants: Variants = {
  idle: { scale: 1 },
  bump: {
    scale: [1, 1.2, 1],
    transition: { duration: 0.3, times: [0, 0.5, 1] },
  },
};

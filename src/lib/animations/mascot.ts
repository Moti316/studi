/**
 * Mascot (robot) animations — V7, V13, V14, V15.
 * Sources: video 02 @ 00:32.300 + video 07 (mascot reactions).
 *
 * Used by: <Mascot> (Bob the robot)
 */

import type { Variants } from 'framer-motion';
import { springs } from './_base';

/**
 * V7 — Robot pop-in (elastic mascot entry).
 * Source: video 02 @ 00:32.300 (T+100ms)
 *
 * Use when mascot enters a fresh scene (bottom-sheet, modal, screen).
 */
export const mascotPopVariants: Variants = {
  hidden: { scale: 0 },
  visible: {
    scale: [0, 1.1, 1],
    transition: {
      ...springs.elastic,
      times: [0, 0.7, 1],
      duration: 0.4,
    },
  },
};

/**
 * V13 — Idle float (sine-wave Y loop).
 * Source: video 07 (Bob hovering on every screen)
 *
 * Continuous animation — apply to mascot at rest.
 */
export const mascotIdleVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * V14 — Success reaction (lift + glow boost).
 * Source: video 07 (mascot reaction on correct answer / lesson complete)
 */
export const mascotSuccessVariants: Variants = {
  animate: {
    y: -15,
    filter: 'drop-shadow(0 0 30px rgba(6,182,212,0.8))',
    transition: { ...springs.elastic },
  },
};

/**
 * V15 — Error reaction (shake + downward shift + color shift).
 * Source: video 07 (mascot reaction on wrong answer)
 */
export const mascotErrorVariants: Variants = {
  animate: {
    y: 10,
    x: [0, -4, 4, -2, 2, 0],
    filter: 'drop-shadow(0 0 15px rgba(239,68,68,0.6))',
    transition: { duration: 0.4 },
  },
};

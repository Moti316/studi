/**
 * Skill-tree animations — V9, V10, V11, V12 from gemini-response 07-stats-feedback.
 *
 * Used by: <SkillTree>, <SkillNode>, <SkillPath>
 */

import type { Variants } from 'framer-motion';
import { easings, springs } from './_base';

/**
 * V9 — SVG path drawing (stroke-dashoffset trick via motion.path).
 * Source: video 07 @ 00:03.200
 *
 * @example
 * <motion.path d={pathD} variants={pathDrawVariants} initial="hidden" animate="visible" />
 */
export const pathDrawVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: easings.out },
  },
};

/**
 * V10 — Active node pop-in with primary-blue glow.
 * Source: video 07 @ 00:03.300
 */
export const activeNodeVariants: Variants = {
  hidden: { scale: 0, boxShadow: '0 0 0 rgba(26,86,219,0)' },
  visible: {
    scale: [0, 1.1, 1],
    boxShadow: '0 0 15px -3px rgba(26,86,219,0.5)',
    transition: { ...springs.elastic, times: [0, 0.7, 1] },
  },
};

/**
 * V11 — Locked node reveal (simple fade + slide).
 * Source: video 07 @ 00:03.500
 */
export const lockedNodeVariants: Variants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

/**
 * V12 — Unlock sequence (3-stage: shake → ripple → icon-pop).
 * Source: video 07 deep-dive B3.
 *
 * Trigger sequentially when a locked node unlocks.
 */
export const unlockSequence = {
  /** Stage 1 — Lock icon shakes then fades out */
  lockShake: {
    x: [0, -3, 3, -2, 2, 0],
    opacity: [1, 1, 1, 1, 0],
    transition: { duration: 0.2 },
  },
  /** Stage 2 — Primary-blue ripple ring expands and fades */
  ripple: {
    scale: [1, 1.5],
    opacity: [1, 0],
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  /** Stage 3 — New icon pops in */
  iconPop: {
    scale: [0.5, 1],
    transition: { duration: 0.2, ...springs.pop },
  },
} as const;

/**
 * Modal animations — V17 from gemini-response 07-stats-feedback.
 *
 * Used by: <DeepExplanationModal> (center-pop, NOT bottom-sheet).
 */

import type { Variants } from 'framer-motion';
import { springs } from './_base';

/**
 * V17 — Center modal grow + lift + fade (deep-explanation).
 * Source: video 07 deep-dive B2.
 *
 * @example
 * <motion.div variants={centerModalVariants} initial="hidden" animate="visible" exit="exit" />
 */
export const centerModalVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0, y: 20 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { ...springs.modal },
  },
  exit: { scale: 0.9, opacity: 0, transition: { duration: 0.15 } },
};

/**
 * Backdrop deepens to blur-8px in parallel with modal entry.
 */
export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
  visible: {
    opacity: 0.6,
    backdropFilter: 'blur(8px)',
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: { duration: 0.15 },
  },
};

/**
 * Modal content staggered fade — for inner elements after modal grows.
 * Children should have variant transition delay: 0.25s base + 0.05s stagger.
 */
export const modalContentVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.25,
      staggerChildren: 0.05,
    },
  },
};

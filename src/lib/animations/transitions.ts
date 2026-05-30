/**
 * Screen + element transitions.
 * Sources: videos 01, 04, 05 (page-flow, spinner, modal-grow).
 *
 * Used by: full-page wizards, loading states, course-create modal.
 */

import type { Variants } from 'framer-motion';
import { easings, springs } from './_base';

/**
 * V24 — Full-page horizontal slide (wizard / quiz page).
 * Source: video 04 @ 00:03.700-00:03.800 (multi-step wizard slide).
 *
 * @example
 * <AnimatePresence mode="wait" custom={direction}>
 *   <motion.div key={step} variants={pageSlideHorizontal} ... />
 * </AnimatePresence>
 */
export const pageSlideHorizontal: Variants = {
  enter: { x: '100%', opacity: 0 },
  active: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', bounce: 0, duration: 0.4 },
  },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.3, ease: easings.in } },
};

/**
 * V25 — Spinner appear + spin loop.
 * Source: video 04 @ 00:01.400-00:01.600 (loading spinner).
 *
 * Combine enter variant + animate.rotate continuous loop.
 */
export const spinnerEnterVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.15, ease: easings.out },
  },
};

export const spinnerRotateAnimation = {
  rotate: 360,
  transition: { duration: 1, repeat: Infinity, ease: 'linear' },
} as const;

/**
 * V26 — Center modal grow (lighter than V17 — for confirm dialogs).
 * Source: video 05 @ 00:13.700 (course-creation modal).
 */
export const centerModalLightVariants: Variants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { ...springs.modal },
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

/**
 * V27 — Loader → checkmark morph (job-success swap).
 * Source: video 05 @ 00:29.100 (spinner replaced by green ✓).
 *
 * @example
 * {isLoading ? (
 *   <motion.div {...spinnerEnterVariants} animate={spinnerRotateAnimation}><Spinner/></motion.div>
 * ) : (
 *   <motion.div variants={checkmarkPopVariants} initial="hidden" animate="visible"><Check/></motion.div>
 * )}
 */
export const checkmarkPopVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { ...springs.pop },
  },
};

/**
 * V28 — Stagger grid (page-grid items reveal).
 * Source: video 04 @ 00:13.700 (570-page grid loads with staggered fade-up).
 */
export const gridStaggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

export const gridStaggerItem: Variants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.2, ease: easings.out },
  },
};

/**
 * V29 — Checkbox/radio pop (selection on page-grid item).
 * Source: video 04 @ 00:13.800+ (blue checkmark scale 0→1 spring).
 */
export const checkboxPopVariants: Variants = {
  unchecked: { scale: 0, opacity: 0 },
  checked: {
    scale: 1,
    opacity: 1,
    transition: { ...springs.pop },
  },
};

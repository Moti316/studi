/**
 * Bottom-sheet animations — V6 from gemini-response 02-lesson-flow.
 *
 * Used by: <FeedbackDrawer>, <LessonCompleteSheet>
 */

import type { Variants } from 'framer-motion';
import { springs } from './_base';

/**
 * V6 — Bottom-sheet slide-up (error/feedback drawer).
 * Source: video 02 @ 00:32.200 (deep-dive 2.3)
 *
 * @example
 * <AnimatePresence>
 *   {isOpen && (
 *     <motion.div
 *       variants={bottomSheetVariants}
 *       initial="hidden"
 *       animate="visible"
 *       exit="exit"
 *     >...</motion.div>
 *   )}
 * </AnimatePresence>
 */
export const bottomSheetVariants: Variants = {
  hidden: { y: '100%', opacity: 1 },
  visible: {
    y: '0%',
    transition: { ...springs.layout },
  },
  exit: {
    y: '100%',
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

/**
 * Backdrop fade for bottom-sheet — appears in parallel.
 */
export const backdropFadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.6, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

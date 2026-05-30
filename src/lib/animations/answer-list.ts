/**
 * Answer list stagger — V8 from gemini-response 02-lesson-flow.
 *
 * Used by: feedback drawer showing list of correct/incorrect answers.
 */

import type { Variants } from 'framer-motion';
import { springs } from './_base';

/**
 * V8 — Container variant for staggered children.
 * Source: video 02 @ 00:32.500
 *
 * @example
 * <motion.ul variants={answerListContainer} initial="hidden" animate="visible">
 *   {items.map(i => <motion.li key={i.id} variants={answerListItem}>...</motion.li>)}
 * </motion.ul>
 */
export const answerListContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05, // 50ms between items
      delayChildren: 0.1, // wait for drawer
    },
  },
};

/**
 * V8 — Individual list-item slide-up.
 */
export const answerListItem: Variants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { ...springs.button },
  },
};

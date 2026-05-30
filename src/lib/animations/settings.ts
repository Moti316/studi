/**
 * Settings UI animations — toggles, segmented controls, toasts, voice loaders.
 * Source: video 06 (settings + voice-preview).
 *
 * Used by: <SettingsScreen>, <ThemeToggle>, <VoiceCard>, <Toast>
 */

import type { Transition, Variants } from 'framer-motion';

/**
 * V30 — Toggle switch (iOS-style, tight settling).
 * Source: video 06 @ 00:32.400 (accessibility toggle on→off).
 *
 * Use a stiff spring with high damping for native-feel snap.
 *
 * @example
 * <motion.div
 *   className="relative w-12 h-7 rounded-pill"
 *   animate={{ backgroundColor: isOn ? '#007AFF' : '#E5E5EA' }}
 *   transition={toggleSwitchTransition}
 * >
 *   <motion.div
 *     className="w-6 h-6 rounded-full bg-white"
 *     animate={{ x: isOn ? 20 : 0 }}
 *     transition={toggleSwitchTransition}
 *   />
 * </motion.div>
 */
export const toggleSwitchTransition = {
  type: 'spring',
  stiffness: 700,
  damping: 40,
} as const satisfies Transition;

/**
 * V31 — Segmented control "magic motion" pill background.
 * Source: video 06 @ 00:18.400-00:20.400 (theme toggle: bright/dark/system).
 *
 * Use Framer's `layoutId` on the highlight `<motion.div>` to get the
 * smooth slide-between-segments effect.
 *
 * @example
 * {options.map(opt => (
 *   <button key={opt}>
 *     {opt === active && (
 *       <motion.div layoutId="segmented-pill" transition={segmentedControlTransition} />
 *     )}
 *     <span>{opt}</span>
 *   </button>
 * ))}
 */
export const segmentedControlTransition = {
  type: 'spring',
  bounce: 0.15,
  duration: 0.3,
} as const satisfies Transition;

/**
 * V32 — Toast/Snackbar slide-up from bottom.
 * Source: video 06 @ 00:27.300 ("הקול עודכן ל'יואב'").
 *
 * Includes hidden initial, visible animate, and exit-down on dismiss.
 */
export const toastVariants: Variants = {
  hidden: { y: 100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 500, damping: 30 },
  },
  exit: {
    y: 100,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

/**
 * V33 — Voice-card loader (mini-spinner inside card → checkmark swap).
 * Source: video 06 @ 00:26.400 (voice change: loader spins ~700ms then ✓).
 *
 * Two-stage: spinner appears immediately, then morphs to checkmark on success.
 */
export const voiceCardLoaderVariants: Variants = {
  idle: { opacity: 1 },
  loading: { opacity: 1 },
  success: {
    opacity: 1,
    transition: { duration: 0.15 },
  },
};

/**
 * V34 — Daily-goal selector pill (similar to V31 but for goal options).
 * Source: video 06 @ 00:20.900 (10/15/20-min selector).
 *
 * Same pattern as segmented control — wrap chosen-option indicator with
 * `layoutId="daily-goal-pill"`.
 */
export const dailyGoalPillTransition = segmentedControlTransition;

/**
 * Animation base — spring presets + reduced-motion respect.
 *
 * Source: gemini analysis of StudiesGo videos 02 + 07.
 * StudiesGo uses springs almost exclusively (not cubic-bezier).
 *
 * @see docs/design/motion-specs.md
 */

import type { Transition, Variants } from 'framer-motion';

/**
 * Spring presets calibrated from Gemini observation.
 */
export const springs = {
  /** Buttons, micro-interactions, scale-bumps */
  button: { type: 'spring', stiffness: 400, damping: 25 } as const satisfies Transition,

  /** Large element entry (cards, modals, mascot) — more elastic */
  elastic: { type: 'spring', stiffness: 300, damping: 12 } as const satisfies Transition,

  /** Pop animations — fast with bounce */
  pop: { type: 'spring', stiffness: 500, damping: 15 } as const satisfies Transition,

  /** Layout transitions (default for AnimatePresence) */
  layout: { type: 'spring', stiffness: 350, damping: 30 } as const satisfies Transition,

  /** Modal-grow (center modal opening — V17) */
  modal: { type: 'spring', stiffness: 300, damping: 25 } as const satisfies Transition,
} as const;

/**
 * Duration presets in seconds (matching CSS-in-JS conventions).
 */
export const durations = {
  fast: 0.05,
  base: 0.15,
  medium: 0.25,
  slow: 0.4,
  loop: 3, // mascot idle float cycle
} as const;

/**
 * Easing curves (bezier-style for non-spring transitions).
 */
export const easings = {
  /** Standard ease-out — for screen-enters, fade-ins */
  out: [0.4, 0, 0.2, 1] as const,
  /** ease-in — for screen-exits */
  in: [0.4, 0, 1, 1] as const,
  /** ease-in-out — for fade-betweens */
  inOut: [0.4, 0, 0.2, 1] as const,
} as const;

/**
 * Respect prefers-reduced-motion — return no-op variants when reduced.
 * Use this to wrap any complex animation variants.
 */
export function respectReducedMotion(variants: Variants): Variants {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return variants;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) return variants;
  // Strip all transitions when reduced
  return Object.fromEntries(
    Object.entries(variants).map(([key, value]) => [
      key,
      typeof value === 'object' && value !== null
        ? { ...value, transition: { duration: 0 } }
        : value,
    ]),
  );
}

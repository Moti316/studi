/**
 * Particle / confetti configuration — gemini-response 07-stats-feedback section ה'.
 *
 * Used for: success celebrations (correct answer, level-up, lesson complete).
 * Recommendation: pair with `canvas-confetti` or `react-confetti`.
 */

/**
 * Confetti shoot config — fountain from bottom-center.
 *
 * @example
 * import confetti from 'canvas-confetti';
 * confetti(confettiConfig);
 */
export const confettiConfig = {
  particleCount: 80,
  spread: 90,
  startVelocity: 30,
  decay: 0.94,
  gravity: 0.6,
  colors: ['#10B981', '#FBBF24', '#FFFFFF'],
  origin: { y: 0.8, x: 0.5 },
  ticks: 200, // ~800ms at 240fps
} as const;

'use client';

/**
 * <LessonHeader> — top bar of the lesson player.
 *
 * Shows: progress-dots (●●●○○) · XP counter · streak (🔥) · AI-disclaimer notice.
 *
 * Spec: docs/screens-spec/lesson-mcq-long.md (header block)
 * Animations: src/lib/animations gamification (V21 progressDot · V19 xpCountUpFlash
 *   · streakBump) wrapped in respectReducedMotion.
 * RTL-first: dir="rtl", logical props (ps-/pe-/gap), mirrored layout.
 */

import { motion } from 'framer-motion';
import {
  progressDotVariants,
  xpCountUpFlashVariants,
  streakBumpVariants,
  respectReducedMotion,
} from '@/lib/animations';

export type LessonHeaderProps = {
  /** Total questions in the lesson (number of progress dots). */
  totalQuestions: number;
  /** Zero-based index of the current question. */
  currentIndex: number;
  /** Accumulated XP to display. */
  xp: number;
  /** Current streak; the 🔥 badge is hidden when 0. */
  streak: number;
};

const AI_NOTICE = 'המידע נוצר על-ידי AI ועלול להכיל שגיאות';

export function LessonHeader({ totalQuestions, currentIndex, xp, streak }: LessonHeaderProps) {
  const safeDot = respectReducedMotion(progressDotVariants);
  const safeXpFlash = respectReducedMotion(xpCountUpFlashVariants);
  const safeStreak = respectReducedMotion(streakBumpVariants);

  const answered = Math.min(Math.max(currentIndex + 1, 0), totalQuestions);

  return (
    <header
      dir="rtl"
      role="banner"
      className="flex flex-col gap-3 font-hebrew"
      data-testid="lesson-header"
    >
      {/* ── Top row: progress dots · XP · streak ── */}
      <div className="flex items-center justify-between gap-3">
        {/* Progress dots */}
        <div
          role="progressbar"
          aria-label="התקדמות בשיעור"
          aria-valuenow={answered}
          aria-valuemin={0}
          aria-valuemax={totalQuestions}
          className="flex flex-1 items-center gap-1.5"
          data-testid="progress-dots"
        >
          {Array.from({ length: totalQuestions }).map((_, i) => {
            const isCurrent = i === currentIndex;
            const isDone = i < currentIndex;
            return (
              <motion.span
                key={i}
                data-testid={`progress-dot-${i}`}
                aria-current={isCurrent ? 'step' : undefined}
                className="h-2.5 w-2.5 flex-shrink-0 rounded-pill"
                variants={safeDot}
                initial={false}
                animate={isDone || isCurrent ? 'active' : 'inactive'}
              />
            );
          })}
        </div>

        {/* XP + streak */}
        <div className="flex items-center gap-3">
          <motion.span
            data-testid="xp-counter"
            aria-label={`ניקוד: ${xp} נקודות`}
            className="inline-flex items-center gap-1 text-sm font-bold text-quiz-text-primary"
            variants={safeXpFlash}
            initial="idle"
            animate="idle"
          >
            <span aria-hidden="true" className="text-accent-500">
              ⭐
            </span>
            {xp}
          </motion.span>

          {streak > 0 && (
            <motion.span
              data-testid="streak-badge"
              aria-label={`רצף: ${streak} ימים`}
              className="inline-flex items-center gap-1 text-sm font-bold text-accent-600"
              variants={safeStreak}
              initial="idle"
              animate="idle"
            >
              <span aria-hidden="true">🔥</span>
              {streak}
            </motion.span>
          )}
        </div>
      </div>

      {/* ── AI disclaimer ── */}
      <p
        role="note"
        data-testid="ai-notice"
        className="flex items-center gap-1.5 rounded-card bg-quiz-explanation px-3 py-2 text-xs leading-snug text-quiz-text-secondary"
      >
        <span aria-hidden="true">ℹ️</span>
        <span>{AI_NOTICE}</span>
      </p>
    </header>
  );
}

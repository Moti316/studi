'use client';

/**
 * <LessonHeader> — top bar of the lesson player (B1 bold redesign · 2026-06-11).
 *
 * Shows: gradient progress-track (●●●▬○○) · XP glass-pill · streak flame-pill · AI-disclaimer.
 *
 * Spec: docs/screens-spec/lesson-mcq-long.md (header block)
 * Design: shares the dashboard's bold language — brand-blue progress, accent glass-pills.
 *   (Static brand styling, not the legacy orange framer dot-variant — keeps it on-brand.)
 * RTL-first: dir="rtl", logical props, mirrored layout.
 */

import { cn } from '@/lib/utils';

export type LessonHeaderProps = {
  /** Total questions in the lesson (number of progress segments). */
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
  const answered = Math.min(Math.max(currentIndex + 1, 0), totalQuestions);

  return (
    <header
      dir="rtl"
      role="banner"
      className="flex flex-col gap-3 font-hebrew"
      data-testid="lesson-header"
    >
      {/* ── Top row: progress segments · XP · streak ── */}
      <div className="flex items-center justify-between gap-3">
        {/* Progress segments — brand-blue gradient fill, current segment widened + glow */}
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
              <span
                key={i}
                data-testid={`progress-dot-${i}`}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'h-2.5 flex-shrink-0 rounded-pill transition-all duration-300',
                  isCurrent
                    ? 'w-6 bg-gradient-to-bl from-primary-500 to-primary-600 shadow-button'
                    : isDone
                      ? 'w-2.5 bg-primary-500'
                      : 'w-2.5 bg-quiz-border',
                )}
              />
            );
          })}
        </div>

        {/* XP + streak — bold glass-pills (dashboard vocabulary) */}
        <div className="flex items-center gap-2">
          <span
            data-testid="xp-counter"
            aria-label={`ניקוד: ${xp} נקודות`}
            className="inline-flex items-center gap-1 rounded-pill bg-primary-50 px-2.5 py-1 text-sm font-extrabold text-primary-700 ring-1 ring-inset ring-primary-100"
          >
            <span aria-hidden="true">⭐</span>
            {xp}
          </span>

          {streak > 0 && (
            <span
              data-testid="streak-badge"
              aria-label={`רצף: ${streak} ימים`}
              // טקסט-כהה (#7a4d00) על ענבר-בהיר ל-WCAG AA (accent-700 על accent-50 = 4.42:1 נכשל)
              className="inline-flex items-center gap-1 rounded-pill bg-accent-50 px-2.5 py-1 text-sm font-extrabold text-[#7a4d00] ring-1 ring-inset ring-accent-100"
            >
              <span aria-hidden="true" className="animate-flame-pulse">
                🔥
              </span>
              {streak}
            </span>
          )}
        </div>
      </div>

      {/* ── AI disclaimer ── */}
      <p
        role="note"
        data-testid="ai-notice"
        className="flex items-center gap-1.5 rounded-card bg-quiz-explanation px-3 py-2 text-xs leading-snug text-quiz-text-secondary ring-1 ring-inset ring-primary-100"
      >
        <span aria-hidden="true">ℹ️</span>
        <span>{AI_NOTICE}</span>
      </p>
    </header>
  );
}

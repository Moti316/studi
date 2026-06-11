'use client';

/**
 * <ExamPlayer> — מבחן-הסמכה-דמה (D3 · B1 bold).
 *
 * מצב-מבחן אמיתי: 30 שאלות-אמריקאיות · טיימר-60-דקות יורד · **אפס-משוב תוך-כדי**
 * (בניגוד לתרגול) · אפשר לדלג ולחזור · "הגש מבחן" בכל-עת · נגמר-הזמן ⇒ הגשה-אוטומטית.
 * תוצאה: עובר/נכשל (≥70) + סקירת-טעויות מלאה (השאלה · תשובתך · הנכונה).
 *
 * presentational (questions prop) → `/lesson/exam` (auth · DB) וגם `/preview/exam` (mock).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Timer, Flag, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Question } from '../../../drizzle/schema';
import {
  EXAM_DURATION_MIN,
  EXAM_PASS_PCT,
  scoreExam,
  correctIndexOf,
  formatTime,
  type ExamAnswers,
} from './exam-core';

export interface ExamPlayerProps {
  questions: Question[];
  /** משך בדקות (ברירת-מחדל 60 · ניתן-לקיצור ב-preview). */
  durationMin?: number;
}

/** אפשרויות-שאלה כ-string[] (schema-as-is). */
function optionsOf(q: Question): string[] {
  return Array.isArray(q.options) ? (q.options as unknown[]).map(String) : [];
}

export function ExamPlayer({ questions, durationMin = EXAM_DURATION_MIN }: ExamPlayerProps) {
  const total = questions.length;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswers>({});
  const [finished, setFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(durationMin * 60);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(true);
  }, []);

  // טיימר יורד · נגמר-הזמן ⇒ הגשה-אוטומטית.
  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [finished, finish]);

  const answeredCount = Object.keys(answers).length;
  const score = useMemo(() => scoreExam(questions, answers), [questions, answers]);
  const lowTime = secondsLeft <= 5 * 60;

  if (total === 0) {
    return (
      <div
        dir="rtl"
        role="status"
        data-testid="exam-empty"
        className="rounded-card border border-quiz-border bg-card px-6 py-12 text-center font-hebrew"
      >
        <p className="text-base font-bold text-quiz-text-primary">אין שאלות-מבחן זמינות</p>
        <p className="mt-1 text-sm text-quiz-text-secondary">נסו שוב בקרוב.</p>
      </div>
    );
  }

  // ════════════════ מסך-תוצאות ════════════════
  if (finished) {
    return (
      <div dir="rtl" data-testid="exam-results" className="flex flex-col gap-4 font-hebrew">
        {/* hero עובר/נכשל */}
        <section
          className={cn(
            'relative overflow-hidden rounded-modal px-6 py-8 text-center text-white shadow-button ring-1',
            score.passed
              ? 'bg-gradient-to-bl from-[#0c5132] via-[#107048] to-success ring-success/30'
              : 'bg-gradient-to-bl from-primary-700 via-primary-600 to-primary-500 ring-primary-700/20',
          )}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15 blur-3xl"
          />
          <div className="relative flex flex-col items-center gap-2">
            <span aria-hidden="true" className="text-5xl">
              {score.passed ? '🎉' : '💪'}
            </span>
            <h2 className="text-3xl font-extrabold" data-testid="exam-verdict">
              {score.passed ? 'עברת את מבחן-הדמה!' : 'עוד לא — וזה בסדר'}
            </h2>
            <p className="text-base text-white/85">
              ציון:{' '}
              <span data-testid="exam-score" className="font-extrabold">
                {score.pct}
              </span>{' '}
              · ציון-עובר: {EXAM_PASS_PCT} · ענית נכון על {score.correct} מתוך {score.scorable}
            </p>
            {!score.passed && (
              <p className="text-sm text-white/70">
                סקור את הטעויות למטה — כל טעות היא שיעור לקראת הוועדה.
              </p>
            )}
          </div>
        </section>

        {/* סקירת-שאלות (טעויות תחילה) */}
        <section aria-label="סקירת המבחן" className="flex flex-col gap-2">
          <h3 className="text-sm font-extrabold text-quiz-text-primary">סקירה מלאה</h3>
          {questions.map((q, i) => {
            const ci = correctIndexOf(q);
            const opts = optionsOf(q);
            const mine = answers[i];
            const isCorrect = ci !== null && mine === ci;
            return (
              <details
                key={q.id}
                data-testid={`review-${i}`}
                className={cn(
                  'rounded-card border bg-card px-4 py-3 shadow-card',
                  isCorrect ? 'border-quiz-success-border' : 'border-quiz-error-border',
                )}
              >
                <summary className="flex cursor-pointer items-start gap-2 text-sm font-bold text-quiz-text-primary">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white',
                      isCorrect ? 'bg-success' : 'bg-error',
                    )}
                  >
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="flex-1">
                    {i + 1}. {q.prompt}
                  </span>
                </summary>
                <div className="mt-2 flex flex-col gap-1 ps-7 text-sm">
                  <p className="text-quiz-text-secondary">
                    תשובתך:{' '}
                    <span className={isCorrect ? 'font-bold text-success' : 'font-bold text-error'}>
                      {mine !== undefined ? (opts[mine] ?? '—') : 'לא נענתה'}
                    </span>
                  </p>
                  {!isCorrect && ci !== null && (
                    <p className="text-quiz-text-secondary">
                      הנכונה: <span className="font-bold text-success">{opts[ci] ?? '—'}</span>
                    </p>
                  )}
                  {q.explanation && (
                    <p className="mt-1 rounded-card bg-quiz-explanation px-3 py-2 text-xs leading-relaxed text-quiz-text-primary">
                      {q.explanation}
                    </p>
                  )}
                </div>
              </details>
            );
          })}
        </section>

        <button
          type="button"
          data-testid="exam-retake"
          onClick={() => window.location.reload()}
          className="w-full select-none rounded-pill bg-gradient-to-bl from-primary-500 to-primary-600 py-4 text-lg font-bold text-white shadow-button transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
        >
          מבחן חדש (שאלות אקראיות)
        </button>
      </div>
    );
  }

  // ════════════════ מסך-שאלה ════════════════
  const q = questions[idx]!;
  const opts = optionsOf(q);
  const mine = answers[idx];

  return (
    <div dir="rtl" data-testid="exam-player" className="flex flex-col gap-4 font-hebrew">
      {/* ── header: טיימר + התקדמות ── */}
      <header className="flex items-center justify-between gap-3">
        <span
          data-testid="exam-progress"
          className="rounded-pill bg-primary-50 px-3 py-1 text-sm font-extrabold text-primary-700 ring-1 ring-inset ring-primary-100"
        >
          {idx + 1} / {total}
        </span>
        <span className="text-xs font-medium text-quiz-text-secondary">
          נענו: {answeredCount}/{total}
        </span>
        <span
          data-testid="exam-timer"
          aria-live={lowTime ? 'polite' : undefined}
          aria-label={`זמן שנותר: ${formatTime(secondsLeft)}`}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-sm font-extrabold ring-1 ring-inset',
            lowTime
              ? 'bg-quiz-error-bg text-error ring-quiz-error-border'
              : 'bg-card text-quiz-text-primary ring-quiz-border',
          )}
        >
          <Timer className="size-4" aria-hidden="true" />
          {formatTime(secondsLeft)}
        </span>
      </header>

      {/* ── מצב-מבחן (אין משוב) ── */}
      <p className="rounded-card bg-quiz-explanation px-3 py-2 text-xs leading-snug text-quiz-text-secondary">
        🎓 מצב-מבחן: ללא משוב תוך-כדי. אפשר לדלג ולחזור. ציון-עובר: {EXAM_PASS_PCT}.
      </p>

      {/* ── השאלה ── */}
      <p className="text-start text-lg font-extrabold leading-relaxed text-quiz-text-primary">
        {q.prompt}
      </p>

      <div role="radiogroup" aria-label="אפשרויות תשובה" className="flex flex-col gap-2.5">
        {opts.map((opt, oi) => {
          const selected = mine === oi;
          return (
            <button
              key={oi}
              type="button"
              role="radio"
              aria-checked={selected}
              data-testid={`exam-option-${oi}`}
              onClick={() => setAnswers((a) => ({ ...a, [idx]: oi }))}
              className={cn(
                'flex min-h-[52px] items-center gap-2.5 rounded-card border-2 bg-card px-4 py-3 text-start text-sm font-medium leading-snug text-quiz-text-primary',
                'shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active',
                selected ? 'border-accent-500 bg-accent-500/10' : 'border-quiz-border',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-pill border text-xs font-extrabold',
                  selected
                    ? 'border-accent-500 bg-accent-500 text-quiz-text-primary'
                    : 'border-quiz-border bg-quiz-bg text-quiz-text-secondary',
                )}
              >
                {oi + 1}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* ── ניווט ── */}
      <div className="flex items-center justify-between gap-3 border-t border-quiz-border pt-4">
        <button
          type="button"
          data-testid="exam-prev"
          disabled={idx === 0}
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          className="inline-flex items-center gap-1 rounded-pill border border-quiz-border bg-card px-4 py-2.5 text-sm font-semibold text-quiz-text-secondary transition-colors hover:border-primary-500 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
          הקודמת
        </button>

        {idx < total - 1 ? (
          <button
            type="button"
            data-testid="exam-next"
            onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-pill bg-gradient-to-bl from-primary-500 to-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-button transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
          >
            הבאה
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <span className="flex-1" />
        )}

        <button
          type="button"
          data-testid="exam-finish"
          onClick={finish}
          className="inline-flex items-center gap-1.5 rounded-pill border-2 border-accent-500 bg-accent-50 px-4 py-2.5 text-sm font-bold text-[#7a4d00] transition-colors hover:bg-accent-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
        >
          <Flag className="size-4" aria-hidden="true" />
          הגש מבחן
        </button>
      </div>
    </div>
  );
}

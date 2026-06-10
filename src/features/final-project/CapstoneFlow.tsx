'use client';

/**
 * src/features/final-project/CapstoneFlow.tsx — מנצח-תזמורת wizard פרויקט-הגמר (JSA Capstone).
 *
 * ארבעה שלבים לפי useCapstoneStore.step:
 *   site     → <SiteStep>      — בחירת-אתר + פרופיל-מקום-עבודה (שלב 1).
 *   hazards  → <JsaBuilder>    — בניית טבלת-JSA שורה-אחר-שורה (שלבים 2-3).
 *   matrix   → <RiskMatrix>    — הצגת מטריצת-הסיכון + מדרג-בקרות + ולידציה (שלב 3).
 *   feedback → <FeedbackStep>  — משוב-AI (Claude-Haiku / fallback דטרמיניסטי) + הכנה-להגשה.
 *
 * אחריות:
 *   - progress-bar פר-שלב (aria-valuenow / aria-valuemax / aria-label).
 *   - stepper ויזואלי עם מצבי active / completed / disabled.
 *   - כפתורי ניווט קדימה / אחורה עם ולידציה בסיסית (מניעת מעבר ללא-תנאים).
 *   - מסירת callbacks onBack / onSubmit לשלבים שדורשים אותם.
 *   - RTL-first: dir="rtl" · logical-props · icons מתהפכים.
 *   - data-testid על כל אלמנט interactive.
 *   - מצבי loading / empty / error מטופלים בתוך כל step-component.
 *
 * ראה:
 *   courses/safety-officer/FINAL-PROJECT.md
 *   src/features/final-project/{types,store,jsa-validation}.ts
 *   src/features/final-project/components/{SiteStep,JsaBuilder,RiskMatrix,FeedbackStep}.tsx
 */

import React, { useCallback } from 'react';
import { useCapstoneStore, selectStep, selectSite, selectJsaRows } from './store';
import type { CapstoneStep } from './types';
import { SiteStep } from './components/SiteStep';
import { JsaBuilder } from './components/JsaBuilder';
import { RiskMatrix } from './components/RiskMatrix';
import { FeedbackStep } from './components/FeedbackStep';

// ---------------------------------------------------------------------------
// קונפיגורציית הסטפר
// ---------------------------------------------------------------------------

interface StepMeta {
  key: CapstoneStep;
  /** תווית-תצוגה בעברית */
  label: string;
  /** תיאור-נגישות מורחב */
  description: string;
}

const STEPS: StepMeta[] = [
  {
    key: 'site',
    label: 'פרופיל-אתר',
    description: 'בחירת מקום-עבודה ממשי ומאפייניו',
  },
  {
    key: 'hazards',
    label: 'טבלת-JSA',
    description: 'סקר-מפגעים ובניית טבלת-ניתוח-סיכונים',
  },
  {
    key: 'matrix',
    label: 'מטריצת-סיכון',
    description: 'הצגת פיזור-הסיכונים ובדיקת מדרג-הבקרות',
  },
  {
    key: 'feedback',
    label: 'משוב והגשה',
    description: 'הערכת הפרויקט ו-checklist להגשה לוועדה',
  },
];

const STEP_INDEX: Record<CapstoneStep, number> = {
  site: 0,
  hazards: 1,
  matrix: 2,
  feedback: 3,
};

// ---------------------------------------------------------------------------
// CapstoneFlow — מנצח-הthrchestra
// ---------------------------------------------------------------------------

/**
 * CapstoneFlow — wizard ראשי לפרויקט-הגמר.
 * Client Component; קורא useCapstoneStore ישירות — אין props.
 * data-testid="capstone-flow" משמש כנקודת-כניסה לטסטים.
 */
export function CapstoneFlow() {
  const step = useCapstoneStore(selectStep);
  const setStep = useCapstoneStore((s) => s.setStep);
  const reset = useCapstoneStore((s) => s.reset);
  const site = useCapstoneStore(selectSite);
  const jsaRows = useCapstoneStore(selectJsaRows);

  const currentIndex = STEP_INDEX[step];
  const totalSteps = STEPS.length;

  // ── callbacks ────────────────────────────────────────────────────────────

  /** ניווט קדימה עם ולידציה בסיסית */
  const handleNext = useCallback(() => {
    const next = STEPS[currentIndex + 1];
    if (!next) return;

    // שלב 1→2: חייב site
    if (step === 'site' && !site) return;
    // שלב 2→3: חייב לפחות שורה אחת
    if (step === 'hazards' && jsaRows.length === 0) return;

    setStep(next.key);
  }, [step, site, jsaRows.length, currentIndex, setStep]);

  /** ניווט אחורה */
  const handleBack = useCallback(() => {
    const prev = STEPS[currentIndex - 1];
    if (prev) setStep(prev.key);
  }, [currentIndex, setStep]);

  /** FeedbackStep → ריסט (פרויקט חדש) */
  const handleFinish = useCallback(() => {
    reset();
  }, [reset]);

  // ── האם כפתור-קדימה מאופשר ────────────────────────────────────────────

  const canAdvance =
    step === 'site'
      ? !!site
      : step === 'hazards'
        ? jsaRows.length > 0
        : step === 'matrix'
          ? true
          : /* feedback */ false; // השלב האחרון — אין "קדימה"

  const isLastStep = currentIndex === totalSteps - 1;

  // ── progress ──────────────────────────────────────────────────────────────

  /** אחוז-התקדמות לפרוגרס-בר (שלב 1 = 25% · שלב 4 = 100%). */
  const progressPct = Math.round(((currentIndex + 1) / totalSteps) * 100);

  return (
    <div
      dir="rtl"
      data-testid="capstone-flow"
      className="mx-auto flex w-full max-w-3xl flex-col gap-0 font-hebrew"
    >
      {/* ════════════════════════════════════════════════════════════
          STEPPER + PROGRESS-BAR
      ════════════════════════════════════════════════════════════ */}
      <CapstoneStepperHeader
        currentIndex={currentIndex}
        progressPct={progressPct}
        totalSteps={totalSteps}
        onStepClick={(idx) => {
          // מותר לנווט רק לשלבים שכבר הגענו אליהם (לא קפיצה קדימה)
          if (idx <= currentIndex) {
            const target = STEPS[idx];
            if (target) setStep(target.key);
          }
        }}
      />

      {/* ════════════════════════════════════════════════════════════
          תוכן השלב הנוכחי
      ════════════════════════════════════════════════════════════ */}
      <main
        aria-label={`שלב ${currentIndex + 1} מתוך ${totalSteps}: ${STEPS[currentIndex]?.label ?? ''}`}
        className="rounded-b-card border border-t-0 border-quiz-border bg-quiz-bg p-5 sm:p-6"
      >
        {step === 'site' && <SiteStep />}

        {step === 'hazards' && (
          <>
            <JsaBuilder />
            {/* ניווט-hazards: קדימה רק עם שורות */}
            <StepNavBar
              onBack={handleBack}
              onNext={handleNext}
              canAdvance={jsaRows.length > 0}
              isLastStep={false}
              nextLabel="המשך למטריצה"
            />
          </>
        )}

        {step === 'matrix' && (
          <>
            <RiskMatrix rows={jsaRows} />
            {/* ניווט-matrix: תמיד מאופשר */}
            <StepNavBar
              onBack={handleBack}
              onNext={handleNext}
              canAdvance={true}
              isLastStep={false}
              nextLabel="המשך למשוב"
            />
          </>
        )}

        {step === 'feedback' && <FeedbackStep onBack={handleBack} onSubmit={handleFinish} />}
      </main>

      {/* ════════════════════════════════════════════════════════════
          כפתור-איפוס (תמיד גלוי — פרויקט חדש)
      ════════════════════════════════════════════════════════════ */}
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          data-testid="capstone-reset-btn"
          onClick={reset}
          className={[
            'rounded-pill border border-quiz-border bg-white px-5 py-2 text-xs font-medium text-quiz-text-secondary',
            'hover:border-error hover:text-error',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error',
            'select-none transition-colors',
          ].join(' ')}
        >
          התחל פרויקט חדש
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CapstoneStepperHeader — progress-bar + stepper ויזואלי
// ---------------------------------------------------------------------------

interface CapstoneStepperHeaderProps {
  currentIndex: number;
  progressPct: number;
  totalSteps: number;
  onStepClick: (idx: number) => void;
}

function CapstoneStepperHeader({
  currentIndex,
  progressPct,
  totalSteps,
  onStepClick,
}: CapstoneStepperHeaderProps) {
  return (
    <header
      className="rounded-t-card border border-quiz-border bg-white px-5 pb-4 pt-5"
      data-testid="capstone-stepper"
    >
      {/* ── progress-bar ─────────────────────────────────── */}
      <div
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`התקדמות: שלב ${currentIndex + 1} מתוך ${totalSteps}`}
        data-testid="capstone-progress-bar"
        className="mb-4 h-1.5 w-full overflow-hidden rounded-pill bg-quiz-border"
      >
        <div
          aria-hidden="true"
          className="h-full rounded-pill bg-quiz-primary-active transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── stepper tabs ─────────────────────────────────── */}
      <nav aria-label="שלבי הפרויקט">
        <ol className="flex gap-0.5" role="list">
          {STEPS.map((s, idx) => {
            const isDone = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isFuture = idx > currentIndex;
            const isClickable = idx <= currentIndex;

            return (
              <li key={s.key} role="listitem" className="flex flex-1 flex-col items-center">
                <button
                  type="button"
                  data-testid={`capstone-step-btn-${s.key}`}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`שלב ${idx + 1}: ${s.label}${isDone ? ' (הושלם)' : ''} — ${s.description}`}
                  disabled={isFuture}
                  onClick={() => isClickable && onStepClick(idx)}
                  className={[
                    'flex flex-col items-center gap-1.5 px-1 py-0 transition-all',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active',
                    isClickable && !isCurrent
                      ? 'cursor-pointer hover:opacity-80'
                      : isFuture
                        ? 'cursor-not-allowed'
                        : 'cursor-default',
                  ].join(' ')}
                >
                  {/* עיגול-שלב */}
                  <span
                    aria-hidden="true"
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-extrabold transition-all',
                      isDone
                        ? 'border-quiz-primary-active bg-quiz-primary-active text-white'
                        : isCurrent
                          ? 'border-quiz-primary-active bg-white text-quiz-primary-active shadow-button'
                          : 'border-quiz-border bg-white text-quiz-text-secondary',
                    ].join(' ')}
                  >
                    {isDone ? '✓' : idx + 1}
                  </span>

                  {/* תווית */}
                  <span
                    className={[
                      'hidden text-center text-[11px] leading-snug sm:block',
                      isDone ? 'font-medium text-quiz-primary-active' : '',
                      isCurrent ? 'font-bold text-quiz-text-primary' : '',
                      isFuture ? 'text-quiz-text-secondary' : '',
                    ].join(' ')}
                  >
                    {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </header>
  );
}

// ---------------------------------------------------------------------------
// StepNavBar — שורת-ניווט קדימה / אחורה (עבור שלבים שלא מנהלים את הניווט עצמם)
// ---------------------------------------------------------------------------

interface StepNavBarProps {
  onBack: () => void;
  onNext: () => void;
  canAdvance: boolean;
  isLastStep: boolean;
  nextLabel?: string;
}

/**
 * StepNavBar — כפתורי ניווט תחתונים.
 * מוצג רק בשלב hazards ו-matrix (SiteStep + FeedbackStep מנהלים ניווט עצמאי).
 */
function StepNavBar({ onBack, onNext, canAdvance, isLastStep, nextLabel }: StepNavBarProps) {
  return (
    <div
      data-testid="capstone-step-nav"
      className="mt-6 flex flex-row-reverse items-center justify-between gap-3 border-t border-quiz-border pt-5"
    >
      {/* כפתור-קדימה (RTL: ימין) */}
      <button
        type="button"
        data-testid="capstone-next-btn"
        onClick={onNext}
        disabled={!canAdvance}
        className={[
          'flex min-w-[9rem] select-none items-center justify-center gap-1.5 rounded-pill px-6 py-3 text-sm font-bold transition-all',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active',
          canAdvance
            ? 'bg-quiz-primary-active text-white shadow-button hover:bg-primary-600'
            : 'cursor-not-allowed bg-quiz-primary-disabled text-white opacity-60',
        ].join(' ')}
      >
        {nextLabel ?? (isLastStep ? 'קבל משוב' : 'הבא')}
        {/* chevron שמאלה ב-RTL = קדימה */}
        {!isLastStep && (
          <span aria-hidden="true" className="text-base leading-none">
            ‹
          </span>
        )}
      </button>

      {/* כפתור-אחורה (RTL: שמאל) */}
      <button
        type="button"
        data-testid="capstone-prev-btn"
        onClick={onBack}
        className={[
          'flex select-none items-center gap-1 rounded-pill border border-quiz-border bg-white px-5 py-3 text-sm font-medium text-quiz-text-secondary',
          'hover:border-quiz-primary-active hover:text-quiz-primary-active',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active',
          'transition-colors',
        ].join(' ')}
      >
        {/* chevron ימינה ב-RTL = אחורה */}
        <span aria-hidden="true" className="text-base leading-none">
          ›
        </span>
        הקודם
      </button>
    </div>
  );
}

'use client';

/**
 * src/features/final-project/components/SiteStep.tsx
 *
 * שלב 1 בפרויקט-הגמר (wizard): בחירת-אתר וקביעת-פרופיל-מקום-העבודה.
 *
 * מטרה: המשתמש ממלא SiteInfo → setSite(site) → setStep('hazards').
 *
 * שדות:
 *   - שם-האתר       (שדה-טקסט חופשי, תיאורי בלבד — לא PII)
 *   - ענף-תעשייה    (radio-group ויזואלי, 8 אפשרויות)
 *   - מספר-עובדים   (number input, min 1)
 *   - מפגעים-עיקריים (checklist + כתיבה-חופשית, לפחות 1)
 *
 * ולידציה:
 *   - שם מינימום 2 תווים
 *   - ענף חייב להיבחר
 *   - מספר-עובדים ≥ 1 (שלם)
 *   - לפחות מפגע-עיקרי 1
 *
 * RTL-first: dir="rtl", logical props (ps-/pe-/text-start).
 * state מקומי (controlled form) → לא קורא לשום DB/fetch.
 * על submit: setSite + setStep('hazards').
 *
 * name-clean: שדה-שם תיאורי-תפקוד/ענף בלבד — לא שם-אדם/חברה.
 * ראה: courses/safety-officer/FINAL-PROJECT.md · types.ts.
 */

import React, { useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCapstoneStore } from '@/features/final-project/store';
import type { IndustrySector, SiteInfo } from '@/features/final-project/types';

// ---------------------------------------------------------------------------
// קבועים: ענפי-תעשייה
// ---------------------------------------------------------------------------

interface SectorOption {
  value: IndustrySector;
  /** תווית-תצוגה בעברית */
  label: string;
  /** אמוג'י/סמל לייצוג ויזואלי (aria-hidden) */
  icon: string;
}

const SECTOR_OPTIONS: SectorOption[] = [
  { value: 'construction', label: 'בנייה', icon: '🏗️' },
  { value: 'manufacturing', label: 'ייצור / מפעל', icon: '🏭' },
  { value: 'electrical', label: 'חשמל', icon: '⚡' },
  { value: 'chemicals', label: 'חומ"ס', icon: '🧪' },
  { value: 'agriculture', label: 'חקלאות', icon: '🌾' },
  { value: 'logistics', label: 'לוגיסטיקה / מחסן', icon: '📦' },
  { value: 'maintenance', label: 'אחזקה', icon: '🔧' },
  { value: 'other', label: 'אחר', icon: '⚙️' },
];

// ---------------------------------------------------------------------------
// קבועים: מפגעים-עיקריים גנריים לבחירה-מהירה
// ---------------------------------------------------------------------------

const COMMON_HAZARDS: string[] = [
  'עבודה בגובה',
  'נפילת חפצים',
  'חשמל / מכה חשמלית',
  'ציוד הרמה / מלגזה',
  'חומרים מסוכנים',
  'פגיעה ממכונות',
  'לחץ חום / סביבת-עבודה קשה',
  'רעש',
  'חפירות / קריסת-קרקע',
  'כלים חדים / חיתוך',
];

// ---------------------------------------------------------------------------
// טיפוסי-ולידציה
// ---------------------------------------------------------------------------

interface FormErrors {
  name?: string;
  sector?: string;
  workerCount?: string;
  mainHazards?: string;
}

// ---------------------------------------------------------------------------
// פונקציות-עזר
// ---------------------------------------------------------------------------

function validate(
  name: string,
  sector: IndustrySector | '',
  workerCountRaw: string,
  mainHazards: string[],
): FormErrors {
  const errors: FormErrors = {};

  if (name.trim().length < 2) {
    errors.name = 'שם-האתר חייב להכיל לפחות 2 תווים';
  }
  if (!sector) {
    errors.sector = 'יש לבחור ענף-תעשייה';
  }
  const count = parseInt(workerCountRaw, 10);
  if (!workerCountRaw || isNaN(count) || count < 1 || !Number.isInteger(count)) {
    errors.workerCount = 'מספר-עובדים חייב להיות מספר שלם ≥ 1';
  }
  if (mainHazards.length === 0) {
    errors.mainHazards = 'יש לציין לפחות מפגע-עיקרי אחד';
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * SiteStep — שלב 1 בפרויקט-הגמר.
 *
 * מחזיר JSX טופס RTL עם ולידציה מקומית.
 * על submit תקין: setSite(site) + setStep('hazards').
 */
export function SiteStep() {
  // ---- store actions (selector צר — מניעת re-render) ----
  const setSite = useCapstoneStore((s) => s.setSite);
  const setStep = useCapstoneStore((s) => s.setStep);

  // ---- state מקומי של הטופס ----
  const [name, setName] = useState('');
  const [sector, setSector] = useState<IndustrySector | ''>('');
  const [workerCountRaw, setWorkerCountRaw] = useState('');
  const [checkedHazards, setCheckedHazards] = useState<Set<string>>(new Set());
  const [customHazard, setCustomHazard] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // ---- מזהי-a11y ייחודיים ----
  const nameId = useId();
  const sectorId = useId();
  const workerCountId = useId();
  const hazardsId = useId();
  const customHazardId = useId();

  // ---- חישוב: רשימת-מפגעים-מאוחדת ----
  function buildMainHazards(): string[] {
    const fromCheckbox = Array.from(checkedHazards);
    const fromCustom = customHazard
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return [...fromCheckbox, ...fromCustom];
  }

  // ---- toggle checkbox ----
  function toggleHazard(hazard: string) {
    setCheckedHazards((prev) => {
      const next = new Set(prev);
      if (next.has(hazard)) {
        next.delete(hazard);
      } else {
        next.add(hazard);
      }
      return next;
    });
  }

  // ---- submit ----
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const mainHazards = buildMainHazards();
    const errs = validate(name, sector, workerCountRaw, mainHazards);
    setErrors(errs);
    setSubmitted(true);

    if (Object.keys(errs).length > 0) return;

    const site: SiteInfo = {
      name: name.trim(),
      sector: sector as IndustrySector,
      workerCount: parseInt(workerCountRaw, 10),
      mainHazards,
    };

    setSite(site);
    setStep('hazards');
  }

  const hasErrors = submitted && Object.keys(errors).length > 0;

  return (
    <section
      dir="rtl"
      aria-labelledby="site-step-heading"
      data-testid="site-step"
      className="mx-auto w-full max-w-2xl rounded-card bg-quiz-bg p-6 shadow-card"
    >
      {/* ---- כותרת ---- */}
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-quiz-text-secondary">
          שלב 1 מתוך 4
        </p>
        <h1
          id="site-step-heading"
          className="text-start text-2xl font-bold leading-snug text-quiz-text-primary"
        >
          פרופיל-מקום-העבודה
        </h1>
        <p className="mt-1 text-start text-sm text-quiz-text-secondary">
          מלא את פרטי האתר לפני תחילת סקר-המפגעים. הנתונים משמשים לכיול-הסיכון וההמלצות.
        </p>
      </div>

      {/* ---- הודעת-שגיאה גלובלית (aria-live) ---- */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-testid="site-step-error-summary"
        className={cn(
          'mb-4 rounded-card border px-4 py-3 text-start text-sm font-medium',
          hasErrors ? 'border-quiz-error-border bg-quiz-error-bg text-error' : 'hidden',
        )}
      >
        יש לתקן את השדות המסומנים לפני המשך.
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-label="טופס פרופיל-מקום-עבודה"
        data-testid="site-step-form"
      >
        <div className="flex flex-col gap-6">
          {/* ======================================================= */}
          {/* שדה 1: שם-האתר                                          */}
          {/* ======================================================= */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={nameId} className="text-quiz-text-primary">
              שם-האתר / תיאור-המיקום
              <span aria-hidden="true" className="ms-1 text-error">
                *
              </span>
            </Label>
            <p id={`${nameId}-hint`} className="text-xs text-quiz-text-secondary">
              תיאורי-תפקוד בלבד (לדוגמה: &quot;אתר-בנייה קומות&quot; / &quot;מפעל-מזון&quot;). ללא
              שמות-אנשים.
            </p>
            <Input
              id={nameId}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: אתר-בנייה קומות — רמת-גן"
              autoComplete="off"
              aria-required="true"
              aria-invalid={submitted && !!errors.name ? 'true' : undefined}
              aria-describedby={`${nameId}-hint${errors.name ? ` ${nameId}-error` : ''}`}
              data-testid="site-name-input"
              className="text-start"
              maxLength={120}
            />
            {submitted && errors.name && (
              <p
                id={`${nameId}-error`}
                role="alert"
                data-testid="site-name-error"
                className="text-xs text-error"
              >
                {errors.name}
              </p>
            )}
          </div>

          {/* ======================================================= */}
          {/* שדה 2: ענף-תעשייה (radio-group ויזואלי)                 */}
          {/* ======================================================= */}
          <div
            role="radiogroup"
            aria-labelledby={sectorId}
            aria-required="true"
            aria-invalid={submitted && !!errors.sector ? 'true' : undefined}
            aria-describedby={errors.sector ? `${sectorId}-error` : undefined}
            data-testid="sector-radiogroup"
            className="flex flex-col gap-2"
          >
            <p id={sectorId} className="text-sm font-medium text-quiz-text-primary">
              ענף-תעשייה
              <span aria-hidden="true" className="ms-1 text-error">
                *
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SECTOR_OPTIONS.map((opt) => {
                const isActive = sector === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => setSector(opt.value)}
                    data-testid={`sector-option-${opt.value}`}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-card border-2 px-3 py-3 text-sm font-medium transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active',
                      isActive
                        ? 'border-quiz-primary-active bg-primary-50 text-primary-700'
                        : 'border-quiz-border bg-quiz-bg text-quiz-text-primary hover:border-quiz-primary-active/40',
                    )}
                  >
                    <span aria-hidden="true" className="text-xl leading-none">
                      {opt.icon}
                    </span>
                    <span className="leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            {submitted && errors.sector && (
              <p
                id={`${sectorId}-error`}
                role="alert"
                data-testid="sector-error"
                className="text-xs text-error"
              >
                {errors.sector}
              </p>
            )}
          </div>

          {/* ======================================================= */}
          {/* שדה 3: מספר-עובדים                                       */}
          {/* ======================================================= */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={workerCountId} className="text-quiz-text-primary">
              מספר-עובדים משוער
              <span aria-hidden="true" className="ms-1 text-error">
                *
              </span>
            </Label>
            <p id={`${workerCountId}-hint`} className="text-xs text-quiz-text-secondary">
              משמש לכיול-הסיכון וההמלצות (לא יאוחסן).
            </p>
            <Input
              id={workerCountId}
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={workerCountRaw}
              onChange={(e) => setWorkerCountRaw(e.target.value)}
              placeholder="לדוגמה: 25"
              aria-required="true"
              aria-invalid={submitted && !!errors.workerCount ? 'true' : undefined}
              aria-describedby={`${workerCountId}-hint${errors.workerCount ? ` ${workerCountId}-error` : ''}`}
              data-testid="worker-count-input"
              className="w-36 text-start"
            />
            {submitted && errors.workerCount && (
              <p
                id={`${workerCountId}-error`}
                role="alert"
                data-testid="worker-count-error"
                className="text-xs text-error"
              >
                {errors.workerCount}
              </p>
            )}
          </div>

          {/* ======================================================= */}
          {/* שדה 4: מפגעים-עיקריים (checklist + כתיבה-חופשית)        */}
          {/* ======================================================= */}
          <fieldset
            aria-labelledby={hazardsId}
            aria-required="true"
            aria-invalid={submitted && !!errors.mainHazards ? 'true' : undefined}
            aria-describedby={errors.mainHazards ? `${hazardsId}-error` : undefined}
            data-testid="main-hazards-fieldset"
            className="flex flex-col gap-3 rounded-card border border-quiz-border p-4"
          >
            <legend id={hazardsId} className="px-1 text-sm font-medium text-quiz-text-primary">
              מפגעים-עיקריים שנצפו
              <span aria-hidden="true" className="ms-1 text-error">
                *
              </span>
            </legend>
            <p className="text-xs text-quiz-text-secondary">
              סמן את המפגעים שנצפו בסיור האתר (לפחות אחד). ניתן להוסיף מפגעים נוספים בשדה החופשי.
            </p>

            {/* ---- רשת-checkboxes ---- */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" data-testid="hazard-checklist">
              {COMMON_HAZARDS.map((hazard) => {
                const checkId = `hazard-${hazard.replace(/\s+/g, '-')}`;
                const isChecked = checkedHazards.has(hazard);
                return (
                  <label
                    key={hazard}
                    htmlFor={checkId}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm transition-colors',
                      'focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-quiz-primary-active',
                      isChecked
                        ? 'border-quiz-primary-active bg-primary-50 text-primary-700'
                        : 'border-quiz-border bg-quiz-bg text-quiz-text-primary hover:border-quiz-primary-active/40',
                    )}
                  >
                    <input
                      id={checkId}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleHazard(hazard)}
                      data-testid={`hazard-checkbox-${hazard.replace(/\s+/g, '-')}`}
                      className={cn(
                        'h-4 w-4 flex-shrink-0 rounded border-quiz-border accent-quiz-primary-active',
                        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-quiz-primary-active',
                      )}
                    />
                    <span className="leading-snug">{hazard}</span>
                  </label>
                );
              })}
            </div>

            {/* ---- שדה-חופשי: מפגעים נוספים ---- */}
            <div className="mt-1 flex flex-col gap-1">
              <Label htmlFor={customHazardId} className="text-xs text-quiz-text-secondary">
                מפגעים נוספים (הפרד בפסיק)
              </Label>
              <Input
                id={customHazardId}
                type="text"
                value={customHazard}
                onChange={(e) => setCustomHazard(e.target.value)}
                placeholder="לדוגמה: ריתוך בסביבה סגורה, אבק-מתכות"
                aria-describedby={`${hazardsId}`}
                data-testid="custom-hazard-input"
                className="text-start"
              />
            </div>

            {submitted && errors.mainHazards && (
              <p
                id={`${hazardsId}-error`}
                role="alert"
                data-testid="main-hazards-error"
                className="text-xs text-error"
              >
                {errors.mainHazards}
              </p>
            )}
          </fieldset>

          {/* ======================================================= */}
          {/* כפתור-המשך                                               */}
          {/* ======================================================= */}
          <button
            type="submit"
            data-testid="site-step-submit"
            className={cn(
              'w-full rounded-pill py-4 text-base font-bold text-white',
              'bg-gradient-to-bl from-primary-500 to-primary-600 transition-transform hover:-translate-y-0.5 active:translate-y-0',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active',
              'select-none shadow-button',
            )}
          >
            המשך — סקר-מפגעים
          </button>
        </div>
      </form>
    </section>
  );
}

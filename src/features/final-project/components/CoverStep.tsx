'use client';

/**
 * src/features/final-project/components/CoverStep.tsx
 *
 * שלב 0 בפרויקט-הגמר (wizard): עמוד-הפתיחה — **עמוד-1 של מסמך-הפרויקט**
 * (דרישת-משרד-העבודה: תבנית "עמוד פתיחה לפרויקט").
 *
 * מטרה: המשתמש ממלא CoverInfo → setCover(cover) → onSubmit() (להמשך-שלב).
 *
 * שדות (7 · CoverInfo):
 *   - companyName   — שם-החברה/הארגון (האתר-האמיתי)
 *   - projectName   — שם-הפרויקט
 *   - location      — מקום-הפרויקט (עיר/יישוב)
 *   - submitterName — שם-המגיש        (PII · עמוד-הפתיחה בלבד)
 *   - idNumber      — ת.ז. (9 ספרות)  (PII · עמוד-הפתיחה בלבד)
 *   - date          — תאריך-ההגשה (ISO "YYYY-MM-DD")
 *   - mentorName    — שם-המנחה        (PII · עמוד-הפתיחה בלבד)
 *
 * ⚠️ **PII:** submitterName + idNumber + mentorName נשמרים **client-side בלבד**
 *    (אין-DB) ו**לעולם לא נשלחים ל-AI** (ל-Claude עוברים רק site/hazards).
 *    הודעת-PII רכה מוצגת למשתמש מעל-הטופס.
 *
 * ולידציה:
 *   - companyName / projectName / location / submitterName / mentorName — חובה (≥ 2 תווים)
 *   - date — חובה
 *   - idNumber — חובה; אזהרה-רכה (לא-מחמיר) אם אינו 9 ספרות
 *
 * RTL-first: dir="rtl", logical props (ps-/pe-/text-start).
 * state מקומי (controlled form) → לא קורא לשום DB/fetch.
 * על submit תקין: setCover(cover) + onSubmit().
 *
 * ראה: courses/safety-officer/FINAL-PROJECT.md · types.ts · SiteStep.tsx (דפוס-אב).
 */

import React, { useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCapstoneStore, selectCover } from '@/features/final-project/store';
import type { CoverInfo } from '@/features/final-project/types';

// ---------------------------------------------------------------------------
// קונפיגורציית-השדות (מחולל-טופס דקלרטיבי)
// ---------------------------------------------------------------------------

type CoverField = keyof CoverInfo;

interface FieldConfig {
  key: CoverField;
  label: string;
  /** placeholder תיאורי */
  placeholder: string;
  /** רמז-משנה (hint) מתחת לתווית — אופציונלי */
  hint?: string;
  /** type של ה-<input> */
  type: 'text' | 'date';
  /** inputMode (לעזרי-מקלדת בנייד) */
  inputMode?: 'text' | 'numeric';
  /** הוא שדה-PII (מקבל סימון ויזואלי רך) */
  pii?: boolean;
  maxLength?: number;
}

const FIELDS: FieldConfig[] = [
  {
    key: 'companyName',
    label: 'שם-החברה / הארגון',
    placeholder: 'לדוגמה: חברת-הבנייה בע"מ',
    hint: 'שם-הארגון שבו בוצע הפרויקט (האתר-האמיתי).',
    type: 'text',
    maxLength: 120,
  },
  {
    key: 'projectName',
    label: 'שם-הפרויקט',
    placeholder: 'לדוגמה: תכנית ניהול-סיכונים — אתר-בנייה',
    type: 'text',
    maxLength: 160,
  },
  {
    key: 'location',
    label: 'מקום-הפרויקט (עיר / יישוב)',
    placeholder: 'לדוגמה: רמת-גן',
    type: 'text',
    maxLength: 80,
  },
  {
    key: 'submitterName',
    label: 'שם-המגיש',
    placeholder: 'שם פרטי ומשפחה',
    type: 'text',
    pii: true,
    maxLength: 80,
  },
  {
    key: 'idNumber',
    label: 'מספר ת.ז.',
    placeholder: '9 ספרות',
    hint: '9 ספרות. נשמר במכשירך בלבד — לעמוד-הפתיחה בלבד.',
    type: 'text',
    inputMode: 'numeric',
    pii: true,
    maxLength: 9,
  },
  {
    key: 'date',
    label: 'תאריך-ההגשה',
    placeholder: '',
    type: 'date',
  },
  {
    key: 'mentorName',
    label: 'שם-המנחה',
    placeholder: 'שם המנחה / הבוחן',
    type: 'text',
    pii: true,
    maxLength: 80,
  },
];

// ---------------------------------------------------------------------------
// טיפוסי-ולידציה
// ---------------------------------------------------------------------------

type FormErrors = Partial<Record<CoverField, string>>;

const EMPTY_COVER: CoverInfo = {
  companyName: '',
  projectName: '',
  location: '',
  submitterName: '',
  idNumber: '',
  date: '',
  mentorName: '',
};

// שדות-החובה (idNumber מטופל בנפרד — אזהרה-רכה, לא-חוסם).
const REQUIRED_FIELDS: CoverField[] = [
  'companyName',
  'projectName',
  'location',
  'submitterName',
  'date',
  'mentorName',
];

// ---------------------------------------------------------------------------
// פונקציות-עזר
// ---------------------------------------------------------------------------

/** ת.ז. תקין-מבנית = בדיוק 9 ספרות (לא-מחמיר · ללא בדיקת-ביקורת). */
function isNineDigitId(raw: string): boolean {
  return /^\d{9}$/.test(raw.trim());
}

/**
 * ולידציה.
 * שדות-חובה (כולל idNumber-לא-ריק) חוסמים את ה-submit.
 * idNumber שאינו 9-ספרות → אזהרה-רכה (errors.idNumber מוגדר אך **לא** חוסם).
 */
function validate(values: CoverInfo): { errors: FormErrors; hardError: boolean } {
  const errors: FormErrors = {};
  let hardError = false;

  for (const f of REQUIRED_FIELDS) {
    if (values[f].trim().length < 2) {
      errors[f] = 'שדה-חובה (לפחות 2 תווים)';
      hardError = true;
    }
  }

  // idNumber: חובה-להזין (חוסם) · אך פורמט-9-ספרות = אזהרה-רכה (לא-חוסם).
  const id = values.idNumber.trim();
  if (id.length === 0) {
    errors.idNumber = 'שדה-חובה — הזן מספר ת.ז.';
    hardError = true;
  } else if (!isNineDigitId(id)) {
    errors.idNumber = 'מומלץ 9 ספרות (אזהרה בלבד — ניתן להמשיך).';
    // לא מסומן hardError — אזהרה-רכה
  }

  return { errors, hardError };
}

/** האם error מסוים הוא חוסם (כל השגיאות חוסמות חוץ מ-idNumber-בפורמט-לא-תקין). */
function isSoftWarning(field: CoverField, errors: FormErrors, values: CoverInfo): boolean {
  return field === 'idNumber' && !!errors.idNumber && values.idNumber.trim().length > 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface CoverStepProps {
  /** נקרא אחרי שמירה-תקינה (setCover) — להמשך-לשלב-הבא ב-wizard. */
  onSubmit?: () => void;
}

/**
 * CoverStep — שלב 0 בפרויקט-הגמר (עמוד-הפתיחה).
 *
 * מחזיר JSX טופס RTL עם ולידציה מקומית.
 * על submit תקין: setCover(cover) + onSubmit().
 */
export function CoverStep({ onSubmit }: CoverStepProps) {
  // ---- store ----
  const existingCover = useCapstoneStore(selectCover);
  const setCover = useCapstoneStore((s) => s.setCover);

  // ---- state מקומי (אתחול מערכי-הסטור אם כבר מולא) ----
  const [values, setValues] = useState<CoverInfo>(() => existingCover ?? EMPTY_COVER);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // ---- מזהי-a11y בסיסיים (prefix יחיד · נגזר פר-שדה) ----
  const baseId = useId();

  function setField(key: CoverField, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);

    // נורמליזציה (trim) לפני שמירה.
    const normalized: CoverInfo = {
      companyName: values.companyName.trim(),
      projectName: values.projectName.trim(),
      location: values.location.trim(),
      submitterName: values.submitterName.trim(),
      idNumber: values.idNumber.trim(),
      date: values.date,
      mentorName: values.mentorName.trim(),
    };

    const { errors: errs, hardError } = validate(normalized);
    setErrors(errs);

    if (hardError) return;

    // שמירה (גם אם יש אזהרת-PII-רכה על ת.ז.).
    setCover(normalized);
    onSubmit?.();
  }

  // האם יש שגיאות-חוסמות (לתצוגת error-summary).
  const hasHardErrors = submitted && validate(values).hardError;

  return (
    <section
      dir="rtl"
      aria-labelledby={`${baseId}-heading`}
      data-testid="cover-step"
      className="mx-auto w-full max-w-2xl rounded-card bg-quiz-bg p-6 shadow-card"
    >
      {/* ---- כותרת ---- */}
      <div className="mb-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-quiz-text-secondary">
          עמוד-פתיחה
        </p>
        <h1
          id={`${baseId}-heading`}
          className="text-start text-2xl font-bold leading-snug text-quiz-text-primary"
        >
          פרויקט גמר · קורס ממונים על הבטיחות בעבודה · תכנית ניהול-סיכונים
        </h1>
        <p className="mt-1 text-start text-sm text-quiz-text-secondary">
          פרטי-המגיש והחברה. עמוד זה מהווה את עמוד-1 של מסמך-הפרויקט המוגש לוועדה.
        </p>
      </div>

      {/* ---- הודעת-PII רכה ---- */}
      <div
        role="note"
        data-testid="cover-pii-notice"
        className="mb-5 flex items-start gap-2.5 rounded-card border border-quiz-border bg-primary-50 px-4 py-3 text-start text-sm text-primary-700"
      >
        <span aria-hidden="true" className="mt-0.5 text-base leading-none">
          🔒
        </span>
        <span>
          פרטים-אישיים אלה (שם · ת.ז. · מנחה) נשמרים במכשירך בלבד ומשמשים לעמוד-הפתיחה — לא נשלחים
          לבינה.
        </span>
      </div>

      {/* ---- הודעת-שגיאה גלובלית (aria-live) ---- */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-testid="cover-step-error-summary"
        className={cn(
          'mb-4 rounded-card border px-4 py-3 text-start text-sm font-medium',
          hasHardErrors ? 'border-quiz-error-border bg-quiz-error-bg text-error' : 'hidden',
        )}
      >
        יש למלא את כל שדות-החובה לפני המשך.
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-label="טופס עמוד-פתיחה לפרויקט-הגמר"
        data-testid="cover-step-form"
        className="flex flex-col gap-5"
      >
        {FIELDS.map((field) => {
          const fieldId = `${baseId}-${field.key}`;
          const errMsg = submitted ? errors[field.key] : undefined;
          const soft = errMsg ? isSoftWarning(field.key, errors, values) : false;
          const describedBy = [
            field.hint ? `${fieldId}-hint` : '',
            errMsg ? `${fieldId}-error` : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label htmlFor={fieldId} className="text-quiz-text-primary">
                {field.label}
                <span aria-hidden="true" className="ms-1 text-error">
                  *
                </span>
                {field.pii && (
                  <span
                    aria-hidden="true"
                    className="ms-2 rounded-pill bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700"
                  >
                    מידע-אישי
                  </span>
                )}
              </Label>

              {field.hint && (
                <p id={`${fieldId}-hint`} className="text-xs text-quiz-text-secondary">
                  {field.hint}
                </p>
              )}

              <Input
                id={fieldId}
                type={field.type}
                inputMode={field.inputMode}
                value={values[field.key]}
                onChange={(e) => setField(field.key, e.target.value)}
                placeholder={field.placeholder || undefined}
                autoComplete="off"
                aria-required="true"
                aria-invalid={errMsg && !soft ? 'true' : undefined}
                aria-describedby={describedBy || undefined}
                data-testid={`cover-${field.key}-input`}
                className="text-start"
                maxLength={field.maxLength}
              />

              {errMsg && (
                <p
                  id={`${fieldId}-error`}
                  role="alert"
                  data-testid={`cover-${field.key}-error`}
                  className={cn('text-xs', soft ? 'text-quiz-text-secondary' : 'text-error')}
                >
                  {soft && (
                    <span aria-hidden="true" className="ms-0.5">
                      ⚠️{' '}
                    </span>
                  )}
                  {errMsg}
                </p>
              )}
            </div>
          );
        })}

        {/* ---- כפתור-המשך ---- */}
        <button
          type="submit"
          data-testid="cover-step-submit"
          className={cn(
            'mt-1 w-full rounded-pill py-4 text-base font-bold text-white transition-colors',
            'bg-quiz-primary-active hover:bg-primary-600 active:bg-primary-700',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active',
            'select-none shadow-button',
          )}
        >
          המשך — פרופיל-האתר
        </button>
      </form>
    </section>
  );
}

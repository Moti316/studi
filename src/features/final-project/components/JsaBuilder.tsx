'use client';

/**
 * <JsaBuilder> — טבלת-JSA אינטראקטיבית לשלב ה-hazards של פרויקט-הגמר.
 *
 * אחריות הרכיב:
 *   - תצוגת שורות-JSA קיימות מה-store (useCapstoneStore).
 *   - הוספת שורה חדשה דרך טופס-inline (addRow).
 *   - עריכת שורה קיימת in-place (updateRow).
 *   - מחיקת שורה (removeRow).
 *   - בחירת severity + probability (1-4) עם אינדיקטור רמת-סיכון (ירוק/צהוב/אדום) פר-שורה.
 *   - ולידציית-היררכיה inline (validateHierarchy) — מוצגת כ-toast/banner מתחת לשורה הבעייתית.
 *
 * מבנה:
 *   - RTL-first: dir="rtl", logical props (ps-/pe-/text-start).
 *   - Tokens: quiz-* · primary-* · accent-*.
 *   - data-testid על כל אלמנט אינטראקטיבי.
 *   - aria-live על תוצאות ותגובות.
 *   - State מקומי בלבד (zustand store) — אפס DB / fetch.
 *
 * @see src/features/final-project/types.ts
 * @see src/features/final-project/store.ts
 * @see src/features/final-project/jsa-validation.ts
 */

import React, { useCallback, useId, useReducer, useRef } from 'react';
import { useCapstoneStore, selectJsaRows, selectSite } from '../store';
import { validateHierarchy } from '../jsa-validation';
import { riskLevel, riskBand } from '../types';
import type { JsaRow, SeverityLevel, ProbabilityLevel } from '../types';
import { generateJsaDraftAction } from '../generate-jsa.action';

// ---------------------------------------------------------------------------
// קבועים
// ---------------------------------------------------------------------------

/** תוויות חומרה עברית (1-4 לפי מקרא-המשרד). */
const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  1: '1 — מזערי',
  2: '2 — קל',
  3: '3 — בינוני',
  4: '4 — חמור',
};

/** תוויות סבירות עברית (1-4 לפי מקרא-המשרד). */
const PROBABILITY_LABELS: Record<ProbabilityLevel, string> = {
  1: '1 — נמוכה-מאוד',
  2: '2 — נמוכה',
  3: '3 — בינונית',
  4: '4 — גבוהה',
};

/** כותרות עמודות-ה-JSA (6 עמודות רשמיות). */
const COLUMN_HEADERS = [
  'גורם-הסיכון',
  'תרחיש-להתממשות',
  'בקרות-קיימות',
  'הערכת-סיכון',
  'בקרות-נוספות-נדרשות',
  'אחראי ומועד',
] as const;

// ---------------------------------------------------------------------------
// עזרים לרמת-סיכון
// ---------------------------------------------------------------------------

/** מחזיר classes של צבע-רקע ו-border לפי רצועת-הסיכון. */
function riskBandClasses(band: 'green' | 'yellow' | 'red'): {
  bg: string;
  border: string;
  text: string;
  label: string;
} {
  switch (band) {
    case 'green':
      return {
        bg: 'bg-quiz-success-bg',
        border: 'border-quiz-success-border',
        text: 'text-[#166534]',
        label: 'ליבק',
      };
    case 'yellow':
      return {
        bg: 'bg-accent-50',
        border: 'border-accent-500',
        text: 'text-accent-700',
        label: 'להפחית',
      };
    case 'red':
      return {
        bg: 'bg-quiz-error-bg',
        border: 'border-quiz-error-border',
        text: 'text-[#991b1b]',
        label: 'פעולה-מיידית',
      };
  }
}

// ---------------------------------------------------------------------------
// טופס שורה — state פנימי
// ---------------------------------------------------------------------------

/** שדות ה-form ללא id (id נוצר בעת ה-submit). */
type RowFormState = Omit<JsaRow, 'id'>;

const EMPTY_FORM: RowFormState = {
  hazard: '',
  scenario: '',
  existingControls: '',
  severity: 1,
  probability: 1,
  addedControls: '',
  owner: '',
  due: '',
};

type FormAction =
  | { type: 'SET_FIELD'; field: keyof RowFormState; value: string | number }
  | { type: 'RESET' }
  | { type: 'LOAD'; payload: RowFormState };

function formReducer(state: RowFormState, action: FormAction): RowFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return { ...EMPTY_FORM };
    case 'LOAD':
      return { ...action.payload };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// רכיב-עזר: בחירת 1-4 (Severity / Probability)
// ---------------------------------------------------------------------------

interface LevelPickerProps {
  label: string;
  value: number;
  labels: Record<number, string>;
  onChange: (v: number) => void;
  testIdPrefix: string;
  disabled?: boolean;
}

function LevelPicker({
  label,
  value,
  labels,
  onChange,
  testIdPrefix,
  disabled = false,
}: LevelPickerProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-quiz-text-secondary">{label}</span>
      <div className="flex flex-wrap gap-1" role="group" aria-label={label}>
        {([1, 2, 3, 4] as const).map((lvl) => {
          const active = value === lvl;
          return (
            <button
              key={lvl}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              aria-label={`${label}: ${labels[lvl]}`}
              data-testid={`${testIdPrefix}-${lvl}`}
              onClick={() => onChange(lvl)}
              className={[
                'min-w-[2rem] rounded-button border px-2 py-1 text-xs font-bold transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active',
                'disabled:cursor-not-allowed disabled:opacity-40',
                active
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-quiz-border bg-quiz-bg text-quiz-text-primary hover:border-primary-500 hover:bg-primary-50',
              ].join(' ')}
            >
              {lvl}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// רכיב-עזר: שדה-קלט מסוגנן (תמיכה ב-textarea/input)
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  testId: string;
  disabled?: boolean;
  type?: string;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  multiline = false,
  testId,
  disabled = false,
  type = 'text',
}: FieldProps) {
  const id = useId();
  const baseClasses = [
    'w-full rounded-card border border-quiz-border bg-quiz-bg px-3 py-2 text-sm text-quiz-text-primary',
    'placeholder:text-quiz-text-secondary',
    'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'transition-colors',
  ].join(' ');

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-quiz-text-secondary">
        {label}
        {required && (
          <span aria-hidden="true" className="ms-0.5 text-error">
            *
          </span>
        )}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          data-testid={testId}
          rows={2}
          className={`${baseClasses} resize-none`}
          dir="rtl"
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          data-testid={testId}
          className={baseClasses}
          dir="rtl"
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// רכיב-עזר: badge רמת-סיכון
// ---------------------------------------------------------------------------

interface RiskBadgeProps {
  severity: SeverityLevel;
  probability: ProbabilityLevel;
}

function RiskBadge({ severity, probability }: RiskBadgeProps) {
  const score = riskLevel(severity, probability);
  const band = riskBand(score);
  const { bg, border, text, label } = riskBandClasses(band);

  return (
    <div
      data-testid="risk-badge"
      aria-label={`ציון-סיכון: ${score} — ${label}`}
      className={`inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-xs font-bold ${bg} ${border} ${text}`}
    >
      <span aria-hidden="true" className="text-sm">
        {band === 'green' ? '🟢' : band === 'yellow' ? '🟡' : '🔴'}
      </span>
      <span>{score}</span>
      <span>— {label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// רכיב-עזר: שורת-JSA בתצוגה (read mode)
// ---------------------------------------------------------------------------

interface JsaRowCardProps {
  row: JsaRow;
  index: number;
  hierarchyErrors: string[];
  onEdit: (row: JsaRow) => void;
  onDelete: (id: string) => void;
}

function JsaRowCard({ row, index, hierarchyErrors, onEdit, onDelete }: JsaRowCardProps) {
  const score = riskLevel(row.severity, row.probability);
  const band = riskBand(score);
  const { border } = riskBandClasses(band);
  const hasIssues = hierarchyErrors.length > 0;

  return (
    <li
      data-testid={`jsa-row-${index}`}
      className={[
        'rounded-card border-2 bg-quiz-bg p-4 transition-shadow hover:shadow-card-hover',
        hasIssues ? 'border-warning' : border,
      ].join(' ')}
    >
      {/* כותרת שורה */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-pill bg-primary-500 text-xs font-bold text-white"
          >
            {index + 1}
          </span>
          <span className="text-sm font-bold text-quiz-text-primary">{row.hazard || '—'}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={`ערוך שורה ${index + 1}: ${row.hazard}`}
            data-testid={`edit-row-${index}`}
            onClick={() => onEdit(row)}
            className={[
              'rounded-button border border-quiz-border px-3 py-1 text-xs font-semibold text-quiz-text-primary',
              'hover:border-primary-500 hover:text-primary-500',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active',
              'transition-colors',
            ].join(' ')}
          >
            ערוך
          </button>
          <button
            type="button"
            aria-label={`מחק שורה ${index + 1}: ${row.hazard}`}
            data-testid={`delete-row-${index}`}
            onClick={() => onDelete(row.id)}
            className={[
              'rounded-button border border-quiz-error-border px-3 py-1 text-xs font-semibold text-[#991b1b]',
              'hover:bg-quiz-error-bg',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active',
              'transition-colors',
            ].join(' ')}
          >
            מחק
          </button>
        </div>
      </div>

      {/* גריד 6 עמודות — responsive */}
      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {/* עמודה 2 — תרחיש */}
        <div>
          <dt className="text-xs font-semibold text-quiz-text-secondary">תרחיש-להתממשות</dt>
          <dd className="text-quiz-text-primary">{row.scenario || '—'}</dd>
        </div>

        {/* עמודה 3 — בקרות-קיימות */}
        <div>
          <dt className="text-xs font-semibold text-quiz-text-secondary">בקרות-קיימות</dt>
          <dd className="text-quiz-text-primary">{row.existingControls || '—'}</dd>
        </div>

        {/* עמודה 4 — הערכת-סיכון */}
        <div>
          <dt className="text-xs font-semibold text-quiz-text-secondary">הערכת-סיכון</dt>
          <dd className="mt-1">
            <RiskBadge severity={row.severity} probability={row.probability} />
            <span className="ms-2 text-xs text-quiz-text-secondary">
              (חומרה {row.severity} × סבירות {row.probability})
            </span>
          </dd>
        </div>

        {/* עמודה 5 — בקרות-נוספות */}
        <div>
          <dt className="text-xs font-semibold text-quiz-text-secondary">בקרות-נוספות-נדרשות</dt>
          <dd
            className={
              row.addedControls ? 'text-quiz-text-primary' : 'italic text-quiz-text-secondary'
            }
          >
            {row.addedControls || 'לא הוגדר'}
          </dd>
        </div>

        {/* עמודה 6 — אחראי+מועד */}
        <div>
          <dt className="text-xs font-semibold text-quiz-text-secondary">אחראי ומועד</dt>
          <dd className="text-quiz-text-primary">
            {row.owner ? (
              <>
                <span>{row.owner}</span>
                {row.due && (
                  <span className="ms-2 text-quiz-text-secondary">
                    · {new Date(row.due).toLocaleDateString('he-IL')}
                  </span>
                )}
              </>
            ) : (
              <span className="italic text-quiz-text-secondary">לא הוגדר</span>
            )}
          </dd>
        </div>
      </dl>

      {/* ולידציית-היררכיה inline */}
      {hasIssues && (
        <ul
          aria-live="polite"
          data-testid={`hierarchy-issues-${index}`}
          className="mt-3 flex flex-col gap-1 rounded-card border border-warning bg-accent-50 px-3 py-2"
        >
          {hierarchyErrors.map((issue, i) => (
            <li key={i} className="flex items-start gap-1 text-xs text-accent-700">
              <span aria-hidden="true" className="mt-0.5 flex-shrink-0">
                ⚠
              </span>
              <span>{issue}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// רכיב-עזר: טופס הוספה/עריכה
// ---------------------------------------------------------------------------

interface RowFormProps {
  /** null = הוספה · JsaRow = עריכה */
  editingRow: JsaRow | null;
  onSubmit: (data: RowFormState) => void;
  onCancel: () => void;
}

function RowForm({ editingRow, onSubmit, onCancel }: RowFormProps) {
  const [form, dispatch] = useReducer(
    formReducer,
    editingRow ? { ...editingRow } : { ...EMPTY_FORM },
  );

  // אתחול הטופס כשעוברים לעריכה
  const prevEditingRef = useRef<JsaRow | null>(null);
  if (prevEditingRef.current?.id !== editingRow?.id) {
    prevEditingRef.current = editingRow ?? null;
  }

  const setField = useCallback(
    (field: keyof RowFormState) => (value: string | number) => {
      dispatch({ type: 'SET_FIELD', field, value });
    },
    [],
  );

  /** ניקוד סיכון חי בטופס */
  const liveScore = riskLevel(form.severity, form.probability);
  const liveBand = riskBand(liveScore);
  const { bg, border, text, label } = riskBandClasses(liveBand);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hazard.trim() || !form.scenario.trim()) return;
    onSubmit(form);
  };

  const isEditing = editingRow !== null;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={isEditing ? 'עריכת שורת JSA' : 'הוספת שורת JSA'}
      data-testid="jsa-row-form"
      dir="rtl"
      className="rounded-card border-2 border-primary-500 bg-white p-4 shadow-card"
    >
      <h3 className="mb-4 text-sm font-bold text-quiz-text-primary">
        {isEditing ? `✏️ עורך: ${editingRow.hazard || 'שורה'}` : '➕ הוספת שורת-JSA חדשה'}
      </h3>

      {/* גריד 2 עמודות */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* עמודה 1 */}
        <Field
          label="גורם-הסיכון"
          value={form.hazard}
          onChange={setField('hazard')}
          placeholder="למשל: ציוד-חשמלי ללא הארקה"
          required
          multiline
          testId="form-hazard"
        />

        {/* עמודה 2 */}
        <Field
          label="תרחיש-להתממשות"
          value={form.scenario}
          onChange={setField('scenario')}
          placeholder="למשל: עובד נוגע בחלק חי — חשמול"
          required
          multiline
          testId="form-scenario"
        />

        {/* עמודה 3 */}
        <Field
          label="בקרות-קיימות"
          value={form.existingControls}
          onChange={setField('existingControls')}
          placeholder="למשל: הארקה + בדיקה שנתית"
          multiline
          testId="form-existing-controls"
        />

        {/* עמודה 4 — הערכת-סיכון */}
        <div className="flex flex-col gap-3">
          <LevelPicker
            label="חומרה (1-4)"
            value={form.severity}
            labels={SEVERITY_LABELS}
            onChange={(v) => setField('severity')(v as SeverityLevel)}
            testIdPrefix="severity-btn"
          />
          <LevelPicker
            label="סבירות (1-4)"
            value={form.probability}
            labels={PROBABILITY_LABELS}
            onChange={(v) => setField('probability')(v as ProbabilityLevel)}
            testIdPrefix="probability-btn"
          />

          {/* תצוגה חיה */}
          <div
            aria-live="polite"
            aria-atomic="true"
            data-testid="live-risk-score"
            className={`flex items-center gap-2 rounded-card border px-3 py-2 text-xs font-bold ${bg} ${border} ${text}`}
          >
            <span>ציון-סיכון:</span>
            <span className="text-base">{liveScore}</span>
            <span>— {label}</span>
          </div>
        </div>

        {/* עמודה 5 */}
        <Field
          label="בקרות-נוספות-נדרשות"
          value={form.addedControls}
          onChange={setField('addedControls')}
          placeholder={'לפי מדרג: חיסול → החלפה → הנדסי → מנהלי → צמ"א'}
          multiline
          testId="form-added-controls"
        />

        {/* עמודה 6 — אחראי+מועד */}
        <div className="flex flex-col gap-3">
          <Field
            label="אחראי-לביצוע (תפקיד בלבד)"
            value={form.owner}
            onChange={setField('owner')}
            placeholder="למשל: מנהל-עבודה"
            testId="form-owner"
          />
          <Field
            label="מועד-ביצוע-יעד"
            value={form.due}
            onChange={setField('due')}
            type="date"
            testId="form-due"
          />
        </div>
      </div>

      {/* כפתורי פעולה */}
      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          data-testid="form-submit"
          disabled={!form.hazard.trim() || !form.scenario.trim()}
          className={[
            'rounded-pill bg-primary-500 px-6 py-2 text-sm font-bold text-white shadow-button',
            'hover:bg-primary-600',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active',
            'disabled:cursor-not-allowed disabled:opacity-40',
            'transition-colors',
          ].join(' ')}
        >
          {isEditing ? 'שמור שינויים' : 'הוסף שורה'}
        </button>

        <button
          type="button"
          data-testid="form-cancel"
          onClick={onCancel}
          className={[
            'rounded-pill border border-quiz-border px-6 py-2 text-sm font-semibold text-quiz-text-primary',
            'hover:border-primary-500 hover:text-primary-500',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active',
            'transition-colors',
          ].join(' ')}
        >
          ביטול
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// רכיב-עזר: כפתור "הכן עבורי טיוטה (AI)"
// ---------------------------------------------------------------------------

interface GenerateDraftButtonProps {
  /** האם פעולת-ההפקה רצה כעת (loading משותף לכל המופעים). */
  isGenerating: boolean;
  /** האם הכפתור מושבת (אין-פרופיל-אתר → אין-בסיס לטיוטה). */
  disabled: boolean;
  /** מפעיל את ההפקה. */
  onGenerate: () => void;
}

/**
 * GenerateDraftButton — כפתור הפקת-טיוטת-JSA על-ידי AI.
 *
 * מצבים:
 *   רגיל     — "✨ הכן עבורי טיוטה (AI)".
 *   loading  — "✨ מכין טיוטה…" + disabled + aria-busy (data-testid=generate-loading).
 *   disabled — מושבת כשאין-פרופיל-אתר (צריך למלא אתר תחילה).
 */
function GenerateDraftButton({ isGenerating, disabled, onGenerate }: GenerateDraftButtonProps) {
  const isDisabled = disabled || isGenerating;

  return (
    <button
      type="button"
      data-testid="generate-draft-btn"
      onClick={onGenerate}
      disabled={isDisabled}
      aria-busy={isGenerating}
      aria-label={
        disabled ? 'הכן עבורי טיוטה (AI) — נדרש פרופיל-אתר תחילה' : 'הכן עבורי טיוטת-JSA באמצעות AI'
      }
      title={disabled ? 'יש למלא פרופיל-אתר לפני הפקת-טיוטה' : undefined}
      className={[
        'inline-flex items-center gap-2 rounded-pill border-2 px-5 py-2 text-sm font-bold transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'border-accent-500 bg-accent-50 text-accent-700 hover:bg-accent-100',
      ].join(' ')}
    >
      {isGenerating ? (
        <span data-testid="generate-loading" className="flex items-center gap-2">
          <span aria-hidden="true" className="animate-pulse">
            ✨
          </span>
          מכין טיוטה…
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <span aria-hidden="true">✨</span>
          הכן עבורי טיוטה (AI)
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// רכיב ראשי: JsaBuilder
// ---------------------------------------------------------------------------

/**
 * JsaBuilder — בונה-JSA המלא: טבלת-6-עמודות עריכה + ולידציית-היררכיה inline.
 *
 * props: אין (מחובר ישירות ל-useCapstoneStore).
 *
 * תמיכה בשלושה מצבי-קצה:
 *   empty   — אין שורות: CTA ברור להוספה.
 *   loading — אין (state מקומי, ללא async).
 *   error   — ולידציה inline (היררכיה) מוצגת על-ידי הרכיב עצמו.
 */
export function JsaBuilder() {
  const jsaRows = useCapstoneStore(selectJsaRows);
  const site = useCapstoneStore(selectSite);
  const addRow = useCapstoneStore((s) => s.addRow);
  const updateRow = useCapstoneStore((s) => s.updateRow);
  const removeRow = useCapstoneStore((s) => s.removeRow);
  const loadRows = useCapstoneStore((s) => s.loadRows);

  /** האם הטופס פתוח + איזו שורה עורכים (null = הוספה). */
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<JsaRow | null>(null);

  /** האם הפקת-טיוטת-AI רצה כעת. */
  const [isGenerating, setIsGenerating] = React.useState(false);
  /** שגיאת-הפקה עדינה (null = אין-שגיאה). */
  const [generateError, setGenerateError] = React.useState<string | null>(null);

  /**
   * הפקת-טיוטה: קריאת ה-server-action עם פרופיל-האתר → loadRows.
   * עוטף ב-try/catch — שגיאה מציגה הודעה-עדינה ואינה זורקת.
   * אין-site → no-op (הכפתור ממילא disabled).
   */
  const handleGenerateDraft = React.useCallback(async () => {
    if (!site) return;
    setGenerateError(null);
    setIsGenerating(true);
    try {
      const rows = await generateJsaDraftAction(site);
      loadRows(rows);
    } catch {
      // כשל-רך — לא לזרוק; הלומד יכול להמשיך ידנית.
      setGenerateError('הפקת-הטיוטה נכשלה. נסה שוב, או הוסף שורות ידנית.');
    } finally {
      setIsGenerating(false);
    }
  }, [site, loadRows]);

  /** מיפוי rowId → רשימת תיאורי-ליקוי (מחושב מ-validateHierarchy). */
  const hierarchyIssuesByRow = React.useMemo(() => {
    const issues = validateHierarchy(jsaRows);
    const map: Record<string, string[]> = {};
    for (const issue of issues) {
      if (!map[issue.rowId]) map[issue.rowId] = [];
      map[issue.rowId]!.push(issue.description);
    }
    return map;
  }, [jsaRows]);

  /** מספר-שגיאות כולל (לסיכום). */
  const totalIssues = Object.values(hierarchyIssuesByRow).flat().length;

  const handleOpenAdd = () => {
    setEditingRow(null);
    setFormOpen(true);
  };

  const handleEdit = (row: JsaRow) => {
    setEditingRow(row);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    removeRow(id);
    // אם מוחקים את השורה שעורכים — סגור טופס
    if (editingRow?.id === id) {
      setFormOpen(false);
      setEditingRow(null);
    }
  };

  const handleFormSubmit = (data: RowFormState) => {
    if (editingRow) {
      updateRow(editingRow.id, data);
    } else {
      const id = crypto.randomUUID();
      addRow({ id, ...data });
    }
    setFormOpen(false);
    setEditingRow(null);
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    setEditingRow(null);
  };

  return (
    <section
      dir="rtl"
      data-testid="jsa-builder"
      aria-label="בונה-JSA: טבלת ניהול-סיכונים"
      className="flex flex-col gap-6 font-hebrew"
    >
      {/* ─── כותרת + סיכום ─── */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-quiz-text-primary">טבלת-JSA — ניהול-סיכונים</h2>

          {/* מונה שורות */}
          <div
            aria-live="polite"
            aria-atomic="true"
            data-testid="row-count"
            className="flex items-center gap-2 text-sm text-quiz-text-secondary"
          >
            <span
              className={[
                'rounded-pill px-3 py-1 text-xs font-bold',
                jsaRows.length === 0
                  ? 'bg-quiz-error-bg text-[#991b1b]'
                  : jsaRows.length < 5
                    ? 'bg-accent-50 text-accent-700'
                    : 'bg-quiz-success-bg text-[#166534]',
              ].join(' ')}
            >
              {jsaRows.length} / 10 שורות
            </span>
          </div>
        </div>

        {/* כותרות-טבלה (תצוגה רק מ-md ומעלה) */}
        <div
          aria-hidden="true"
          className="mt-2 hidden rounded-card border border-quiz-border bg-primary-50 px-4 py-2 md:grid md:grid-cols-6 md:gap-2"
        >
          {COLUMN_HEADERS.map((h) => (
            <div key={h} className="text-xs font-bold text-quiz-text-secondary">
              {h}
            </div>
          ))}
        </div>
      </div>

      {/* ─── הודעת-אתר-אמיתי (banner · דרישת-משרד-העבודה) ─── */}
      <div
        role="note"
        data-testid="real-site-notice"
        className="flex items-start gap-2 rounded-card border border-primary-500 bg-primary-50 px-4 py-3 text-sm text-quiz-text-primary"
      >
        <span aria-hidden="true" className="mt-0.5 flex-shrink-0 text-base">
          🏗️
        </span>
        <span>
          משרד-העבודה דורש אתר/מפעל <strong>אמיתי</strong>. הטיוטה = שלד-הכוונה — בדוק ותקן כל שורה
          מול האתר שלך.
        </span>
      </div>

      {/* ─── שגיאת-הפקת-טיוטה (עדינה) ─── */}
      {generateError && (
        <div
          role="alert"
          aria-live="polite"
          data-testid="generate-error"
          className="flex items-start gap-2 rounded-card border border-quiz-error-border bg-quiz-error-bg px-4 py-3 text-sm text-[#991b1b]"
        >
          <span aria-hidden="true" className="mt-0.5 flex-shrink-0">
            ⚠
          </span>
          <span>{generateError}</span>
        </div>
      )}

      {/* ─── שגיאות-היררכיה כלליות (banner) ─── */}
      {totalIssues > 0 && (
        <div
          role="alert"
          aria-live="polite"
          data-testid="hierarchy-banner"
          className="flex items-start gap-2 rounded-card border border-warning bg-accent-50 px-4 py-3 text-sm text-accent-700"
        >
          <span aria-hidden="true" className="mt-0.5 flex-shrink-0 text-base">
            ⚠
          </span>
          <span>
            נמצאו <strong>{totalIssues}</strong> ליקויי-מדרג-בקרות. הוועדה בוחנת נושא זה — יש לתקן
            לפני-הגשה. הליקויים מסומנים מתחת לשורות הרלוונטיות.
          </span>
        </div>
      )}

      {/* ─── רשימת שורות / empty state ─── */}
      {jsaRows.length === 0 && !formOpen ? (
        <div
          data-testid="jsa-empty-state"
          role="status"
          className="flex flex-col items-center gap-4 rounded-card border-2 border-dashed border-quiz-border bg-quiz-bg py-12 text-center"
        >
          <div aria-hidden="true" className="text-4xl">
            📋
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-base font-bold text-quiz-text-primary">טרם נוספו שורות-JSA</p>
            <p className="text-sm text-quiz-text-secondary">
              לחץ על "הוסף שורה" כדי להתחיל לבנות את טבלת-ניהול-הסיכונים.
              <br />
              <span className="font-medium">מינימום מומלץ: 10 שורות לפרויקט-גמר מלא.</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              data-testid="add-first-row-btn"
              onClick={handleOpenAdd}
              className={[
                'rounded-pill bg-primary-500 px-6 py-3 text-sm font-bold text-white shadow-button',
                'hover:bg-primary-600',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active',
                'transition-colors',
              ].join(' ')}
            >
              ➕ הוסף שורה ראשונה
            </button>
            <GenerateDraftButton
              isGenerating={isGenerating}
              disabled={!site}
              onGenerate={() => void handleGenerateDraft()}
            />
          </div>
          {!site && (
            <p className="text-xs italic text-quiz-text-secondary">
              להפקת-טיוטה אוטומטית — מלא תחילה את פרופיל-האתר.
            </p>
          )}
        </div>
      ) : (
        <ul
          aria-label={`שורות-JSA (${jsaRows.length})`}
          data-testid="jsa-rows-list"
          className="flex flex-col gap-3"
        >
          {jsaRows.map((row, index) => (
            <JsaRowCard
              key={row.id}
              row={row}
              index={index}
              hierarchyErrors={hierarchyIssuesByRow[row.id] ?? []}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}

      {/* ─── טופס הוספה/עריכה ─── */}
      {formOpen && (
        <RowForm editingRow={editingRow} onSubmit={handleFormSubmit} onCancel={handleFormCancel} />
      )}

      {/* ─── כפתורי הוספה (נראים כשיש שורות קיימות) ─── */}
      {jsaRows.length > 0 && !formOpen && (
        <div className="flex flex-wrap items-center gap-3 self-start">
          <button
            type="button"
            data-testid="add-row-btn"
            onClick={handleOpenAdd}
            className={[
              'rounded-pill border-2 border-dashed border-primary-500 px-5 py-2 text-sm font-bold text-primary-500',
              'hover:bg-primary-50',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active',
              'transition-colors',
            ].join(' ')}
          >
            ➕ הוסף שורה
          </button>
          <GenerateDraftButton
            isGenerating={isGenerating}
            disabled={!site}
            onGenerate={() => void handleGenerateDraft()}
          />
        </div>
      )}

      {/* ─── הנחיית-מדרג (תמיד גלויה — תזכורת לכל המשתמשים) ─── */}
      <aside
        aria-label="תזכורת: מדרג-הבקרות"
        className="rounded-card border border-quiz-border bg-primary-50 px-4 py-3 text-xs text-quiz-text-secondary"
      >
        <p className="font-bold text-quiz-text-primary">מדרג-הבקרות (חובה לפי ISO 45001):</p>
        <ol
          className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 ps-4"
          style={{ listStyleType: 'decimal' }}
        >
          <li>חיסול</li>
          <li>החלפה</li>
          <li>בקרה-הנדסית</li>
          <li>בקרה-מנהלתית</li>
          <li>צמ"א (אחרון)</li>
        </ol>
      </aside>
    </section>
  );
}

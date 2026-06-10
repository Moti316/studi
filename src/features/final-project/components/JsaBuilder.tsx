'use client';

/**
 * <JsaBuilder> — טבלת-JSA אינטראקטיבית לשלב ה-hazards של פרויקט-הגמר.
 *
 * אחריות הרכיב:
 *   - תצוגת שורות-JSA קיימות מה-store (useCapstoneStore).
 *   - הוספת שורה חדשה דרך טופס-inline (addRow).
 *   - עריכת שורה קיימת in-place (updateRow).
 *   - מחיקת שורה (removeRow).
 *   - בחירת severity + probability (1-4) **לפני ואחרי** הבקרות עם אינדיקטור
 *     רמת-סיכון (ירוק/צהוב/אדום) פר-הערכה.
 *   - 3 שדות-בקרות-קיימות: engineering / administrative / ppe (ControlSet).
 *   - 3 שדות-בקרות-נוספות: engineering / administrative / ppe (ControlSet).
 *   - ולידציית-PPE-only inline (isPpeOnly) על בקרות-הנוספות.
 *   - ולידציית-היררכיה inline (validateHierarchy) — מוצגת מתחת לשורה הבעייתית.
 *   - בחירת סטטוס (JSA_STATUS_LABELS) פר-שורה.
 *
 * מבנה:
 *   - RTL-first: dir="rtl", logical props (ps-/pe-/text-start).
 *   - Tokens: quiz-* · primary-* · accent-*.
 *   - data-testid="jsa-builder" + data-testid על כל אלמנט אינטראקטיבי.
 *   - aria-live על תוצאות ותגובות.
 *   - State מקומי בלבד (zustand store) — אפס DB / fetch.
 *   - noUncheckedIndexedAccess-safe: כל גישה ל-Record/Array עוטפת בבטיחות.
 *
 * @see src/features/final-project/types.ts
 * @see src/features/final-project/store.ts
 * @see src/features/final-project/jsa-validation.ts
 */

import React, { useCallback, useId, useReducer, useRef } from 'react';
import { useCapstoneStore, selectJsaRows, selectSite } from '../store';
import { validateHierarchy } from '../jsa-validation';
import {
  riskLevel,
  riskBand,
  riskBandLabel,
  assessmentScore,
  emptyJsaRow,
  emptyControlSet,
  isPpeOnly,
  JSA_STATUS_LABELS,
} from '../types';
import type {
  JsaRow,
  JsaStatus,
  SeverityLevel,
  ProbabilityLevel,
  ControlSet,
  RiskAssessment,
} from '../types';
import { generateJsaDraftAction } from '../generate-jsa.action';

// ---------------------------------------------------------------------------
// קבועים
// ---------------------------------------------------------------------------

/** תוויות חומרה עברית (1-4 לפי מקרא-המשרד). */
const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  1: '1 — שולית',
  2: '2 — קלה',
  3: '3 — בינונית',
  4: '4 — חמורה',
};

/** תוויות סבירות עברית (1-4 לפי מקרא-המשרד). */
const PROBABILITY_LABELS: Record<ProbabilityLevel, string> = {
  1: '1 — נמוכה-מאוד',
  2: '2 — נמוכה',
  3: '3 — בינונית',
  4: '4 — גבוהה',
};

/** כותרות עמודות-ה-JSA (סדר רשמי — משרד-העבודה). */
const COLUMN_HEADERS = [
  'גורם-הסיכון',
  'תרחיש-להתממשות',
  'בקרות-קיימות',
  'הערכת-סיכון-בשלב-זה',
  'בקרות-נוספות-נדרשות',
  'הערכת-סיכון-לאחר-יישום',
  'אחראי / מועד / סטטוס',
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
        label: riskBandLabel('green'),
      };
    case 'yellow':
      return {
        bg: 'bg-accent-50',
        border: 'border-accent-500',
        text: 'text-accent-700',
        label: riskBandLabel('yellow'),
      };
    case 'red':
      return {
        bg: 'bg-quiz-error-bg',
        border: 'border-quiz-error-border',
        text: 'text-[#991b1b]',
        label: riskBandLabel('red'),
      };
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
          const lvlLabel = labels[lvl] ?? String(lvl);
          return (
            <button
              key={lvl}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              aria-label={`${label}: ${lvlLabel}`}
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
  assessment: RiskAssessment;
  testId?: string;
}

function RiskBadge({ assessment, testId }: RiskBadgeProps) {
  const score = assessmentScore(assessment);
  const band = riskBand(score);
  const { bg, border, text, label } = riskBandClasses(band);

  return (
    <div
      data-testid={testId ?? 'risk-badge'}
      aria-label={`ציון-סיכון: ${score} — ${label}`}
      className={`inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-xs font-bold ${bg} ${border} ${text}`}
    >
      <span aria-hidden="true" className="text-sm">
        {band === 'green' ? '●' : band === 'yellow' ? '◑' : '◉'}
      </span>
      <span>{score}</span>
      <span>— {label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// רכיב-עזר: תצוגת ControlSet (3 שורות: הנדסיות / מנהלתיות / צמ"א)
// ---------------------------------------------------------------------------

interface ControlSetDisplayProps {
  controls: ControlSet;
  label: string;
}

function ControlSetDisplay({ controls, label }: ControlSetDisplayProps) {
  const isEmpty =
    !controls.engineering.trim() && !controls.administrative.trim() && !controls.ppe.trim();

  if (isEmpty) {
    return (
      <div>
        <dt className="text-xs font-semibold text-quiz-text-secondary">{label}</dt>
        <dd className="text-sm italic text-quiz-text-secondary">אין</dd>
      </div>
    );
  }

  return (
    <div>
      <dt className="text-xs font-semibold text-quiz-text-secondary">{label}</dt>
      <dd className="flex flex-col gap-0.5 text-sm">
        {controls.engineering.trim() ? (
          <span>
            <span className="font-semibold text-quiz-text-secondary">הנדסי:</span>{' '}
            <span className="text-quiz-text-primary">{controls.engineering}</span>
          </span>
        ) : null}
        {controls.administrative.trim() ? (
          <span>
            <span className="font-semibold text-quiz-text-secondary">מנהלי:</span>{' '}
            <span className="text-quiz-text-primary">{controls.administrative}</span>
          </span>
        ) : null}
        {controls.ppe.trim() ? (
          <span>
            <span className="font-semibold text-quiz-text-secondary">צמ"א:</span>{' '}
            <span className="text-quiz-text-primary">{controls.ppe}</span>
          </span>
        ) : null}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// רכיב-עזר: עורך ControlSet (3 שדות inline)
// ---------------------------------------------------------------------------

interface ControlSetEditorProps {
  /** תווית הקבוצה (לדוגמה: "בקרות-קיימות"). */
  groupLabel: string;
  controls: ControlSet;
  onChange: (c: ControlSet) => void;
  /** prefix ל-testid (ל-data-testid="<prefix>-engineering" וכו'). */
  testIdPrefix: string;
  disabled?: boolean;
  /** מציג אזהרת PPE-only כשרלוונטי. */
  showPpeWarning?: boolean;
}

function ControlSetEditor({
  groupLabel,
  controls,
  onChange,
  testIdPrefix,
  disabled = false,
  showPpeWarning = false,
}: ControlSetEditorProps) {
  const set = (field: keyof ControlSet) => (v: string) => onChange({ ...controls, [field]: v });
  const ppOnly = showPpeWarning && isPpeOnly(controls);

  return (
    <fieldset className="flex flex-col gap-2 rounded-card border border-quiz-border px-3 py-2">
      <legend className="px-1 text-xs font-bold text-quiz-text-primary">{groupLabel}</legend>
      <Field
        label="הנדסיות (אוורור · מיגון · אינטרלוק)"
        value={controls.engineering}
        onChange={set('engineering')}
        placeholder="למשל: מיגון-מכונות · יניקה"
        multiline
        testId={`${testIdPrefix}-engineering`}
        disabled={disabled}
      />
      <Field
        label="מנהלתיות (נהלים · שילוט · הדרכה)"
        value={controls.administrative}
        onChange={set('administrative')}
        placeholder="למשל: נוהל-עבודה-בטוחה · שילוט-אזהרה"
        multiline
        testId={`${testIdPrefix}-administrative`}
        disabled={disabled}
      />
      <Field
        label='צמ"א (ציוד-מגן-אישי)'
        value={controls.ppe}
        onChange={set('ppe')}
        placeholder="למשל: קסדה · כפפות · משקפי-בטיחות"
        multiline
        testId={`${testIdPrefix}-ppe`}
        disabled={disabled}
      />
      {ppOnly && (
        <p
          role="alert"
          aria-live="polite"
          data-testid={`${testIdPrefix}-ppe-only-warning`}
          className="rounded-card border border-warning bg-accent-50 px-3 py-2 text-xs text-accent-700"
        >
          <span aria-hidden="true">⚠ </span>
          צמ"א בלבד — יש לבחון תחילה חיסול / החלפה / בקרה-הנדסית / מנהלתית לפי מדרג-הבקרות.
        </p>
      )}
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// רכיב-עזר: עורך RiskAssessment inline (severity + probability + badge חי)
// ---------------------------------------------------------------------------

interface RiskAssessmentEditorProps {
  groupLabel: string;
  assessment: RiskAssessment;
  onChange: (a: RiskAssessment) => void;
  /** prefix ל-testid (ל-data-testid="<prefix>-severity-N" / "-probability-N" / "-live"). */
  testIdPrefix: string;
  disabled?: boolean;
}

function RiskAssessmentEditor({
  groupLabel,
  assessment,
  onChange,
  testIdPrefix,
  disabled = false,
}: RiskAssessmentEditorProps) {
  const liveScore = riskLevel(assessment.severity, assessment.probability);
  const liveBand = riskBand(liveScore);
  const { bg, border, text, label } = riskBandClasses(liveBand);

  return (
    <fieldset className="flex flex-col gap-3 rounded-card border border-quiz-border px-3 py-2">
      <legend className="px-1 text-xs font-bold text-quiz-text-primary">{groupLabel}</legend>
      <LevelPicker
        label="חומרה (1-4)"
        value={assessment.severity}
        labels={SEVERITY_LABELS}
        onChange={(v) => onChange({ ...assessment, severity: v as SeverityLevel })}
        testIdPrefix={`${testIdPrefix}-severity`}
        disabled={disabled}
      />
      <LevelPicker
        label="סבירות (1-4)"
        value={assessment.probability}
        labels={PROBABILITY_LABELS}
        onChange={(v) => onChange({ ...assessment, probability: v as ProbabilityLevel })}
        testIdPrefix={`${testIdPrefix}-probability`}
        disabled={disabled}
      />
      <div
        aria-live="polite"
        aria-atomic="true"
        data-testid={`${testIdPrefix}-live`}
        className={`flex items-center gap-2 rounded-card border px-3 py-2 text-xs font-bold ${bg} ${border} ${text}`}
      >
        <span>ציון-סיכון:</span>
        <span className="text-base">{liveScore}</span>
        <span>— {label}</span>
      </div>
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// טופס שורה — state פנימי
// ---------------------------------------------------------------------------

/** שדות ה-form ללא id (id נוצר בעת ה-submit). */
type RowFormState = Omit<JsaRow, 'id'>;

function emptyFormState(): RowFormState {
  return {
    hazard: '',
    scenario: '',
    existingControls: emptyControlSet(),
    riskBefore: { probability: 1, severity: 1 },
    addedControls: emptyControlSet(),
    riskAfter: { probability: 1, severity: 1 },
    owner: '',
    due: '',
    status: 'open',
  };
}

type FormAction =
  | { type: 'SET_HAZARD'; value: string }
  | { type: 'SET_SCENARIO'; value: string }
  | { type: 'SET_EXISTING_CONTROLS'; value: ControlSet }
  | { type: 'SET_RISK_BEFORE'; value: RiskAssessment }
  | { type: 'SET_ADDED_CONTROLS'; value: ControlSet }
  | { type: 'SET_RISK_AFTER'; value: RiskAssessment }
  | { type: 'SET_OWNER'; value: string }
  | { type: 'SET_DUE'; value: string }
  | { type: 'SET_STATUS'; value: JsaStatus }
  | { type: 'RESET' }
  | { type: 'LOAD'; payload: RowFormState };

function formReducer(state: RowFormState, action: FormAction): RowFormState {
  switch (action.type) {
    case 'SET_HAZARD':
      return { ...state, hazard: action.value };
    case 'SET_SCENARIO':
      return { ...state, scenario: action.value };
    case 'SET_EXISTING_CONTROLS':
      return { ...state, existingControls: action.value };
    case 'SET_RISK_BEFORE':
      return { ...state, riskBefore: action.value };
    case 'SET_ADDED_CONTROLS':
      return { ...state, addedControls: action.value };
    case 'SET_RISK_AFTER':
      return { ...state, riskAfter: action.value };
    case 'SET_OWNER':
      return { ...state, owner: action.value };
    case 'SET_DUE':
      return { ...state, due: action.value };
    case 'SET_STATUS':
      return { ...state, status: action.value };
    case 'RESET':
      return emptyFormState();
    case 'LOAD':
      return { ...action.payload };
    default:
      return state;
  }
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
  const scoreBefore = assessmentScore(row.riskBefore);
  const bandBefore = riskBand(scoreBefore);
  const { border } = riskBandClasses(bandBefore);
  const hasIssues = hierarchyErrors.length > 0;
  const statusLabel = JSA_STATUS_LABELS[row.status];

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
        <div className="flex items-center gap-2">
          {/* תווית-סטטוס */}
          <span
            data-testid={`row-status-${index}`}
            className={[
              'rounded-pill px-2 py-0.5 text-xs font-semibold',
              row.status === 'done'
                ? 'bg-quiz-success-bg text-[#166534]'
                : row.status === 'in_progress'
                  ? 'bg-accent-50 text-accent-700'
                  : 'bg-quiz-error-bg text-[#991b1b]',
            ].join(' ')}
          >
            {statusLabel}
          </span>
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

      {/* גריד responsive — פרטי השורה */}
      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {/* תרחיש */}
        <div>
          <dt className="text-xs font-semibold text-quiz-text-secondary">תרחיש-להתממשות</dt>
          <dd className="text-quiz-text-primary">{row.scenario || '—'}</dd>
        </div>

        {/* בקרות-קיימות */}
        <ControlSetDisplay controls={row.existingControls} label="בקרות-קיימות" />

        {/* הערכת-סיכון לפני */}
        <div>
          <dt className="text-xs font-semibold text-quiz-text-secondary">הערכת-סיכון-בשלב-זה</dt>
          <dd className="mt-1 flex flex-col gap-1">
            <RiskBadge assessment={row.riskBefore} testId={`risk-before-badge-${index}`} />
            <span className="text-xs text-quiz-text-secondary">
              חומרה {row.riskBefore.severity} × סבירות {row.riskBefore.probability}
            </span>
          </dd>
        </div>

        {/* בקרות-נוספות */}
        <ControlSetDisplay controls={row.addedControls} label="בקרות-נוספות-נדרשות" />

        {/* הערכת-סיכון אחרי */}
        <div>
          <dt className="text-xs font-semibold text-quiz-text-secondary">הערכת-סיכון-לאחר-יישום</dt>
          <dd className="mt-1 flex flex-col gap-1">
            <RiskBadge assessment={row.riskAfter} testId={`risk-after-badge-${index}`} />
            <span className="text-xs text-quiz-text-secondary">
              חומרה {row.riskAfter.severity} × סבירות {row.riskAfter.probability}
            </span>
          </dd>
        </div>

        {/* אחראי + מועד */}
        <div>
          <dt className="text-xs font-semibold text-quiz-text-secondary">אחראי ומועד</dt>
          <dd className="text-quiz-text-primary">
            {row.owner ? (
              <>
                <span>{row.owner}</span>
                {row.due ? (
                  <span className="ms-2 text-quiz-text-secondary">
                    · {new Date(row.due).toLocaleDateString('he-IL')}
                  </span>
                ) : null}
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
  const initialState: RowFormState = editingRow
    ? {
        hazard: editingRow.hazard,
        scenario: editingRow.scenario,
        existingControls: { ...editingRow.existingControls },
        riskBefore: { ...editingRow.riskBefore },
        addedControls: { ...editingRow.addedControls },
        riskAfter: { ...editingRow.riskAfter },
        owner: editingRow.owner,
        due: editingRow.due,
        status: editingRow.status,
      }
    : emptyFormState();

  const [form, dispatch] = useReducer(formReducer, initialState);

  // אתחול הטופס כשעוברים לעריכת-שורה שונה
  const prevEditingIdRef = useRef<string | null>(editingRow?.id ?? null);
  if (prevEditingIdRef.current !== (editingRow?.id ?? null)) {
    prevEditingIdRef.current = editingRow?.id ?? null;
  }

  const isEditing = editingRow !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hazard.trim() || !form.scenario.trim()) return;
    onSubmit(form);
  };

  // תצוגת ציון-PPE-only בשדות-בקרות-נוספות
  const addedPpeOnly = isPpeOnly(form.addedControls);
  void addedPpeOnly; // consumed via showPpeWarning prop below

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
        {isEditing ? `עורך: ${editingRow.hazard || 'שורה'}` : 'הוספת שורת-JSA חדשה'}
      </h3>

      {/* שורה 1: גורם-הסיכון + תרחיש */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="גורם-הסיכון"
          value={form.hazard}
          onChange={(v) => dispatch({ type: 'SET_HAZARD', value: v })}
          placeholder="למשל: ציוד-חשמלי ללא הארקה"
          required
          multiline
          testId="form-hazard"
        />
        <Field
          label="תרחיש-להתממשות"
          value={form.scenario}
          onChange={(v) => dispatch({ type: 'SET_SCENARIO', value: v })}
          placeholder="למשל: עובד נוגע בחלק חי — חשמול"
          required
          multiline
          testId="form-scenario"
        />
      </div>

      {/* שורה 2: בקרות-קיימות + הערכת-סיכון-לפני */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ControlSetEditor
          groupLabel="בקרות-קיימות"
          controls={form.existingControls}
          onChange={(v) => dispatch({ type: 'SET_EXISTING_CONTROLS', value: v })}
          testIdPrefix="existing-controls"
        />
        <RiskAssessmentEditor
          groupLabel="הערכת-סיכון-בשלב-זה"
          assessment={form.riskBefore}
          onChange={(v) => dispatch({ type: 'SET_RISK_BEFORE', value: v })}
          testIdPrefix="risk-before"
        />
      </div>

      {/* שורה 3: בקרות-נוספות + הערכת-סיכון-אחרי */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ControlSetEditor
          groupLabel="בקרות-נוספות-נדרשות"
          controls={form.addedControls}
          onChange={(v) => dispatch({ type: 'SET_ADDED_CONTROLS', value: v })}
          testIdPrefix="added-controls"
          showPpeWarning
        />
        <RiskAssessmentEditor
          groupLabel="הערכת-סיכון-לאחר-יישום"
          assessment={form.riskAfter}
          onChange={(v) => dispatch({ type: 'SET_RISK_AFTER', value: v })}
          testIdPrefix="risk-after"
        />
      </div>

      {/* שורה 4: אחראי + מועד + סטטוס */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field
          label="אחראי-לביצוע (תפקיד בלבד — name-clean)"
          value={form.owner}
          onChange={(v) => dispatch({ type: 'SET_OWNER', value: v })}
          placeholder="למשל: מנהל-עבודה"
          testId="form-owner"
        />
        <Field
          label="מועד-ביצוע-יעד"
          value={form.due}
          onChange={(v) => dispatch({ type: 'SET_DUE', value: v })}
          type="date"
          testId="form-due"
        />
        {/* בורר סטטוס */}
        <StatusPicker
          value={form.status}
          onChange={(v) => dispatch({ type: 'SET_STATUS', value: v })}
        />
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
// רכיב-עזר: בורר סטטוס (JSA_STATUS_LABELS)
// ---------------------------------------------------------------------------

interface StatusPickerProps {
  value: JsaStatus;
  onChange: (v: JsaStatus) => void;
  disabled?: boolean;
}

function StatusPicker({ value, onChange, disabled = false }: StatusPickerProps) {
  const id = useId();
  const statuses: JsaStatus[] = ['open', 'in_progress', 'done'];

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-quiz-text-secondary">
        סטטוס
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as JsaStatus)}
        disabled={disabled}
        data-testid="form-status"
        dir="rtl"
        className={[
          'w-full rounded-card border border-quiz-border bg-quiz-bg px-3 py-2 text-sm text-quiz-text-primary',
          'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors',
        ].join(' ')}
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {JSA_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// רכיב-עזר: כפתור "הכן עבורי טיוטה (AI)"
// ---------------------------------------------------------------------------

interface GenerateDraftButtonProps {
  isGenerating: boolean;
  disabled: boolean;
  onGenerate: () => void;
}

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
 * JsaBuilder — בונה-JSA המלא: טבלת-9-עמודות-רשמית (פורמט-משרד-העבודה) עריכה +
 * ולידציית-היררכיה inline.
 *
 * props: אין (מחובר ישירות ל-useCapstoneStore).
 *
 * תמיכה בשלושה מצבי-קצה:
 *   empty   — אין שורות: CTA ברור להוספה.
 *   loading — ללא async (state מקומי).
 *   error   — ולידציה inline (היררכיה + PPE-only) מוצגת על-ידי הרכיב עצמו.
 */
export function JsaBuilder() {
  const jsaRows = useCapstoneStore(selectJsaRows);
  const site = useCapstoneStore(selectSite);
  const addRow = useCapstoneStore((s) => s.addRow);
  const updateRow = useCapstoneStore((s) => s.updateRow);
  const removeRow = useCapstoneStore((s) => s.removeRow);
  const loadRows = useCapstoneStore((s) => s.loadRows);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<JsaRow | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generateError, setGenerateError] = React.useState<string | null>(null);

  const handleGenerateDraft = useCallback(async () => {
    if (!site) return;
    setGenerateError(null);
    setIsGenerating(true);
    try {
      const rows = await generateJsaDraftAction(site);
      loadRows(rows);
    } catch {
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
      const existing = map[issue.rowId];
      if (existing === undefined) {
        map[issue.rowId] = [issue.description];
      } else {
        existing.push(issue.description);
      }
    }
    return map;
  }, [jsaRows]);

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
    if (editingRow?.id === id) {
      setFormOpen(false);
      setEditingRow(null);
    }
  };

  const handleFormSubmit = (data: RowFormState) => {
    if (editingRow) {
      updateRow(editingRow.id, data);
    } else {
      const base = emptyJsaRow(crypto.randomUUID());
      addRow({ ...base, ...data });
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
      {/* ─── כותרת + מונה שורות ─── */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-quiz-text-primary">טבלת-JSA — ניהול-סיכונים</h2>
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

        {/* כותרות-טבלה (נראות מ-md ומעלה) */}
        <div
          aria-hidden="true"
          className="mt-2 hidden rounded-card border border-quiz-border bg-primary-50 px-4 py-2 md:grid md:gap-2"
          style={{ gridTemplateColumns: `repeat(${COLUMN_HEADERS.length}, 1fr)` }}
        >
          {COLUMN_HEADERS.map((h) => (
            <div key={h} className="text-xs font-bold text-quiz-text-secondary">
              {h}
            </div>
          ))}
        </div>
      </div>

      {/* ─── banner: אתר-אמיתי ─── */}
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

      {/* ─── שגיאת-הפקת-טיוטה ─── */}
      {generateError !== null && (
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

      {/* ─── banner: שגיאות-היררכיה כלליות ─── */}
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

      {/* ─── empty state / רשימת שורות ─── */}
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
              הוסף שורה ראשונה
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

      {/* ─── כפתורי הוספה (כשיש שורות קיימות) ─── */}
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
            הוסף שורה
          </button>
          <GenerateDraftButton
            isGenerating={isGenerating}
            disabled={!site}
            onGenerate={() => void handleGenerateDraft()}
          />
        </div>
      )}

      {/* ─── תזכורת מדרג-הבקרות ─── */}
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
        <p className="mt-2 text-[10px]">
          מקרא-סיכון: <span className="font-semibold text-[#166534]">1-4 = קביל</span> ·{' '}
          <span className="font-semibold text-accent-700">6-9 = לא-קביל (אישור-מנהל)</span> ·{' '}
          <span className="font-semibold text-[#991b1b]">12-16 = לא-קביל (עצירה)</span>
        </p>
      </aside>
    </section>
  );
}

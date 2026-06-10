'use client';

/**
 * <RiskMatrix> — מטריצת-סיכון ויזואלית 4×4 (חומרה × סבירות).
 *
 * מציגה:
 *   - 16 תאים צבועים לפי רצועת-הסיכון (ירוק/צהוב/אדום) על-פי riskBand().
 *   - מסמן (badge מספרי) על כל תא שיש בו שורות-JSA.
 *   - מקרא (legend) עם הגדרות-רצועות לפי מסמך-JSA הרשמי.
 *   - Tooltip/popup עם שמות-המפגעים בעת ריחוף/לחיצה על תא-מסומן.
 *
 * RTL: dir="rtl" · ציר-X (חומרה) עולה שמאל←ימין (ציר-עברי-טבעי).
 * נגישות: role="grid" · aria-label · aria-live על tooltip · data-testid על כל interactive.
 *
 * props:
 *   rows — שורות-JSA מה-store (selectJsaRows). ריק = empty-state.
 *
 * ייבוא:
 *   import { RiskMatrix } from '@/features/final-project/components/RiskMatrix';
 *   const rows = useCapstoneStore(selectJsaRows);
 *   <RiskMatrix rows={rows} />
 *
 * מקורות:
 *   courses/safety-officer/FINAL-PROJECT.md §מטריצת-הסיכון
 *   src/features/final-project/types.ts (riskLevel · riskBand)
 */

import React, { useCallback, useId, useRef, useState } from 'react';
import type { JsaRow, SeverityLevel, ProbabilityLevel } from '../types';
import { riskBand, riskLevel } from '../types';

// ---------------------------------------------------------------------------
// קבועים
// ---------------------------------------------------------------------------

const SEVERITY_LEVELS = [1, 2, 3, 4] as const; // עמודות: חומרה 1→4 (שמאל=נמוך, ימין=גבוה)
const PROBABILITY_LEVELS = [4, 3, 2, 1] as const; // שורות: סבירות 4→1 (עליון=גבוה, תחתון=נמוך)

/** תוויות-חומרה (1-4) לפי מקרא-המשרד. */
const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  1: 'מזערי',
  2: 'קל',
  3: 'בינוני',
  4: 'חמור',
};

/** תוויות-סבירות (1-4) לפי מקרא-המשרד. */
const PROBABILITY_LABELS: Record<ProbabilityLevel, string> = {
  1: 'נמוכה מאוד',
  2: 'נמוכה',
  3: 'בינונית',
  4: 'גבוהה',
};

/** תוויות-רצועה לתצוגה ב-legend + tooltip. */
const BAND_META = {
  green: { label: 'ליבק (טיפול-שגרתי)', score: '1–4', textClass: 'text-green-800' },
  yellow: { label: 'לא ליבק (להפחית)', score: '5–9', textClass: 'text-yellow-900' },
  red: { label: 'לא ליבק — פעולה-מיידית / עצירה', score: '10–16', textClass: 'text-red-900' },
} as const;

/** קלאסי-רקע לפי רצועה — Tailwind JIT-safe (ללא dynamic string). */
const BAND_BG: Record<'green' | 'yellow' | 'red', string> = {
  green: 'bg-[#d1fae5] border-[#6ee7b7]', // ירוק-בהיר
  yellow: 'bg-[#fef9c3] border-[#fde047]', // צהוב-בהיר
  red: 'bg-[#fee2e2] border-[#fca5a5]', // אדום-בהיר
};

/** צבע-badge לפי רצועה. */
const BADGE_COLOR: Record<'green' | 'yellow' | 'red', string> = {
  green: 'bg-green-700 text-white',
  yellow: 'bg-yellow-600 text-white',
  red: 'bg-red-700 text-white',
};

// ---------------------------------------------------------------------------
// ממשק props
// ---------------------------------------------------------------------------

export interface RiskMatrixProps {
  /** שורות-JSA מה-store (ריק = empty-state). */
  rows: JsaRow[];
}

// ---------------------------------------------------------------------------
// פונקציה: בניית מפה rows-per-cell
// ---------------------------------------------------------------------------

/** מפה: "severity-probability" → רשימת-שמות-מפגעים. */
function buildCellMap(rows: JsaRow[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const key = `${row.severity}-${row.probability}`;
    const existing = map.get(key) ?? [];
    existing.push(row.hazard || 'מפגע לא-ממויין');
    map.set(key, existing);
  }
  return map;
}

// ---------------------------------------------------------------------------
// תת-רכיב: תא בודד במטריצה
// ---------------------------------------------------------------------------

interface MatrixCellProps {
  severity: SeverityLevel;
  probability: ProbabilityLevel;
  hazards: string[]; // שמות-המפגעים בתא זה (ריק = ללא-שורה)
  tooltipId: string; // id ל-aria-describedby
  isExpanded: boolean; // האם ה-tooltip פתוח?
  onToggle: () => void; // פתיחה/סגירה ל-tooltip
}

function MatrixCell({
  severity,
  probability,
  hazards,
  tooltipId,
  isExpanded,
  onToggle,
}: MatrixCellProps) {
  const score = riskLevel(severity, probability);
  const band = riskBand(score);
  const count = hazards.length;
  const hasDot = count > 0;

  const cellTestId = `matrix-cell-s${severity}-p${probability}`;

  return (
    <div
      role="gridcell"
      aria-label={`חומרה ${severity} · סבירות ${probability} · ציון ${score}`}
      aria-expanded={hasDot ? isExpanded : undefined}
      aria-describedby={hasDot && isExpanded ? tooltipId : undefined}
      data-testid={cellTestId}
      tabIndex={hasDot ? 0 : -1}
      onClick={hasDot ? onToggle : undefined}
      onKeyDown={
        hasDot
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggle();
              }
            }
          : undefined
      }
      className={[
        'relative flex items-center justify-center rounded-sm border transition-all duration-150',
        BAND_BG[band],
        // גודל-תא: ריבועי, responsive
        'h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14',
        hasDot
          ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active'
          : 'cursor-default',
        isExpanded ? 'ring-2 ring-quiz-primary-active ring-offset-1' : '',
      ].join(' ')}
    >
      {/* ציון-מספרי בתא (קטן, עדין) */}
      <span
        aria-hidden="true"
        className={[
          'select-none text-xs font-medium',
          band === 'green'
            ? 'text-green-700'
            : band === 'yellow'
              ? 'text-yellow-800'
              : 'text-red-800',
        ].join(' ')}
      >
        {score}
      </span>

      {/* badge — מספר-שורות בתא (מוצג רק אם יש) */}
      {hasDot && (
        <span
          aria-hidden="true"
          data-testid={`${cellTestId}-badge`}
          className={[
            'absolute -end-1.5 -top-1.5 flex h-5 w-5 items-center justify-center',
            'rounded-full text-[10px] font-bold leading-none shadow-sm',
            BADGE_COLOR[band],
          ].join(' ')}
        >
          {count}
        </span>
      )}

      {/* Tooltip — רשימת-מפגעים בתא (מופיע בעת לחיצה/ריחוף) */}
      {hasDot && isExpanded && (
        <div
          role="tooltip"
          id={tooltipId}
          data-testid={`${cellTestId}-tooltip`}
          className={[
            'absolute bottom-full end-0 z-20 mb-2',
            'min-w-[180px] max-w-[240px]',
            'rounded-card border border-quiz-border bg-quiz-bg',
            'px-3 py-2 shadow-card-hover',
            'text-start text-xs leading-relaxed text-quiz-text-primary',
          ].join(' ')}
        >
          <p className="mb-1 font-bold text-quiz-text-secondary">גורמי-סיכון ({count}):</p>
          <ul className="list-disc space-y-0.5 ps-4">
            {hazards.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// רכיב ראשי: RiskMatrix
// ---------------------------------------------------------------------------

/**
 * RiskMatrix — מטריצת-סיכון ויזואלית 4×4.
 *
 * @param rows - שורות-JSA מה-store.
 */
export function RiskMatrix({ rows }: RiskMatrixProps) {
  const uid = useId();
  const cellMap = buildCellMap(rows);

  // מעקב אחרי התא הפתוח (tooltip)
  const [openCell, setOpenCell] = useState<string | null>(null);

  // סגירה בלחיצה מחוץ לרכיב
  const containerRef = useRef<HTMLDivElement>(null);
  const handleContainerBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    // אם הפוקוס עוזב את הרכיב לגמרי — סגור tooltip
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpenCell(null);
    }
  }, []);

  const toggleCell = useCallback((key: string) => {
    setOpenCell((prev) => (prev === key ? null : key));
  }, []);

  // ---------------------------------------------------------------------------
  // מצב-ריק (אין שורות-JSA)
  // ---------------------------------------------------------------------------
  if (rows.length === 0) {
    return (
      <div
        dir="rtl"
        data-testid="risk-matrix"
        role="region"
        aria-label="מטריצת-סיכון"
        className="flex flex-col items-center justify-center gap-3 rounded-card border border-quiz-border bg-quiz-bg px-6 py-10 text-center font-hebrew"
      >
        <span aria-hidden="true" className="select-none text-4xl">
          📊
        </span>
        <p className="text-base font-bold text-quiz-text-primary">
          המטריצה תיוצג לאחר הוספת שורות-JSA
        </p>
        <p className="text-sm text-quiz-text-secondary">
          הוסף לפחות שורה אחת בשלב הסקר כדי לראות את פיזור-הסיכונים.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // מטריצה מלאה
  // ---------------------------------------------------------------------------
  return (
    <div
      dir="rtl"
      data-testid="risk-matrix"
      role="region"
      aria-label="מטריצת-סיכון 4×4 — חומרה לעומת סבירות"
      className="flex flex-col gap-4 font-hebrew"
      ref={containerRef}
      onBlur={handleContainerBlur}
    >
      {/* כותרת */}
      <h3 className="text-base font-bold text-quiz-text-primary" data-testid="risk-matrix-title">
        מטריצת-סיכון (חומרה × סבירות)
      </h3>

      {/* עטיפה: ציר-Y + גריד */}
      <div className="flex items-center gap-2">
        {/* תווית-ציר Y (סבירות) — מסובבת */}
        <div
          aria-hidden="true"
          className="flex flex-col items-center justify-center self-stretch"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          <span className="select-none text-xs font-semibold tracking-wide text-quiz-text-secondary">
            סבירות ↑
          </span>
        </div>

        {/* הגריד + כותרות-עמודות */}
        <div className="flex flex-1 flex-col gap-1">
          {/* כותרות-עמודות (חומרה 1→4) */}
          <div
            aria-hidden="true"
            className="grid grid-cols-4 gap-1"
            data-testid="risk-matrix-severity-headers"
          >
            {SEVERITY_LEVELS.map((sev) => (
              <div key={sev} className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-semibold text-quiz-text-secondary">{sev}</span>
                <span className="hidden text-center text-[10px] leading-tight text-quiz-text-secondary sm:block">
                  {SEVERITY_LABELS[sev]}
                </span>
              </div>
            ))}
          </div>

          {/* שורות-המטריצה (סבירות 4→1) */}
          <div
            role="grid"
            aria-label="תאי מטריצת-הסיכון"
            aria-rowcount={4}
            aria-colcount={4}
            className="flex flex-col gap-1"
            data-testid="risk-matrix-grid"
          >
            {PROBABILITY_LEVELS.map((prob) => (
              <div
                key={prob}
                role="row"
                aria-label={`סבירות ${prob} — ${PROBABILITY_LABELS[prob]}`}
                className="grid grid-cols-4 items-center gap-1"
              >
                {SEVERITY_LEVELS.map((sev) => {
                  const cellKey = `${sev}-${prob}`;
                  const hazards = cellMap.get(cellKey) ?? [];
                  const tooltipId = `${uid}-tooltip-${cellKey}`;
                  return (
                    <MatrixCell
                      key={cellKey}
                      severity={sev}
                      probability={prob}
                      hazards={hazards}
                      tooltipId={tooltipId}
                      isExpanded={openCell === cellKey}
                      onToggle={() => toggleCell(cellKey)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* תווית-ציר X (חומרה) */}
          <div aria-hidden="true" className="mt-1 text-center">
            <span className="select-none text-xs font-semibold tracking-wide text-quiz-text-secondary">
              חומרה ←
            </span>
          </div>
        </div>

        {/* תוויות-שורות ציר Y (סבירות 4→1) — ליד הגריד */}
        <div aria-hidden="true" className="flex flex-col gap-1">
          {PROBABILITY_LEVELS.map((prob) => (
            <div key={prob} className="flex h-10 items-center sm:h-12 md:h-14">
              <span className="hidden w-16 text-start text-[10px] leading-tight text-quiz-text-secondary sm:block">
                {PROBABILITY_LABELS[prob]}
              </span>
              <span className="text-[10px] font-semibold text-quiz-text-secondary sm:hidden">
                {prob}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── מקרא (Legend) ─── */}
      <MatrixLegend rows={rows} />

      {/* הודעת-נגישות עבור tooltip פתוח */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid="risk-matrix-live">
        {openCell
          ? `תא נבחר: חומרה ${openCell.split('-')[0]}, סבירות ${openCell.split('-')[1]}, ${(cellMap.get(openCell) ?? []).length} מפגעים`
          : ''}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// תת-רכיב: מקרא (Legend)
// ---------------------------------------------------------------------------

interface MatrixLegendProps {
  rows: JsaRow[];
}

function MatrixLegend({ rows }: MatrixLegendProps) {
  // סיכום: כמה שורות בכל רצועה
  const counts = { green: 0, yellow: 0, red: 0 };
  for (const row of rows) {
    const score = riskLevel(row.severity, row.probability);
    const band = riskBand(score);
    counts[band]++;
  }

  return (
    <div
      role="note"
      aria-label="מקרא מטריצת-הסיכון"
      data-testid="risk-matrix-legend"
      className="rounded-card border border-quiz-border bg-quiz-bg p-3"
    >
      <p className="mb-2 text-xs font-bold text-quiz-text-secondary">מקרא:</p>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-3">
        {(
          Object.entries(BAND_META) as Array<
            [keyof typeof BAND_META, (typeof BAND_META)[keyof typeof BAND_META]]
          >
        ).map(([band, meta]) => (
          <div key={band} className="flex items-center gap-2" data-testid={`legend-${band}`}>
            {/* ריבוע-צבע */}
            <span
              aria-hidden="true"
              className={[
                'inline-block h-4 w-4 flex-shrink-0 rounded-sm border',
                BAND_BG[band],
              ].join(' ')}
            />
            {/* טקסט */}
            <span className={['text-xs', meta.textClass].join(' ')}>
              <span className="font-semibold">{meta.score}</span>
              {' — '}
              {meta.label}
            </span>
            {/* מונה-שורות */}
            {counts[band] > 0 && (
              <span
                aria-label={`${counts[band]} שורות ברצועה זו`}
                className={[
                  'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                  BADGE_COLOR[band],
                ].join(' ')}
              >
                {counts[band]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* מדרג-בקרות — תזכורת */}
      <p
        data-testid="risk-matrix-hierarchy-hint"
        className="mt-2 border-t border-quiz-border pt-2 text-[11px] leading-snug text-quiz-text-secondary"
      >
        מדרג-בקרות (חובה): סילוק → החלפה → הנדסי → מנהלי →{' '}
        <span className="font-semibold">צמ&quot;א אחרון</span>
      </p>
    </div>
  );
}

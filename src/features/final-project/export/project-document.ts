/**
 * src/features/final-project/export/project-document.ts — מודל-ביניים טהור למסמך-המוגש.
 *
 * שכבת-מודל משותפת ל-export-docx.ts ו-export-pdf.ts: לוקחת את שלושת מקורות-הנתונים
 * (cover / site / rows) ובונה מבנה-ביניים פשוט ושטוח — coverLines · siteSummary · jsaTable —
 * שכל מנוע-ייצוא (Word / PDF) מרנדר משלו. כך לוגיקת-העברית, הכותרות והחישוב (riskLevel/riskBand)
 * חיים במקום-אחד בלבד וניתנים-לטסט ב-Vitest.
 *
 * טהור (pure): ללא IO · ללא side-effects · ללא תלות-DOM.
 *
 * ⚠️ PII: cover מכיל שם/ת.ז./מנחה (CoverInfo). מבנה זה משמש **רק** לייצוא-המסמך client-side —
 *    לעולם לא נשלח ל-AI/שרת.
 *
 * @see src/features/final-project/types.ts — CoverInfo · SiteInfo · JsaRow · riskLevel · riskBand
 */

import type { CoverInfo, SiteInfo, JsaRow, IndustrySector } from '../types';
import { riskLevel, riskBand } from '../types';

// ---------------------------------------------------------------------------
// תוויות-עברית (reuse — תואמות SiteStep.SECTOR_OPTIONS / FeedbackStep)
// ---------------------------------------------------------------------------

/** תוויות-ענף בעברית (זהות ל-SECTOR_OPTIONS ב-SiteStep). */
const SECTOR_LABELS: Record<IndustrySector, string> = {
  construction: 'בנייה',
  manufacturing: 'ייצור / מפעל',
  electrical: 'חשמל',
  chemicals: 'חומ"ס',
  agriculture: 'חקלאות',
  logistics: 'לוגיסטיקה / מחסן',
  maintenance: 'אחזקה',
  other: 'אחר',
};

/** תרגום-רצועת-סיכון לעברית (לתצוגה במסמך). */
const RISK_BAND_LABELS: Record<'green' | 'yellow' | 'red', string> = {
  green: 'ירוק',
  yellow: 'צהוב',
  red: 'אדום',
};

/** כותרות-עמודות טבלת-ה-JSA (סדר-קבוע · עברית). */
export const JSA_HEADERS = [
  'מס׳',
  'גורם-סיכון',
  'תרחיש',
  'בקרות-קיימות',
  'חומרה',
  'סבירות',
  'רמת-סיכון',
  'בקרות-נוספות',
  'אחראי',
  'מועד',
] as const;

// ---------------------------------------------------------------------------
// טיפוסי-מבנה-הביניים
// ---------------------------------------------------------------------------

/** שורת-טבלה אחת במבנה-הביניים (כבר מחושבת — riskLevel + riskBand). */
export interface JsaTableRow {
  /** מספר-שורה לתצוגה (1-based). */
  index: number;
  /** ערכי-התאים בסדר JSA_HEADERS (10 תאים · כולל המספר). */
  cells: string[];
  /** ציון-סיכון מספרי (חומרה × סבירות · 1-16). */
  riskScore: number;
  /** רצועת-סיכון (לצביעת-רקע פר-שורה ב-docx/pdf). */
  band: 'green' | 'yellow' | 'red';
}

/** טבלת-ה-JSA המוכנה-לרינדור. */
export interface JsaTable {
  /** כותרות-העמודות (עברית). */
  headers: string[];
  /** שורות-מחושבות. */
  rows: JsaTableRow[];
}

/** מבנה-הביניים המלא של המסמך-המוגש. */
export interface ProjectDocument {
  /** כותרת-ראשית של המסמך. */
  title: string;
  /** שורות עמוד-הפתיחה (7 שדות · "תווית: ערך"). */
  coverLines: string[];
  /** פסקת-סיכום-האתר (ענף · עובדים · מפגעים-עיקריים). */
  siteSummary: string;
  /** טבלת-ה-JSA המחושבת. */
  jsaTable: JsaTable;
}

// ---------------------------------------------------------------------------
// עזרים פנימיים
// ---------------------------------------------------------------------------

/** מציג ערך-טקסט בטוח (ריק → "—") — מונע תאים-ריקים מבלבלים במסמך. */
function safe(value: string | undefined | null): string {
  const v = (value ?? '').trim();
  return v.length > 0 ? v : '—';
}

// ---------------------------------------------------------------------------
// buildProjectDocument — בונה את מבנה-הביניים
// ---------------------------------------------------------------------------

/**
 * buildProjectDocument — ממיר cover/site/rows למבנה-ביניים אחיד (Word + PDF).
 *
 * @param cover עמוד-הפתיחה (PII · client-side בלבד · null = טרם-מולא).
 * @param site  פרופיל-האתר (null = טרם-מולא).
 * @param rows  שורות-ה-JSA (יתכן ריק).
 * @returns     ProjectDocument — coverLines · siteSummary · jsaTable.
 */
export function buildProjectDocument(
  cover: CoverInfo | null,
  site: SiteInfo | null,
  rows: JsaRow[],
): ProjectDocument {
  // ── עמוד-פתיחה: 7 שדות בסדר-קבוע (גם אם cover=null → "—") ──
  const coverLines: string[] = [
    `שם-החברה / הארגון: ${safe(cover?.companyName)}`,
    `שם-הפרויקט: ${safe(cover?.projectName)}`,
    `מקום-הפרויקט: ${safe(cover?.location)}`,
    `שם-המגיש: ${safe(cover?.submitterName)}`,
    `מספר ת.ז.: ${safe(cover?.idNumber)}`,
    `תאריך-הגשה: ${safe(cover?.date)}`,
    `שם-המנחה: ${safe(cover?.mentorName)}`,
  ];

  // ── סיכום-אתר ──
  let siteSummary: string;
  if (!site) {
    siteSummary = 'טרם הוזן פרופיל-אתר.';
  } else {
    const sectorLabel = SECTOR_LABELS[site.sector] ?? site.sector;
    const hazards =
      site.mainHazards.length > 0 ? site.mainHazards.join(', ') : 'לא צוינו מפגעים-עיקריים';
    siteSummary =
      `אתר: ${safe(site.name)} · ענף: ${sectorLabel} · מספר-עובדים: ${site.workerCount}. ` +
      `מפגעים-עיקריים שזוהו בסיור: ${hazards}.`;
  }

  // ── טבלת-JSA ──
  const tableRows: JsaTableRow[] = rows.map((row, i) => {
    const score = riskLevel(row.severity, row.probability);
    const band = riskBand(score);
    const index = i + 1;

    const cells: string[] = [
      String(index),
      safe(row.hazard),
      safe(row.scenario),
      safe(row.existingControls),
      String(row.severity),
      String(row.probability),
      `${score} (${RISK_BAND_LABELS[band]})`,
      safe(row.addedControls),
      safe(row.owner),
      safe(row.due),
    ];

    return { index, cells, riskScore: score, band };
  });

  return {
    title: 'פרויקט-גמר — ניתוח-סיכונים (JSA)',
    coverLines,
    siteSummary,
    jsaTable: {
      headers: [...JSA_HEADERS],
      rows: tableRows,
    },
  };
}

// ---------------------------------------------------------------------------
// re-export נוחות
// ---------------------------------------------------------------------------

export { SECTOR_LABELS, RISK_BAND_LABELS };

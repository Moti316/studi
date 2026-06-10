/**
 * src/features/final-project/export/project-document.ts — מודל-ביניים טהור למסמך-המוגש.
 *
 * שכבת-מודל משותפת ל-export-docx.ts ו-export-pdf.ts: לוקחת את שלושת מקורות-הנתונים
 * (cover / site / rows) ובונה מבנה-ביניים פשוט ושטוח — coverLines · tableHeader ·
 * siteSummary · jsaTable — שכל מנוע-ייצוא (Word / PDF) מרנדר משלו. כך לוגיקת-העברית,
 * הכותרות והחישוב (assessmentScore/riskBand/riskBandLabel/JSA_STATUS_LABELS) חיים
 * במקום-אחד בלבד וניתנים-לטסט ב-Vitest.
 *
 * פורמט-עמודות: **פורמט-רשמי מלא** (משרד-העבודה · "המלצה לפורמט טבלה בניתוח הסיכונים"):
 *   מס׳ | גורם-הסיכון | תרחיש | בקרות-קיימות{הנדסיות·מנהלתיות·צמ"א} |
 *   הערכת-סיכון-בשלב-זה{סבירות·חומרה·רמה} | בקרות-נוספות{הנדסיות·מנהלתיות·צמ"א} |
 *   הערכת-סיכון-לאחר{סבירות·חומרה·רמה} | אחראי | תאריך-ביצוע | סטטוס
 *   = 18 עמודות.
 *
 * טהור (pure): ללא IO · ללא side-effects · ללא תלות-DOM.
 *
 * ⚠️ PII: cover מכיל שם/ת.ז./מנחה (CoverInfo). מבנה זה משמש **רק** לייצוא-המסמך client-side —
 *    לעולם לא נשלח ל-AI/שרת.
 *
 * @see src/features/final-project/types.ts — CoverInfo · SiteInfo · JsaRow · assessmentScore ·
 *      riskBand · riskBandLabel · JSA_STATUS_LABELS
 */

import type { CoverInfo, SiteInfo, JsaRow, IndustrySector } from '../types';
import { assessmentScore, riskBand, riskBandLabel, JSA_STATUS_LABELS } from '../types';
import type { ProjectNarrative } from '../narrative';

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

// ---------------------------------------------------------------------------
// כותרות-עמודות — פורמט-רשמי מלא (18 עמודות · משרד-העבודה)
// ---------------------------------------------------------------------------

/**
 * כותרות-עמודות טבלת-ה-JSA (סדר-קבוע · עברית · פורמט-רשמי מלא).
 *
 * 18 עמודות בסדר הרשמי:
 *   [0]  מס׳
 *   [1]  גורם-הסיכון
 *   [2]  תרחיש-להתממשות
 *   [3]  בקרות-קיימות: הנדסיות
 *   [4]  בקרות-קיימות: מנהלתיות
 *   [5]  בקרות-קיימות: צמ"א
 *   [6]  הערכת-סיכון בשלב-זה: סבירות
 *   [7]  הערכת-סיכון בשלב-זה: חומרה
 *   [8]  הערכת-סיכון בשלב-זה: רמת-סיכון  ← צביעה-לפי-רצועה
 *   [9]  בקרות-נוספות-נדרשות: הנדסיות
 *   [10] בקרות-נוספות-נדרשות: מנהלתיות
 *   [11] בקרות-נוספות-נדרשות: צמ"א
 *   [12] הערכת-סיכון לאחר-יישום: סבירות
 *   [13] הערכת-סיכון לאחר-יישום: חומרה
 *   [14] הערכת-סיכון לאחר-יישום: רמת-סיכון  ← צביעה-לפי-רצועה
 *   [15] אחראי-לביצוע
 *   [16] תאריך-ביצוע
 *   [17] סטטוס
 */
export const JSA_HEADERS = [
  'מס׳',
  'גורם-הסיכון',
  'תרחיש-להתממשות',
  // בקרות-קיימות (3)
  'בקרות-קיימות: הנדסיות',
  'בקרות-קיימות: מנהלתיות',
  'בקרות-קיימות: צמ"א',
  // הערכת-סיכון בשלב-זה (3)
  'הערכת-סיכון בשלב-זה: סבירות',
  'הערכת-סיכון בשלב-זה: חומרה',
  'הערכת-סיכון בשלב-זה: רמת-סיכון',
  // בקרות-נוספות (3)
  'בקרות-נוספות-נדרשות: הנדסיות',
  'בקרות-נוספות-נדרשות: מנהלתיות',
  'בקרות-נוספות-נדרשות: צמ"א',
  // הערכת-סיכון לאחר (3)
  'הערכת-סיכון לאחר-יישום: סבירות',
  'הערכת-סיכון לאחר-יישום: חומרה',
  'הערכת-סיכון לאחר-יישום: רמת-סיכון',
  // סיום (3)
  'אחראי-לביצוע',
  'תאריך-ביצוע',
  'סטטוס',
] as const;

/** אינדקסי-העמודות בהן מוצגת "רמת-סיכון" (לצביעה פר-רצועה ב-docx/pdf). */
export const RISK_LEVEL_COLUMN_INDICES = [8, 14] as const;

// ---------------------------------------------------------------------------
// כותרת-הטבלה (table header block · "מפעל/מקום-עבודה/עמדה/הוכן-ע"י/אושר-ע"י")
// ---------------------------------------------------------------------------

/**
 * כותרת-הטבלה הרשמית (שורה מעל הכותרות · פורמט-משרד-העבודה).
 * שדות תיאוריים-בלבד (name-clean) — ממולאים מ-cover/site.
 */
export interface JsaTableHeader {
  /** שם-מפעל / שם-הפרויקט. */
  factory: string;
  /** מקום-עבודה (עיר/יישוב). */
  workplace: string;
  /** עמדה / שלב-עבודה (ענף). */
  workPosition: string;
  /** הוכן-ע"י (תיאור-תפקיד, name-clean). */
  preparedBy: string;
  /** אושר-ע"י (תיאור-תפקיד, name-clean — ריק = "טרם-אושר"). */
  approvedBy: string;
}

// ---------------------------------------------------------------------------
// טיפוסי-מבנה-הביניים
// ---------------------------------------------------------------------------

/**
 * שורת-טבלה אחת במבנה-הביניים (כבר מחושבת — assessmentScore + riskBand לפני ואחרי).
 *
 * cells: 18 תאים בסדר JSA_HEADERS.
 * bandBefore / bandAfter: רצועת-הסיכון לפני ואחרי (לצביעה פר-עמודת-רמה).
 */
export interface JsaTableRow {
  /** מספר-שורה לתצוגה (1-based). */
  index: number;
  /** ערכי-התאים בסדר JSA_HEADERS (18 תאים). */
  cells: string[];
  /** ציון-סיכון לפני (חומרה × סבירות · 1-16). */
  riskScoreBefore: number;
  /** ציון-סיכון אחרי (חומרה × סבירות · 1-16). */
  riskScoreAfter: number;
  /** רצועת-סיכון לפני יישום-הבקרות-הנוספות (לצביעת-עמודה [8]). */
  bandBefore: 'green' | 'yellow' | 'red';
  /** רצועת-סיכון אחרי יישום-הבקרות-הנוספות (לצביעת-עמודה [14]). */
  bandAfter: 'green' | 'yellow' | 'red';
  /**
   * @deprecated השתמש ב-bandBefore (שמור לתאימות-אחורה עם export-docx.ts שמשתמש ב-band).
   * ישוּוה ל-bandBefore.
   */
  band: 'green' | 'yellow' | 'red';
  /**
   * @deprecated השתמש ב-riskScoreBefore (שמור לתאימות-אחורה).
   */
  riskScore: number;
}

/** טבלת-ה-JSA המוכנה-לרינדור. */
export interface JsaTable {
  /** כותרת-הטבלה הרשמית (מעל שורת-הכותרות). */
  tableHeader: JsaTableHeader;
  /** כותרות-העמודות הרשמיות (18 · עברית). */
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
  /**
   * פרקים-נרטיביים (1,2,3,4,6) — אופציונלי.
   * נוכח רק כשמחולל-הנרטיב (generate-narrative.action.ts) רץ לפני הייצוא.
   * undefined = נרטיב לא הופק עדיין (מנועי-הייצוא יפעלו ללא פרקי-נרטיב).
   */
  narrative?: ProjectNarrative;
}

// ---------------------------------------------------------------------------
// עזרים פנימיים
// ---------------------------------------------------------------------------

/** מציג ערך-טקסט בטוח (ריק → "—") — מונע תאים-ריקים מבלבלים במסמך. */
function safe(value: string | undefined | null): string {
  const v = (value ?? '').trim();
  return v.length > 0 ? v : '—';
}

/**
 * מרכיב תיאור-רמת-סיכון מלא: "ציון (תווית-רצועה)" — לדוגמה: "6 (לא-קביל (אישור-מנהל))".
 * משתמש ב-assessmentScore/riskBand/riskBandLabel מ-types.ts.
 */
function riskLevelCell(score: number): string {
  const band = riskBand(score);
  return `${score} (${riskBandLabel(band)})`;
}

// ---------------------------------------------------------------------------
// buildProjectDocument — בונה את מבנה-הביניים
// ---------------------------------------------------------------------------

/**
 * buildProjectDocument — ממיר cover/site/rows למבנה-ביניים אחיד (Word + PDF).
 *
 * @param cover     עמוד-הפתיחה (PII · client-side בלבד · null = טרם-מולא).
 * @param site      פרופיל-האתר (null = טרם-מולא).
 * @param rows      שורות-ה-JSA (יתכן ריק).
 * @param narrative פרקים-נרטיביים מ-generate-narrative.action.ts (אופציונלי —
 *                  כשנמסר, ייכלל ב-ProjectDocument.narrative).
 * @returns         ProjectDocument — coverLines · siteSummary · jsaTable [· narrative].
 */
export function buildProjectDocument(
  cover: CoverInfo | null,
  site: SiteInfo | null,
  rows: JsaRow[],
  narrative?: ProjectNarrative,
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

  // ── כותרת-הטבלה הרשמית (מפעל/מקום/עמדה/הוכן-ע"י/אושר-ע"י) ──
  const sectorLabel = site ? (SECTOR_LABELS[site.sector] ?? site.sector) : '—';
  const tableHeader: JsaTableHeader = {
    factory: safe(cover?.projectName ?? site?.name),
    workplace: safe(cover?.location),
    workPosition: site ? sectorLabel : '—',
    // name-clean: "מגיש הפרויקט" (תיאור-תפקיד · לא שם-אדם)
    preparedBy: 'מגיש הפרויקט',
    // name-clean: "מנחה הפרויקט" (תיאור-תפקיד · לא שם-אדם)
    approvedBy: 'מנחה הפרויקט',
  };

  // ── טבלת-JSA (18 עמודות · פורמט-רשמי) ──
  const tableRows: JsaTableRow[] = rows.map((row, i) => {
    const scoreBefore = assessmentScore(row.riskBefore);
    const scoreAfter = assessmentScore(row.riskAfter);
    const bandBefore = riskBand(scoreBefore);
    const bandAfter = riskBand(scoreAfter);
    const index = i + 1;

    // 18 תאים בסדר JSA_HEADERS (noUncheckedIndexedAccess: ControlSet לא undefined — מובטח ע"י JsaRow)
    const cells: string[] = [
      // [0]  מס׳
      String(index),
      // [1]  גורם-הסיכון
      safe(row.hazard),
      // [2]  תרחיש-להתממשות
      safe(row.scenario),
      // [3-5] בקרות-קיימות (3 תת-עמודות)
      safe(row.existingControls.engineering),
      safe(row.existingControls.administrative),
      safe(row.existingControls.ppe),
      // [6-8] הערכת-סיכון בשלב-זה
      String(row.riskBefore.probability),
      String(row.riskBefore.severity),
      riskLevelCell(scoreBefore),
      // [9-11] בקרות-נוספות-נדרשות (3 תת-עמודות)
      safe(row.addedControls.engineering),
      safe(row.addedControls.administrative),
      safe(row.addedControls.ppe),
      // [12-14] הערכת-סיכון לאחר-יישום
      String(row.riskAfter.probability),
      String(row.riskAfter.severity),
      riskLevelCell(scoreAfter),
      // [15] אחראי-לביצוע
      safe(row.owner),
      // [16] תאריך-ביצוע
      safe(row.due),
      // [17] סטטוס
      JSA_STATUS_LABELS[row.status],
    ];

    return {
      index,
      cells,
      riskScoreBefore: scoreBefore,
      riskScoreAfter: scoreAfter,
      bandBefore,
      bandAfter,
      // תאימות-אחורה
      band: bandBefore,
      riskScore: scoreBefore,
    };
  });

  return {
    title: 'פרויקט-גמר — ניתוח-סיכונים (JSA)',
    coverLines,
    siteSummary,
    jsaTable: {
      tableHeader,
      headers: [...JSA_HEADERS],
      rows: tableRows,
    },
    ...(narrative !== undefined ? { narrative } : {}),
  };
}

// ---------------------------------------------------------------------------
// PROJECT_CHAPTERS — מטא-מערך של 6 הפרקים הרשמיים בסדרם
// ---------------------------------------------------------------------------

/**
 * מטא-רשומה של פרק בודד במסמך-הגמר.
 * key: מפתח ב-ProjectNarrative (פרק 5 = 'jsaTable' — לא שדה בנרטיב).
 */
export interface ChapterMeta {
  /** מספר-הפרק הרשמי (1–6). */
  num: 1 | 2 | 3 | 4 | 5 | 6;
  /** כותרת-הפרק בעברית (כפי שמופיעה במסמך-הגמר). */
  title: string;
  /** מפתח-הנתונים: שדה ב-ProjectNarrative (פרקים 1,2,3,4,6) או 'jsaTable' (פרק 5). */
  key: keyof ProjectNarrative | 'jsaTable';
}

/**
 * 6 הפרקים הרשמיים של מסמך-הגמר (משרד-העבודה · פורמט 19.10.2025) בסדרם.
 *
 * פרק 5 (jsaTable) הוא הטבלה-הרשמית — אינו שדה ב-ProjectNarrative; key='jsaTable'.
 * שאר הפרקים מפנים לשדות ProjectNarrative.
 *
 * @example
 *   PROJECT_CHAPTERS.find(c => c.num === 3)
 *   // { num: 3, title: 'פרק 3 — מבנה ארגוני', key: 'orgStructure' }
 */
export const PROJECT_CHAPTERS: readonly ChapterMeta[] = [
  { num: 1, title: 'פרק 1 — אודות החברה', key: 'aboutCompany' },
  { num: 2, title: 'פרק 2 — אודות הפרויקט ותהליכי-העבודה', key: 'aboutProject' },
  { num: 3, title: 'פרק 3 — מבנה ארגוני', key: 'orgStructure' },
  { num: 4, title: 'פרק 4 — פירוט תהליכי-עבודה וסיכונים כלליים', key: 'workProcesses' },
  { num: 5, title: 'פרק 5 — טבלת הערכת-סיכונים (לוח-החלטה)', key: 'jsaTable' },
  { num: 6, title: 'פרק 6 — ניתוח סיכונים', key: 'riskAnalysis' },
] as const;

// ---------------------------------------------------------------------------
// re-export נוחות
// ---------------------------------------------------------------------------

export { SECTOR_LABELS, RISK_BAND_LABELS };

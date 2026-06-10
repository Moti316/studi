/**
 * src/features/final-project/jsa-validation.ts — פונקציות-ולידציה טהורות לטבלת-JSA.
 *
 * כל פונקציה היא טהורה (pure): ללא IO · ללא side-effects · ניתנת-לטסט ב-Vitest.
 *
 * שלוש קבוצות:
 *   1. validateHierarchy — בדיקת מדרג-הבקרות (Hierarchy of Controls) לפי ISO 45001 + צמ"א-אחרון.
 *   2. coverageGaps      — זיהוי-פערי-כיסוי מפגעים לפי ענף-האתר.
 *   3. scoreBand         — ניקוד-כולל + רצועה לפרויקט (deterministic fallback).
 *
 * מקורות:
 *   courses/safety-officer/FINAL-PROJECT.md §מדרג-הבקרות · §מטריצת-הסיכון
 *   courses/safety-officer/curriculum-atgar.md פרק ט (ניהול-סיכונים · scope 5.6 · 6.x)
 */

import type { JsaRow, SiteInfo, CapstoneFeedback, CapstoneFeedbackSection } from './types';
import { riskLevel, riskBand } from './types';

// ---------------------------------------------------------------------------
// 1. validateHierarchy — מדרג-הבקרות
// ---------------------------------------------------------------------------

/**
 * מיפוי-מדרג: ערך-נמוך = עדיפות-גבוהה.
 * מקור: ISO 45001:2018 · תקנות-הבטיחות בעבודה.
 *
 * ס' 1-3 = בקרות-הנדסיות/חיסול (חובה לשקול לפני מנהלי/PPE).
 * ס' 4   = מנהלתי (מותר רק אחרי 1-3 נשקלו).
 * ס' 5   = צמ"א/PPE (אחרון-במדרג — תמיד).
 */
const HIERARCHY_RANK: Record<string, number> = {
  elimination: 1, // חיסול
  substitution: 2, // החלפה
  engineering: 3, // הנדסי
  administrative: 4, // מנהלתי
  ppe: 5, // צמ"א / PPE
};

/**
 * מילות-מפתח לזיהוי-רמת-הבקרה מהטקסט-החופשי של המשתמש.
 * הרשימה intentionally-broad — עדיף false-positive מאשר false-negative.
 */
const CONTROL_KEYWORDS: { level: keyof typeof HIERARCHY_RANK; he: string[]; en: string[] }[] = [
  {
    level: 'elimination',
    he: ['חיסול', 'ביטול', 'הסרת', 'להסיר', 'לבטל'],
    en: ['eliminat', 'remov'],
  },
  {
    level: 'substitution',
    he: ['החלפה', 'החלף', 'חומר חלופי', 'תחליף'],
    en: ['substitut', 'replac'],
  },
  {
    level: 'engineering',
    he: [
      'גדר',
      'מגן',
      'נעילה',
      'תיוג',
      'מחסום',
      'הנדסי',
      'ביסוס',
      'מעקה',
      'מסיך',
      'אוורור',
      'מערכת-ריסון',
      'בידוד',
      'חיתוך-אנרגיה',
      'LOTO',
      'לוטו',
      'הארקה',
    ],
    en: [
      'guard',
      'barrier',
      'interlock',
      'ventilat',
      'engineer',
      'lockout',
      'tagout',
      'loto',
      'isolat',
    ],
  },
  {
    level: 'administrative',
    he: [
      'נוהל',
      'הדרכה',
      'שילוט',
      'פיקוח',
      'הגבלת-זמן',
      'תיאום-עבודה',
      'תדרוך',
      'בדיקה-תקופתית',
      'מנהלתי',
      'מנהלי',
      'אישור-עבודה',
      'היתר-עבודה',
    ],
    en: ['procedure', 'training', 'sign', 'supervis', 'admin', 'permit'],
  },
  {
    level: 'ppe',
    he: [
      'כפפות',
      'קסדה',
      'נעלי-בטיחות',
      'ציוד-מגן',
      'צמ"א',
      'PPE',
      'מסיכה',
      'ווסט',
      'עניים',
      'אוזניות',
      'חגורת-בטיחות',
      'ציוד-מגן-אישי',
    ],
    en: ['glove', 'helmet', 'ppe', 'respirator', 'harness', 'goggle', 'earmuff'],
  },
];

/** מזהה את רמת-הבקרה הגבוהה-ביותר (מספרית-נמוכה-ביותר) בטקסט-חופשי. */
function detectHighestControlLevel(text: string): number | null {
  const lower = text.toLowerCase();
  let highest: number | null = null;

  for (const { level, he, en } of CONTROL_KEYWORDS) {
    const found =
      he.some((kw) => lower.includes(kw.toLowerCase())) ||
      en.some((kw) => lower.includes(kw.toLowerCase()));

    if (found) {
      const rank = HIERARCHY_RANK[level]!;
      if (highest === null || rank < highest) {
        highest = rank;
      }
    }
  }

  return highest;
}

/** האם בקרה-ממליצה היא צמ"א בלבד (ללא בקרה-הנדסית/חיסול/החלפה). */
function isPpeOnly(text: string): boolean {
  const lower = text.toLowerCase();
  const hasPpe = CONTROL_KEYWORDS.find((c) => c.level === 'ppe')!;
  const hasPpeMatch =
    hasPpe.he.some((kw) => lower.includes(kw.toLowerCase())) ||
    hasPpe.en.some((kw) => lower.includes(kw.toLowerCase()));

  if (!hasPpeMatch) return false;

  // בדוק אם יש גם בקרה-הנדסית/חיסול/החלפה
  for (const { level, he, en } of CONTROL_KEYWORDS) {
    if (['elimination', 'substitution', 'engineering'].includes(level)) {
      const match =
        he.some((kw) => lower.includes(kw.toLowerCase())) ||
        en.some((kw) => lower.includes(kw.toLowerCase()));
      if (match) return false; // יש בקרה-גבוהה-יותר → לא PPE-only
    }
  }

  return true;
}

export interface HierarchyIssue {
  /** id השורה הבעייתית. */
  rowId: string;
  /** תיאור-הליקוי בעברית. */
  description: string;
  /** חומרת-הליקוי (error = ליקוי-מהותי · warning = אזהרה). */
  severity: 'error' | 'warning';
}

/**
 * validateHierarchy — בדיקת מדרג-הבקרות על כל שורות-ה-JSA.
 *
 * בודק שתי עקרונות:
 *   A. צמ"א כבקרה-יחידה המומלצת בלי שנשקלו הנדסיות/חיסול = ליקוי-מהותי.
 *   B. addedControls ריק על שורה עם סיכון yellow/red = אזהרה (מצריך המלצות-בקרה).
 *
 * @param rows שורות-JSA לבדיקה.
 * @returns מערך-ממצאים (ריק = תקין).
 */
export function validateHierarchy(rows: JsaRow[]): HierarchyIssue[] {
  const issues: HierarchyIssue[] = [];

  for (const row of rows) {
    const score = riskLevel(row.severity, row.probability);
    const band = riskBand(score);

    // A: המלצת-צמ"א בלבד (PPE-only) בלי בקרה-הנדסית קודמת.
    // שתי-העמודות יחד (קיימות + נוספות) מייצגות את כלל-הבקרות — אם בקרה-הנדסית
    // כבר קיימת ב-existingControls והמשתמש הוסיף רק צמ"א, אין-זה ליקוי PPE-only.
    const allControls = `${row.existingControls ?? ''} ${row.addedControls ?? ''}`;
    if (isPpeOnly(allControls)) {
      issues.push({
        rowId: row.id,
        description:
          `גורם-סיכון "${row.hazard}": הבקרה-המומלצת היא ציוד-מגן-אישי בלבד. ` +
          `יש לשקול קודם חיסול / החלפה / בקרה-הנדסית לפי מדרג-הבקרות (ISO 45001).`,
        severity: 'error',
      });
    }

    // B: סיכון yellow/red ללא המלצות-בקרה כלל
    if ((band === 'yellow' || band === 'red') && row.addedControls.trim().length === 0) {
      issues.push({
        rowId: row.id,
        description:
          `גורם-סיכון "${row.hazard}": ציון-סיכון ${score} (${band === 'red' ? 'אדום — פעולה-מיידית' : 'צהוב — להפחית'}) ` +
          `אך לא הוגדרו בקרות-נוספות-נדרשות. חובה לפרט המלצות-בקרה.`,
        severity: band === 'red' ? 'error' : 'warning',
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// 2. coverageGaps — פערי-כיסוי מפגעים לפי-ענף
// ---------------------------------------------------------------------------

/**
 * מפגעים-מינימליים שהמשרד מצפה לראות לפי-ענף.
 * מבוסס על פרקי-הקורס ד-ח (scope מלא ב-content-scope.md).
 *
 * המפתח = IndustrySector; הערך = מערך-טופלים לחיפוש-בטקסט (ANY match = מכוסה).
 */
const EXPECTED_HAZARDS_BY_SECTOR: Record<string, string[][]> = {
  construction: [
    ['גובה', 'height', 'נפילה', 'fall', 'פיגום', 'scaffold', 'מדרגות', 'גג'],
    ['חשמל', 'electrical', 'מתח', 'voltage', 'כבל', 'cable'],
    ['חפירה', 'excavat', 'קרקע', 'ground', 'תמיכה', 'shoring'],
    ['ציוד-הרמה', 'crane', 'עגורן', 'forklift', 'הרמה'],
    ['אבק-סיליקה', 'silica', 'dust', 'אבק-בנייה'],
  ],
  manufacturing: [
    ['מכונות', 'machine', 'חלקים-נעים', 'moving parts', 'לחיצה', 'press'],
    ['חשמל', 'electrical', 'נעילה', 'LOTO', 'לוטו'],
    ['ידני', 'manual', 'הרמה-ידנית', 'human factors', 'ergono'],
    ['רעש', 'noise', 'שמיעה', 'hearing'],
    ['כימי', 'chemical', 'חומר-מסוכן', 'hazardous material'],
  ],
  electrical: [
    ['מתח-גבוה', 'high voltage', 'קצר', 'short circuit', 'חשמל'],
    ['נעילה', 'LOTO', 'לוטו', 'lockout', 'tagout'],
    ['פיצוץ', 'arc flash', 'קשת-חשמלית', 'flash'],
    ['עבודה-בגובה', 'עבודה-בגובה', 'עמוד', 'pole', 'מגדל'],
  ],
  chemicals: [
    ['שאיפה', 'inhalat', 'אדים', 'fume', 'vapour', 'vapor'],
    ['ספיגה', 'absorpt', 'skin contact', 'מגע-עור'],
    ['אחסון', 'storag', 'MSDS', 'SDS', 'עלון-בטיחות'],
    ['שריפה', 'fire', 'בעירה', 'דליקות', 'flammab'],
    ['כלי-לחץ', 'pressure vessel', 'מיכל', 'tank'],
  ],
  agriculture: [
    ['חקלאי', 'tractor', 'טרקטור', 'ציוד-חקלאי'],
    ['חרקים', 'pesticide', 'חומרי-הדברה', 'ריסוס'],
    ['שמש', 'heat', 'חום', 'solar', 'לחץ-חום'],
    ['כלים-חדים', 'sharp', 'חד', 'blade', 'להב'],
  ],
  logistics: [
    ['מלגזה', 'forklift', 'כלי-הרמה', 'lifting equipment'],
    ['גב', 'back', 'הרמה-ידנית', 'manual handling', 'ergon'],
    ['שבר-מטען', 'falling object', 'מטען-נופל', 'racking'],
    ['תנועה', 'traffic', 'כלי-רכב', 'vehicle'],
  ],
  maintenance: [
    ['נעילה', 'LOTO', 'לוטו', 'lockout'],
    ['גובה', 'height', 'סולם', 'ladder'],
    ['כלים', 'tool', 'ציוד', 'equipment'],
    ['חשמל', 'electrical'],
  ],
  other: [], // ענף-כללי — אין דרישות-ספציפיות
};

/**
 * coverageGaps — מזהה מפגעים-מהותיים לפי-ענף שלא הופיעו בטבלת-ה-JSA.
 *
 * האלגוריתם:
 *   1. לוקח את רשימת-המפגעים-הצפויים לענף-האתר.
 *   2. לכל קבוצת-מפגע: מחפש בטקסט של כל שורות-ה-JSA (hazard + scenario).
 *   3. קבוצה ללא-כיסוי → מדווחת כ-gap.
 *
 * @param site    פרופיל-האתר (ענף + מפגעים-עיקריים שהמשתמש ציין).
 * @param rows    שורות-ה-JSA שנבנו.
 * @returns       רשימת-תיאורים של מפגעים-חסרים (ריק = כיסוי-טוב).
 */
export function coverageGaps(site: SiteInfo, rows: JsaRow[]): string[] {
  const expected = EXPECTED_HAZARDS_BY_SECTOR[site.sector] ?? [];
  if (expected.length === 0) return [];

  // כל הטקסט הרלוונטי מהשורות (hazard + scenario בלי existingControls ו-addedControls
  // כי שם מופיע תוכן-בקרות, לא תיאור-מפגע)
  const allText = rows.map((r) => `${r.hazard} ${r.scenario}`.toLowerCase()).join(' ');

  const gaps: string[] = [];

  for (const keywordGroup of expected) {
    const covered = keywordGroup.some((kw) => allText.includes(kw.toLowerCase()));
    if (!covered) {
      // תיאור-gap מבוסס על מילת-המפתח הראשונה (הבולטת ביותר)
      const primary = keywordGroup[0] ?? 'מפגע-לא-ידוע';
      gaps.push(`מפגע שצפוי בענף "${site.sector}" לא זוהה בטבלה: ${primary}`);
    }
  }

  return gaps;
}

// ---------------------------------------------------------------------------
// 3. scoreBand — ניקוד-כולל + רצועת-פרויקט (fallback דטרמיניסטי)
// ---------------------------------------------------------------------------

export interface ProjectScoreResult {
  /**
   * ניקוד-כולל (0-100).
   * מחושב לפי:
   *   - כיסוי-שורות: +40 (10 שורות = מלא · פרו-ראטה)
   *   - מדרג-בקרות: +30 (ללא-ליקויים = מלא · חסר 5 לכל-ליקוי)
   *   - כיסוי-מפגעים: +20 (ללא-gaps = מלא · חסר 4 לכל-gap)
   *   - שורות-עם-אחראי+מועד: +10 (פרו-ראטה)
   */
  score: number;
  /**
   * רצועת-ציון:
   *   excellent  ≥ 80
   *   good       60–79
   *   needs_work < 60
   */
  band: 'excellent' | 'good' | 'needs_work';
  /** פירוט-ניקוד פר-ממד. */
  breakdown: {
    rowCoverage: number;
    hierarchyScore: number;
    hazardCoverage: number;
    completenessScore: number;
  };
}

const TARGET_ROWS = 10; // מספר-שורות-יעד לפרויקט-בטיחות מלא

/**
 * scoreBand — מחשב ציון-כולל לפרויקט-גמר ומסווגו לרצועה.
 *
 * פונקציה-דטרמיניסטית בלבד (fallback כשאין Claude).
 *
 * @param site  פרופיל-האתר.
 * @param rows  שורות-ה-JSA.
 * @returns     ציון + רצועה + פירוט.
 */
export function scoreBand(site: SiteInfo, rows: JsaRow[]): ProjectScoreResult {
  // --- ממד 1: כיסוי-שורות (0-40) ---
  const rowCoverage = Math.min(40, Math.round((rows.length / TARGET_ROWS) * 40));

  // --- ממד 2: מדרג-בקרות (0-30) ---
  const hierarchyIssues = validateHierarchy(rows);
  const errorCount = hierarchyIssues.filter((i) => i.severity === 'error').length;
  const warnCount = hierarchyIssues.filter((i) => i.severity === 'warning').length;
  const hierarchyScore = Math.max(0, 30 - errorCount * 5 - warnCount * 2);

  // --- ממד 3: כיסוי-מפגעים (0-20) ---
  const gaps = coverageGaps(site, rows);
  const hazardCoverage = Math.max(0, 20 - gaps.length * 4);

  // --- ממד 4: שלמות-שדות (0-10): owner + due מולאו ---
  const completeRows = rows.filter(
    (r) => r.owner.trim().length > 0 && r.due.trim().length > 0,
  ).length;
  const completenessScore = rows.length > 0 ? Math.round((completeRows / rows.length) * 10) : 0;

  // --- ציון-כולל ---
  const rawScore = rowCoverage + hierarchyScore + hazardCoverage + completenessScore;
  const score = Math.min(100, Math.max(0, rawScore));

  // --- רצועה ---
  const band: ProjectScoreResult['band'] =
    score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs_work';

  return {
    score,
    band,
    breakdown: { rowCoverage, hierarchyScore, hazardCoverage, completenessScore },
  };
}

// ---------------------------------------------------------------------------
// 4. buildDeterministicFeedback — fallback מלא (ללא Claude)
// ---------------------------------------------------------------------------

/**
 * buildDeterministicFeedback — בונה CapstoneFeedback שלם ללא-LLM.
 *
 * נקרא ע"י שכבת-ה-action כ-fallback כשאין ANTHROPIC_API_KEY.
 * תבנית-המשוב פשוטה יותר מהמשוב-ה-Claude, אך מדויקת-מבחינת-ממצאים.
 *
 * @param site  פרופיל-האתר.
 * @param rows  שורות-ה-JSA.
 * @returns     CapstoneFeedback מסוג 'deterministic'.
 */
export function buildDeterministicFeedback(site: SiteInfo, rows: JsaRow[]): CapstoneFeedback {
  const { score, band, breakdown } = scoreBand(site, rows);
  const hierarchyIssues = validateHierarchy(rows);
  const gaps = coverageGaps(site, rows);

  // בנה sections
  const sections: CapstoneFeedbackSection[] = [
    {
      key: 'jsa_completeness',
      grade:
        breakdown.rowCoverage >= 32
          ? 'excellent'
          : breakdown.rowCoverage >= 20
            ? 'good'
            : 'needs_work',
      feedback:
        rows.length === 0
          ? 'לא נמצאו שורות-JSA. יש להוסיף לפחות 5 שורות לפרויקט-גמר ראוי.'
          : `נמצאו ${rows.length} שורות-JSA (יעד מינימלי: ${TARGET_ROWS}). ${
              rows.length < TARGET_ROWS
                ? `מומלץ להוסיף ${TARGET_ROWS - rows.length} שורות נוספות.`
                : 'כמות-השורות מספקת.'
            }`,
    },
    {
      key: 'hierarchy',
      grade:
        hierarchyIssues.filter((i) => i.severity === 'error').length === 0
          ? 'excellent'
          : hierarchyIssues.filter((i) => i.severity === 'error').length <= 2
            ? 'good'
            : 'needs_work',
      feedback:
        hierarchyIssues.length === 0
          ? 'מדרג-הבקרות תקין — לא זוהו ליקויים.'
          : `זוהו ${hierarchyIssues.length} ליקויי-מדרג. הוועדה בוחנת את הנושא הזה — יש לתקן לפני-הגשה.`,
    },
    {
      key: 'coverage',
      grade: gaps.length === 0 ? 'excellent' : gaps.length <= 2 ? 'good' : 'needs_work',
      feedback:
        gaps.length === 0
          ? `כיסוי-מפגעים טוב לענף "${site.sector}".`
          : `זוהו ${gaps.length} מפגעים-צפויים לענף שלא טופלו בטבלה.`,
    },
    {
      key: 'matrix',
      grade:
        breakdown.completenessScore >= 8
          ? 'excellent'
          : breakdown.completenessScore >= 5
            ? 'good'
            : 'needs_work',
      feedback:
        breakdown.completenessScore >= 8
          ? 'שדות-אחראי ומועד מולאו — טוב.'
          : 'חסרים שדות אחראי-לביצוע ו/או מועד בחלק מהשורות. יש לשלם לפני-הגשה.',
    },
  ];

  // overall — לפי ה-band
  const overall: CapstoneFeedback['overall'] =
    band === 'excellent' ? 'excellent' : band === 'good' ? 'good' : 'needs_work';

  return {
    overall,
    sections,
    hierarchyIssues: hierarchyIssues.map((i) => i.description),
    missingHazards: gaps,
    source: 'deterministic',
  };
}

// ---------------------------------------------------------------------------
// re-export נוחות (ייבוא אחיד מהמודול)
// ---------------------------------------------------------------------------

export { riskLevel, riskBand } from './types';

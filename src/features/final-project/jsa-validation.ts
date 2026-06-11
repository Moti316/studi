/**
 * src/features/final-project/jsa-validation.ts — פונקציות-ולידציה טהורות לטבלת-JSA.
 *
 * **פורמט-רשמי:** הבקרות מבוּנות (הנדסיות/מנהלתיות/צמ"א), והערכת-הסיכון לפני-ואחרי —
 * כך שבדיקת-מדרג-הבקרות מבנית (לא ניחוש-מילות-מפתח). כל פונקציה טהורה · ניתנת-לטסט.
 *
 * שלוש קבוצות:
 *   1. validateHierarchy — מדרג-הבקרות (Hierarchy of Controls · צמ"א-אחרון).
 *   2. coverageGaps      — פערי-כיסוי מפגעים לפי-ענף.
 *   3. scoreBand         — ניקוד-כולל + רצועה (fallback דטרמיניסטי).
 *
 * מקורות: courses/safety-officer/FINAL-PROJECT.md · "המלצה לפורמט טבלה" + "לוח החלטה" (משרד-העבודה).
 */

import type { JsaRow, SiteInfo, CapstoneFeedback, CapstoneFeedbackSection } from './types';
import { riskBand, assessmentScore, isControlSetEmpty } from './types';

// ---------------------------------------------------------------------------
// 1. validateHierarchy — מדרג-הבקרות (מבני · על ControlSet)
// ---------------------------------------------------------------------------

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
 * שני עקרונות:
 *   A. **PPE-only:** הבקרות (קיימות+נוספות יחד) כוללות צמ"א אך **אין** בקרה הנדסית או
 *      מנהלתית כלל = ליקוי-מהותי (צמ"א הוא קו-ההגנה האחרון · ISO 45001 · מדרג-הבקרות).
 *   B. סיכון yellow/red (לפי הערכת-הסיכון בשלב-זה) ללא בקרות-נוספות כלל = אזהרה/ליקוי.
 *
 * @param rows שורות-JSA לבדיקה.
 * @returns מערך-ממצאים (ריק = תקין).
 */
export function validateHierarchy(rows: JsaRow[]): HierarchyIssue[] {
  const issues: HierarchyIssue[] = [];

  for (const row of rows) {
    const score = assessmentScore(row.riskBefore);
    const band = riskBand(score);

    // A: PPE-only — שתי-העמודות (קיימות + נוספות) יחד מייצגות את כלל-הבקרות.
    const hasEng =
      !!row.existingControls.engineering.trim() || !!row.addedControls.engineering.trim();
    const hasAdmin =
      !!row.existingControls.administrative.trim() || !!row.addedControls.administrative.trim();
    const hasPpe = !!row.existingControls.ppe.trim() || !!row.addedControls.ppe.trim();

    if (hasPpe && !hasEng && !hasAdmin) {
      issues.push({
        rowId: row.id,
        description:
          `גורם-סיכון "${row.hazard}": הבקרות הן ציוד-מגן-אישי בלבד. ` +
          `יש לשקול קודם חיסול / החלפה / בקרה-הנדסית / מנהלתית לפי מדרג-הבקרות (ISO 45001).`,
        severity: 'error',
      });
    }

    // B: סיכון yellow/red ללא בקרות-נוספות כלל.
    if ((band === 'yellow' || band === 'red') && isControlSetEmpty(row.addedControls)) {
      issues.push({
        rowId: row.id,
        description:
          `גורם-סיכון "${row.hazard}": ציון-סיכון ${score} ` +
          `(${band === 'red' ? 'אדום — פעולה-מיידית' : 'צהוב — להפחית'}) ` +
          `אך לא הוגדרו בקרות-נוספות-נדרשות. חובה לפרט המלצות-בקרה.`,
        severity: band === 'red' ? 'error' : 'warning',
      });
    }

    // C: סיכון yellow/red לפני הבקרות, הוגדרו בקרות-נוספות, אך הסיכון-אחרי עדיין אינו ירוק.
    const afterScore = assessmentScore(row.riskAfter);
    const afterBand = riskBand(afterScore);
    if (
      (band === 'yellow' || band === 'red') &&
      !isControlSetEmpty(row.addedControls) &&
      afterBand !== 'green'
    ) {
      issues.push({
        rowId: row.id,
        description:
          `גורם-סיכון "${row.hazard}": הבקרות-הנוספות אינן מורידות את הסיכון לרמה-קבילה ` +
          `(ציון-אחרי ${afterScore} = ${afterBand === 'red' ? 'אדום' : 'צהוב'}). יש לחזק את הבקרות עד להורדת-הסיכון לרצועה-ירוקה.`,
        severity: 'warning',
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// 2. coverageGaps — פערי-כיסוי מפגעים לפי-ענף
// ---------------------------------------------------------------------------

/**
 * מפגעים-מינימליים שהמשרד מצפה לראות לפי-ענף (חיפוש-בטקסט · ANY match = מכוסה).
 * מבוסס על פרקי-הקורס ד-ח (scope מלא ב-content-scope.md).
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
    ['עבודה-בגובה', 'עמוד', 'pole', 'מגדל'],
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
    // הוסר 'חד' (substring 2-תווים תפס מילים לא-קשורות: "אחד"/"מיוחד"/"חדר" → פער-לא-מדווח ·
    // BUGS#system-bug-hunt · #4). מילים-שלמות/≥3-תווים בלבד.
    ['כלים-חדים', 'sharp', 'blade', 'להב', 'חיתוך', 'קטיעה', 'משחזת'],
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
  other: [],
};

/**
 * coverageGaps — מפגעים-מהותיים לפי-ענף שלא הופיעו בטבלת-ה-JSA.
 * מחפש ב-`hazard + scenario` של כל השורות (לא בבקרות).
 *
 * @returns רשימת-תיאורים של מפגעים-חסרים (ריק = כיסוי-טוב).
 */
export function coverageGaps(site: SiteInfo, rows: JsaRow[]): string[] {
  const expected = EXPECTED_HAZARDS_BY_SECTOR[site.sector] ?? [];
  if (expected.length === 0) return [];

  const allText = rows.map((r) => `${r.hazard} ${r.scenario}`.toLowerCase()).join(' ');
  const gaps: string[] = [];

  for (const keywordGroup of expected) {
    const covered = keywordGroup.some((kw) => allText.includes(kw.toLowerCase()));
    if (!covered) {
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
  /** ניקוד-כולל (0-100). */
  score: number;
  /** רצועת-ציון: excellent ≥80 · good 60-79 · needs_work <60. */
  band: 'excellent' | 'good' | 'needs_work';
  /** פירוט-ניקוד פר-ממד. */
  breakdown: {
    rowCoverage: number;
    hierarchyScore: number;
    hazardCoverage: number;
    completenessScore: number;
  };
}

/** מספר-שורות-יעד (דרישת-משרד-העבודה: ≥10 שורות לפרויקט-גמר). */
export const TARGET_ROWS = 10;

/**
 * scoreBand — מחשב ציון-כולל לפרויקט-גמר ומסווגו לרצועה.
 * דטרמיניסטי בלבד (fallback כשאין Claude).
 */
export function scoreBand(site: SiteInfo, rows: JsaRow[]): ProjectScoreResult {
  // ממד 1: כיסוי-שורות (0-40)
  const rowCoverage = Math.min(40, Math.round((rows.length / TARGET_ROWS) * 40));

  // ממד 2: מדרג-בקרות (0-30)
  const hierarchyIssues = validateHierarchy(rows);
  const errorCount = hierarchyIssues.filter((i) => i.severity === 'error').length;
  const warnCount = hierarchyIssues.filter((i) => i.severity === 'warning').length;
  const hierarchyScore = Math.max(0, 30 - errorCount * 5 - warnCount * 2);

  // ממד 3: כיסוי-מפגעים (0-20)
  const gaps = coverageGaps(site, rows);
  const hazardCoverage = Math.max(0, 20 - gaps.length * 4);

  // ממד 4: שלמות-שדות (0-10): owner + due מולאו
  const completeRows = rows.filter(
    (r) => r.owner.trim().length > 0 && r.due.trim().length > 0,
  ).length;
  const completenessScore = rows.length > 0 ? Math.round((completeRows / rows.length) * 10) : 0;

  const rawScore = rowCoverage + hierarchyScore + hazardCoverage + completenessScore;
  const score = Math.min(100, Math.max(0, rawScore));

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
 * נקרא ע"י שכבת-ה-action כ-fallback כשאין ANTHROPIC_API_KEY.
 */
export function buildDeterministicFeedback(site: SiteInfo, rows: JsaRow[]): CapstoneFeedback {
  const { band, breakdown } = scoreBand(site, rows);
  const hierarchyIssues = validateHierarchy(rows);
  const gaps = coverageGaps(site, rows);
  const errorCount = hierarchyIssues.filter((i) => i.severity === 'error').length;

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
          ? `לא נמצאו שורות-JSA. דרישת-משרד-העבודה: לפחות ${TARGET_ROWS} שורות.`
          : `נמצאו ${rows.length} שורות-JSA (יעד-חובה: ${TARGET_ROWS}). ${
              rows.length < TARGET_ROWS
                ? `יש להוסיף ${TARGET_ROWS - rows.length} שורות נוספות.`
                : 'כמות-השורות מספקת.'
            }`,
    },
    {
      key: 'hierarchy',
      grade: errorCount === 0 ? 'excellent' : errorCount <= 2 ? 'good' : 'needs_work',
      feedback:
        hierarchyIssues.length === 0
          ? 'מדרג-הבקרות תקין — לא זוהו ליקויים.'
          : `זוהו ${hierarchyIssues.length} ליקויי-מדרג. הוועדה בוחנת זאת — יש לתקן לפני-הגשה.`,
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
          : 'חסרים שדות אחראי-לביצוע ו/או מועד בחלק מהשורות. יש למלא לפני-הגשה.',
    },
  ];

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
// re-export נוחות
// ---------------------------------------------------------------------------

export { riskLevel, riskBand } from './types';

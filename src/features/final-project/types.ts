/**
 * src/features/final-project/types.ts — מודל-הנתונים של פרויקט-הגמר (Capstone JSA).
 *
 * **פורמט-רשמי מדויק** של משרד-העבודה (עדכון-תכנית 19.10.2025 · "המלצה לפורמט טבלה בניתוח
 * הסיכונים" + "לוח החלטה לסקר סיכונים"). הטבלה הרשמית = בקרות-מפוצלות (הנדסיות/מנהלתיות/צמ"א)
 * × הערכת-סיכון **לפני-ואחרי** יישום-הבקרות + סטטוס. ראה courses/safety-officer/FINAL-PROJECT.md.
 *
 * **name-clean:** כל שדה הנוגע לאנשים — תיאורי-תפקיד בלבד ("מנהל-עבודה", "עובד").
 *                לעולם לא שמות-אדם בפרמטרים ציבוריים (חריג: עמוד-הפתיחה `CoverInfo` · client-only · לא-ל-AI).
 *
 * טהור (types + helpers טהורים · ללא IO · ללא side-effects).
 */

// ---------------------------------------------------------------------------
// שלבי-הליווי (wizard steps)
// ---------------------------------------------------------------------------

/**
 * חמשת שלבי-ה-wizard של פרויקט-הגמר:
 *   cover    — עמוד-פתיחה (פרטי-מגיש + חברה + מנחה) — **עמוד-1 של הפרויקט** (דרישת-משרד-העבודה).
 *   site     — בחירת-אתר + פרופיל-מקום-עבודה **אמיתי** (שלב 1).
 *   hazards  — סקר-מפגעים + בניית טבלת-JSA שורה-אחר-שורה (שלבים 2-3).
 *   matrix   — הצגת מטריצת-הסיכון + מדרג-בקרות (שלבים 4-5).
 *   feedback — משוב-AI על העבודה + הורדה (PDF/Word) + הכנה להגשה (שלב 6).
 */
export type CapstoneStep = 'cover' | 'site' | 'hazards' | 'matrix' | 'feedback';

// ---------------------------------------------------------------------------
// עמוד-פתיחה (שלב 0 · דרישת-משרד-העבודה — עמוד-1 של הפרויקט)
// ---------------------------------------------------------------------------

/**
 * פרטי עמוד-הפתיחה (מבוסס תבנית-משרד-העבודה "עמוד פתיחה לפרויקט").
 *
 * ⚠️ **PII:** `submitterName` + `idNumber` + `mentorName` = מידע-אישי.
 *    נשמר **client-side בלבד** (אין-DB) · **לעולם לא נשלח ל-AI** (ל-Claude עוברים רק site/hazards).
 *    משמש אך-ורק לעמוד-הפתיחה בייצוא-המסמך (PDF/Word).
 */
export interface CoverInfo {
  /** שם-החברה/הארגון (האתר-האמיתי). */
  companyName: string;
  /** שם-הפרויקט. */
  projectName: string;
  /** מקום-הפרויקט (עיר/יישוב). */
  location: string;
  /** שם-המגיש (PII · לעמוד-הפתיחה בלבד). */
  submitterName: string;
  /** מספר ת.ז. (PII · 9 ספרות · לעמוד-הפתיחה בלבד). */
  idNumber: string;
  /** תאריך-ההגשה (ISO "YYYY-MM-DD"). */
  date: string;
  /** שם-המנחה (PII · לעמוד-הפתיחה בלבד). */
  mentorName: string;
}

// ---------------------------------------------------------------------------
// פרופיל-האתר (שלב 1)
// ---------------------------------------------------------------------------

/**
 * ענפי-תעשייה הרלוונטיים לעבודת-גמר בבטיחות תעסוקתית.
 * מבוסס על פרקי-הקורס ד-ח (חשמל / חומ"ס / גובה-ובנייה / חקלאות / תעשייה-כללית).
 */
export type IndustrySector =
  | 'construction' // בנייה
  | 'manufacturing' // ייצור / מפעל
  | 'electrical' // חשמל
  | 'chemicals' // חומרים מסוכנים (חומ"ס)
  | 'agriculture' // חקלאות
  | 'logistics' // לוגיסטיקה / מחסנאות
  | 'maintenance' // אחזקה
  | 'other'; // אחר

/**
 * פרופיל-מקום-העבודה שהמשתמש מזין בשלב 1.
 * הנתונים אמיתיים (דרישת-משרד-העבודה: אתר-ממשי בלבד).
 */
export interface SiteInfo {
  /** שם-תיאורי (לא PII — שם-ענף/תפקוד, לא שם-אדם/חברה). */
  name: string;
  /** ענף-הפעילות (מחולל-השדות-ב-wizard). */
  sector: IndustrySector;
  /** מספר-עובדים משוער (לכיול-הסיכון וההמלצות). */
  workerCount: number;
  /**
   * מפגעים-עיקריים שנצפו בשטח (מזוהים בסיור — לא מהזיכרון).
   * מחרוזות-חופשיות שהמשתמש מזין; המערכת מעשירה מה-gaps-check.
   */
  mainHazards: string[];
}

// ---------------------------------------------------------------------------
// שורת-JSA (פורמט-רשמי · שלב 2-3)
// ---------------------------------------------------------------------------

/**
 * ערכי-חומרה (1-4) — מ"לוח ההחלטה" הרשמי:
 *   1 = שולית  (רק עזרה-ראשונה)
 *   2 = קלה    (פגיעה עם היעדרות עד-חודש)
 *   3 = בינונית (נכות או היעדרות-ממושכת)
 *   4 = חמורה  (מוות / נפגעים-רבים)
 */
export type SeverityLevel = 1 | 2 | 3 | 4;

/**
 * ערכי-סבירות (1-4) — מ"לוח ההחלטה" הרשמי:
 *   1 = נמוכה-מאוד (קלושה-ביותר)
 *   2 = נמוכה       (עלול לקרות לעיתים-רחוקות)
 *   3 = בינונית      (עלול לקרות לעיתים)
 *   4 = גבוהה        (עשוי לקרות בכל-יום)
 */
export type ProbabilityLevel = 1 | 2 | 3 | 4;

/**
 * סטטוס-יישום הבקרות-הנוספות (עמודת "סטטוס" בטבלה הרשמית).
 *   open        — פתוח (טרם-בוצע)
 *   in_progress — בביצוע
 *   done        — מבוצע
 */
export type JsaStatus = 'open' | 'in_progress' | 'done';

/** תוויות-סטטוס עבריות (לתצוגה + ייצוא). */
export const JSA_STATUS_LABELS: Record<JsaStatus, string> = {
  open: 'פתוח',
  in_progress: 'בביצוע',
  done: 'מבוצע',
};

/**
 * בקרות מפוצלות לפי מדרג-הבקרות — **פורמט-המשרד** (3 תת-עמודות בטבלה הרשמית).
 * ריק = "אין"/"לא נדרשות". המדרג: סילוק→החלפה→**הנדסיות→מנהלתיות→צמ"א** (צמ"א אחרון).
 */
export interface ControlSet {
  /** הנדסיות: אוורור/יניקה, מיגון-אקוסטי, מיגון-מכונות, אינטרלוקים, מכשור, כלי-הרמה. */
  engineering: string;
  /** מנהלתיות: נהלים/הוראות, שילוט. */
  administrative: string;
  /** צמ"א: ציוד-מגן-אישי כפי שהוגדר בתקנות (ציוד מגן אישי), תשנ"ז-1997. */
  ppe: string;
}

/** ControlSet ריק (ברירת-מחדל לשורה-חדשה). */
export function emptyControlSet(): ControlSet {
  return { engineering: '', administrative: '', ppe: '' };
}

/** האם ה-ControlSet ריק לחלוטין (אין אף בקרה). */
export function isControlSetEmpty(c: ControlSet): boolean {
  return !c.engineering.trim() && !c.administrative.trim() && !c.ppe.trim();
}

/** האם יש בקרה לא-צמ"א (הנדסית או מנהלתית) — לבדיקת מדרג-הבקרות. */
export function hasNonPpeControl(c: ControlSet): boolean {
  return !!c.engineering.trim() || !!c.administrative.trim();
}

/** האם יש **רק** צמ"א (צמ"א מלא, ללא הנדסי/מנהלי) — דגל מדרג-בקרות. */
export function isPpeOnly(c: ControlSet): boolean {
  return !!c.ppe.trim() && !hasNonPpeControl(c);
}

/** הערכת-סיכון בנקודת-זמן (לפני/אחרי) — סבירות × חומרה → רמה. */
export interface RiskAssessment {
  /** סבירות 1-4. */
  probability: ProbabilityLevel;
  /** חומרה 1-4. */
  severity: SeverityLevel;
}

/**
 * שורה בודדת בטבלת-JSA — **פורמט-רשמי מלא** (משרד-העבודה · 19.10.2025).
 *
 * עמודות (בסדר-הטבלה הרשמית):
 *   מס' | גורם-הסיכון | תרחיש-להתממשות | בקרות-קיימות(הנדסי/מנהלי/צמ"א) |
 *   הערכת-סיכון-בשלב-זה(סבירות/חומרה/רמה) | בקרות-נוספות(הנדסי/מנהלי/צמ"א) |
 *   הערכת-סיכון-אחרי(סבירות/חומרה/רמה) | אחראי | תאריך-ביצוע | סטטוס
 *
 * name-clean: `owner` = תיאור-תפקיד בלבד (לא שם-אדם).
 */
export interface JsaRow {
  /** מזהה-ייחודי. */
  id: string;
  /** גורם-הסיכון (מה עלול לפגוע · כפי שהוגדר בתקנה). */
  hazard: string;
  /** תרחיש-להתממשות גורם-הסיכון (מנגנון-הנזק). */
  scenario: string;
  /** בקרות-קיימות (3 תת-עמודות · הנדסי/מנהלי/צמ"א). */
  existingControls: ControlSet;
  /** הערכת-סיכון בשלב-זה (לפני הבקרות-הנוספות). */
  riskBefore: RiskAssessment;
  /** בקרות-נוספות-נדרשות להפחתת-הסיכון (3 תת-עמודות). */
  addedControls: ControlSet;
  /** הערכת-סיכון לאחר יישום הבקרות-הנוספות (יעד). */
  riskAfter: RiskAssessment;
  /** תפקיד-אחראי-לביצוע (שם-תפקיד בלבד — name-clean). */
  owner: string;
  /** תאריך-ביצוע-יעד (ISO "YYYY-MM-DD" · ריק = לא-הוגדר). */
  due: string;
  /** סטטוס-יישום הבקרות-הנוספות. */
  status: JsaStatus;
}

/** שורת-JSA חדשה-ריקה (ברירת-מחדל · severity/probability=1). */
export function emptyJsaRow(id: string): JsaRow {
  return {
    id,
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

// ---------------------------------------------------------------------------
// מטריצת-הסיכון (חישוב · "לוח החלטה" הרשמי)
// ---------------------------------------------------------------------------

/**
 * ציון-סיכון מספרי = חומרה × סבירות (טווח: 1-16).
 */
export function riskLevel(severity: SeverityLevel, probability: ProbabilityLevel): number {
  return severity * probability;
}

/** ציון-סיכון מתוך הערכת-סיכון (helper). */
export function assessmentScore(a: RiskAssessment): number {
  return riskLevel(a.severity, a.probability);
}

/**
 * סיווג-רצועה לפי "לוח ההחלטה" הרשמי:
 *   green  — 1-4  : סיכון קביל (צעדים-קבועים).
 *   yellow — 6-9  : לא-קביל (להורידו · המשך-מוגבל רק באישור-מנהל-מוסמך).
 *   red    — 12-16: לא-קביל (פעולה-מיידית · עד-עצירת-עבודה).
 *
 * ציון 5, 7, 10-11 אינם מכפלה-אפשרית ב-4×4 (ערכים-אפשריים: 1,2,3,4,6,8,9,12,16); best-fit (5→yellow · 7→yellow · 10-11→red).
 */
export function riskBand(score: number): 'green' | 'yellow' | 'red' {
  if (score <= 4) return 'green';
  if (score <= 9) return 'yellow';
  return 'red';
}

/** פרשנות-עברית לרמת-הסיכון (מ"לוח ההחלטה"). */
export function riskBandLabel(band: 'green' | 'yellow' | 'red'): string {
  return band === 'green' ? 'קביל' : band === 'yellow' ? 'לא-קביל (אישור-מנהל)' : 'לא-קביל (עצירה)';
}

// ---------------------------------------------------------------------------
// משוב-AI (שלב 4)
// ---------------------------------------------------------------------------

/**
 * דרגת-ציון-כוללת עבור פרויקט-הגמר:
 *   excellent  — עבודה ברמה מוכנה-להגשה, מדרג-בקרות תקין, כיסוי-מפגעים טוב.
 *   good       — עבודה סבירה, כמה ליקויים-קלים, ניתן לשפר לפני-הגשה.
 *   needs_work — פערים מהותיים בכיסוי-מפגעים, מדרג-בקרות לקוי, או שורות-JSA חסרות.
 */
export type CapstoneGrade = 'excellent' | 'good' | 'needs_work';

/** גורם-ציון פרטני בסעיף-הפרויקט. */
export interface CapstoneFeedbackSection {
  /** מפתח-סעיף (לדוגמה: 'jsa_completeness' · 'hierarchy' · 'matrix' · 'coverage'). */
  key: string;
  /** ציון-מילולי לסעיף (excellent / good / needs_work). */
  grade: CapstoneGrade;
  /** טקסט-משוב ספציפי לסעיף (בעברית · עד ~200 תווים). */
  feedback: string;
}

/**
 * תוצאת-המשוב הכולל על פרויקט-הגמר (שלב 4).
 *
 * מחולל על-ידי:
 *   claude       — Claude-Haiku (אם ANTHROPIC_API_KEY מוגדר) דרך claudeGenerateJSON<CapstoneFeedback>().
 *   deterministic — fallback מבוסס-כללים (jsa-validation.ts) ללא-LLM.
 */
export interface CapstoneFeedback {
  /** ציון-כולל. */
  overall: CapstoneGrade;
  /** משוב פר-סעיף (JSA-שלמות / מדרג-בקרות / כיסוי-מפגעים / מטריצה). */
  sections: CapstoneFeedbackSection[];
  /**
   * רשימת-ליקויים במדרג-הבקרות (מזוהים ע"י validateHierarchy).
   * לדוגמה: ["שורה 3: צמ"א ללא הנדסי קודם", "שורה 7: מנהלי לפני הנדסי"].
   */
  hierarchyIssues: string[];
  /**
   * מפגעים-חסרים שזוהו על-בסיס הענף (מזוהים ע"י coverageGaps).
   * לדוגמה: ["עבודה בגובה — לא זוהה", "חשמל — ציוד-לא-מוארק"].
   */
  missingHazards: string[];
  /** מקור-המשוב (לתצוגה + telemetry). */
  source: 'claude' | 'deterministic';
}

/**
 * src/features/final-project/jsa-generation.ts — לוגיקה-טהורה לטיוטת-JSA אוטומטית.
 *
 * כל פונקציה כאן היא טהורה (pure) ככל-הניתן · ללא IO · ללא קריאות-רשת.
 * (היחיד שאינו-דטרמיניסטי לחלוטין הוא `buildDeterministicJsaDraft`, המשתמש
 *  ב-`crypto.randomUUID` ליצירת-מזהים — אך גם הוא ללא-IO/רשת.)
 *
 * שלושה תפקידים:
 *   1. SYSTEM_JSA_DRAFTER — system-prompt למסייע-ניתוח-JSA (Claude).
 *   2. buildDraftPrompt    — prompt מובנה מתוך SiteInfo.
 *   3. isValidJsaRowArray  — ולידציה על תגובת-Claude.
 *   4. buildDeterministicJsaDraft — fallback בלי-Claude (שלד-שורות לפי-ענף).
 *
 * ⚠️ **טיוטה-לבדיקה בלבד:** הפלט הוא *הצעה* לסקירת-הלומד מול האתר-האמיתי,
 *    לא סקר-בטיחות סופי. אסור להמציא עובדות-שטח.
 *
 * עקרון-יסוד (מדרג-הבקרות · ISO 45001): צמ"א/PPE הוא **תמיד אחרון** —
 * חיסול → החלפה → הנדסי → מנהלי → צמ"א. הטיוטה לעולם לא ממליצה על צמ"א-בלבד.
 *
 * @see src/features/final-project/types.ts          — SiteInfo · JsaRow
 * @see src/features/final-project/jsa-validation.ts  — validateHierarchy (אימות-מדרג)
 * @see src/features/final-project/generate-jsa.action.ts — ה-action (IO · Claude)
 */

import type { JsaRow, SiteInfo, IndustrySector, SeverityLevel, ProbabilityLevel } from './types';
import { riskLevel, riskBand } from './types';

// ---------------------------------------------------------------------------
// 1. system-prompt — מסייע-ניתוח-JSA
// ---------------------------------------------------------------------------

/**
 * SYSTEM_JSA_DRAFTER — מעגן את ה-LLM לתפקיד מסייע-ניתוח-JSA על **אתר-אמיתי**.
 *
 * עקרונות-העיגון (קריטי):
 *   - האתר אמיתי, הלומד כבר סקר אותו — נתח את מה-שסופק, אל תמציא עובדות-שטח.
 *   - הפלט = טיוטה-לבדיקה, לא סקר-סופי.
 *   - פורמט פר-שורה: גורם-סיכון + תרחיש · בקרות-קיימות · חומרה×סבירות → רמת-סיכון ·
 *     בקרות-נוספות לפי-מדרג (צמ"א-אחרון).
 *   - לוח-החלטה: 1-4 קביל · 6-9 לא-קביל (אישור-מנהל) · 12-16 לא-קביל (מיידי/עצירה).
 *   - name-clean: owner = תיאור-תפקיד בלבד.
 */
export const SYSTEM_JSA_DRAFTER = `\
אתה מסייע-לנתח אתר-אמיתי שהלומד סקר. הלומד הוא ממונה-בטיחות-בהכשרה,
והוא כבר ביקר בשטח. תפקידך: לנתח את המפגעים-שסופקו + להציע מפגעים-טיפוסיים-לענף
לבדיקה. אל תמציא עובדות-שטח. זו טיוטה-לבדיקה שהלומד יאמת מול האתר, לא סקר-סופי.

מבנה כל שורה (פורמט-JSA הרשמי · משרד-העבודה):
- גורם-סיכון + תרחיש-התממשות (מנגנון-הנזק הקונקרטי).
- בקרות-קיימות — לפי מדרג-הבקרות (לא רק "כפפות"; ציין את רמת-הבקרה).
- חומרה (1-4) × סבירות (1-4) → רמת-סיכון.
- בקרות-נוספות-נדרשות לפי מדרג-הבקרות:
  חיסול → החלפה → הנדסי → מנהלי → צמ"א/PPE.
  צמ"א הוא **תמיד אחרון** — לעולם אל תמליץ על צמ"א-בלבד כשניתן לשקול בקרה-הנדסית.

לוח-החלטה (מקרא-המשרד):
- 1-4   = קביל (טיפול-שגרתי).
- 6-9   = לא-קביל — נדרש אישור-מנהל + בקרות-נוספות.
- 12-16 = לא-קביל — פעולה-מיידית עד-עצירת-עבודה; חובה בקרות-נוספות.
שורה אדומה (≥12) חייבת בקרות-נוספות-נדרשות.

name-clean: אחראי-לביצוע = תיאור-תפקיד בלבד ("מנהל-עבודה" · "ממונה-בטיחות"),
לעולם לא שם-אדם.

שפה: עברית בלבד · RTL. החזר 3-6 שורות.
החזר JSON תקין בלבד בפורמט: { "rows": JsaRow[] } — **בלי שדה id** (הקליינט יזריק).
כל שורה: hazard · scenario · existingControls · severity (1-4) · probability (1-4) ·
addedControls · owner. השדה due רשות (מחרוזת-ריקה אם לא-ידוע).`;

// ---------------------------------------------------------------------------
// 2. שלד-מפגעים פר-ענף (fallback) — צמד {מפגע, בקרה-הנדסית-מומלצת}
// ---------------------------------------------------------------------------

/**
 * שלד-JSA דטרמיניסטי פר-ענף.
 *
 * כל פריט = מפגע-טיפוסי-לענף + תרחיש + בקרה-קיימת + בקרה-נוספת (הנדסי/מנהלי, **לא** צמ"א-בלבד)
 * + חומרה/סבירות זהירים. נבחר במכוון כך שכל שורה תכבד את מדרג-הבקרות:
 * `addedControls` כולל לפחות בקרה-הנדסית/מנהלית — אף-פעם לא צמ"א-בלבד
 * (כדי ש-`validateHierarchy` לא ידגיש PPE-only).
 *
 * המבנה מקביל ל-EXPECTED_HAZARDS_BY_SECTOR ב-jsa-validation.ts (אותם-ענפים),
 * אך עשיר-יותר — שורות-שלד מלאות, לא רק מילות-מפתח-לחיפוש.
 */
interface HazardSkeleton {
  hazard: string;
  scenario: string;
  existingControls: string;
  /** בקרה-נוספת — כוללת תמיד בקרה-הנדסית/מנהלית (לא צמ"א-בלבד). */
  addedControls: string;
  severity: SeverityLevel;
  probability: ProbabilityLevel;
}

const SECTOR_SKELETONS: Record<IndustrySector, HazardSkeleton[]> = {
  construction: [
    {
      hazard: 'עבודה בגובה — נפילת-אדם',
      scenario: 'עובד על קצה-קומה / פיגום ללא מעקה תקני נופל לגובה',
      existingControls: 'מעקה-זמני חלקי',
      addedControls: 'התקנת מעקה-תקני קבוע (הנדסי) + נוהל-עבודה-בגובה ומערכת-עיגון',
      severity: 4,
      probability: 3,
    },
    {
      hazard: 'התחשמלות — מתח-חי',
      scenario: 'מגע בכבל-הזנה חשוף או לוח-חשמל לא-מוגן באתר',
      existingControls: 'לוחות-חשמל סגורים חלקית',
      addedControls: 'הארקה ומפסק-פחת (הנדסי) + נעילה-ותיוג (LOTO) לפני-עבודה',
      severity: 4,
      probability: 2,
    },
    {
      hazard: 'התמוטטות-דופן בחפירה',
      scenario: 'עובד בתעלה עמוקה ללא תמיכה — קריסת-קרקע וכיסוי',
      existingControls: 'סימון-שטח החפירה',
      addedControls: 'דיפון/תמיכת-דפנות (הנדסי) + נוהל-כניסה-לחפירה ופיקוח',
      severity: 4,
      probability: 2,
    },
  ],
  manufacturing: [
    {
      hazard: 'מגע עם חלקים-נעים של מכונה',
      scenario: 'יד נכנסת לאזור-העבודה של המכונה בזמן-תנועה',
      existingControls: 'מגן-מכונה חלקי',
      addedControls: 'התקנת מגן-מכונה הנדסי + מנגנון-עצירת-חירום (interlock) + נוהל-הפעלה',
      severity: 4,
      probability: 3,
    },
    {
      hazard: 'חשיפה לרעש-תעסוקתי',
      scenario: 'עבודה ממושכת ליד מכונה רועשת — נזק-שמיעה מצטבר',
      existingControls: 'מדידת-רעש תקופתית',
      addedControls: 'בידוד-אקוסטי למקור-הרעש (הנדסי) + הגבלת-זמן-חשיפה (מנהלי)',
      severity: 3,
      probability: 3,
    },
    {
      hazard: 'חשיפה לחומר-מסוכן בתהליך',
      scenario: 'שאיפת-אדים מתהליך-ייצור ללא אוורור מספק',
      existingControls: 'אוורור-כללי',
      addedControls: 'מערכת-שאיבה-מקומית למקור (הנדסי) + נוהל-עבודה ועלון-בטיחות',
      severity: 3,
      probability: 2,
    },
  ],
  electrical: [
    {
      hazard: 'התחשמלות ממתח-גבוה',
      scenario: 'מגע במוליך-חי בלוח/קו במהלך-תחזוקה',
      existingControls: 'נוהל-עבודה-חשמלית',
      addedControls: 'ניתוק-מתח ונעילה-ותיוג (LOTO · הנדסי+מנהלי) לפני-עבודה + הארקת-עבודה',
      severity: 4,
      probability: 2,
    },
    {
      hazard: 'קשת-חשמלית (Arc Flash)',
      scenario: 'פתיחת-לוח תחת-מתח → קשת-חשמלית וכוויות',
      existingControls: 'מרחק-בטיחות',
      addedControls: 'ניתוק-מתח לפני-פתיחה (הנדסי) + נוהל-עבודה ואישור-עבודה',
      severity: 4,
      probability: 2,
    },
    {
      hazard: 'עבודה בגובה על עמוד/מתקן',
      scenario: 'נפילה מעמוד-חשמל או מגדל בזמן-טיפוס',
      existingControls: 'סולם-טיפוס',
      addedControls: 'מערכת-עיגון ונקודות-קשירה (הנדסי) + נוהל-עבודה-בגובה',
      severity: 4,
      probability: 2,
    },
  ],
  chemicals: [
    {
      hazard: 'שאיפת-אדים רעילים',
      scenario: 'חשיפה לאדי-ממס במילוי/עירוי ללא אוורור-מקומי',
      existingControls: 'אוורור-כללי בחדר',
      addedControls: 'מנדף/שאיבה-מקומית (הנדסי) + נוהל-עבודה ועלון-בטיחות (SDS)',
      severity: 4,
      probability: 2,
    },
    {
      hazard: 'מגע-עור עם חומר-מאכל',
      scenario: 'התזת-חומר במהלך-העברה → כוויה כימית',
      existingControls: 'אריזות-מקור סגורות',
      addedControls: 'מערכת-העברה-סגורה (הנדסי) + נוהל-טיפול ועמדת-שטיפת-חירום',
      severity: 3,
      probability: 2,
    },
    {
      hazard: 'אחסון-לקוי וסיכון-שריפה',
      scenario: 'אחסון חומרים-דליקים ללא הפרדה → התלקחות',
      existingControls: 'מחסן-ייעודי',
      addedControls: 'ארון-אחסון-תקני והפרדת-חומרים (הנדסי) + נוהל-אחסון ובקרה',
      severity: 4,
      probability: 2,
    },
  ],
  agriculture: [
    {
      hazard: 'התהפכות-טרקטור / ציוד-חקלאי',
      scenario: 'נסיעה בשטח-משופע → התהפכות ומעיכה',
      existingControls: 'נהיגה-זהירה',
      addedControls: 'מבנה-הגנה-מפני-התהפכות (ROPS · הנדסי) + נוהל-נסיעה והדרכה',
      severity: 4,
      probability: 2,
    },
    {
      hazard: 'חשיפה לחומרי-הדברה',
      scenario: 'ריסוס ללא הגנה → שאיפה/ספיגה רעילה',
      existingControls: 'ריסוס בשעות-קרירות',
      addedControls: 'ציוד-ריסוס-סגור (הנדסי) + נוהל-ריסוס ותקופות-המתנה (מנהלי)',
      severity: 3,
      probability: 3,
    },
    {
      hazard: 'עומס-חום (לחץ-חום)',
      scenario: 'עבודה ממושכת בשמש → התייבשות ומכת-חום',
      existingControls: 'הפסקות',
      addedControls: 'הצללה ועמדות-מים (הנדסי) + נוהל-עבודה-בחום והגבלת-זמן (מנהלי)',
      severity: 3,
      probability: 3,
    },
  ],
  logistics: [
    {
      hazard: 'פגיעת-מלגזה בהולך-רגל',
      scenario: 'מלגזה נעה במחסן פוגעת בעובד באזור-מעבר',
      existingControls: 'סימון-נתיבים',
      addedControls: 'הפרדת-מסלולי הולכי-רגל ומלגזות (הנדסי) + נוהל-תנועה ופיקוח',
      severity: 4,
      probability: 3,
    },
    {
      hazard: 'הרמה-ידנית ועומס-גב',
      scenario: 'הרמת-מטען כבד ידנית → פגיעת-גב מצטברת',
      existingControls: 'הדרכת-הרמה',
      addedControls: 'אמצעי-הרמה מכניים (הנדסי) + הגבלת-משקל ונוהל-הרמה (מנהלי)',
      severity: 2,
      probability: 3,
    },
    {
      hazard: 'נפילת-מטען ממדף-אחסון',
      scenario: 'מטען-לא-מאובטח נופל ממדף גבוה על-עובד',
      existingControls: 'מדפים מסומנים',
      addedControls: 'עיגון-מדפים והגבלת-עומס (הנדסי) + נוהל-אחסון ובדיקה-תקופתית',
      severity: 3,
      probability: 2,
    },
  ],
  maintenance: [
    {
      hazard: 'הפעלה-בלתי-צפויה של ציוד',
      scenario: 'הפעלת-מכונה בזמן-תחזוקה → לכידת-איבר',
      existingControls: 'תיאום-עבודה',
      addedControls: 'נעילה-ותיוג (LOTO · הנדסי+מנהלי) לפני-עבודה + נוהל-תחזוקה',
      severity: 4,
      probability: 2,
    },
    {
      hazard: 'עבודה בגובה — סולם/מתקן',
      scenario: 'נפילה מסולם בזמן-תחזוקת-מתקן',
      existingControls: 'סולם-תקני',
      addedControls: 'פיגום/במת-הרמה יציבה (הנדסי) + נוהל-עבודה-בגובה ופיקוח',
      severity: 4,
      probability: 2,
    },
    {
      hazard: 'התחשמלות בעבודת-חשמל',
      scenario: 'מגע-מתח בזמן-תחזוקת לוח/ציוד-חשמלי',
      existingControls: 'נוהל-חשמל',
      addedControls: 'ניתוק-מתח ונעילה-ותיוג (LOTO · הנדסי) + בדיקת היעדר-מתח',
      severity: 4,
      probability: 2,
    },
  ],
  other: [
    {
      hazard: 'מעידה / החלקה / נפילה במישור',
      scenario: 'משטח-עבודה רטוב או לא-מסודר → מעידה ופציעה',
      existingControls: 'ניקיון-תקופתי',
      addedControls: 'משטחים נגד-החלקה וסילוק-מכשולים (הנדסי) + נוהל-סדר-וניקיון (מנהלי)',
      severity: 2,
      probability: 3,
    },
    {
      hazard: 'ארגונומיה — תנוחת-עבודה',
      scenario: 'עבודה ממושכת בתנוחה-לקויה → פגיעה-שלד-שרירית',
      existingControls: 'ריהוט-בסיסי',
      addedControls: 'התאמת-עמדה-ארגונומית (הנדסי) + הפסקות ורוטציה (מנהלי)',
      severity: 2,
      probability: 2,
    },
  ],
};

// ---------------------------------------------------------------------------
// 3. buildDraftPrompt — prompt מובנה מ-SiteInfo
// ---------------------------------------------------------------------------

/**
 * רשימת-המפגעים-הצפויים פר-ענף (להצגה ל-LLM כ"לבדוק").
 * מילת-המפתח הראשונה מכל שלד = הכותרת-הבולטת.
 */
function expectedHazardTitles(sector: IndustrySector): string[] {
  return (SECTOR_SKELETONS[sector] ?? []).map((s) => s.hazard);
}

/**
 * buildDraftPrompt — מרכיב prompt מובנה ל-Claude מתוך פרופיל-האתר.
 *
 * מזריק: שם/ענף/מספר-עובדים/מפגעים-שצוינו + מפגעים-צפויים-לענף + שורת-few-shot.
 *
 * @param site פרופיל-האתר (שלב 1).
 * @returns    טקסט-prompt.
 */
export function buildDraftPrompt(site: SiteInfo): string {
  const observed =
    site.mainHazards.length > 0
      ? site.mainHazards.map((h) => `- ${h}`).join('\n')
      : '- (הלומד לא ציין מפגעים-ספציפיים — הצע מפגעים-טיפוסיים-לענף לבדיקה)';

  const expected = expectedHazardTitles(site.sector);
  const expectedText =
    expected.length > 0
      ? expected.map((h) => `- ${h}`).join('\n')
      : '- (אין רשימת-מפגעים-טיפוסית לענף זה — הסתמך על המפגעים-שצוינו)';

  // שורת few-shot אחת — מדגימה את הפורמט + כיבוד-מדרג (בקרה-הנדסית, לא צמ"א-בלבד).
  const fewShot = `\
דוגמה לשורה-תקינה (פורמט-מטרה · אל תעתיק את-התוכן):
{
  "hazard": "עבודה בגובה — נפילת-אדם",
  "scenario": "עובד על קצה-קומה ללא מעקה תקני נופל",
  "existingControls": "מעקה-זמני חלקי",
  "severity": 4,
  "probability": 3,
  "addedControls": "התקנת מעקה-תקני קבוע (הנדסי) + נוהל-עבודה-בגובה ומערכת-עיגון",
  "owner": "מנהל-עבודה",
  "due": ""
}`;

  return (
    `## פרופיל-האתר (אמיתי · נסקר ע"י הלומד)\n` +
    `שם: "${site.name}"\n` +
    `ענף: ${site.sector}\n` +
    `מספר-עובדים: ${site.workerCount}\n\n` +
    `## מפגעים-שהלומד ציין בשטח\n${observed}\n\n` +
    `## מפגעים-טיפוסיים-לענף לבדיקה (הצע אם רלוונטי לאתר)\n${expectedText}\n\n` +
    `${fewShot}\n\n` +
    `החזר { "rows": JsaRow[] } — 3-6 שורות · בלי id · צמ"א-אחרון תמיד.`
  );
}

// ---------------------------------------------------------------------------
// 4. isValidJsaRowArray — ולידציה על תגובת-Claude
// ---------------------------------------------------------------------------

function isSeverityLevel(x: unknown): x is SeverityLevel {
  return x === 1 || x === 2 || x === 3 || x === 4;
}

/**
 * isValidJsaRowArray — type-guard: מאמת ש-x הוא JsaRow[] שלם.
 *
 * כל שורה חייבת: hazard/scenario/existingControls/addedControls/owner (strings) ·
 * severity ו-probability (1-4) · id (string). (due רשות — מאופס אם חסר ע"י הקורא.)
 *
 * משמש את ה-action *אחרי* הזרקת-ה-id — לכן דורש id-string.
 */
export function isValidJsaRowArray(x: unknown): x is JsaRow[] {
  if (!Array.isArray(x)) return false;
  if (x.length === 0) return false;

  for (const item of x) {
    if (!item || typeof item !== 'object') return false;
    const r = item as Record<string, unknown>;
    if (typeof r['id'] !== 'string' || r['id'].length === 0) return false;
    if (typeof r['hazard'] !== 'string') return false;
    if (typeof r['scenario'] !== 'string') return false;
    if (typeof r['existingControls'] !== 'string') return false;
    if (typeof r['addedControls'] !== 'string') return false;
    if (typeof r['owner'] !== 'string') return false;
    if (!isSeverityLevel(r['severity'])) return false;
    if (!isSeverityLevel(r['probability'])) return false;
    // due רשות — אם קיים חייב להיות string.
    if (r['due'] !== undefined && typeof r['due'] !== 'string') return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// 5. buildDeterministicJsaDraft — fallback בלי-Claude
// ---------------------------------------------------------------------------

const DEFAULT_OWNER = 'מנהל-עבודה';

/**
 * buildDeterministicJsaDraft — בונה טיוטת-JSA שלמה ללא-LLM.
 *
 * הלוגיקה:
 *   1. מתחיל מהמפגעים-שהלומד ציין (mainHazards) → שורת-שלד פר-מפגע (best-fit לענף).
 *   2. משלים משלד-הענף (SECTOR_SKELETONS) עד לכיסוי-מינימלי (≥3 שורות),
 *      בלי לשכפל מפגעים-שכבר-כוסו.
 *   3. כל שורה: בקרות לפי-מדרג · severity/probability זהירים · addedControls מוצע
 *      (כולל תמיד בקרה-הנדסית/מנהלית — **לא צמ"א-בלבד**) · owner=מנהל-עבודה ·
 *      id מ-crypto.randomUUID.
 *
 * @param site פרופיל-האתר.
 * @returns    JsaRow[] (≥1 שורה תקינה תמיד).
 */
export function buildDeterministicJsaDraft(site: SiteInfo): JsaRow[] {
  const skeletons = SECTOR_SKELETONS[site.sector] ?? SECTOR_SKELETONS.other;
  const rows: JsaRow[] = [];
  const usedHazards = new Set<string>();

  // --- שלב 1: מפגעים שהלומד ציין מפורשות ---
  for (const userHazard of site.mainHazards) {
    const trimmed = userHazard.trim();
    if (trimmed.length === 0) continue;

    // נסה להתאים שלד-ענף שמכסה את המפגע-שצוין (חיפוש-מילולי גס) — אם נמצא, נשתמש
    // בבקרות-המומלצות שלו (כך נשמר כיבוד-המדרג); אחרת שורת-שלד-גנרית בטוחה.
    const match = skeletons.find(
      (s) =>
        s.hazard.includes(trimmed) ||
        trimmed.includes(s.hazard) ||
        s.hazard.split(' ').some((w) => w.length > 2 && trimmed.includes(w)),
    );

    if (match) {
      rows.push(skeletonToRow({ ...match, hazard: trimmed || match.hazard }));
      usedHazards.add(match.hazard);
    } else {
      rows.push(genericRowForHazard(trimmed));
    }
  }

  // --- שלב 2: השלמה משלד-הענף עד ≥3 שורות (בלי כפילויות) ---
  for (const s of skeletons) {
    if (rows.length >= 3) break;
    if (usedHazards.has(s.hazard)) continue;
    rows.push(skeletonToRow(s));
    usedHazards.add(s.hazard);
  }

  // --- רשת-ביטחון: לעולם לא ריק ---
  if (rows.length === 0) {
    const fallback = (SECTOR_SKELETONS.other[0] ?? {
      hazard: 'מפגע-כללי',
      scenario: 'תרחיש-התממשות לבדיקה מול האתר',
      existingControls: 'בקרות-בסיסיות',
      addedControls: 'בקרה-הנדסית/מנהלית לפי-מדרג + נוהל-עבודה',
      severity: 2 as SeverityLevel,
      probability: 2 as ProbabilityLevel,
    }) satisfies HazardSkeleton;
    rows.push(skeletonToRow(fallback));
  }

  return rows;
}

/** ממיר שלד-מפגע לשורת-JSA מלאה עם id. */
function skeletonToRow(s: HazardSkeleton): JsaRow {
  return {
    id: crypto.randomUUID(),
    hazard: s.hazard,
    scenario: s.scenario,
    existingControls: s.existingControls,
    severity: s.severity,
    probability: s.probability,
    addedControls: s.addedControls,
    owner: DEFAULT_OWNER,
    due: '',
  };
}

/**
 * genericRowForHazard — שורת-שלד בטוחה למפגע-חופשי שלא-תואם-שלד-ענף.
 *
 * הבקרה-הנוספת כוללת **בקרה-הנדסית/מנהלית מפורשת** (לא צמ"א-בלבד) כדי לכבד
 * את מדרג-הבקרות. severity/probability זהירים (3×3) כדי לדרבן את-הלומד לבדוק.
 */
function genericRowForHazard(hazard: string): JsaRow {
  const score = riskLevel(3, 3);
  void riskBand(score); // (תיעוד: 9 = צהוב · לא-קביל → דורש בקרות-נוספות)
  return {
    id: crypto.randomUUID(),
    hazard,
    scenario: `תרחיש-התממשות עבור "${hazard}" — לבדיקה ולתיאור מול האתר.`,
    existingControls: 'בקרות-קיימות לבדיקה מול האתר',
    severity: 3,
    probability: 3,
    addedControls:
      'לשקול לפי-מדרג: בקרה-הנדסית (חיסול/החלפה/מיגון) ואז בקרה-מנהלית (נוהל/הדרכה/פיקוח); צמ"א אחרון בלבד.',
    owner: DEFAULT_OWNER,
    due: '',
  };
}

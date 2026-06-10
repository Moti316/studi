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
 * **פורמט-נתונים (עדכון-שובר):** ControlSet { engineering, administrative, ppe } (לא string),
 * RiskAssessment { probability, severity } לפני-ואחרי. row.severity/probability הוסרו —
 * יש להשתמש ב-row.riskBefore.severity / row.riskBefore.probability.
 *
 * @see src/features/final-project/types.ts          — SiteInfo · JsaRow · ControlSet · RiskAssessment
 * @see src/features/final-project/jsa-validation.ts  — validateHierarchy (אימות-מדרג)
 * @see src/features/final-project/generate-jsa.action.ts — ה-action (IO · Claude)
 */

import type {
  JsaRow,
  SiteInfo,
  IndustrySector,
  SeverityLevel,
  ProbabilityLevel,
  ControlSet,
  RiskAssessment,
} from './types';
import { riskLevel, riskBand, emptyControlSet, emptyJsaRow } from './types';

// ---------------------------------------------------------------------------
// 1. system-prompt — מסייע-ניתוח-JSA
// ---------------------------------------------------------------------------

/**
 * SYSTEM_JSA_DRAFTER — מעגן את ה-LLM לתפקיד מסייע-ניתוח-JSA על **אתר-אמיתי**.
 *
 * עקרונות-העיגון (קריטי):
 *   - האתר אמיתי, הלומד כבר סקר אותו — נתח את מה-שסופק, אל תמציא עובדות-שטח.
 *   - הפלט = טיוטה-לבדיקה, לא סקר-סופי.
 *   - **פורמט-נתונים עשיר (פורמט-רשמי · משרד-העבודה):**
 *       existingControls / addedControls = ControlSet { engineering, administrative, ppe }.
 *       riskBefore / riskAfter = { probability: 1-4, severity: 1-4 }.
 *       status = "open" | "in_progress" | "done".
 *   - לוח-החלטה: 1-4 קביל · 6-9 לא-קביל (אישור-מנהל) · 12-16 לא-קביל (מיידי/עצירה).
 *   - name-clean: owner = תיאור-תפקיד בלבד.
 *   - צמ"א הוא תמיד אחרון — לעולם לא addedControls.ppe בלבד כשניתן לשקול הנדסי/מנהלי.
 */
export const SYSTEM_JSA_DRAFTER = `\
אתה מסייע-לנתח אתר-אמיתי שהלומד סקר. הלומד הוא ממונה-בטיחות-בהכשרה,
והוא כבר ביקר בשטח. תפקידך: לנתח את המפגעים-שסופקו + להציע מפגעים-טיפוסיים-לענף
לבדיקה. אל תמציא עובדות-שטח. זו טיוטה-לבדיקה שהלומד יאמת מול האתר, לא סקר-סופי.

## מבנה כל שורה — פורמט-JSA הרשמי (משרד-העבודה · עדכון 19.10.2025)

כל שורה חייבת לכלול את כל השדות הבאים:

- hazard         — גורם-הסיכון (מה עלול לפגוע).
- scenario       — תרחיש-התממשות (מנגנון-הנזק הקונקרטי).
- existingControls — ControlSet (3 שדות: engineering, administrative, ppe).
  בקרות-קיימות-כבר-באתר לפי רמות-מדרג.
- riskBefore     — הערכת-סיכון בשלב-זה: { probability: 1-4, severity: 1-4 }.
  מכפלה = רמת-הסיכון לפי לוח-ההחלטה.
- addedControls  — ControlSet (3 שדות: engineering, administrative, ppe).
  בקרות-נוספות-נדרשות לפי מדרג:
  חיסול → החלפה → **הנדסי** (engineering) → **מנהלי** (administrative) → **צמ"א** (ppe).
  צמ"א/ppe הוא **תמיד אחרון** — לעולם לא ppe-בלבד כשניתן לשקול הנדסי/מנהלי.
- riskAfter      — הערכת-סיכון לאחר יישום הבקרות-הנוספות: { probability: 1-4, severity: 1-4 }.
  צריכה להיות נמוכה מ-riskBefore.
- owner          — תפקיד-אחראי (תיאור-תפקיד בלבד · name-clean: לא שם-אדם).
- due            — תאריך-יעד (מחרוזת-ריקה אם לא-ידוע).
- status         — סטטוס: "open" | "in_progress" | "done" (ברירת-מחדל: "open").

## לוח-החלטה (מקרא-המשרד)
- 1-4   = קביל (טיפול-שגרתי).
- 6-9   = לא-קביל — נדרש אישור-מנהל + בקרות-נוספות.
- 12-16 = לא-קביל — פעולה-מיידית עד-עצירת-עבודה; חובה בקרות-נוספות.
שורה אדומה (riskBefore.severity × riskBefore.probability ≥ 12) חייבת addedControls שאינם ריקים.

## name-clean
- owner = תיאור-תפקיד בלבד ("מנהל-עבודה" · "ממונה-בטיחות"). לעולם לא שם-אדם.

## הנחיות-פלט
- שפה: עברית בלבד · RTL.
- ייצר 10-12 שורות.
- החזר JSON תקין בלבד בפורמט: { "rows": JsaRow[] } — **בלי שדה id** (הקליינט יזריק).
- אין שדות severity/probability ישירות ב-row (הם בתוך riskBefore/riskAfter בלבד).

ControlSet (מבנה לכל existingControls / addedControls):
{
  "engineering":    "<בקרה-הנדסית: מיגון / יניקה / אינטרלוק / כלי-הרמה / הארקה ... | ריק אם אין>",
  "administrative": "<בקרה-מנהלתית: נוהל / הדרכה / שילוט / LOTO / פיקוח ... | ריק אם אין>",
  "ppe":            "<צמ"א: קסדה / אפוד / משקפי-מגן / נגד-נפילה ... | ריק אם אין>"
}`;

// ---------------------------------------------------------------------------
// 2. שלד-מפגעים פר-ענף (fallback) — עשיר (ControlSet + RiskAssessment)
// ---------------------------------------------------------------------------

/**
 * שלד-JSA דטרמיניסטי פר-ענף — **פורמט-עשיר** (ControlSet × RiskAssessment).
 *
 * כל פריט = מפגע-טיפוסי-לענף + תרחיש + ControlSet-קיימות + riskBefore +
 * ControlSet-נוספות (כולל תמיד בקרה-הנדסית/מנהלית, **לא** ppe-בלבד) + riskAfter.
 * נבחר כך שכל שורה תכבד את מדרג-הבקרות: addedControls כולל engineering/administrative.
 *
 * המבנה מקביל ל-EXPECTED_HAZARDS_BY_SECTOR ב-jsa-validation.ts (אותם-ענפים),
 * אך עשיר-יותר — שורות-שלד מלאות, לא רק מילות-מפתח-לחיפוש.
 */
interface HazardSkeleton {
  hazard: string;
  scenario: string;
  existingControls: ControlSet;
  riskBefore: RiskAssessment;
  /** בקרות-נוספות — כוללת תמיד engineering/administrative (לא ppe-בלבד). */
  addedControls: ControlSet;
  riskAfter: RiskAssessment;
}

// ---------------------------------------------------------------------------
// helpers — בונה ControlSet ו-RiskAssessment בתמציתיות
// ---------------------------------------------------------------------------

function cs(engineering: string, administrative: string, ppe = ''): ControlSet {
  return { engineering, administrative, ppe };
}

function ra(severity: SeverityLevel, probability: ProbabilityLevel): RiskAssessment {
  return { severity, probability };
}

// ---------------------------------------------------------------------------
// SECTOR_SKELETONS — שלדי-ענף (פורמט-עשיר)
// ---------------------------------------------------------------------------

const SECTOR_SKELETONS: Record<IndustrySector, HazardSkeleton[]> = {
  construction: [
    {
      hazard: 'עבודה בגובה — נפילת-אדם',
      scenario: 'עובד על קצה-קומה / פיגום ללא מעקה תקני נופל לגובה',
      existingControls: cs('מעקה-זמני חלקי', '', 'קסדה'),
      riskBefore: ra(4, 3),
      addedControls: cs(
        'התקנת מעקה-תקני קבוע + מערכת-עיגון ונקודות-קשירה',
        'נוהל-עבודה-בגובה + פיקוח ממונה-בטיחות',
        'ציוד-עיגון אישי (רתמה + חבל-עיגון)',
      ),
      riskAfter: ra(4, 1),
    },
    {
      hazard: 'התחשמלות — מתח-חי',
      scenario: 'מגע בכבל-הזנה חשוף או לוח-חשמל לא-מוגן באתר',
      existingControls: cs('לוחות-חשמל סגורים חלקית', '', ''),
      riskBefore: ra(4, 2),
      addedControls: cs(
        'הארקה + מפסק-פחת (RCD) + גידור-אזור-מתח',
        'נוהל-נעילה-ותיוג (LOTO) לפני-עבודה + הדרכת-חשמל',
        'כפפות-בידוד חשמלי',
      ),
      riskAfter: ra(4, 1),
    },
    {
      hazard: 'התמוטטות-דופן בחפירה',
      scenario: 'עובד בתעלה עמוקה ללא תמיכה — קריסת-קרקע וכיסוי',
      existingControls: cs('', 'סימון-שטח החפירה', ''),
      riskBefore: ra(4, 2),
      addedControls: cs(
        'דיפון / תמיכת-דפנות / שיפוע-מאושר',
        'נוהל-כניסה-לחפירה + פיקוח מהנדס-קרקע',
        '',
      ),
      riskAfter: ra(4, 1),
    },
    {
      hazard: 'ציוד-הרמה — נפילת-מטען',
      scenario: 'חבל-הרמה / ווי-עגורן מתנתק — מטען נופל על-עובד שמתחת',
      existingControls: cs('', 'הגבלת-כניסה לאזור-הרמה', 'קסדה'),
      riskBefore: ra(4, 2),
      addedControls: cs(
        'בדיקה-תקופתית של אמצעי-ריתוק (אישור מוסמך-הרמה)',
        'גידור-אוטומטי לאזור-ההרמה + נוהל-תיאום',
        '',
      ),
      riskAfter: ra(4, 1),
    },
    {
      hazard: 'חשיפה לאבק-סיליקה',
      scenario: 'עבודות-חציבה/ריסוס-בטון — שאיפת-אבק-סיליקה → פיברוזיס',
      existingControls: cs('', 'הגבלת-שהייה', ''),
      riskBefore: ra(3, 3),
      addedControls: cs(
        'מערכת-לחות/ריסוס-מים במקור (wet method) + שאיבה-מקומית',
        'נוהל-עבודה + ניטור-אבק תקופתי',
        'מסיכת-P3/FFP3',
      ),
      riskAfter: ra(3, 1),
    },
  ],
  manufacturing: [
    {
      hazard: 'מגע עם חלקים-נעים של מכונה',
      scenario: 'יד נכנסת לאזור-העבודה של המכונה בזמן-תנועה',
      existingControls: cs('מגן-מכונה חלקי', '', ''),
      riskBefore: ra(4, 3),
      addedControls: cs(
        'מגן-מכונה מלא + אינטרלוק-בטיחות (עצירה-בפתיחת-המגן)',
        'נוהל-הפעלה + הדרכה שנתית',
        '',
      ),
      riskAfter: ra(4, 1),
    },
    {
      hazard: 'חשיפה לרעש-תעסוקתי',
      scenario: 'עבודה ממושכת ליד מכונה רועשת — נזק-שמיעה מצטבר',
      existingControls: cs('', 'מדידת-רעש תקופתית', ''),
      riskBefore: ra(3, 3),
      addedControls: cs(
        'בידוד-אקוסטי למקור-הרעש (כיסוי/קופסת-בידוד)',
        'הגבלת-זמן-חשיפה + רוטציה ופיקוח',
        'אוזניות-הגנה (SNR מתאים)',
      ),
      riskAfter: ra(3, 1),
    },
    {
      hazard: 'חשיפה לחומר-מסוכן בתהליך',
      scenario: 'שאיפת-אדים מתהליך-ייצור ללא אוורור מספק',
      existingControls: cs('אוורור-כללי בחדר', '', ''),
      riskBefore: ra(3, 2),
      addedControls: cs(
        'מערכת-שאיבה-מקומית (LEV) ישירות למקור-הפליטה',
        'נוהל-עבודה + עלון-בטיחות (SDS) + הדרכה',
        'מסיכת-גז/אבק (בהתאם לחומר)',
      ),
      riskAfter: ra(3, 1),
    },
    {
      hazard: 'נעילה-ותיוג (LOTO) — הפעלה-בלתי-צפויה',
      scenario: 'הפעלת-מכונה בזמן תחזוקה/ניקוי → לכידת-איבר',
      existingControls: cs('', 'תיאום-עבודה בעל-פה', ''),
      riskBefore: ra(4, 2),
      addedControls: cs(
        'מנגנון-נעילה פיזי (LOTO kit) לאחד-על-לוח-הבקרה',
        'נוהל-LOTO כתוב + הדרכה + ביקורת-תקופתית',
        '',
      ),
      riskAfter: ra(4, 1),
    },
    {
      hazard: 'הרמה-ידנית ועומס-גב',
      scenario: 'הרמת-מטען כבד ידנית → פגיעת-גב מצטברת',
      existingControls: cs('', 'הדרכת-הרמה בסיסית', ''),
      riskBefore: ra(2, 3),
      addedControls: cs(
        'אמצעי-הרמה מכניים (עגלה / מלגזה-ידנית)',
        'הגבלת-משקל לאדם + רוטציה בין-עובדים',
        'חגורת-גב (תמיכה-בלבד, לא תחליף)',
      ),
      riskAfter: ra(2, 2),
    },
  ],
  electrical: [
    {
      hazard: 'התחשמלות ממתח-גבוה',
      scenario: 'מגע במוליך-חי בלוח/קו במהלך-תחזוקה',
      existingControls: cs('', 'נוהל-עבודה-חשמלית', ''),
      riskBefore: ra(4, 2),
      addedControls: cs(
        'ניתוק-מתח + הארקת-עבודה + נעילה-ותיוג (LOTO)',
        'אישור-עבודה + בדיקת-היעדר-מתח לפני-עבודה',
        'כפפות-בידוד + מגן-פנים (arc-rated)',
      ),
      riskAfter: ra(4, 1),
    },
    {
      hazard: 'קשת-חשמלית (Arc Flash)',
      scenario: 'פתיחת-לוח תחת-מתח → קשת-חשמלית וכוויות-קשות',
      existingControls: cs('מרחק-בטיחות', '', ''),
      riskBefore: ra(4, 2),
      addedControls: cs(
        'ניתוק-מתח מלא לפני-פתיחה + ברקרים-מוגנים',
        'נוהל-פתיחת-לוח + אישור-עבודה + תיוג-סכנה',
        'ציוד-arc-rated (חליפת-מגן/מגן-פנים/כפפות)',
      ),
      riskAfter: ra(4, 1),
    },
    {
      hazard: 'עבודה בגובה על עמוד/מתקן',
      scenario: 'נפילה מעמוד-חשמל או מגדל בזמן-טיפוס',
      existingControls: cs('סולם-טיפוס', '', 'קסדה'),
      riskBefore: ra(4, 2),
      addedControls: cs(
        'נקודות-עיגון מאושרות + מערכת-בלימת-נפילה (SRL)',
        'נוהל-עבודה-בגובה + פיקוח + אישור-עבודה',
        'רתמה מלאה + חבל-עיגון',
      ),
      riskAfter: ra(4, 1),
    },
    {
      hazard: 'עבודה בתא חשמלי סגור — חנק',
      scenario: 'כניסה לתא-חשמל עם ריכוז SF6/גז-חנק → אובדן-הכרה',
      existingControls: cs('', 'הגבלת-גישה לתא', ''),
      riskBefore: ra(4, 1),
      addedControls: cs(
        'מד-חמצן בכניסה (גלאי O₂) + אוורור לפני-כניסה',
        'נוהל-כניסה-לחלל-מוגבל + אדם-שומר-בחוץ',
        'מנשם-חמצן אוטונומי (SCBA)',
      ),
      riskAfter: ra(4, 1),
    },
  ],
  chemicals: [
    {
      hazard: 'שאיפת-אדים רעילים',
      scenario: 'חשיפה לאדי-ממס במילוי/עירוי ללא אוורור-מקומי',
      existingControls: cs('אוורור-כללי בחדר', '', ''),
      riskBefore: ra(4, 2),
      addedControls: cs(
        'מנדף / שאיבה-מקומית (LEV) ישירות למקור',
        'נוהל-עבודה + עלון-בטיחות (SDS) + הדרכה',
        'מסיכת-גז (פחמן-פעיל)',
      ),
      riskAfter: ra(4, 1),
    },
    {
      hazard: 'מגע-עור עם חומר-מאכל',
      scenario: 'התזת-חומר במהלך-העברה → כוויה כימית',
      existingControls: cs('אריזות-מקור סגורות', '', ''),
      riskBefore: ra(3, 2),
      addedControls: cs(
        'מערכת-העברה-סגורה + עמדת-שטיפת-חירום (15 דק.)',
        'נוהל-טיפול + הדרכה + עלון-SDS נגיש',
        'כפפות-כימיות + משקפי-מגן + סינר-מגן',
      ),
      riskAfter: ra(3, 1),
    },
    {
      hazard: 'אחסון-לקוי וסיכון-שריפה',
      scenario: 'אחסון חומרים-דליקים ללא הפרדה → התלקחות',
      existingControls: cs('', 'מחסן-ייעודי חלקי', ''),
      riskBefore: ra(4, 2),
      addedControls: cs(
        'ארון-אחסון-תקני (EN 14470) + הפרדת-חומרים לא-תואמים + גלאי-עשן',
        'נוהל-אחסון + ניהול-מלאי + ביקורת-תקופתית',
        '',
      ),
      riskAfter: ra(4, 1),
    },
    {
      hazard: 'דליפת כלי-לחץ / מיכל',
      scenario: 'כשל בצינור-לחץ → ריסוס חומר-מסוכן',
      existingControls: cs('', 'בדיקה-תקופתית שנתית', ''),
      riskBefore: ra(3, 2),
      addedControls: cs(
        'שסתומי-בטיחות (PRV) + בדיקת-NDT תקופתית + גלאי-דליפה',
        'נוהל-בדיקה + תכנית-חירום לדליפה',
        'מגן-פנים + ביגוד-כימי',
      ),
      riskAfter: ra(3, 1),
    },
  ],
  agriculture: [
    {
      hazard: 'התהפכות-טרקטור / ציוד-חקלאי',
      scenario: 'נסיעה בשטח-משופע → התהפכות ומעיכה',
      existingControls: cs('', 'נהיגה-זהירה', ''),
      riskBefore: ra(4, 2),
      addedControls: cs(
        'מבנה-הגנה-מפני-התהפכות (ROPS) + חגורת-בטיחות בטרקטור',
        'נוהל-נסיעה + מיפוי-שיפועים מסוכנים + הדרכה',
        'קסדה (לרוכב)',
      ),
      riskAfter: ra(4, 1),
    },
    {
      hazard: 'חשיפה לחומרי-הדברה',
      scenario: 'ריסוס ללא הגנה → שאיפה/ספיגה רעילה',
      existingControls: cs('', 'ריסוס בשעות-קרירות', ''),
      riskBefore: ra(3, 3),
      addedControls: cs(
        'ציוד-ריסוס-סגור (closed-cab) + פילטור-אוויר בקבינה',
        'נוהל-ריסוס + תקופות-המתנה (מנהלי) + גיליון-SDS',
        'ביגוד-ריסוס + מגן-פנים + כפפות-כימיות',
      ),
      riskAfter: ra(3, 1),
    },
    {
      hazard: 'עומס-חום (לחץ-חום)',
      scenario: 'עבודה ממושכת בשמש → התייבשות ומכת-חום',
      existingControls: cs('', 'הפסקות אוכל', ''),
      riskBefore: ra(3, 3),
      addedControls: cs(
        'הצללה ועמדות-מים באתר + קולר-מים נגיש',
        'נוהל-עבודה-בחום (משרד-העבודה) + הגבלת-שעות + ניטור עובדים',
        'כובע-שמש + ביגוד-קליל בהיר',
      ),
      riskAfter: ra(3, 2),
    },
    {
      hazard: 'כלים-חדים / מכסחות',
      scenario: 'מגע עם להב-מכסחה / גלגל-שיניים → חתך/קטיעה',
      existingControls: cs('מגן-חלקי', '', ''),
      riskBefore: ra(3, 2),
      addedControls: cs(
        'מגן-מלא על כל חלקי-הכלי הנעים + עצור-מיידי בפתיחת-המגן',
        'נוהל-הפעלה + ניתוק-לפני-ניקוי/תחזוקה',
        'כפפות-ניגוד-חתך + מגפיים-מוגנות',
      ),
      riskAfter: ra(3, 1),
    },
  ],
  logistics: [
    {
      hazard: 'פגיעת-מלגזה בהולך-רגל',
      scenario: 'מלגזה נעה במחסן פוגעת בעובד באזור-מעבר',
      existingControls: cs('', 'סימון-נתיבים צבעוני', ''),
      riskBefore: ra(4, 3),
      addedControls: cs(
        'הפרדה פיזית (מחסומים/שערים) בין מסלולי הולכי-רגל ומלגזות',
        'נוהל-תנועה + הדרכת-נהגים + פיקוח',
        'אפוד-ניראות',
      ),
      riskAfter: ra(4, 1),
    },
    {
      hazard: 'הרמה-ידנית ועומס-גב',
      scenario: 'הרמת-מטען כבד ידנית → פגיעת-גב מצטברת',
      existingControls: cs('', 'הדרכת-הרמה', ''),
      riskBefore: ra(2, 3),
      addedControls: cs(
        'אמצעי-הרמה מכניים (עגלת-יד / מלגזה-ידנית / מנוף)',
        'הגבלת-משקל (25 ק"ג לאדם) + נוהל-הרמה + רוטציה',
        '',
      ),
      riskAfter: ra(2, 2),
    },
    {
      hazard: 'נפילת-מטען ממדף-אחסון',
      scenario: 'מטען-לא-מאובטח נופל ממדף גבוה על-עובד',
      existingControls: cs('', 'מדפים מסומנים', ''),
      riskBefore: ra(3, 2),
      addedControls: cs(
        'עיגון-מדפים לרצפה/קיר + הגבלת-עומס מסומנת בכל-שלב',
        'נוהל-אחסון + בדיקה-תקופתית (בוחן-מוסמך)',
        'קסדה באזורי-סיכון',
      ),
      riskAfter: ra(3, 1),
    },
    {
      hazard: 'תנועת-כלי-רכב + הולכי-רגל',
      scenario: 'משאית נסועה ל/מהמחסן פוגעת בעובד בחצר',
      existingControls: cs('', 'אזורי-מעבר מסומנים', ''),
      riskBefore: ra(4, 2),
      addedControls: cs(
        'שערים + מחסומים פיזיים לאזורי-הרמה + מראות-פינות',
        'נוהל-כניסת-רכב + אדם-מנחה בכניסה',
        'אפוד-ניראות',
      ),
      riskAfter: ra(4, 1),
    },
  ],
  maintenance: [
    {
      hazard: 'הפעלה-בלתי-צפויה של ציוד',
      scenario: 'הפעלת-מכונה בזמן-תחזוקה → לכידת-איבר',
      existingControls: cs('', 'תיאום-עבודה בעל-פה', ''),
      riskBefore: ra(4, 2),
      addedControls: cs(
        'נעילה-ותיוג פיזי (LOTO kit) על לוח-הבקרה',
        'נוהל-LOTO כתוב + הדרכה + ביקורת-תקופתית',
        '',
      ),
      riskAfter: ra(4, 1),
    },
    {
      hazard: 'עבודה בגובה — סולם/מתקן',
      scenario: 'נפילה מסולם בזמן-תחזוקת-מתקן',
      existingControls: cs('סולם-תקני', '', 'קסדה'),
      riskBefore: ra(4, 2),
      addedControls: cs(
        'פיגום/במת-הרמה יציבה (עדיף על-סולם) + נקודות-עיגון',
        'נוהל-עבודה-בגובה + פיקוח ממונה-בטיחות',
        'רתמה מלאה + חבל-עיגון',
      ),
      riskAfter: ra(4, 1),
    },
    {
      hazard: 'התחשמלות בעבודת-חשמל',
      scenario: 'מגע-מתח בזמן-תחזוקת לוח/ציוד-חשמלי',
      existingControls: cs('', 'נוהל-חשמל כללי', ''),
      riskBefore: ra(4, 2),
      addedControls: cs(
        'ניתוק-מתח + הארקת-עבודה + נעילה-ותיוג (LOTO)',
        'בדיקת-היעדר-מתח לפני-עבודה + אישור-עבודה',
        'כפפות-בידוד חשמלי',
      ),
      riskAfter: ra(4, 1),
    },
    {
      hazard: 'חשיפה לחומרי-סיכה / חומרים-כימיים',
      scenario: 'מגע-עור עם שמנים/ממסים בתחזוקת-ציוד',
      existingControls: cs('', 'עלוני-SDS במחסן', ''),
      riskBefore: ra(2, 3),
      addedControls: cs(
        'עמדת-שטיפה + מיכלי-טפטוף (drip trays)',
        'נוהל-טיפול-בחומרים + הדרכה',
        'כפפות-נגד-כימיקלים + משקפי-מגן',
      ),
      riskAfter: ra(2, 2),
    },
  ],
  other: [
    {
      hazard: 'מעידה / החלקה / נפילה במישור',
      scenario: 'משטח-עבודה רטוב או לא-מסודר → מעידה ופציעה',
      existingControls: cs('', 'ניקיון-תקופתי', ''),
      riskBefore: ra(2, 3),
      addedControls: cs(
        'משטחים נגד-החלקה + תעלות-ניקוז (אם רלוונטי)',
        'נוהל-סדר-וניקיון (5S) + שילוט-אזהרה',
        'נעליים-נגד-החלקה',
      ),
      riskAfter: ra(2, 2),
    },
    {
      hazard: 'ארגונומיה — תנוחת-עבודה',
      scenario: 'עבודה ממושכת בתנוחה-לקויה → פגיעה-שלד-שרירית',
      existingControls: cs('ריהוט-בסיסי', '', ''),
      riskBefore: ra(2, 2),
      addedControls: cs(
        'התאמת-עמדה-ארגונומית (כיסא/שולחן/צג) + כלים-ארגונומיים',
        'הפסקות + רוטציה + הדרכה-ארגונומית',
        '',
      ),
      riskAfter: ra(2, 1),
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

  // שורת few-shot אחת — מדגימה את הפורמט המלא (ControlSet × RiskAssessment) + כיבוד-מדרג.
  const fewShot = `\
דוגמה לשורה-תקינה (פורמט-מטרה · אל תעתיק את-התוכן):
{
  "hazard": "עבודה בגובה — נפילת-אדם",
  "scenario": "עובד על קצה-קומה ללא מעקה תקני נופל לגובה",
  "existingControls": {
    "engineering": "מעקה-זמני חלקי",
    "administrative": "",
    "ppe": "קסדה"
  },
  "riskBefore": { "severity": 4, "probability": 3 },
  "addedControls": {
    "engineering": "התקנת מעקה-תקני קבוע + מערכת-עיגון ונקודות-קשירה",
    "administrative": "נוהל-עבודה-בגובה + פיקוח ממונה-בטיחות",
    "ppe": "ציוד-עיגון אישי (רתמה + חבל-עיגון)"
  },
  "riskAfter": { "severity": 4, "probability": 1 },
  "owner": "מנהל-עבודה",
  "due": "",
  "status": "open"
}`;

  return (
    `## פרופיל-האתר (אמיתי · נסקר ע"י הלומד)\n` +
    `שם: "${site.name}"\n` +
    `ענף: ${site.sector}\n` +
    `מספר-עובדים: ${site.workerCount}\n\n` +
    `## מפגעים-שהלומד ציין בשטח\n${observed}\n\n` +
    `## מפגעים-טיפוסיים-לענף לבדיקה (הצע אם רלוונטי לאתר)\n${expectedText}\n\n` +
    `${fewShot}\n\n` +
    `החזר { "rows": JsaRow[] } — 10-12 שורות · בלי id · riskAfter < riskBefore · ` +
    `addedControls.engineering/administrative לא ריקים בשורות אדום/צהוב · צמ"א-אחרון תמיד.`
  );
}

// ---------------------------------------------------------------------------
// 4. isValidJsaRowArray — ולידציה על תגובת-Claude (פורמט-עשיר)
// ---------------------------------------------------------------------------

function isSeverityLevel(x: unknown): x is SeverityLevel {
  return x === 1 || x === 2 || x === 3 || x === 4;
}

function isValidControlSet(x: unknown): x is ControlSet {
  if (!x || typeof x !== 'object') return false;
  const c = x as Record<string, unknown>;
  return (
    typeof c['engineering'] === 'string' &&
    typeof c['administrative'] === 'string' &&
    typeof c['ppe'] === 'string'
  );
}

function isValidRiskAssessment(x: unknown): x is RiskAssessment {
  if (!x || typeof x !== 'object') return false;
  const a = x as Record<string, unknown>;
  return isSeverityLevel(a['severity']) && isSeverityLevel(a['probability']);
}

/**
 * isValidJsaRowArray — type-guard: מאמת ש-x הוא JsaRow[] מלא (**פורמט-עשיר**).
 *
 * כל שורה חייבת:
 *   - id, hazard, scenario, owner — strings לא-ריקים (id מוזרק ע"י action לפני ולידציה).
 *   - existingControls, addedControls — ControlSet { engineering, administrative, ppe }.
 *   - riskBefore, riskAfter — RiskAssessment { severity, probability } (1-4).
 *   - status — "open" | "in_progress" | "done" (רשות · default "open").
 *   - due — string (רשות).
 *
 * ⚠️ משמש את ה-action *אחרי* הזרקת-ה-id — לכן דורש id-string.
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
    if (typeof r['owner'] !== 'string') return false;

    // existingControls / addedControls — חייבים להיות ControlSet
    if (!isValidControlSet(r['existingControls'])) return false;
    if (!isValidControlSet(r['addedControls'])) return false;

    // riskBefore / riskAfter — חייבים להיות RiskAssessment
    if (!isValidRiskAssessment(r['riskBefore'])) return false;
    if (!isValidRiskAssessment(r['riskAfter'])) return false;

    // status — רשות; אם קיים חייב להיות ערך-חוקי
    if (
      r['status'] !== undefined &&
      r['status'] !== 'open' &&
      r['status'] !== 'in_progress' &&
      r['status'] !== 'done'
    ) {
      return false;
    }

    // due — רשות; אם קיים חייב להיות string
    if (r['due'] !== undefined && typeof r['due'] !== 'string') return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// 5. buildDeterministicJsaDraft — fallback בלי-Claude (פורמט-עשיר)
// ---------------------------------------------------------------------------

const DEFAULT_OWNER = 'מנהל-עבודה';

/**
 * buildDeterministicJsaDraft — בונה טיוטת-JSA שלמה ללא-LLM (**פורמט-עשיר**).
 *
 * הלוגיקה:
 *   1. מתחיל מהמפגעים-שהלומד ציין (mainHazards) → שורת-שלד פר-מפגע (best-fit לענף).
 *   2. משלים משלד-הענף (SECTOR_SKELETONS) עד לכיסוי-מינימלי (≥3 שורות),
 *      בלי לשכפל מפגעים-שכבר-כוסו.
 *   3. כל שורה: ControlSet מדויק לפי-מדרג (engineering/administrative לפחות בבקרות-נוספות) ·
 *      riskBefore/riskAfter · status="open" · owner=מנהל-עבודה · id מ-crypto.randomUUID.
 *
 * @param site פרופיל-האתר.
 * @returns    JsaRow[] (≥1 שורה תמיד).
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
    const fallbackSkeleton: HazardSkeleton = SECTOR_SKELETONS.other[0] ?? {
      hazard: 'מפגע-כללי',
      scenario: 'תרחיש-התממשות לבדיקה מול האתר',
      existingControls: cs('בקרות-הנדסיות בסיסיות', '', ''),
      riskBefore: ra(2, 2),
      addedControls: cs('בקרה-הנדסית לפי-מדרג', 'נוהל-עבודה + הדרכה', ''),
      riskAfter: ra(2, 1),
    };
    rows.push(skeletonToRow(fallbackSkeleton));
  }

  return rows;
}

// ---------------------------------------------------------------------------
// helpers פנימיים
// ---------------------------------------------------------------------------

/** ממיר שלד-מפגע (עשיר) לשורת-JSA מלאה עם id. */
function skeletonToRow(s: HazardSkeleton): JsaRow {
  return {
    ...emptyJsaRow(crypto.randomUUID()),
    hazard: s.hazard,
    scenario: s.scenario,
    existingControls: { ...s.existingControls },
    riskBefore: { ...s.riskBefore },
    addedControls: { ...s.addedControls },
    riskAfter: { ...s.riskAfter },
    owner: DEFAULT_OWNER,
    due: '',
    status: 'open',
  };
}

/**
 * genericRowForHazard — שורת-שלד בטוחה למפגע-חופשי שלא-תואם-שלד-ענף.
 *
 * riskBefore = 3×3 = 9 (צהוב · לא-קביל) → מדרבן את-הלומד לבדוק ולהוסיף-בקרות.
 * addedControls כולל engineering + administrative (לא ppe-בלבד).
 */
function genericRowForHazard(hazard: string): JsaRow {
  void riskBand(riskLevel(3, 3)); // 9 = צהוב
  return {
    ...emptyJsaRow(crypto.randomUUID()),
    hazard,
    scenario: `תרחיש-התממשות עבור "${hazard}" — לתיאור ואימות מול האתר.`,
    existingControls: emptyControlSet(),
    riskBefore: ra(3, 3),
    addedControls: cs(
      'בקרה-הנדסית לפי-מדרג (לבחון: חיסול/החלפה/מיגון/שאיבה)',
      'נוהל-עבודה + הדרכה + פיקוח',
      '',
    ),
    riskAfter: ra(3, 1),
    owner: DEFAULT_OWNER,
    due: '',
    status: 'open',
  };
}

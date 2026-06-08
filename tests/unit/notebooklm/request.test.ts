/**
 * tests/unit/notebooklm/request.test.ts — בדיקות יחידה ל-buildScenarioExpansionRequest.
 *
 * בדיקות טהורות לחלוטין: אפס IO, אפס Gemini, אפס DB.
 * כוסוי: (1) הנחיה להרחבה (לא-סיכום), (2) שמות-3-חלקים בפלט,
 *        (3) מחרוזת-JSON-דוגמה, (4) רמז-scope (פיגום → 2.1/2.2).
 */
import { describe, it, expect } from 'vitest';
import {
  buildScenarioExpansionRequest,
  SCENARIO_EXPANSION_SYSTEM,
  type ScenarioRequestItem,
} from '@/lib/notebooklm/request';

// ── נתוני-עזר ──────────────────────────────────────────────────────────────

/** תרחיש LOTO (חשמל/פניאומטיקה) — scope 2.4/2.4.1. */
const LOTO_SCENARIO: ScenarioRequestItem = {
  title: 'האנרגיה הבלתי-נראית (LOTO מורחב)',
  background: 'איש אחזקה ביצע נעילת LOTO על מפסק החשמל הראשי. זרוע פניאומטית השתחררה בפתאומיות.',
  task: 'נתח את האירוע: פעולה מיידית, גיבוי חוקי, הנדסה וניהול.',
  solution:
    '**פעולה מיידית:** חילוץ.\n**גיבוי חוקי:** פקודת הבטיחות בעבודה.\n**הנדסה וניהול:** נוהל LOTO מלא.',
};

/** תרחיש פיגום (עבודה בגובה + עבודות בנייה) — scope 2.1/2.2 — לבדיקת רמז-scope. */
const SCAFFOLD_SCENARIO: ScenarioRequestItem = {
  title: 'הגלגלים המעופפים (עבודה בגובה)',
  background: 'שני עובדים עמדו על פיגום נייד בגובה 4 מטרים. עובד שלישי דחף את הפיגום כשהם למעלה.',
  task: 'נתח את האירוע: פעולה מיידית, גיבוי חוקי, הנדסה וניהול.',
  solution:
    '**פעולה מיידית:** הורדת עובדים.\n**גיבוי חוקי:** תקנות עבודה בגובה.\n**הנדסה וניהול:** בלמי גלגלים.',
};

/** תרחיש חומרים מסוכנים — scope 4.4. */
const HAZMAT_SCENARIO: ScenarioRequestItem = {
  title: 'שלולית מסתורית (חומרים מסוכנים)',
  background: 'מכל IBC של 1000 ליטר נוזל שקוף זולג לביוב העירוני ללא מאצרה.',
  task: 'נתח את האירוע: פעולה מיידית, גיבוי חוקי, הנדסה וניהול.',
  solution:
    '**פעולה מיידית:** ריחוק.\n**גיבוי חוקי:** חוק החומרים המסוכנים.\n**הנדסה וניהול:** מאצרה.',
};

// ── עזר ────────────────────────────────────────────────────────────────────

function buildSingle(scenario = LOTO_SCENARIO): string {
  return buildScenarioExpansionRequest([scenario]);
}

function buildMulti(): string {
  return buildScenarioExpansionRequest([LOTO_SCENARIO, SCAFFOLD_SCENARIO, HAZMAT_SCENARIO]);
}

// ── בדיקות ─────────────────────────────────────────────────────────────────

describe('SCENARIO_EXPANSION_SYSTEM', () => {
  it('מכיל הנחיה להרחיב ולא לסכם', () => {
    expect(SCENARIO_EXPANSION_SYSTEM).toContain('להרחיב');
    expect(SCENARIO_EXPANSION_SYSTEM).not.toContain('לסכם');
  });

  it('מכיל כלל אנטי-הזיה (ציטוט מילולי)', () => {
    expect(SCENARIO_EXPANSION_SYSTEM).toMatch(/ציטוט.*מילולי|מילולי.*ציטוט/);
  });
});

describe('buildScenarioExpansionRequest — תרחיש-בודד', () => {
  it('מכיל "להרחיב" ולא "לסכם"', () => {
    const prompt = buildSingle();
    expect(prompt).toContain('להרחיב');
    expect(prompt).not.toMatch(/\bלסכם\b/);
  });

  it('מכיל את שלושת שמות-החלקים', () => {
    const prompt = buildSingle();
    expect(prompt).toContain('immediateAction');
    expect(prompt).toContain('legalBackup');
    expect(prompt).toContain('engineeringMgmt');
  });

  it('מכיל מחרוזת-JSON-דוגמה (כולל batch ו-contentType)', () => {
    const prompt = buildSingle();
    expect(prompt).toContain('"batch"');
    expect(prompt).toContain('"contentType"');
    expect(prompt).toContain('"scenario_expansion"');
    expect(prompt).toContain('"items"');
  });

  it('מכיל את כותרת-התרחיש בגוף ה-prompt', () => {
    const prompt = buildSingle();
    expect(prompt).toContain(LOTO_SCENARIO.title);
  });

  it('מכיל הנחייה שlegalBackup חייב ציטוט (G4)', () => {
    const prompt = buildSingle();
    expect(prompt).toMatch(/legalBackup.*citations|citations.*legalBackup/s);
  });
});

describe('buildScenarioExpansionRequest — רמז-scope', () => {
  it('פיגום/עבודה בגובה → רמז-scope כולל 2.1 או 2.2', () => {
    const prompt = buildScenarioExpansionRequest([SCAFFOLD_SCENARIO]);
    // matchScopeKeywords אמורה למצוא hit ל-2.1 (רתמה/סולם/פיגום) ו/או 2.2 (עבודות בנייה)
    const hasScopeHint = prompt.includes('2.1') || prompt.includes('2.2');
    expect(hasScopeHint).toBe(true);
  });

  it('תרחיש LOTO (מתקן חי / נעילה ותיוג) → רמז-scope כולל 2.4 או 2.4.1', () => {
    const prompt = buildSingle(LOTO_SCENARIO);
    // "LOTO" / "נעילה ותיוג" → 2.4.1
    const hasScopeHint = prompt.includes('2.4') || prompt.includes('2.4.1');
    expect(hasScopeHint).toBe(true);
  });

  it('תרחיש חומ"ס → רמז-scope כולל 4.4', () => {
    const prompt = buildScenarioExpansionRequest([HAZMAT_SCENARIO]);
    expect(prompt).toContain('4.4');
  });
});

describe('buildScenarioExpansionRequest — ריבוי-תרחישים', () => {
  it('מכיל את כל 3 כותרות-התרחישים', () => {
    const prompt = buildMulti();
    expect(prompt).toContain(LOTO_SCENARIO.title);
    expect(prompt).toContain(SCAFFOLD_SCENARIO.title);
    expect(prompt).toContain(HAZMAT_SCENARIO.title);
  });

  it('הנחיית-סיום מציינת את מספר ה-items', () => {
    const prompt = buildMulti();
    expect(prompt).toContain('items[3]');
  });

  it('מספר התרחישים מוצג בכותרת-הסעיף', () => {
    const prompt = buildMulti();
    expect(prompt).toContain('3 סה"כ');
  });
});

describe('buildScenarioExpansionRequest — הגנות-קלט', () => {
  it('זורק שגיאה על מערך-ריק', () => {
    expect(() => buildScenarioExpansionRequest([])).toThrow();
  });

  it('מחזיר string (לא null/undefined)', () => {
    const result = buildSingle();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(100);
  });
});

describe('buildScenarioExpansionRequest — ניקיון PII', () => {
  it('הדוגמה-העובדת אינה מכילה שמות אנשים אמיתיים', () => {
    const prompt = buildSingle();
    // הדוגמה העובדת אינה אמורה להכיל שמות פרטיים נפוצים
    // הבדיקה ודאית: הדוגמה "נפילה מפיגום" לא כוללת שמות
    expect(prompt).not.toMatch(/\b(ישראל ישראלי|אבי|שמואל)\b/);
  });
});

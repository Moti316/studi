/**
 * tests/unit/notebooklm/map-scenario.test.ts
 *
 * Unit tests for mapScenario (pure mapping — no DB, no AI, no I/O).
 *
 * Asserts:
 * - builds a valid NewScenario with the correct Markdown solution (3 bold headers),
 *   status='מוסקנא', scopeRefs from parameter, and sourceRef passed through.
 * - throws on an invalid rubric (wrong shape / empty).
 * - throws on an empty sourceRef.
 */

import { describe, it, expect } from 'vitest';
import { mapScenario } from '@/lib/notebooklm/map-scenario';
import type { ParsedScenarioExpansion } from '@/lib/notebooklm/parse-output';

type ParsedItem = ParsedScenarioExpansion['items'][number];

const VALID_RUBRIC = [
  { criterion: 'זיהוי הסיכון', points: 1 },
  { criterion: 'פעולה מיידית נכונה', points: 1 },
  { criterion: 'ציטוט חקיקה מדויק', points: 1 },
];

function makeItem(over: Partial<ParsedItem> = {}): ParsedItem {
  return {
    title: 'עבודה בגובה ללא מעקה',
    background: 'פועל עומד על קצה פיגום בגובה 5 מ׳ ללא מעקה מגן.',
    data: null,
    task: 'נתח את האירוע: פעולה מיידית, גיבוי חוקי, הנדסה וניהול.',
    solution: {
      immediateAction: {
        text: 'הפסקת עבודה מיידית והרחקת העובד מאזור הסיכון.',
        citations: [],
      },
      legalBackup: {
        text: 'הפרת תקנה 6 לתקנות הבטיחות בעבודה (עבודות בנייה).',
        citations: [{ scopeId: '2.1', quote: 'לא תבוצע עבודה בגובה ללא מעקה', section: 'תקנה 6' }],
      },
      engineeringMgmt: {
        text: 'התקנת מעקה תקני לאורך קצה הפיגום לפני חידוש העבודה.',
        citations: [],
      },
    },
    rubric: VALID_RUBRIC,
    ...over,
  };
}

const SCOPE_REFS = [{ id: '2.1', confidence: 1 }];
const SOURCE_REF = 'scn:abc123:0';

describe('mapScenario — NewScenario תקין', () => {
  it('בונה NewScenario עם שלוש הכותרות המודגשות ב-solution', () => {
    const row = mapScenario(makeItem(), SOURCE_REF, SCOPE_REFS);

    expect(row.solution).toContain('**פעולה מיידית:**');
    expect(row.solution).toContain('**גיבוי חוקי:**');
    expect(row.solution).toContain('**הנדסה וניהול:**');
    expect(row.solution).toContain('הפסקת עבודה מיידית');
    expect(row.solution).toContain('הפרת תקנה 6');
    expect(row.solution).toContain('התקנת מעקה תקני');
  });

  it('מחזיר status=מוסקנא תמיד', () => {
    const row = mapScenario(makeItem(), SOURCE_REF, SCOPE_REFS);
    expect(row.status).toBe('מוסקנא');
  });

  it('מחזיר scopeRefs מהפרמטר', () => {
    const customRefs = [
      { id: '2.1', confidence: 1 },
      { id: '2.2', confidence: 0.9 },
    ];
    const row = mapScenario(makeItem(), SOURCE_REF, customRefs);
    expect(row.scopeRefs).toEqual(customRefs);
  });

  it('מחזיר sourceRef מהפרמטר', () => {
    const row = mapScenario(makeItem(), 'scn:xyz:5', SCOPE_REFS);
    expect(row.sourceRef).toBe('scn:xyz:5');
  });

  it('מעביר title/background/task/data בלי שינוי', () => {
    const item = makeItem({ data: 'גובה: 5 מ׳' });
    const row = mapScenario(item, SOURCE_REF, SCOPE_REFS);

    expect(row.title).toBe(item.title);
    expect(row.background).toBe(item.background);
    expect(row.task).toBe(item.task);
    expect(row.data).toBe('גובה: 5 מ׳');
  });

  it('ממיר data=undefined ל-null', () => {
    const item = makeItem({ data: undefined });
    const row = mapScenario(item, SOURCE_REF, SCOPE_REFS);
    expect(row.data).toBeNull();
  });

  it('לא קובע difficulty (undefined)', () => {
    const row = mapScenario(makeItem(), SOURCE_REF, SCOPE_REFS);
    expect(row.difficulty).toBeUndefined();
  });

  it('מחזיר rubric ישירות מה-parsed item', () => {
    const row = mapScenario(makeItem(), SOURCE_REF, SCOPE_REFS);
    expect(row.rubric).toEqual(VALID_RUBRIC);
  });

  it('פורמט solution מלא עם הפרדות-שורה כפולות', () => {
    const row = mapScenario(makeItem(), SOURCE_REF, SCOPE_REFS);
    // שתי שורות ריקות בין כל חלק
    expect(row.solution).toMatch(/\*\*פעולה מיידית:\*\*.*\n\n\*\*גיבוי חוקי:\*\*/s);
    expect(row.solution).toMatch(/\*\*גיבוי חוקי:\*\*.*\n\n\*\*הנדסה וניהול:\*\*/s);
  });
});

describe('mapScenario — rubric פסול זורק', () => {
  it('זורק כשרשימה ריקה', () => {
    expect(() => mapScenario(makeItem({ rubric: [] }), SOURCE_REF, SCOPE_REFS)).toThrow(/rubric/i);
  });

  it('זורק כשמבנה שגוי (חסר criterion)', () => {
    const badRubric = [{ points: 1 }] as unknown as typeof VALID_RUBRIC;
    expect(() => mapScenario(makeItem({ rubric: badRubric }), SOURCE_REF, SCOPE_REFS)).toThrow(
      /rubric/i,
    );
  });

  it('זורק כשמבנה שגוי (חסר points)', () => {
    const badRubric = [{ criterion: 'בדיקה' }] as unknown as typeof VALID_RUBRIC;
    expect(() => mapScenario(makeItem({ rubric: badRubric }), SOURCE_REF, SCOPE_REFS)).toThrow(
      /rubric/i,
    );
  });

  it('זורק כש-rubric אינו מערך', () => {
    const badRubric = 'not an array' as unknown as typeof VALID_RUBRIC;
    expect(() => mapScenario(makeItem({ rubric: badRubric }), SOURCE_REF, SCOPE_REFS)).toThrow(
      /rubric/i,
    );
  });
});

describe('mapScenario — sourceRef ריק זורק', () => {
  it('זורק כש-sourceRef מחרוזת ריקה', () => {
    expect(() => mapScenario(makeItem(), '', SCOPE_REFS)).toThrow(/sourceRef/i);
  });

  it('זורק כש-sourceRef רק רווחים', () => {
    expect(() => mapScenario(makeItem(), '   ', SCOPE_REFS)).toThrow(/sourceRef/i);
  });
});

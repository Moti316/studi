/**
 * tests/unit/notebooklm/parse-output.test.ts
 *
 * בדיקות יחידה ל-parseNotebookLmOutput ו-stripJsonFences (ללא db/fs/I/O).
 *
 * מכסה:
 * - JSON תקין (עם ובלי code fences) עובר ומחזיר NotebookLmBatch מוקלד.
 * - envelope חסר-items זורק.
 * - items=[] זורק.
 * - item ללא solution.legalBackup זורק.
 * - rubric ריק/פסול זורק.
 * - ציטוט עם section אופציונלי עובר.
 * - JSON לא-תקין זורק.
 * - שדות-envelope חסרים (batch/contentType) זורקים.
 */

import { describe, it, expect } from 'vitest';
import {
  stripJsonFences,
  parseNotebookLmOutput,
  type NotebookLmBatch,
  type ParsedScenarioItem,
  type CitationInput,
} from '@/lib/notebooklm/parse-output';

// ---------------------------------------------------------------------------
// נתוני-עזר
// ---------------------------------------------------------------------------

const VALID_CITATION: CitationInput = {
  scopeId: '2.1',
  quote: 'לא יבצע אדם עבודה בגובה אלא אם כן הוסמך',
  section: 'תקנה 2',
};

const VALID_CITATION_NO_SECTION: CitationInput = {
  scopeId: '2.3',
  quote: 'מחזיק במקום עבודה יספק לעובד ציוד מגן אישי מתאים',
};

function makeItem(over: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    sourceRef: 'scn:abc123:0',
    title: 'עבודה בגובה ללא מעקה',
    background: 'פועל עומד על קצה פיגום בגובה 5 מ׳ ללא מעקה מגן.',
    data: null,
    task: 'נתח את האירוע: פעולה מיידית, גיבוי חוקי, הנדסה וניהול.',
    solution: {
      immediateAction: {
        text: 'הפסקת עבודה מיידית.',
        citations: [],
      },
      legalBackup: {
        text: 'הפרת תקנה 6 לתקנות הבטיחות בעבודה.',
        citations: [VALID_CITATION],
      },
      engineeringMgmt: {
        text: 'התקנת מעקה תקני.',
        citations: [],
      },
    },
    rubric: [
      { criterion: 'זיהוי הסיכון', points: 1 },
      { criterion: 'פעולה מיידית נכונה', points: 1 },
      { criterion: 'ציטוט חקיקה מדויק', points: 1 },
    ],
    ...over,
  };
}

function makeBatch(itemsOverride?: unknown[]): Record<string, unknown> {
  return {
    batch: 'scenarios-expand',
    contentType: 'scenario_expansion',
    items: itemsOverride ?? [makeItem()],
  };
}

function toJson(obj: unknown): string {
  return JSON.stringify(obj);
}

// ---------------------------------------------------------------------------
// stripJsonFences
// ---------------------------------------------------------------------------

describe('stripJsonFences', () => {
  it('מחזיר מחרוזת נקייה ללא fences כפי-שהיא', () => {
    const raw = '{"a":1}';
    expect(stripJsonFences(raw)).toBe('{"a":1}');
  });

  it('מסיר עטיפת ```json\\n...\\n```', () => {
    const raw = '```json\n{"a":1}\n```';
    expect(stripJsonFences(raw)).toBe('{"a":1}');
  });

  it('מסיר עטיפת ``` ללא שם-שפה', () => {
    const raw = '```\n{"a":1}\n```';
    expect(stripJsonFences(raw)).toBe('{"a":1}');
  });

  it('מנרמל רווחים-קצוות', () => {
    const raw = '   {"a":1}   ';
    expect(stripJsonFences(raw)).toBe('{"a":1}');
  });
});

// ---------------------------------------------------------------------------
// parseNotebookLmOutput — JSON תקין
// ---------------------------------------------------------------------------

describe('parseNotebookLmOutput — JSON תקין עובר', () => {
  it('מנתח batch תקין ומחזיר NotebookLmBatch עם items', () => {
    const result: NotebookLmBatch = parseNotebookLmOutput(toJson(makeBatch()));
    expect(result.batch).toBe('scenarios-expand');
    expect(result.contentType).toBe('scenario_expansion');
    expect(result.items).toHaveLength(1);
  });

  it('מחזיר item עם כל השדות הנדרשים', () => {
    const result = parseNotebookLmOutput(toJson(makeBatch()));
    const item: ParsedScenarioItem = result.items[0]!;

    expect(item.title).toBe('עבודה בגובה ללא מעקה');
    expect(item.background).toContain('פועל עומד');
    expect(item.task).toContain('נתח את האירוע');
    expect(item.data).toBeNull();
    expect(item.sourceRef).toBe('scn:abc123:0');
  });

  it('מנתח solution עם 3 חלקים', () => {
    const result = parseNotebookLmOutput(toJson(makeBatch()));
    const { solution } = result.items[0]!;

    expect(solution.immediateAction.text).toContain('הפסקת עבודה');
    expect(solution.legalBackup.text).toContain('הפרת תקנה');
    expect(solution.engineeringMgmt.text).toContain('התקנת מעקה');
  });

  it('מנתח ציטוט עם section אופציונלי', () => {
    const result = parseNotebookLmOutput(toJson(makeBatch()));
    const citations = result.items[0]!.solution.legalBackup.citations;

    expect(citations).toHaveLength(1);
    expect(citations[0]!.scopeId).toBe('2.1');
    expect(citations[0]!.quote).toContain('לא יבצע אדם');
    expect(citations[0]!.section).toBe('תקנה 2');
  });

  it('ציטוט ללא section עובר (section אופציונלי)', () => {
    const itemWithoutSection = makeItem({
      solution: {
        immediateAction: { text: 'פעולה מיידית', citations: [] },
        legalBackup: {
          text: 'גיבוי חוקי',
          citations: [VALID_CITATION_NO_SECTION],
        },
        engineeringMgmt: { text: 'הנדסה וניהול', citations: [] },
      },
    });
    const result = parseNotebookLmOutput(toJson(makeBatch([itemWithoutSection])));
    const citation = result.items[0]!.solution.legalBackup.citations[0]!;

    expect(citation.section).toBeUndefined();
    expect(citation.scopeId).toBe('2.3');
  });

  it('עובר עם code fences (```json)', () => {
    const json = toJson(makeBatch());
    const fenced = '```json\n' + json + '\n```';
    const result = parseNotebookLmOutput(fenced);
    expect(result.items).toHaveLength(1);
  });

  it('עובר עם code fences ללא שם-שפה', () => {
    const json = toJson(makeBatch());
    const fenced = '```\n' + json + '\n```';
    const result = parseNotebookLmOutput(fenced);
    expect(result.batch).toBe('scenarios-expand');
  });

  it('sourceRef אופציונלי — עובר כש-sourceRef חסר', () => {
    const itemNoRef = makeItem({ sourceRef: undefined });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (itemNoRef as any)['sourceRef'];
    const result = parseNotebookLmOutput(toJson(makeBatch([itemNoRef])));
    expect(result.items[0]!.sourceRef).toBeUndefined();
  });

  it('data אופציונלי — עובר כש-data חסר', () => {
    const itemNoData = makeItem();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (itemNoData as any)['data'];
    const result = parseNotebookLmOutput(toJson(makeBatch([itemNoData])));
    expect(result.items[0]!.data).toBeUndefined();
  });

  it('data=null עובר ומוחזר כ-null', () => {
    const result = parseNotebookLmOutput(toJson(makeBatch()));
    expect(result.items[0]!.data).toBeNull();
  });

  it('rubric עם ≥1 קריטריון עובר', () => {
    const result = parseNotebookLmOutput(toJson(makeBatch()));
    expect(result.items[0]!.rubric).toHaveLength(3);
    expect(result.items[0]!.rubric[0]!.criterion).toBe('זיהוי הסיכון');
    expect(result.items[0]!.rubric[0]!.points).toBe(1);
  });

  it('items עם מרובה תרחישים עובר', () => {
    const batch = makeBatch([makeItem(), makeItem({ title: 'תרחיש שני', sourceRef: 'scn:abc:1' })]);
    const result = parseNotebookLmOutput(toJson(batch));
    expect(result.items).toHaveLength(2);
    expect(result.items[1]!.title).toBe('תרחיש שני');
  });
});

// ---------------------------------------------------------------------------
// parseNotebookLmOutput — שגיאות-מבנה
// ---------------------------------------------------------------------------

describe('parseNotebookLmOutput — שגיאות-מבנה זורקות', () => {
  it('JSON לא-תקין זורק עם הסבר JSON.parse', () => {
    expect(() => parseNotebookLmOutput('{ not valid json }')).toThrow(/JSON\.parse/i);
  });

  it('envelope ללא שדה items זורק', () => {
    const noItems = { batch: 'x', contentType: 'scenario_expansion' };
    expect(() => parseNotebookLmOutput(toJson(noItems))).toThrow(/items/);
  });

  it('envelope עם items=[] זורק', () => {
    expect(() => parseNotebookLmOutput(toJson(makeBatch([])))).toThrow(/items/);
  });

  it('envelope ללא batch זורק', () => {
    const noBatch = { contentType: 'scenario_expansion', items: [makeItem()] };
    expect(() => parseNotebookLmOutput(toJson(noBatch))).toThrow(/batch/);
  });

  it('envelope ללא contentType זורק', () => {
    const noContentType = { batch: 'x', items: [makeItem()] };
    expect(() => parseNotebookLmOutput(toJson(noContentType))).toThrow(/contentType/);
  });

  it('item ללא title זורק', () => {
    const bad = makeItem({ title: undefined });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (bad as any)['title'];
    expect(() => parseNotebookLmOutput(toJson(makeBatch([bad])))).toThrow(/title/);
  });

  it('item ללא background זורק', () => {
    const bad = makeItem({ background: undefined });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (bad as any)['background'];
    expect(() => parseNotebookLmOutput(toJson(makeBatch([bad])))).toThrow(/background/);
  });

  it('item ללא task זורק', () => {
    const bad = makeItem({ task: undefined });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (bad as any)['task'];
    expect(() => parseNotebookLmOutput(toJson(makeBatch([bad])))).toThrow(/task/);
  });

  it('item ללא solution.legalBackup זורק', () => {
    const badItem = makeItem({
      solution: {
        immediateAction: { text: 'טקסט', citations: [] },
        // legalBackup חסר
        engineeringMgmt: { text: 'טקסט', citations: [] },
      },
    });
    expect(() => parseNotebookLmOutput(toJson(makeBatch([badItem])))).toThrow(/legalBackup/);
  });

  it('item ללא solution.immediateAction זורק', () => {
    const badItem = makeItem({
      solution: {
        // immediateAction חסר
        legalBackup: { text: 'טקסט', citations: [VALID_CITATION] },
        engineeringMgmt: { text: 'טקסט', citations: [] },
      },
    });
    expect(() => parseNotebookLmOutput(toJson(makeBatch([badItem])))).toThrow(/immediateAction/);
  });

  it('item ללא solution.engineeringMgmt זורק', () => {
    const badItem = makeItem({
      solution: {
        immediateAction: { text: 'טקסט', citations: [] },
        legalBackup: { text: 'טקסט', citations: [VALID_CITATION] },
        // engineeringMgmt חסר
      },
    });
    expect(() => parseNotebookLmOutput(toJson(makeBatch([badItem])))).toThrow(/engineeringMgmt/);
  });

  it('rubric=[] (מערך-ריק) זורק', () => {
    const bad = makeItem({ rubric: [] });
    expect(() => parseNotebookLmOutput(toJson(makeBatch([bad])))).toThrow(/rubric/);
  });

  it('rubric עם item חסר criterion זורק', () => {
    const bad = makeItem({ rubric: [{ points: 1 }] });
    expect(() => parseNotebookLmOutput(toJson(makeBatch([bad])))).toThrow(/criterion/);
  });

  it('rubric עם item חסר points זורק', () => {
    const bad = makeItem({ rubric: [{ criterion: 'בדיקה' }] });
    expect(() => parseNotebookLmOutput(toJson(makeBatch([bad])))).toThrow(/points/);
  });

  it('rubric עם points שאינו number זורק', () => {
    const bad = makeItem({ rubric: [{ criterion: 'בדיקה', points: '1' }] });
    expect(() => parseNotebookLmOutput(toJson(makeBatch([bad])))).toThrow(/points/);
  });

  it('ציטוט ללא scopeId זורק', () => {
    const badCitation = { quote: 'ציטוט ארוך מספיק לבדיקה' };
    const bad = makeItem({
      solution: {
        immediateAction: { text: 'טקסט', citations: [] },
        legalBackup: { text: 'טקסט', citations: [badCitation] },
        engineeringMgmt: { text: 'טקסט', citations: [] },
      },
    });
    expect(() => parseNotebookLmOutput(toJson(makeBatch([bad])))).toThrow(/scopeId/);
  });

  it('ציטוט ללא quote זורק', () => {
    const badCitation = { scopeId: '2.1' };
    const bad = makeItem({
      solution: {
        immediateAction: { text: 'טקסט', citations: [] },
        legalBackup: { text: 'טקסט', citations: [badCitation] },
        engineeringMgmt: { text: 'טקסט', citations: [] },
      },
    });
    expect(() => parseNotebookLmOutput(toJson(makeBatch([bad])))).toThrow(/quote/);
  });

  it('solution שאינו אובייקט זורק', () => {
    const bad = makeItem({ solution: 'not-an-object' });
    expect(() => parseNotebookLmOutput(toJson(makeBatch([bad])))).toThrow(/solution/);
  });

  it('rubric שאינו מערך זורק', () => {
    const bad = makeItem({ rubric: 'not-an-array' });
    expect(() => parseNotebookLmOutput(toJson(makeBatch([bad])))).toThrow(/rubric/);
  });
});

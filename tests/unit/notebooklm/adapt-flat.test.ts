/**
 * tests/unit/notebooklm/adapt-flat.test.ts
 *
 * בדיקות ל-extractFlatJson, adaptFlatToItem, buildBatch.
 *
 * מכסה:
 * - extractFlatJson: חילוץ נכון בין Answer: ל-Resumed conversation:
 * - extractFlatJson: עובד גם ללא "Resumed conversation:" (עד סוף)
 * - extractFlatJson: שגיאה על JSON שבור
 * - extractFlatJson: שגיאה על שדות-חובה חסרים (כולל controlsHierarchy, managerialAction)
 * - adaptFlatToItem: מיזוג background/task/data/rubric מ-source
 * - adaptFlatToItem: legalCitation → legalBackup.citations[0]
 * - adaptFlatToItem: immediateAction/controlsHierarchy/managerialAction → citations=[]
 * - buildBatch: contentType='scenario_expansion' + batch-name
 */

import { describe, it, expect } from 'vitest';
import {
  extractFlatJson,
  adaptFlatToItem,
  buildBatch,
  type FlatScenario,
  type ScenarioSource,
} from '@/lib/notebooklm/adapt-flat';

// ── נתוני-עזר ──────────────────────────────────────────────────────────────

const VALID_FLAT: FlatScenario = {
  title: 'הגלגלים המעופפים',
  immediateAction: 'עצור את הפיגום מיד.',
  controlsHierarchy: 'ביטול הסיכון → הגנה קולקטיבית (מעקה) → ציוד-מגן-אישי.',
  legalBackup: 'תקנות הבטיחות בעבודה (עבודה בגובה), תקנה 24.',
  legalCitation: {
    scopeId: '2.1',
    quote: 'לא יועמד אדם לעבוד על משטח עבודה גבוה אלא אם',
    section: 'תקנה 24',
  },
  managerialAction: 'עדכון נוהל עבודה בגובה + הדרכה שנתית.',
};

const VALID_SOURCE: ScenarioSource = {
  title: 'הגלגלים המעופפים (עבודה בגובה)',
  background: 'עובדים על פיגום נייד בגובה 4 מטרים.',
  data: null,
  task: 'נתח את האירוע: פעולה מיידית, גיבוי חוקי, הנדסה וניהול.',
  rubric: [
    { criterion: 'פעולה מיידית', points: 1 },
    { criterion: 'גיבוי חוקי', points: 1 },
    { criterion: 'הנדסה וניהול', points: 1 },
  ],
};

/** יוצר stdout מדומה עם הבלוק הסטנדרטי */
function makeStdout(jsonStr: string): string {
  return `Continuing conversation...\nAnswer:\n${jsonStr}\n\nResumed conversation: abc-123\n`;
}

// ── extractFlatJson ─────────────────────────────────────────────────────────

describe('extractFlatJson', () => {
  it('מחלץ JSON תקין בין Answer ל-Resumed', () => {
    const json = JSON.stringify(VALID_FLAT);
    const result = extractFlatJson(makeStdout(json));
    expect(result.title).toBe(VALID_FLAT.title);
    expect(result.immediateAction).toBe(VALID_FLAT.immediateAction);
    expect(result.legalBackup).toBe(VALID_FLAT.legalBackup);
    expect(result.legalCitation.scopeId).toBe('2.1');
    expect(result.legalCitation.quote).toBe(VALID_FLAT.legalCitation.quote);
    expect(result.legalCitation.section).toBe('תקנה 24');
  });

  it('מחלץ JSON כשאין Resumed conversation (עד סוף)', () => {
    const json = JSON.stringify(VALID_FLAT);
    const stdout = `Answer:\n${json}\n`;
    const result = extractFlatJson(stdout);
    expect(result.title).toBe(VALID_FLAT.title);
  });

  it('מחלץ JSON ללא שדה section (section אופציונלי)', () => {
    const flatNoSection: FlatScenario = {
      ...VALID_FLAT,
      legalCitation: { scopeId: '2.2', quote: 'ציטוט ללא סעיף' },
    };
    const result = extractFlatJson(makeStdout(JSON.stringify(flatNoSection)));
    expect(result.legalCitation.section).toBeUndefined();
  });

  it('זורק שגיאה על JSON שבור', () => {
    const stdout = makeStdout('{ "title": "שבור"');
    expect(() => extractFlatJson(stdout)).toThrow(/JSON|adapt-flat/);
  });

  it('זורק שגיאה על שדה immediateAction חסר', () => {
    const broken = {
      title: 'ת',
      controlsHierarchy: 'ב',
      legalBackup: 'ג',
      legalCitation: { scopeId: '2.1', quote: 'q' },
      managerialAction: 'ד',
    };
    expect(() => extractFlatJson(makeStdout(JSON.stringify(broken)))).toThrow(/immediateAction/);
  });

  it('זורק שגיאה על שדה controlsHierarchy חסר', () => {
    const broken = {
      title: 'ת',
      immediateAction: 'א',
      legalBackup: 'ג',
      legalCitation: { scopeId: '2.1', quote: 'q' },
      managerialAction: 'ד',
    };
    expect(() => extractFlatJson(makeStdout(JSON.stringify(broken)))).toThrow(/controlsHierarchy/);
  });

  it('זורק שגיאה על שדה managerialAction חסר', () => {
    const broken = {
      title: 'ת',
      immediateAction: 'א',
      controlsHierarchy: 'ב',
      legalBackup: 'ג',
      legalCitation: { scopeId: '2.1', quote: 'q' },
    };
    expect(() => extractFlatJson(makeStdout(JSON.stringify(broken)))).toThrow(/managerialAction/);
  });

  it('זורק שגיאה על legalCitation חסר', () => {
    const broken = {
      title: 'ת',
      immediateAction: 'פ',
      controlsHierarchy: 'ב',
      legalBackup: 'ג',
      managerialAction: 'ד',
    };
    expect(() => extractFlatJson(makeStdout(JSON.stringify(broken)))).toThrow(/legalCitation/);
  });

  it('זורק שגיאה כש-stdout ריק', () => {
    expect(() => extractFlatJson('')).toThrow(/adapt-flat/);
  });
});

// ── adaptFlatToItem ─────────────────────────────────────────────────────────

describe('adaptFlatToItem', () => {
  it('לוקח title מ-source (לא מ-flat)', () => {
    const item = adaptFlatToItem(VALID_FLAT, VALID_SOURCE);
    expect(item.title).toBe(VALID_SOURCE.title);
  });

  it('לוקח background מ-source', () => {
    const item = adaptFlatToItem(VALID_FLAT, VALID_SOURCE);
    expect(item.background).toBe(VALID_SOURCE.background);
  });

  it('לוקח task מ-source', () => {
    const item = adaptFlatToItem(VALID_FLAT, VALID_SOURCE);
    expect(item.task).toBe(VALID_SOURCE.task);
  });

  it('לוקח rubric מ-source', () => {
    const item = adaptFlatToItem(VALID_FLAT, VALID_SOURCE);
    expect(item.rubric).toEqual(VALID_SOURCE.rubric);
  });

  it('data=null כשאין data במקור', () => {
    const item = adaptFlatToItem(VALID_FLAT, VALID_SOURCE);
    expect(item.data).toBeNull();
  });

  it('immediateAction.text מגיע מ-flat', () => {
    const item = adaptFlatToItem(VALID_FLAT, VALID_SOURCE);
    expect(item.solution.immediateAction.text).toBe(VALID_FLAT.immediateAction);
  });

  it('immediateAction.citations ריק', () => {
    const item = adaptFlatToItem(VALID_FLAT, VALID_SOURCE);
    expect(item.solution.immediateAction.citations).toHaveLength(0);
  });

  it('controlsHierarchy.text מגיע מ-flat — (ב) מדרג-הבקרות', () => {
    const item = adaptFlatToItem(VALID_FLAT, VALID_SOURCE);
    expect(item.solution.controlsHierarchy.text).toBe(VALID_FLAT.controlsHierarchy);
  });

  it('controlsHierarchy.citations ריק', () => {
    const item = adaptFlatToItem(VALID_FLAT, VALID_SOURCE);
    expect(item.solution.controlsHierarchy.citations).toHaveLength(0);
  });

  it('legalBackup.text מגיע מ-flat', () => {
    const item = adaptFlatToItem(VALID_FLAT, VALID_SOURCE);
    expect(item.solution.legalBackup.text).toBe(VALID_FLAT.legalBackup);
  });

  it('legalCitation ממופה ל-legalBackup.citations[0]', () => {
    const item = adaptFlatToItem(VALID_FLAT, VALID_SOURCE);
    const cits = item.solution.legalBackup.citations;
    expect(cits).toHaveLength(1);
    expect(cits[0]?.scopeId).toBe('2.1');
    expect(cits[0]?.quote).toBe(VALID_FLAT.legalCitation.quote);
    expect(cits[0]?.section).toBe('תקנה 24');
  });

  it('managerialAction.text מגיע מ-flat — (ד) פעולה ניהולית', () => {
    const item = adaptFlatToItem(VALID_FLAT, VALID_SOURCE);
    expect(item.solution.managerialAction.text).toBe(VALID_FLAT.managerialAction);
  });

  it('managerialAction.citations ריק', () => {
    const item = adaptFlatToItem(VALID_FLAT, VALID_SOURCE);
    expect(item.solution.managerialAction.citations).toHaveLength(0);
  });

  it('legalCitation ללא section — section לא קיים ב-citations[0]', () => {
    const flatNoSection: FlatScenario = {
      ...VALID_FLAT,
      legalCitation: { scopeId: '2.2', quote: 'ציטוט' },
    };
    const item = adaptFlatToItem(flatNoSection, VALID_SOURCE);
    expect(item.solution.legalBackup.citations[0]?.section).toBeUndefined();
  });
});

// ── buildBatch ───────────────────────────────────────────────────────────────

describe('buildBatch', () => {
  it('contentType = scenario_expansion', () => {
    const batch = buildBatch([]);
    expect(batch.contentType).toBe('scenario_expansion');
  });

  it('ברירת-מחדל batch = scenarios-expand', () => {
    const batch = buildBatch([]);
    expect(batch.batch).toBe('scenarios-expand');
  });

  it('שם batch מותאם-אישית', () => {
    const batch = buildBatch([], 'my-batch');
    expect(batch.batch).toBe('my-batch');
  });

  it('items מועברים כנדרש', () => {
    const item = adaptFlatToItem(VALID_FLAT, VALID_SOURCE);
    const batch = buildBatch([item]);
    expect(batch.items).toHaveLength(1);
    expect(batch.items[0]?.title).toBe(VALID_SOURCE.title);
  });

  it('batch ריק מותר (פלט-חלקי)', () => {
    const batch = buildBatch([]);
    expect(batch.items).toHaveLength(0);
  });
});

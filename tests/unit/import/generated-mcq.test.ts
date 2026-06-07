import { describe, it, expect } from 'vitest';
import {
  quoteAppearsInBody,
  depthToDifficulty,
  isValidMcq,
  buildQuestionRow,
  type GeneratedMCQ,
  type StatuteSource,
} from '@/lib/import/generated-mcq';

const STATUTE: StatuteSource = {
  scopeId: '2.3',
  title: 'תקנות הבטיחות בעבודה (ציוד מגן אישי), תשנ"ז-1997',
  depth: 'framework',
  body: 'מחזיק במקום עבודה יספק לעובד ציוד מגן אישי מתאים, יפקח על השימוש בו ויתחזק אותו כראוי.',
};

function mcq(over: Partial<GeneratedMCQ> = {}): GeneratedMCQ {
  return {
    prompt: 'מהי חובת המחזיק לגבי ציוד מגן אישי?',
    options: ['לספק ולפקח ולתחזק', 'רק לספק', 'רק להמליץ', 'אין חובה'],
    correctIndex: 0,
    explanation: 'המחזיק חייב לספק, לפקח ולתחזק.',
    sourceQuote: 'מחזיק במקום עבודה יספק לעובד ציוד מגן אישי מתאים',
    citation: 'תקנה 3',
    difficulty: 2,
    ...over,
  };
}

describe('quoteAppearsInBody (שער-אנטי-הזיה)', () => {
  it('מאתר ציטוט מילולי קיים (אחרי נרמול-רווחים)', () => {
    expect(quoteAppearsInBody('יספק לעובד ציוד מגן אישי מתאים', STATUTE.body)).toBe(true);
    expect(quoteAppearsInBody('מחזיק   במקום\nעבודה יספק', STATUTE.body)).toBe(true); // נרמול רווחים/שורות
  });
  it('דוחה ציטוט מומצא (לא בנוסח)', () => {
    expect(quoteAppearsInBody('העובד רשאי לסרב לכל ציוד מגן', STATUTE.body)).toBe(false);
  });
  it('דוחה ציטוט קצר-מדי', () => {
    expect(quoteAppearsInBody('יספק', STATUTE.body)).toBe(false);
  });
});

describe('depthToDifficulty', () => {
  it('core=1 · framework=2 · sectoral=3 · ברירת-מחדל=2', () => {
    expect(depthToDifficulty('core')).toBe(1);
    expect(depthToDifficulty('framework')).toBe(2);
    expect(depthToDifficulty('sectoral')).toBe(3);
    expect(depthToDifficulty(undefined)).toBe(2);
  });
});

describe('isValidMcq', () => {
  it('פוסל index מחוץ-לתחום / פחות מ-2 מסיחים', () => {
    expect(isValidMcq(mcq({ correctIndex: 9 }))).toBe(false);
    expect(isValidMcq(mcq({ options: ['רק-אחד'] }))).toBe(false);
    expect(isValidMcq(mcq())).toBe(true);
  });
});

describe('buildQuestionRow', () => {
  it('בונה row תקין: status מוסקנא · scopeRefs · correctAnswer · ציטוט-במקור', () => {
    const row = buildQuestionRow(mcq(), STATUTE, 'gen:2.3:abc');
    expect(row).not.toBeNull();
    expect(row!.status).toBe('מוסקנא');
    expect(row!.inScope).toBe(true);
    expect(row!.sourceRef).toBe('gen:2.3:abc');
    expect(row!.correctAnswer).toEqual({ index: 0 });
    expect(row!.scopeRefs).toEqual([{ id: '2.3', confidence: 1 }]);
    expect(String(row!.explanation)).toContain('מקור:'); // ציטוט-מקור משורשר
    expect(row!.difficulty).toBe(2);
  });
  it('מחזיר null כשהציטוט אינו בנוסח (הזיה)', () => {
    expect(
      buildQuestionRow(mcq({ sourceQuote: 'משפט שלא קיים בנוסח כלל' }), STATUTE, 'gen:x'),
    ).toBeNull();
  });
  it('מחזיר null למבנה פסול', () => {
    expect(buildQuestionRow(mcq({ correctIndex: 7 }), STATUTE, 'gen:x')).toBeNull();
  });
});

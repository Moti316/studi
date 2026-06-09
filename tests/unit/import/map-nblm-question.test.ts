import { describe, it, expect } from 'vitest';
import { buildMatchingRow, buildOpenRow } from '@/lib/import/map-nblm-question';
import type { StatuteSource } from '@/lib/import/generated-mcq';
import type { FlatMatchingPair, FlatOpenQa } from '@/lib/notebooklm/adapt-flat-questions';

const STATUTE: StatuteSource = {
  scopeId: '2.3',
  title: 'תקנות הבטיחות בעבודה (ציוד מגן אישי), תשנ"ז-1997',
  depth: 'framework',
  body: 'מחזיק במקום עבודה יספק לעובד ציוד מגן אישי מתאים, ויפקח על השימוש בו ויתחזק אותו כראוי.',
};

function pair(over: Partial<FlatMatchingPair> = {}): FlatMatchingPair {
  return {
    term: 'מחזיק במקום עבודה',
    definition: 'מי שאחראי לספק ציוד מגן',
    sourceQuote: 'מחזיק במקום עבודה יספק לעובד',
    citation: 'תקנה 3',
    ...over,
  };
}

describe('buildMatchingRow', () => {
  it('בונה שאלת-matching מזוגות-מעוגנים (options={left,right}[])', () => {
    const row = buildMatchingRow(
      [pair(), pair({ sourceQuote: 'יפקח על השימוש בו ויתחזק אותו' })],
      STATUTE,
      'nbq:2.3:matching:a',
    );
    expect(row).not.toBeNull();
    expect(row!.type).toBe('matching');
    expect(row!.status).toBe('מוסקנא');
    expect(Array.isArray(row!.options)).toBe(true);
    expect((row!.options as Array<{ left: string; right: string }>)[0]).toHaveProperty('left');
    expect(row!.scopeRefs).toEqual([{ id: '2.3', confidence: 1 }]);
  });
  it('מסנן זוג לא-מעוגן; <2 מעוגנים → null', () => {
    const row = buildMatchingRow(
      [pair(), pair({ sourceQuote: 'משפט שלא קיים בנוסח כלל' })],
      STATUTE,
      'nbq:x',
    );
    expect(row).toBeNull(); // רק 1 מעוגן
  });
});

describe('buildOpenRow', () => {
  it('בונה explanation עם correctAnswer={text} כשהציטוט מעוגן', () => {
    const qa: FlatOpenQa = {
      prompt: 'מה חובת המחזיק?',
      answer: 'לספק, לפקח ולתחזק ציוד-מגן',
      sourceQuote: 'מחזיק במקום עבודה יספק לעובד',
      citation: 'תקנה 3',
    };
    const row = buildOpenRow(qa, STATUTE, 'nbq:2.3:open:a');
    expect(row).not.toBeNull();
    expect(row!.type).toBe('explanation');
    expect(row!.correctAnswer).toEqual({ text: 'לספק, לפקח ולתחזק ציוד-מגן' });
  });
  it('ציטוט מומצא → null (G3)', () => {
    const qa: FlatOpenQa = {
      prompt: 'x',
      answer: 'y',
      sourceQuote: 'טקסט שאינו בנוסח בכלל',
      citation: '1',
    };
    expect(buildOpenRow(qa, STATUTE, 'nbq:x')).toBeNull();
  });
});

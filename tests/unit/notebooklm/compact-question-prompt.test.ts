import { describe, it, expect } from 'vitest';
import { buildCompactQuestionPrompt } from '@/lib/notebooklm/compact-question-prompt';
import type { StatuteSource } from '@/lib/import/generated-mcq';

const STATUTE: StatuteSource = {
  scopeId: '2.3',
  title: 'תקנות הבטיחות בעבודה (ציוד מגן אישי), תשנ"ז-1997',
  depth: 'framework',
  body: 'מחזיק במקום עבודה יספק לעובד ציוד מגן אישי מתאים.',
};

describe('buildCompactQuestionPrompt', () => {
  it('כולל כותרת+scope, סוג, מספר, והוראת-ציטוט-verbatim', () => {
    const p = buildCompactQuestionPrompt(STATUTE, { type: 'mcq', n: 3 });
    expect(p).toContain('2.3');
    expect(p).toContain('ציוד מגן אישי');
    expect(p).toContain('3');
    expect(p).toContain('sourceQuote');
    expect(p).toMatch(/בדיוק|מילולי/);
    expect(p).toContain('correctIndex');
  });
  it('matching → חוזה pairs (term/definition)', () => {
    const p = buildCompactQuestionPrompt(STATUTE, { type: 'matching', n: 4 });
    expect(p).toContain('pairs');
    expect(p).toContain('term');
    expect(p).toContain('definition');
  });
  it('open → חוזה qas (answer)', () => {
    const p = buildCompactQuestionPrompt(STATUTE, { type: 'open', n: 2 });
    expect(p).toContain('qas');
    expect(p).toContain('answer');
  });
  it('prompt קצר (גבול-NotebookLM ~אלף תווים)', () => {
    const p = buildCompactQuestionPrompt(STATUTE, { type: 'mcq', n: 3 });
    expect(p.length).toBeLessThan(1000);
  });
  it('n מינימלי 1 גם לקלט פסול', () => {
    const p = buildCompactQuestionPrompt(STATUTE, { type: 'open', n: 0 });
    expect(p).toContain('1');
  });
});

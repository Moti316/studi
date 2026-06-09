import { describe, it, expect } from 'vitest';
import {
  extractFlatMcqs,
  extractFlatMatching,
  extractFlatOpen,
} from '@/lib/notebooklm/adapt-flat-questions';

function wrap(json: string): string {
  return `Continuing...\nAnswer:\n${json}\n\nResumed conversation: x\n`;
}

describe('extractFlatMcqs', () => {
  it('מחלץ MCQ תקין ומסנן פסול', () => {
    const json = JSON.stringify({
      questions: [
        {
          prompt: 'מהי חובת המחזיק?',
          options: ['לספק', 'לא חייב', 'להמליץ', 'אין'],
          correctIndex: 0,
          explanation: 'חייב לספק',
          sourceQuote: 'מחזיק במקום עבודה יספק',
          citation: 'תקנה 3',
        },
        { prompt: '', options: ['א'], correctIndex: 9, citation: '' }, // פסול
      ],
    });
    const out = extractFlatMcqs(wrap(json));
    expect(out).toHaveLength(1);
    expect(out[0]!.prompt).toBe('מהי חובת המחזיק?');
  });
  it('stdout ללא JSON → מערך ריק', () => {
    expect(extractFlatMcqs('no json here')).toEqual([]);
  });
});

describe('extractFlatMatching', () => {
  it('מחלץ זוגות שלמים ומסנן חסרים', () => {
    const json = JSON.stringify({
      pairs: [
        {
          term: 'מאצרה',
          definition: 'שטח מוקף דפנות',
          sourceQuote: 'מאצרה היא שטח',
          citation: '1',
        },
        { term: 'חסר', definition: '', sourceQuote: 'x', citation: '2' }, // פסול
      ],
    });
    const out = extractFlatMatching(wrap(json));
    expect(out).toHaveLength(1);
    expect(out[0]!.term).toBe('מאצרה');
  });
});

describe('extractFlatOpen', () => {
  it('מחלץ שו"ת-פתוח שלם', () => {
    const json = JSON.stringify({
      qas: [
        {
          prompt: 'מה חובת המחזיק?',
          answer: 'לספק צמ"א',
          sourceQuote: 'יספק לעובד',
          citation: 'תקנה 3',
        },
      ],
    });
    const out = extractFlatOpen(wrap(json));
    expect(out).toHaveLength(1);
    expect(out[0]!.answer).toContain('לספק');
  });
  it('fallback repair על מרכאות-תוכן לא-escaped', () => {
    const broken =
      '{"qas":[{"prompt":"בעל רישיון "חשמלאי" מהו?","answer":"מוסמך","sourceQuote":"בעל רישיון חשמלאי","citation":"5"}]}';
    const out = extractFlatOpen(wrap(broken));
    expect(out).toHaveLength(1);
    expect(out[0]!.prompt).toContain('חשמלאי');
  });
});

/**
 * tests/unit/parsers/parse-pdf-mcq.test.ts
 *
 * בדיקות לפרסר PDF-MCQ.
 * שכבת-לוגיקה נבדקת דרך parsePdfMcqFromText (ללא I/O).
 * smoke test אמיתי על PDF קיים ב-repo.
 */

import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { parsePdfMcqFromText } from '../../../scripts/parsers/parse-pdf-mcq.js';

const SAMPLE_MCQ = [
  '1. מהי הטמפרטורה הנורמלית של גוף האדם?',
  'א. 35 מעלות',
  'ב. 37 מעלות',
  'ג. 39 מעלות',
  'ד. 41 מעלות',
  'תשובה: ב',
  '',
  '2. כמה עצמות יש בגוף האדם הבוגר?',
  'א. 150',
  'ב. 206',
  'ג. 256',
  'ד. 300',
  'תשובה: ב',
].join('\n');

describe('parsePdfMcqFromText: ParseResult structure', () => {
  it('מחזיר ParseResult עם שדות נדרשים', () => {
    const result = parsePdfMcqFromText('', 'test.pdf');
    expect(result).toHaveProperty('source');
    expect(result).toHaveProperty('totalQuestions');
    expect(result).toHaveProperty('questions');
    expect(Array.isArray(result.questions)).toBe(true);
  });

  it('טקסט ריק מחזיר questions=[]', () => {
    const result = parsePdfMcqFromText('', 'empty.pdf');
    expect(result.totalQuestions).toBe(0);
    expect(result.questions).toHaveLength(0);
  });
});

describe('parsePdfMcqFromText: זיהוי שאלות MCQ', () => {
  it('מזהה שתי שאלות MCQ', () => {
    const result = parsePdfMcqFromText(SAMPLE_MCQ, 'mcq.pdf');
    expect(result.totalQuestions).toBe(2);
    expect(result.questions).toHaveLength(2);
  });

  it('שאלה ראשונה: 4 אפשרויות, correctIndex=1 (ב)', () => {
    const result = parsePdfMcqFromText(SAMPLE_MCQ, 'mcq.pdf');
    const first = result.questions[0]!;

    expect(first.options).toHaveLength(4);
    expect(first.correctIndex).toBe(1); // ב = index 1
    expect(first.type).toMatch(/^mcq_/);
    expect(first.scopeRefs).toEqual([]);
  });

  it('שאלה שנייה: correctIndex=1 (ב)', () => {
    const result = parsePdfMcqFromText(SAMPLE_MCQ, 'mcq.pdf');
    const second = result.questions[1]!;
    expect(second.correctIndex).toBe(1);
  });

  it('sourceId מכיל שם-קובץ ומספר-שאלה', () => {
    const result = parsePdfMcqFromText(SAMPLE_MCQ, 'mcq.pdf');
    expect(result.questions[0]!.sourceId).toContain('mcq.pdf');
    expect(result.questions[0]!.sourceId).toContain('#q1');
    expect(result.questions[1]!.sourceId).toContain('#q2');
  });

  it('rawText מכיל את הטקסט המקורי', () => {
    const result = parsePdfMcqFromText(SAMPLE_MCQ, 'mcq.pdf');
    expect(result.questions[0]!.rawText).toContain('35 מעלות');
  });
});

describe('parsePdfMcqFromText: סיווג סוג שאלה', () => {
  it('שאלה קצרה (<120 תווים) = mcq_short', () => {
    const result = parsePdfMcqFromText(SAMPLE_MCQ, 'mcq.pdf');
    expect(result.questions[0]!.type).toBe('mcq_short');
  });

  it('שאלה ארוכה (>120 תווים) = mcq_long', () => {
    const longQ = '1. ' + 'א'.repeat(121) + '?';
    const result = parsePdfMcqFromText(longQ, 'mcq.pdf');
    expect(result.questions[0]!.type).toBe('mcq_long');
  });
});

describe('parsePdfMcqFromText: פורמט אפשרויות עם סוגריים', () => {
  const parenText = [
    '1. מה צבע השמים?',
    '(א) ירוק',
    '(ב) כחול',
    '(ג) אדום',
    '(ד) צהוב',
    'תשובה: ב',
  ].join('\n');

  it('מזהה אפשרויות בסוגריים', () => {
    const result = parsePdfMcqFromText(parenText, 'test.pdf');
    expect(result.questions[0]?.options).toHaveLength(4);
    expect(result.questions[0]?.correctIndex).toBe(1);
  });
});

describe('parsePdfMcq: smoke test על PDF ממשי ב-repo', () => {
  it('קורא 1.5-teunot-machalot-1945.pdf ומחזיר ParseResult תקין', async () => {
    // בדיקה זו כוללת I/O אמיתי — מאשרת שה-wrapper עובד עם pdf-parse
    const { parsePdfMcq } = await import('../../../scripts/parsers/parse-pdf-mcq.js');
    // שימוש ב-process.cwd() כדי להישאר portable בין dev local ל-CI runner
    const pdfPath = path.resolve(
      process.cwd(),
      'docs/sources/laws/1-pikuach-1954/1.5-teunot-machalot-1945.pdf',
    );

    const result = await parsePdfMcq(pdfPath);

    expect(result).toHaveProperty('source', pdfPath);
    expect(typeof result.totalQuestions).toBe('number');
    expect(result.totalQuestions).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.questions)).toBe(true);
    // PDF חוקי עם text-layer — אנחנו רק מאשרים שלא קרסנו
  });
});

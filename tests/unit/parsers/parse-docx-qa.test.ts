/**
 * tests/unit/parsers/parse-docx-qa.test.ts
 *
 * בדיקות לפרסר DOCX Q&A.
 * שכבת-לוגיקה נבדקת דרך parseDocxQAFromText (ללא I/O).
 */

import { describe, expect, it } from 'vitest';
import { parseDocxQAFromText } from '../../../scripts/parsers/parse-docx-qa.js';

describe('parseDocxQAFromText: מבנה ParseResult', () => {
  it('מחזיר ParseResult עם שדות נדרשים', () => {
    const result = parseDocxQAFromText('', 'test.docx');
    expect(result).toHaveProperty('source');
    expect(result).toHaveProperty('totalQuestions');
    expect(result).toHaveProperty('questions');
    expect(Array.isArray(result.questions)).toBe(true);
  });

  it('טקסט ריק מחזיר questions=[]', () => {
    const result = parseDocxQAFromText('', 'empty.docx');
    expect(result.totalQuestions).toBe(0);
    expect(result.questions).toHaveLength(0);
  });
});

describe('parseDocxQAFromText: שאלות פתוחות (open)', () => {
  const openQAText = [
    'שאלה: מהי מטרת פקודת תאונות המחלות?',
    'תשובה: להסדיר את הדיווח על תאונות עבודה ומחלות מקצועיות.',
    '',
    'שאלה: מה חובת המעביד בעת תאונה?',
    'תשובה: לדווח לרשויות תוך 24 שעות.',
  ].join('\n');

  it('מזהה 2 שאלות פתוחות', () => {
    const result = parseDocxQAFromText(openQAText, 'open.docx');
    expect(result.totalQuestions).toBe(2);
    expect(result.questions[0]!.type).toBe('open');
    expect(result.questions[0]!.question).toContain('מטרת');
    expect(result.questions[0]!.correctAnswerText).toBeTruthy();
    expect(result.questions[0]!.scopeRefs).toEqual([]);
  });

  it('שדות שאינם רלוונטיים לשאלה פתוחה לא מוגדרים', () => {
    const result = parseDocxQAFromText(openQAText, 'open.docx');
    expect(result.questions[0]!.options).toBeUndefined();
    expect(result.questions[0]!.correctIndex).toBeUndefined();
  });
});

describe('parseDocxQAFromText: שאלות MCQ עם תוויות עברית', () => {
  const mcqText = [
    'שאלה: מהי תקופת ההתיישנות לתביעה?',
    'א. שנה אחת',
    'ב. שנתיים',
    'ג. שלוש שנים',
    'ד. חמש שנים',
    'תשובה: ג',
    '',
    'שאלה: כמה חברים יש בוועדה?',
    'א. 3',
    'ב. 5',
    'ג. 7',
    'ד. 9',
    'תשובה נכונה: ב',
  ].join('\n');

  it('מזהה 2 שאלות MCQ עם 4 אפשרויות', () => {
    const result = parseDocxQAFromText(mcqText, 'mcq.docx');
    expect(result.totalQuestions).toBe(2);
    expect(result.questions[0]!.options).toHaveLength(4);
    expect(result.questions[1]!.options).toHaveLength(4);
  });

  it('שאלה ראשונה: correctIndex=2 (ג)', () => {
    const result = parseDocxQAFromText(mcqText, 'mcq.docx');
    expect(result.questions[0]!.correctIndex).toBe(2); // ג = index 2
  });

  it('שאלה שנייה: correctIndex=1 (ב)', () => {
    const result = parseDocxQAFromText(mcqText, 'mcq.docx');
    expect(result.questions[1]!.correctIndex).toBe(1); // ב = index 1
  });

  it('type = mcq_short לשאלה קצרה', () => {
    const result = parseDocxQAFromText(mcqText, 'mcq.docx');
    expect(result.questions[0]!.type).toMatch(/^mcq_/);
  });

  it('sourceId מכיל שם-קובץ ומספר-שאלה', () => {
    const result = parseDocxQAFromText(mcqText, 'mcq.docx');
    expect(result.questions[0]!.sourceId).toContain('mcq.docx');
    expect(result.questions[0]!.sourceId).toContain('#q1');
    expect(result.questions[1]!.sourceId).toContain('#q2');
  });
});

describe('parseDocxQAFromText: שאלות ממוספרות', () => {
  const numberedText = [
    '1. מהי האחריות הפלילית?',
    'תשובה: קנס עד 5,000 ש"ח.',
    '',
    '2. מי רשאי לבצע חקירה?',
    'תשובה: פקח מוסמך בלבד.',
  ].join('\n');

  it('מזהה 2 שאלות ממוספרות כ-open', () => {
    const result = parseDocxQAFromText(numberedText, 'numbered.docx');
    expect(result.totalQuestions).toBe(2);
    expect(result.questions[0]!.type).toBe('open');
    expect(result.questions[1]!.type).toBe('open');
  });
});

describe('parseDocxQAFromText: שאלות עם ?', () => {
  const questionMarkText = [
    'מה זה פיקוח על בריאות העם?',
    'תשובה: חוק המסדיר את שירותי הבריאות הציבוריים.',
    '',
    'כיצד מגישים תביעה?',
    'תשובה: דרך הגורם המוסמך.',
  ].join('\n');

  it('מזהה שאלות שמסתיימות ב-?', () => {
    const result = parseDocxQAFromText(questionMarkText, 'qa.docx');
    expect(result.totalQuestions).toBe(2);
  });
});

describe('parseDocxQAFromText: scopeRefs ברירת מחדל', () => {
  it('כל שאלה מחזירה scopeRefs=[]', () => {
    const text = 'שאלה: מה שמך?\nתשובה: ישראל.';
    const result = parseDocxQAFromText(text, 'test.docx');
    for (const q of result.questions) {
      expect(q.scopeRefs).toEqual([]);
    }
  });
});

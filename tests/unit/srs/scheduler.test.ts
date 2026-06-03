/**
 * tests/unit/srs/scheduler.test.ts — בדיקות תזמון-תור-התרגול.
 *
 * מאמת: selectDueQuestions (סינון null, סף-now, מיון-דחיפות) ו-buildPracticeQueue
 * (מכסת-חדשות, מילוי-הדדי, ניצול-limit, dedupe/אי-חפיפה, קלט-לא-תקין).
 */

import { describe, expect, it } from 'vitest';
import { selectDueQuestions, buildPracticeQueue, type ReviewItem } from '@/lib/srs/scheduler';

const NOW = new Date('2026-06-04T12:00:00.000Z');
const at = (offsetMin: number) => new Date(NOW.getTime() + offsetMin * 60_000);

describe('selectDueQuestions', () => {
  it('מסנן null (טרם-מתוזמן) ושאלות-עתידיות; משאיר רק due', () => {
    const items: ReviewItem[] = [
      { questionId: 'a', nextReviewAt: at(-60) }, // overdue
      { questionId: 'b', nextReviewAt: at(60) }, // עתידי
      { questionId: 'c', nextReviewAt: null }, // חדש/לא-מתוזמן
      { questionId: 'd', nextReviewAt: at(0) }, // בדיוק עכשיו (כולל)
    ];
    expect(selectDueQuestions(items, NOW)).toEqual(['a', 'd']);
  });

  it('ממיין מהדחוף-ביותר (overdue) לפחות-דחוף', () => {
    const items: ReviewItem[] = [
      { questionId: 'recent', nextReviewAt: at(-5) },
      { questionId: 'old', nextReviewAt: at(-500) },
      { questionId: 'mid', nextReviewAt: at(-100) },
    ];
    expect(selectDueQuestions(items, NOW)).toEqual(['old', 'mid', 'recent']);
  });

  it('ריק ⇒ []', () => {
    expect(selectDueQuestions([], NOW)).toEqual([]);
  });
});

const due = (n: number) => Array.from({ length: n }, (_, i) => `d${i}`);
const fresh = (n: number) => Array.from({ length: n }, (_, i) => `f${i}`);

describe('buildPracticeQueue', () => {
  it('limit=0 ⇒ []', () => {
    expect(buildPracticeQueue({ due: due(5), fresh: fresh(5), limit: 0 })).toEqual([]);
  });

  it('תמהיל סטנדרטי (limit=10, ratio=0.3) ⇒ 7 חזרות + 3 חדשות', () => {
    const q = buildPracticeQueue({ due: due(20), fresh: fresh(20), limit: 10, newRatio: 0.3 });
    expect(q).toHaveLength(10);
    expect(q.filter((id) => id.startsWith('d'))).toHaveLength(7);
    expect(q.filter((id) => id.startsWith('f'))).toHaveLength(3);
  });

  it('מעט חזרות ⇒ ממלא מחדשות (ניצול-מלא של limit)', () => {
    const q = buildPracticeQueue({ due: due(2), fresh: fresh(20), limit: 10, newRatio: 0.3 });
    expect(q).toHaveLength(10);
    expect(q.filter((id) => id.startsWith('d'))).toHaveLength(2);
    expect(q.filter((id) => id.startsWith('f'))).toHaveLength(8);
  });

  it('מעט חדשות ⇒ ממלא מחזרות', () => {
    const q = buildPracticeQueue({ due: due(20), fresh: fresh(1), limit: 10, newRatio: 0.3 });
    expect(q).toHaveLength(10);
    expect(q.filter((id) => id.startsWith('f'))).toHaveLength(1);
    expect(q.filter((id) => id.startsWith('d'))).toHaveLength(9);
  });

  it('פחות שאלות מ-limit ⇒ מחזיר את כל הזמינות', () => {
    const q = buildPracticeQueue({ due: due(2), fresh: fresh(1), limit: 10 });
    expect(q).toHaveLength(3);
  });

  it('חזרות לפני חדשות (סדר)', () => {
    const q = buildPracticeQueue({
      due: ['d0', 'd1'],
      fresh: ['f0', 'f1'],
      limit: 4,
      newRatio: 0.5,
    });
    expect(q).toEqual(['d0', 'd1', 'f0', 'f1']);
  });

  it('dedupe + אי-חפיפה (מזהה ב-due וגם ב-fresh ⇒ פעם-אחת)', () => {
    const q = buildPracticeQueue({ due: ['x', 'x', 'd1'], fresh: ['x', 'f1'], limit: 10 });
    expect(q.filter((id) => id === 'x')).toHaveLength(1);
    expect(new Set(q).size).toBe(q.length); // ללא-כפילויות
  });

  it('זורק על קלט לא-תקין', () => {
    expect(() => buildPracticeQueue({ due: [], fresh: [], limit: -1 })).toThrow(RangeError);
    expect(() => buildPracticeQueue({ due: [], fresh: [], limit: 5, newRatio: 1.5 })).toThrow(
      RangeError,
    );
    expect(() => buildPracticeQueue({ due: [], fresh: [], limit: 5, newRatio: -0.1 })).toThrow(
      RangeError,
    );
  });
});

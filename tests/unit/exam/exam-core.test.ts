/**
 * exam-core.test.ts — ליבת מבחן-הדמה (D3): ניקוד · עובר · טיימר.
 */
import { describe, it, expect } from 'vitest';
import { scoreExam, correctIndexOf, formatTime, EXAM_PASS_PCT } from '@/features/exam/exam-core';
import type { Question } from '../../../drizzle/schema';

function q(correct: number | null): Question {
  return {
    id: crypto.randomUUID(),
    type: 'mcq_long',
    prompt: 'p',
    options: ['א', 'ב', 'ג', 'ד'],
    correctAnswer: correct === null ? null : { index: correct },
    explanation: null,
    sourceChunkId: null,
    scenarioId: null,
    scopeRefs: [],
    inScope: true,
    status: 'מאומת',
    difficulty: null,
    sourceRef: null,
    createdAt: new Date(0),
  } as Question;
}

describe('correctIndexOf', () => {
  it('מחלץ index תקין · null על payload חסר/שבור', () => {
    expect(correctIndexOf(q(2))).toBe(2);
    expect(correctIndexOf(q(null))).toBeNull();
  });
});

describe('scoreExam', () => {
  it('ציון-אחוז + עובר/נכשל לפי סף-70', () => {
    const qs = [q(0), q(1), q(2), q(3), q(0), q(1), q(2), q(3), q(0), q(1)];
    // 7/10 נכונות → 70 → עובר (בדיוק-בסף)
    const answers = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 0, 5: 1, 6: 2, 7: 0, 8: 1, 9: 0 };
    const s = scoreExam(qs, answers);
    expect(s.scorable).toBe(10);
    expect(s.correct).toBe(7);
    expect(s.pct).toBe(70);
    expect(s.passed).toBe(true);
    expect(EXAM_PASS_PCT).toBe(70);
  });

  it('לא-נענתה = שגויה · שאלה-לא-ניתנת-לניקוד מוחרגת מהמכנה', () => {
    const qs = [q(0), q(1), q(null)];
    const s = scoreExam(qs, { 0: 0 }); // אחת-נכונה, אחת-לא-נענתה, אחת-לא-ניתנת
    expect(s.scorable).toBe(2);
    expect(s.answered).toBe(1);
    expect(s.correct).toBe(1);
    expect(s.pct).toBe(50);
    expect(s.passed).toBe(false);
  });

  it('בנק-ריק → 0 ולא-עובר (לא NaN)', () => {
    const s = scoreExam([], {});
    expect(s.pct).toBe(0);
    expect(s.passed).toBe(false);
  });
});

describe('formatTime', () => {
  it('mm:ss מרופד-אפסים · קוטם-שלילי', () => {
    expect(formatTime(3600)).toBe('60:00');
    expect(formatTime(305)).toBe('05:05');
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(-5)).toBe('00:00');
  });
});

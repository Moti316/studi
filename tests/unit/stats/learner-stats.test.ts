/**
 * tests/unit/stats/learner-stats.test.ts — בדיקות גזירת-סטטיסטיקות-לומד.
 *
 * מאמת: ריק→אפסים, ספירות/דיוק/XP, answeredToday (UTC), רצף-נוכחי (כולל grace
 * של אתמול ושבירה), והרצף-הארוך-ביותר ההיסטורי.
 */

import { describe, expect, it } from 'vitest';
import {
  summarizeLearnerStats,
  XP_CORRECT,
  XP_INCORRECT,
  type AttemptRecord,
} from '@/lib/stats/learner-stats';

const NOW = new Date('2026-06-04T12:00:00.000Z');
/** ניסיון ביום שבמרחק `dayOffset` ימים מ-NOW (UTC). */
const on = (dayOffset: number, isCorrect: boolean): AttemptRecord => ({
  isCorrect,
  attemptedAt: new Date(NOW.getTime() + dayOffset * 86_400_000),
});

describe('summarizeLearnerStats — בסיס', () => {
  it('ריק ⇒ הכל אפס', () => {
    expect(summarizeLearnerStats([], NOW)).toEqual({
      total: 0,
      correct: 0,
      accuracy: 0,
      xp: 0,
      currentStreakDays: 0,
      longestStreakDays: 0,
      answeredToday: 0,
    });
  });

  it('ספירות, דיוק ו-XP', () => {
    const attempts = [on(0, true), on(0, true), on(0, true), on(0, false), on(0, false)];
    const s = summarizeLearnerStats(attempts, NOW);
    expect(s.total).toBe(5);
    expect(s.correct).toBe(3);
    expect(s.accuracy).toBe(60); // round(3/5)
    expect(s.xp).toBe(3 * XP_CORRECT + 2 * XP_INCORRECT); // 34
  });

  it('answeredToday סופר רק את יום-ה-UTC הנוכחי', () => {
    const s = summarizeLearnerStats([on(0, true), on(0, false), on(-1, true)], NOW);
    expect(s.answeredToday).toBe(2);
  });
});

describe('summarizeLearnerStats — רצפים', () => {
  it('רצף-נוכחי: היום+אתמול+שלשום רצופים ⇒ 3', () => {
    const s = summarizeLearnerStats([on(0, true), on(-1, true), on(-2, false)], NOW);
    expect(s.currentStreakDays).toBe(3);
  });

  it('grace: פעילות אתמול (לא היום) עדיין נספרת', () => {
    const s = summarizeLearnerStats([on(-1, true), on(-2, true)], NOW);
    expect(s.currentStreakDays).toBe(2);
  });

  it('רצף-שבור: פעילות אחרונה לפני 3 ימים ⇒ 0', () => {
    const s = summarizeLearnerStats([on(-3, true), on(-4, true)], NOW);
    expect(s.currentStreakDays).toBe(0);
  });

  it('כמה ניסיונות באותו-יום נספרים כיום-רצף אחד', () => {
    const s = summarizeLearnerStats([on(0, true), on(0, false), on(0, true)], NOW);
    expect(s.currentStreakDays).toBe(1);
  });

  it('הרצף-הארוך-ביותר ההיסטורי (3) גדול מהנוכחי (1)', () => {
    const attempts = [on(-10, true), on(-9, true), on(-8, true), on(0, true)];
    const s = summarizeLearnerStats(attempts, NOW);
    expect(s.longestStreakDays).toBe(3);
    expect(s.currentStreakDays).toBe(1);
  });
});

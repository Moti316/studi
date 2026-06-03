/**
 * tests/unit/srs/sm2.test.ts — בדיקות מנוע החזרה-המרווחת (SM-2).
 *
 * מאמת את הנוסחה הקנונית: התקדמות-אינטרוול (1 → 6 → interval×EF), עדכון-EF פר-q,
 * clamp ל-EF≥1.3, איפוס-בכשל (q<3), חישוב nextReviewAt, מיפוי-ביצוע→q, וקלט-לא-תקין.
 */

import { describe, expect, it } from 'vitest';
import {
  reviewCard,
  updateEase,
  clampEase,
  gradeFromAttempt,
  SM2_MIN_EASE,
  SM2_DEFAULT_EASE,
  type Sm2State,
} from '@/lib/srs/sm2';

const NOW = new Date('2026-06-04T00:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

describe('updateEase — נוסחת-EF הקנונית', () => {
  it('q=5 מעלה EF ב-0.1', () => {
    expect(updateEase(2.5, 5)).toBe(2.6);
  });
  it('q=4 משאיר EF ללא-שינוי', () => {
    expect(updateEase(2.5, 4)).toBe(2.5);
  });
  it('q=3 מוריד EF (≈-0.14)', () => {
    expect(updateEase(2.5, 3)).toBe(2.36);
  });
  it('q=2 מוריד EF (≈-0.32)', () => {
    expect(updateEase(2.5, 2)).toBe(2.18);
  });
  it('clamp ל-1.3: q=0 על EF נמוך לא יורד מתחת ל-1.3', () => {
    expect(updateEase(1.3, 0)).toBe(SM2_MIN_EASE);
  });
});

describe('clampEase', () => {
  it('לא יורד מתחת ל-1.3', () => {
    expect(clampEase(0.5)).toBe(1.3);
    expect(clampEase(1.29)).toBe(1.3);
  });
  it('מעגל ל-2 ספרות', () => {
    expect(clampEase(2.333)).toBe(2.33);
  });
});

describe('reviewCard — התקדמות-אינטרוול', () => {
  const fresh: Sm2State = { intervalDays: 0, easeFactor: SM2_DEFAULT_EASE };

  it('שאלה-חדשה + הצלחה (q5) ⇒ interval=1, EF=2.6, חוזר מחר', () => {
    const r = reviewCard(fresh, 5, NOW);
    expect(r.intervalDays).toBe(1);
    expect(r.easeFactor).toBe(2.6);
    expect(r.nextReviewAt.getTime()).toBe(NOW.getTime() + 1 * DAY);
  });

  it('חזרה-שנייה (interval=1, q4) ⇒ interval=6', () => {
    const r = reviewCard({ intervalDays: 1, easeFactor: 2.5 }, 4, NOW);
    expect(r.intervalDays).toBe(6);
    expect(r.easeFactor).toBe(2.5);
    expect(r.nextReviewAt.getTime()).toBe(NOW.getTime() + 6 * DAY);
  });

  it('חזרה-שלישית (interval=6, EF=2.5, q5) ⇒ interval=round(6×2.5)=15', () => {
    const r = reviewCard({ intervalDays: 6, easeFactor: 2.5 }, 5, NOW);
    expect(r.intervalDays).toBe(15);
    expect(r.easeFactor).toBe(2.6);
  });

  it('steady-state (interval=15, EF=2.6, q4) ⇒ round(15×2.6)=39', () => {
    const r = reviewCard({ intervalDays: 15, easeFactor: 2.6 }, 4, NOW);
    expect(r.intervalDays).toBe(39);
    expect(r.easeFactor).toBe(2.6);
  });

  it('כשל-זכירה (q2) ⇒ איפוס ל-interval=1 + EF נענש (2.5→2.18)', () => {
    const r = reviewCard({ intervalDays: 39, easeFactor: 2.5 }, 2, NOW);
    expect(r.intervalDays).toBe(1);
    expect(r.easeFactor).toBe(2.18);
    expect(r.nextReviewAt.getTime()).toBe(NOW.getTime() + 1 * DAY);
  });

  it('EF=0 או חסר ⇒ נופל לברירת-מחדל 2.5', () => {
    const r = reviewCard({ intervalDays: 0, easeFactor: 0 }, 4, NOW);
    expect(r.easeFactor).toBe(2.5); // updateEase(2.5,4)=2.5
    expect(r.intervalDays).toBe(1);
  });

  it('זורק על q לא-תקין', () => {
    expect(() => reviewCard(fresh, 6, NOW)).toThrow(RangeError);
    expect(() => reviewCard(fresh, -1, NOW)).toThrow(RangeError);
    expect(() => reviewCard(fresh, 2.5, NOW)).toThrow(RangeError);
  });

  it('כשלים-חוזרים מצמידים את ה-EF לרצפה (1.3) אך interval נשאר 1', () => {
    let state: Sm2State = { intervalDays: 6, easeFactor: 1.4 };
    for (let i = 0; i < 5; i++) {
      const r = reviewCard(state, 0, NOW);
      state = { intervalDays: r.intervalDays, easeFactor: r.easeFactor };
    }
    expect(state.easeFactor).toBe(SM2_MIN_EASE);
    expect(state.intervalDays).toBe(1);
  });
});

describe('gradeFromAttempt — מיפוי ביצוע→q', () => {
  it('שגוי ⇒ 2 (lapse)', () => {
    expect(gradeFromAttempt({ isCorrect: false })).toBe(2);
    expect(gradeFromAttempt({ isCorrect: false, timeSpentSeconds: 5 })).toBe(2);
  });
  it('נכון ללא-זמן ⇒ 4', () => {
    expect(gradeFromAttempt({ isCorrect: true })).toBe(4);
    expect(gradeFromAttempt({ isCorrect: true, timeSpentSeconds: 0 })).toBe(4);
  });
  it('נכון ומהיר (≤½ יעד) ⇒ 5', () => {
    expect(gradeFromAttempt({ isCorrect: true, timeSpentSeconds: 10, expectedSeconds: 30 })).toBe(
      5,
    );
  });
  it('נכון ואיטי (>2× יעד) ⇒ 3', () => {
    expect(gradeFromAttempt({ isCorrect: true, timeSpentSeconds: 70, expectedSeconds: 30 })).toBe(
      3,
    );
  });
  it('נכון ורגיל ⇒ 4', () => {
    expect(gradeFromAttempt({ isCorrect: true, timeSpentSeconds: 30, expectedSeconds: 30 })).toBe(
      4,
    );
  });

  it('שילוב מלא: שגוי→reviewCard מאפס; נכון-מהיר מגדיל interval', () => {
    const wrong = reviewCard(
      { intervalDays: 20, easeFactor: 2.5 },
      gradeFromAttempt({ isCorrect: false }),
      NOW,
    );
    expect(wrong.intervalDays).toBe(1);
    const right = reviewCard(
      { intervalDays: 6, easeFactor: 2.5 },
      gradeFromAttempt({ isCorrect: true, timeSpentSeconds: 5 }),
      NOW,
    );
    expect(right.intervalDays).toBe(15);
  });
});

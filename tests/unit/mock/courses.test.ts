import { describe, it, expect } from 'vitest';
import { MOCK_COURSES, MOCK_LESSONS, coursePercent } from '@/lib/mock/courses';

describe('MOCK_COURSES', () => {
  it('קורס "ממונה בטיחות בעבודה" קיים עם 8 יחידות-נושא + נקודת-כניסה למסך-הנושאים', () => {
    expect(MOCK_COURSES).toHaveLength(2);
    expect(MOCK_COURSES[0]?.title).toBe('ממונה בטיחות בעבודה');
    expect(MOCK_COURSES[0]?.totalLessons).toBe(8); // 8 יחידות-נושא (mini-within-mini)
    expect(MOCK_COURSES[0]?.href).toBe('/courses/safety-officer');
    expect(MOCK_COURSES[1]?.title).toBe('תרחישי וועדת הסמכה');
    expect(MOCK_COURSES[1]?.href).toBe('/lesson/scenarios');
  });

  it('אין מעקב-התקדמות-אמת → 0 הושלמו (לא אחוז-מדומה); MOCK_LESSONS עם 5 מושלמים', () => {
    expect(MOCK_COURSES[0]?.completedLessons).toBe(0);
    expect(MOCK_LESSONS.filter((l) => l.completed)).toHaveLength(5);
  });
});

describe('coursePercent', () => {
  it('0/8 → 0% (אין התקדמות-מדומה)', () => {
    expect(coursePercent(MOCK_COURSES[0]!)).toBe(0);
  });

  it('0/0 → 0% (אין חלוקה באפס)', () => {
    expect(
      coursePercent({
        id: 'x',
        title: 'x',
        totalLessons: 0,
        completedLessons: 0,
        lastAccessedIso: '',
      }),
    ).toBe(0);
  });

  it('הכל מושלם → 100%', () => {
    expect(
      coursePercent({
        id: 'x',
        title: 'x',
        totalLessons: 10,
        completedLessons: 10,
        lastAccessedIso: '',
      }),
    ).toBe(100);
  });
});

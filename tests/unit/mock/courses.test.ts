import { describe, it, expect } from 'vitest';
import { MOCK_COURSES, MOCK_LESSONS, coursePercent } from '@/lib/mock/courses';

describe('MOCK_COURSES', () => {
  it('קורס "מבוא לכלכלה" קיים עם 12 שיעורים', () => {
    expect(MOCK_COURSES).toHaveLength(1);
    expect(MOCK_COURSES[0]?.title).toBe('מבוא לכלכלה');
    expect(MOCK_COURSES[0]?.totalLessons).toBe(12);
  });

  it('5 שיעורים הושלמו (לפי המוק)', () => {
    expect(MOCK_LESSONS.filter((l) => l.completed)).toHaveLength(5);
    expect(MOCK_COURSES[0]?.completedLessons).toBe(5);
  });
});

describe('coursePercent', () => {
  it('5/12 ≈ 42%', () => {
    expect(coursePercent(MOCK_COURSES[0]!)).toBe(42);
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

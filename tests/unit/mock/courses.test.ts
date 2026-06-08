import { describe, it, expect } from 'vitest';
import { MOCK_COURSES, MOCK_LESSONS, coursePercent } from '@/lib/mock/courses';

describe('MOCK_COURSES', () => {
  it('קורס "ממונה בטיחות בעבודה" קיים עם 11 פרקים + נקודת-כניסה ללימוד', () => {
    expect(MOCK_COURSES).toHaveLength(2);
    expect(MOCK_COURSES[0]?.title).toBe('ממונה בטיחות בעבודה');
    expect(MOCK_COURSES[0]?.totalLessons).toBe(11);
    expect(MOCK_COURSES[0]?.href).toBe('/lesson/practice');
    expect(MOCK_COURSES[1]?.title).toBe('תרחישי וועדת הסמכה');
    expect(MOCK_COURSES[1]?.href).toBe('/lesson/scenarios');
  });

  it('7/11 פרקים הושלמו (מוק); MOCK_LESSONS עם 5 מושלמים', () => {
    expect(MOCK_COURSES[0]?.completedLessons).toBe(7);
    expect(MOCK_LESSONS.filter((l) => l.completed)).toHaveLength(5);
  });
});

describe('coursePercent', () => {
  it('7/11 ≈ 64%', () => {
    expect(coursePercent(MOCK_COURSES[0]!)).toBe(64);
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

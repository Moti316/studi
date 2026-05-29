import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseCard } from '@/components/dashboard/CourseCard';
import type { MockCourse } from '@/lib/mock/courses';

const COURSE_42_PCT: MockCourse = {
  id: 'course-intro-economics',
  title: 'מבוא לכלכלה',
  totalLessons: 12,
  completedLessons: 5,
  lastAccessedIso: '2026-05-28T18:30:00.000Z',
};

const COURSE_COMPLETE: MockCourse = {
  id: 'course-history',
  title: 'היסטוריה של ישראל',
  totalLessons: 10,
  completedLessons: 10,
  lastAccessedIso: '2026-05-27T10:00:00.000Z',
};

const COURSE_EMPTY: MockCourse = {
  id: 'course-math',
  title: 'מתמטיקה',
  totalLessons: 8,
  completedLessons: 0,
  lastAccessedIso: '2026-05-20T08:00:00.000Z',
};

describe('CourseCard', () => {
  it('מציג את כותרת הקורס', () => {
    render(<CourseCard course={COURSE_42_PCT} />);
    expect(screen.getByRole('heading', { name: 'מבוא לכלכלה' })).toBeInTheDocument();
  });

  it('מציג אחוז התקדמות נכון: 5/12 → 42%', () => {
    render(<CourseCard course={COURSE_42_PCT} />);
    expect(screen.getByLabelText(/התקדמות בקורס: 42%/)).toBeInTheDocument();
    expect(screen.getByText(/42%/)).toBeInTheDocument();
  });

  it('מציג מספר שיעורים שהושלמו ומספר שיעורים כולל', () => {
    render(<CourseCard course={COURSE_42_PCT} />);
    expect(screen.getByText(/5 מתוך 12 שיעורים/)).toBeInTheDocument();
  });

  it('מכיל לינק ל-/courses/[id]', () => {
    render(<CourseCard course={COURSE_42_PCT} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/courses/course-intro-economics');
  });

  it('קורס מושלם: 100%', () => {
    render(<CourseCard course={COURSE_COMPLETE} />);
    expect(screen.getByLabelText(/התקדמות בקורס: 100%/)).toBeInTheDocument();
    expect(screen.getByText(/10 מתוך 10 שיעורים/)).toBeInTheDocument();
  });

  it('קורס ריק: 0%', () => {
    render(<CourseCard course={COURSE_EMPTY} />);
    expect(screen.getByLabelText(/התקדמות בקורס: 0%/)).toBeInTheDocument();
    expect(screen.getByText(/0 מתוך 8 שיעורים/)).toBeInTheDocument();
  });

  it('הלינק מוביל ל-id הנכון של קורס שני', () => {
    render(<CourseCard course={COURSE_EMPTY} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/courses/course-math');
  });
});

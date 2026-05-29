export interface MockLesson {
  id: string;
  title: string;
  completed: boolean;
}

export interface MockCourse {
  id: string;
  title: string;
  totalLessons: number;
  completedLessons: number;
  lastAccessedIso: string;
}

export const MOCK_LESSONS: MockLesson[] = Array.from({ length: 12 }, (_, i) => ({
  id: `lesson-${i + 1}`,
  title: `שיעור ${i + 1}`,
  completed: i < 5,
}));

export const MOCK_COURSES: MockCourse[] = [
  {
    id: 'course-intro-economics',
    title: 'מבוא לכלכלה',
    totalLessons: MOCK_LESSONS.length,
    completedLessons: MOCK_LESSONS.filter((l) => l.completed).length,
    lastAccessedIso: '2026-05-28T18:30:00.000Z',
  },
];

/** percent — אחוז שלם של התקדמות בקורס. */
export function coursePercent(course: MockCourse): number {
  if (course.totalLessons === 0) return 0;
  return Math.round((course.completedLessons / course.totalLessons) * 100);
}

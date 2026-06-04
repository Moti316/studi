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
  /** נקודת-כניסה ללימוד (route). ברירת-מחדל: דף-הקורס. */
  href?: string;
}

export const MOCK_LESSONS: MockLesson[] = Array.from({ length: 12 }, (_, i) => ({
  id: `lesson-${i + 1}`,
  title: `שיעור ${i + 1}`,
  completed: i < 5,
}));

export const MOCK_COURSES: MockCourse[] = [
  {
    id: 'course-safety-officer',
    title: 'ממונה בטיחות בעבודה',
    totalLessons: 11, // 11 פרקי תכנית-אתגר
    completedLessons: 7,
    lastAccessedIso: '2026-06-04T08:00:00.000Z',
    href: '/lesson/practice', // נגן-שיעור עם שאלות-אמת שיובאו (T1)
  },
];

/** percent — אחוז שלם של התקדמות בקורס. */
export function coursePercent(course: MockCourse): number {
  if (course.totalLessons === 0) return 0;
  return Math.round((course.completedLessons / course.totalLessons) * 100);
}

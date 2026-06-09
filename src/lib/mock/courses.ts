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

// מבנה 2-מיני-קורסים (הכרעת-מוטי 2026-06-09):
//   (1) "ממונה בטיחות בעבודה" = שו"ת רב-סוגי (NotebookLM · MCQ/matching/open · מקורפוס-החקיקה).
//   (2) "תרחישי וועדת הסמכה" = בנק-תרחישים מעוגן (NotebookLM-ground + Magen-author · 4-חלקים).
export const MOCK_COURSES: MockCourse[] = [
  {
    id: 'course-safety-officer',
    title: 'ממונה בטיחות בעבודה',
    totalLessons: 8, // 8 יחידות-נושא (mini-within-mini · COURSE_TOPICS)
    completedLessons: 0, // אין מעקב-התקדמות-אמת עדיין → 0 (לא אחוז-מדומה)
    lastAccessedIso: '2026-06-04T08:00:00.000Z',
    href: '/courses/safety-officer', // מיני-קורס השו"ת → מסך-נושאים (mini-within-mini)
  },
  {
    id: 'course-committee-scenarios',
    title: 'תרחישי וועדת הסמכה',
    totalLessons: 14, // בנק-תרחישים מעוגן (Magen + NotebookLM · 4-חלקים · G1–G5)
    completedLessons: 0,
    lastAccessedIso: '2026-06-09T12:00:00.000Z',
    href: '/lesson/scenarios', // מיני-קורס נפרד — scenario_walkthrough בלבד
  },
];

/** percent — אחוז שלם של התקדמות בקורס. */
export function coursePercent(course: MockCourse): number {
  if (course.totalLessons === 0) return 0;
  return Math.round((course.completedLessons / course.totalLessons) * 100);
}

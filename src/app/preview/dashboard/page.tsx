import type { Metadata } from 'next';
import { DashboardView } from '@/components/dashboard/DashboardView';
import type { MockUserProfile } from '@/lib/mock/user';
import { MOCK_COURSES } from '@/lib/mock/courses';

export const metadata: Metadata = {
  title: 'תצוגה — לוח הבקרה',
  robots: { index: false, follow: false },
};

/**
 * `/preview/dashboard` — תצוגת-עיצוב ללא-auth של מסך-הבית (DashboardView).
 *
 * נתוני-דמו "חיים" (רצף + XP + שיעור-הושלם) להצגת המהפך-העיצוב במלואו ולאימות-ויזואלי.
 * דטרמיניסטי (hour/today קבועים) — אין Date.now ברינדור.
 */
const DEMO_USER: MockUserProfile = {
  displayName: 'מוטי לוי',
  email: 'demo@studibuilder.dev',
  credits: 1500,
  xpToday: 15,
  xpDailyGoal: 20,
  lessonsToday: 1,
  lessonsDailyGoal: 1,
  streakDays: 12,
  level: 'מתקדם',
};

const DEMO_COURSES = MOCK_COURSES.map((c, i) =>
  i === 0 ? { ...c, completedLessons: 3 } : { ...c, completedLessons: 5 },
);

export default function PreviewDashboardPage() {
  // hour=9 → "בוקר טוב"; today=3 → יום ד' (להדגמת רצף).
  return <DashboardView user={DEMO_USER} courses={DEMO_COURSES} hour={9} today={3} />;
}

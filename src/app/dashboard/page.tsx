import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth/server';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { MOCK_USER_PROFILE } from '@/lib/mock/user';
import { MOCK_COURSES } from '@/lib/mock/courses';

export const metadata: Metadata = {
  title: 'לוח הבקרה',
};

/** תלוי-session — לא ניתן לרינדור-סטטי. */
export const dynamic = 'force-dynamic';

/**
 * `/dashboard` — מסך הבית של משתמש מחובר (מהפך-עיצוב StudiesGo-level · 2026-06-10).
 * הוויזואל ב-<DashboardView> (משותף עם /preview/dashboard · presentational).
 */
export default async function DashboardPage() {
  await requireAuth('/dashboard');

  // מוק עד Phase 4. הזמן נלקח מ-Date.now של ה-server (Jerusalem TZ).
  const now = new Date();
  return (
    <DashboardView
      user={MOCK_USER_PROFILE}
      courses={MOCK_COURSES}
      hour={now.getHours()}
      today={now.getDay()}
    />
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/server';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { GreetingBanner } from '@/components/dashboard/GreetingBanner';
import { UserHeaderStats } from '@/components/dashboard/UserHeaderStats';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { DailyProgressCard } from '@/components/dashboard/DailyProgressCard';
import { LevelBadge } from '@/components/dashboard/LevelBadge';
import { CourseCard } from '@/components/dashboard/CourseCard';
import { MOCK_USER_PROFILE } from '@/lib/mock/user';
import { MOCK_COURSES } from '@/lib/mock/courses';

export const metadata: Metadata = {
  title: 'לוח הבקרה',
};

/** תלוי-session — לא ניתן לרינדור-סטטי. */
export const dynamic = 'force-dynamic';

/**
 * `/dashboard` — מסך הבית של משתמש מחובר (Phase 2 skeleton).
 * מציג greeting + counters, CTA, רצף, יעדי-יום, ורשימת קורסים.
 */
export default async function DashboardPage() {
  await requireAuth('/dashboard');

  // מוק עד Phase 4. הזמן נלקח מ-Date.now של ה-server (Jerusalem TZ).
  const now = new Date();
  const today = now.getDay();
  const user = MOCK_USER_PROFILE;

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-5 p-4 pb-8">
        <header className="relative overflow-hidden rounded-modal bg-gradient-to-bl from-primary-50 via-white to-accent-50/50 px-4 py-5 shadow-card ring-1 ring-quiz-border">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full bg-accent-500/10 blur-2xl"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-12 -right-6 h-28 w-28 rounded-full bg-primary-500/10 blur-2xl"
          />
          <div className="relative flex items-start justify-between gap-3">
            <GreetingBanner name={user.displayName} hour={now.getHours()} />
            <UserHeaderStats
              credits={user.credits}
              xpToday={user.xpToday}
              streakDays={user.streakDays}
            />
          </div>
        </header>

        <StreakCard streakDays={user.streakDays} today={today} />

        <div className="grid grid-cols-2 gap-3">
          <DailyProgressCard
            title="XP היום"
            current={user.xpToday}
            goal={user.xpDailyGoal}
            encouragement={
              user.xpToday >= user.xpDailyGoal
                ? 'יעד-יום הושג!'
                : `עוד ${user.xpDailyGoal - user.xpToday} XP`
            }
          />
          <DailyProgressCard
            title="שיעורים היום"
            current={user.lessonsToday}
            goal={user.lessonsDailyGoal}
            encouragement={
              user.lessonsToday >= user.lessonsDailyGoal ? 'יעד-יום הושג!' : 'עוד אחד!'
            }
          />
        </div>

        <LevelBadge level={user.level} />

        <section aria-labelledby="active-courses-heading" className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 id="active-courses-heading" className="text-lg font-bold">
              הקורסים שלי
            </h2>
            <Link
              href="/courses"
              className="text-sm font-medium text-primary-600 underline-offset-4 hover:underline"
            >
              ראה הכל ←
            </Link>
          </header>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MOCK_COURSES.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

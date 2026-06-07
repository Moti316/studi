import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/server';
import { isCreator } from '@/lib/auth/creator';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { GreetingBanner } from '@/components/dashboard/GreetingBanner';
import { UserHeaderStats } from '@/components/dashboard/UserHeaderStats';
import { NewCourseCTA } from '@/components/dashboard/NewCourseCTA';
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
  // הפרדת פלטפורמה↔קורס: CTA "קורס חדש" הוא כלי-יצירה (פלטפורמה) ליוצר בלבד —
  // לומד בקורס-המשוּוָק אינו רואה אותו. (העדכון: מוטי, 2026-06-07.)
  const creator = await isCreator();

  // מוק עד Phase 4. הזמן נלקח מ-Date.now של ה-server (Jerusalem TZ).
  const now = new Date();
  const today = now.getDay();
  const user = MOCK_USER_PROFILE;

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-5 p-4 pb-8">
        <header className="flex items-start justify-between gap-3">
          <GreetingBanner name={user.displayName} hour={now.getHours()} />
          <UserHeaderStats
            credits={user.credits}
            xpToday={user.xpToday}
            streakDays={user.streakDays}
          />
        </header>

        {creator && <NewCourseCTA />}

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

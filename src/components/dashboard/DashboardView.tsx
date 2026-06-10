import Link from 'next/link';
import { Coins, Zap, Flame, Sparkles, ArrowLeft, ClipboardList } from 'lucide-react';
import { greetingByHour, type MockUserProfile } from '@/lib/mock/user';
import type { MockCourse } from '@/lib/mock/courses';
import { CountUp } from '@/components/ui/CountUp';
import { RingProgress } from '@/components/ui/RingProgress';
import { CourseCard } from '@/components/dashboard/CourseCard';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { cn } from '@/lib/utils';

interface Props {
  user: MockUserProfile;
  courses: MockCourse[];
  /** שעה (0-23) ל-greeting דטרמיניסטי. */
  hour: number;
  /** היום-בשבוע (0=ראשון). */
  today: number;
}

const DAY_LABELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

/**
 * DashboardView — מסך-הבית (מהפך-עיצוב StudiesGo-level · 2026-06-10).
 *
 * hero כהה-עוצמתי (gradient ink-blue + glow-orbs + mascot-float) · stat-chips זכוכית
 * עם count-up · טבעות-התקדמות מונפשות · רצועת-רצף בוהקת · CTA פרויקט-גמר.
 * presentational בלבד (מקבל profile+courses) → משמש גם /dashboard (auth) וגם /preview/dashboard.
 */
export function DashboardView({ user, courses, hour, today }: Props) {
  const streakActive = user.streakDays > 0;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-5 p-4 pb-10">
        {/* ───────────────── HERO — gradient כהה עם עומק ───────────────── */}
        <section className="relative overflow-hidden rounded-modal bg-gradient-to-bl from-primary-700 via-primary-600 to-primary-500 px-5 py-6 text-white shadow-button ring-1 ring-primary-700/20">
          {/* glow-orbs לעומק */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-accent-500/30 blur-3xl"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-white/15 blur-3xl"
          />
          {/* grid-pattern עדין */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(white 1px, transparent 1px), linear-gradient(to right, white 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/70">{greetingByHour(hour)},</p>
              <h1 className="text-3xl font-extrabold leading-tight">{user.displayName}</h1>
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/15 px-3 py-1 text-xs font-bold text-white ring-1 ring-inset ring-white/25 backdrop-blur">
                <Sparkles className="size-3.5 text-accent-100" aria-hidden="true" />
                רמה: {user.level}
              </span>
            </div>
            {/* mascot צף */}
            <div
              aria-hidden="true"
              className="grid size-16 shrink-0 animate-mascot-float place-items-center rounded-full bg-white/15 text-4xl ring-1 ring-inset ring-white/25 backdrop-blur"
            >
              🦺
            </div>
          </div>

          {/* stat-chips זכוכית עם count-up */}
          <div className="relative mt-5 grid grid-cols-3 gap-2.5">
            <HeroStat
              icon={<Coins className="size-4 text-accent-100" aria-hidden="true" />}
              value={user.credits}
              label="קרדיטים"
            />
            <HeroStat
              icon={<Zap className="size-4 text-accent-100" aria-hidden="true" />}
              value={user.xpToday}
              label="XP היום"
            />
            <HeroStat
              icon={
                <Flame
                  className={cn('size-4 text-accent-100', streakActive && 'animate-flame-pulse')}
                  aria-hidden="true"
                />
              }
              value={user.streakDays}
              label="ימי רצף"
            />
          </div>
        </section>

        {/* ───────────────── יעדי-יום — טבעות מונפשות ───────────────── */}
        <section aria-labelledby="goals-heading" className="space-y-3">
          <h2 id="goals-heading" className="px-1 text-lg font-bold text-quiz-text-primary">
            היעדים שלי היום
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <GoalRing
              title="XP היום"
              value={user.xpToday}
              goal={user.xpDailyGoal}
              color="var(--ring-fill)"
              done={user.xpToday >= user.xpDailyGoal}
              remainLabel={`עוד ${Math.max(0, user.xpDailyGoal - user.xpToday)} XP`}
            />
            <GoalRing
              title="שיעורים"
              value={user.lessonsToday}
              goal={user.lessonsDailyGoal}
              color="var(--ring-accent)"
              done={user.lessonsToday >= user.lessonsDailyGoal}
              remainLabel={
                user.lessonsToday >= user.lessonsDailyGoal ? 'יעד הושג!' : 'עוד שיעור אחד!'
              }
            />
          </div>
        </section>

        {/* ───────────────── רצף-למידה — רצועה בוהקת ───────────────── */}
        <section
          aria-labelledby="streak-heading"
          className={cn(
            'relative overflow-hidden rounded-card p-4 shadow-card ring-1',
            streakActive
              ? 'bg-gradient-to-bl from-accent-50 via-card to-card ring-accent-100'
              : 'bg-card ring-quiz-border',
          )}
        >
          <div className="flex items-center justify-between">
            <h2 id="streak-heading" className="text-base font-bold text-quiz-text-primary">
              רצף-למידה
            </h2>
            {streakActive && (
              <span className="flex items-center gap-1.5 text-sm font-extrabold text-accent-700">
                <Flame className="size-5 animate-flame-pulse text-accent-500" aria-hidden="true" />
                <CountUp value={user.streakDays} /> {user.streakDays === 1 ? 'יום' : 'ימים'}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-quiz-text-secondary">
            {streakActive
              ? 'הרצף נשמר גם כשטועים — כל יום של תרגול נחשב 🔥'
              : 'אין רצף עדיין — למד היום כדי להתחיל!'}
          </p>
          <ol className="mt-3 flex justify-between gap-1.5" aria-label="ימי השבוע">
            {DAY_LABELS.map((label, i) => {
              const isToday = i === today;
              // רצועה = השבוע-הנוכחי (א'-ש'): יום-שהושלם = לפני-היום (i<today) ובטווח-הרצף.
              // ימים-עתידיים-השבוע לעולם לא נדלקים. יום-ראשון (today=0) = תחילת-שבוע → 0 (תקין;
              // הרצף-המלא מוצג כמספר "<n> ימים" למעלה).
              const completed =
                streakActive && !isToday && i < today && today - i <= user.streakDays;
              return (
                <li
                  key={label}
                  aria-current={isToday ? 'date' : undefined}
                  className={cn(
                    'flex size-10 items-center justify-center rounded-full text-sm font-bold transition-transform',
                    isToday &&
                      'scale-110 bg-gradient-to-bl from-primary-500 to-primary-600 text-white shadow-button',
                    !isToday && completed && 'bg-accent-100 text-accent-700',
                    !isToday &&
                      !completed &&
                      'bg-background text-quiz-text-secondary ring-1 ring-quiz-border',
                  )}
                >
                  {completed ? (
                    <span aria-label={`יום ${label} — הושלם`}>
                      <span aria-hidden="true">🔥</span>
                    </span>
                  ) : (
                    <span aria-label={`יום ${label}`}>{label}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        {/* ───────────────── הקורסים שלי ───────────────── */}
        <section aria-labelledby="courses-heading" className="space-y-3">
          <header className="flex items-center justify-between px-1">
            <h2 id="courses-heading" className="text-lg font-bold text-quiz-text-primary">
              הקורסים שלי
            </h2>
            <Link
              href="/courses"
              className="flex items-center gap-1 rounded-button px-1.5 py-1 text-sm font-semibold text-primary-600 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            >
              ראה הכל
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
          </header>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>

        {/* ───────────────── CTA פרויקט-גמר ───────────────── */}
        <Link
          href="/capstone"
          data-testid="dashboard-capstone-cta"
          className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-modal bg-gradient-to-bl from-primary-600 to-primary-700 p-5 text-white shadow-button ring-1 ring-primary-700/30 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-8 -top-10 h-32 w-32 rounded-full bg-accent-500/25 blur-2xl"
          />
          <span className="relative flex items-center gap-3 text-start">
            <span className="grid size-12 shrink-0 place-items-center rounded-card bg-white/15 ring-1 ring-inset ring-white/25">
              <ClipboardList className="size-6 text-accent-100" aria-hidden="true" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-xs font-bold uppercase tracking-wide text-accent-100">
                פרויקט גמר
              </span>
              <span className="text-base font-extrabold">ניהול-סיכונים — בונה ה-JSA</span>
              <span className="text-xs text-white/70">
                טבלת-JSA · מטריצת-4×4 של משרד-העבודה · משוב-AI
              </span>
            </span>
          </span>
          <ArrowLeft
            className="relative size-6 shrink-0 text-accent-100 transition-transform group-hover:-translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </main>
      <BottomNav />
    </div>
  );
}

// ---------------------------------------------------------------------------
// תת-רכיבים
// ---------------------------------------------------------------------------

function HeroStat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-col items-center gap-0.5 rounded-card bg-white/10 px-2 py-2.5 text-center ring-1 ring-inset ring-white/15 backdrop-blur"
    >
      <span className="flex items-center gap-1 text-lg font-extrabold leading-none">
        {icon}
        <CountUp value={value} />
      </span>
      <span className="text-[11px] font-medium text-white/70">{label}</span>
    </div>
  );
}

function GoalRing({
  title,
  value,
  goal,
  color,
  done,
  remainLabel,
}: {
  title: string;
  value: number;
  goal: number;
  color: string;
  done: boolean;
  remainLabel: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-card p-4 shadow-card ring-1 transition-colors',
        done ? 'bg-success/5 ring-success/25' : 'bg-card ring-quiz-border',
      )}
    >
      <RingProgress
        value={value}
        goal={goal}
        size={64}
        color={done ? 'var(--ring-fill)' : color}
        label={`${title}: ${value} מתוך ${goal}`}
      >
        <CountUp value={value} className="text-base font-extrabold text-quiz-text-primary" />
        <span className="text-[10px] font-medium text-quiz-text-secondary">/{goal}</span>
      </RingProgress>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-quiz-text-primary">{title}</h3>
        <p
          role={done ? 'status' : undefined}
          className={cn(
            'mt-0.5 text-xs font-bold',
            done ? 'text-success' : 'font-medium text-quiz-text-secondary',
          )}
        >
          {done && (
            <span aria-hidden="true" className="me-0.5">
              ✓
            </span>
          )}
          {remainLabel}
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/server';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { CourseTopics } from '@/components/course/CourseTopics';
import { COURSE_TOPICS } from '@/lib/course/topics';
import { loadTopicCounts } from '@/lib/course/topic-counts';

export const metadata: Metadata = { title: 'ממונה בטיחות בעבודה' };
export const dynamic = 'force-dynamic';

/**
 * `/courses/safety-officer` — מסך מיני-קורס "ממונה בטיחות בעבודה", מחולק ל-8 יחידות-
 * נושא (mini-within-mini). כל יחידה → תרגול מסונן ל-scopes שלה. ספירות-אמת מה-DB.
 */
export default async function SafetyOfficerCoursePage() {
  await requireAuth('/courses/safety-officer');
  const counts = await loadTopicCounts();

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-4 pb-8">
        <header className="space-y-1">
          <span className="text-xs font-bold text-accent-600">מיני-קורס</span>
          <h1 className="text-2xl font-bold">ממונה בטיחות בעבודה</h1>
          <p className="text-foreground/60 text-sm">
            שו"ת רב-סוגי מקורפוס-החקיקה — מחולק לנושאים. כל נושא הוא יחידת-תרגול מעוגנת.
          </p>
        </header>

        <CourseTopics topics={COURSE_TOPICS} counts={counts} />

        {/* פרויקט-גמר (capstone · JSA) */}
        <Link
          href="/capstone"
          data-testid="capstone-entry"
          className="flex items-center justify-between gap-3 rounded-card border border-quiz-border bg-quiz-explanation px-4 py-4 transition-colors hover:border-quiz-primary-active"
        >
          <span className="flex flex-col gap-0.5 text-start">
            <span className="text-sm font-bold text-quiz-text-primary">
              📋 פרויקט גמר — ניהול-סיכונים (JSA)
            </span>
            <span className="text-xs text-quiz-text-secondary">
              בנה טבלת-JSA, הערך לפי מטריצת-4×4 של משרד-העבודה, וקבל משוב-AI
            </span>
          </span>
          <span aria-hidden="true" className="text-lg font-bold text-accent-600">
            ←
          </span>
        </Link>
      </main>
      <BottomNav />
    </div>
  );
}

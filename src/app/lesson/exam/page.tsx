import type { Metadata } from 'next';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { questions, type Question } from '../../../../drizzle/schema';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { ExamPlayer } from '@/features/exam/ExamPlayer';
import { EXAM_QUESTION_COUNT, EXAM_DURATION_MIN, EXAM_PASS_PCT } from '@/features/exam/exam-core';

export const metadata: Metadata = { title: 'מבחן-דמה' };

/** דגימה-אקראית + session → דינמי. */
export const dynamic = 'force-dynamic';

/**
 * `/lesson/exam` — מבחן-הסמכה-דמה (D3): 30 שאלות-אמריקאיות אקראיות מהבנק-המעוגן ·
 * 60 דקות · ציון-עובר 70 · אפס-משוב-תוך-כדי · סקירת-טעויות בסוף.
 * route-סטטי (גובר על `/lesson/[id]`).
 */
export default async function ExamPage() {
  await requireAuth('/lesson/exam');

  const qs: Question[] = await db
    .select()
    .from(questions)
    .where(and(eq(questions.inScope, true), inArray(questions.type, ['mcq_long', 'mcq_short'])))
    .orderBy(sql`random()`)
    .limit(EXAM_QUESTION_COUNT);

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-4 pb-8">
        <header className="space-y-1">
          <span className="text-xs font-bold text-accent-600">מבחן-דמה</span>
          <h1 className="text-2xl font-bold">סימולציית מבחן-הסמכה</h1>
          <p className="text-foreground/60 text-sm">
            {EXAM_QUESTION_COUNT} שאלות · {EXAM_DURATION_MIN} דקות · ציון-עובר {EXAM_PASS_PCT} — כמו
            ביום-האמת.
          </p>
        </header>
        <ExamPlayer questions={qs} />
      </main>
      <BottomNav />
    </div>
  );
}

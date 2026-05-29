import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireAuth } from '@/lib/auth/server';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { CourseCard } from '@/components/dashboard/CourseCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { MOCK_COURSES } from '@/lib/mock/courses';

export const metadata: Metadata = {
  title: 'הקורסים שלי',
};

export const dynamic = 'force-dynamic';

/**
 * `/courses` — רשימת כל הקורסים של המשתמש. כניסה לקורס → רשימת שיעורים
 * (תיבנה ב-Phase 5).
 */
export default async function CoursesPage() {
  await requireAuth('/courses');
  const courses = MOCK_COURSES;
  const isEmpty = courses.length === 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-4 pb-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">הקורסים שלי</h1>
          {!isEmpty && (
            <Button asChild variant="primary" size="sm">
              <Link href="/create">
                <Plus className="size-4" aria-hidden="true" />
                <span>קורס חדש</span>
              </Link>
            </Button>
          )}
        </header>

        {isEmpty ? (
          <EmptyState
            title="אין לך עדיין קורסים"
            description="צור קורס ראשון מתוך מסמך שלך והתחל ללמוד תוך דקות."
            action={
              <Button asChild variant="gradient" size="lg">
                <Link href="/create">
                  <Plus className="size-4" aria-hidden="true" />
                  <span>צור קורס</span>
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

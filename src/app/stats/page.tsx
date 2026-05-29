import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth/server';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { MOCK_USER_PROFILE } from '@/lib/mock/user';

export const metadata: Metadata = {
  title: 'סטטיסטיקות',
};

export const dynamic = 'force-dynamic';

/**
 * `/stats` — מסך-סטטיסטיקות. Phase 2 = empty state בלבד.
 * הגרפים (XP-over-time, streak heatmap, accuracy radar) ייבנו ב-Phase 9.
 */
export default async function StatsPage() {
  await requireAuth('/stats');
  const user = MOCK_USER_PROFILE;

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-4 pb-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">התקדמות</h1>
          <p className="text-foreground/60 text-sm">
            אהלן {user.displayName.split(' ')[0]}, המסע שלך בלמידה במבט אחד.
          </p>
        </header>

        <EmptyState
          pose="happy"
          title="עוד אין הרבה לדווח 🚀"
          description="בוא נתחיל ללמוד והסטטיסטיקות יתמלאו כאן: XP יומי, רצף-ימים, אחוז-דיוק, ושעות הלמידה המועדפות עליך."
        />
      </main>
      <BottomNav />
    </div>
  );
}

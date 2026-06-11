import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth/server';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { LegislationLibrary } from '@/components/legislation/LegislationLibrary';
import {
  LEGISLATION_CHAPTERS,
  LEGISLATION_BY_TOPIC,
  LEGISLATION_TOTAL,
} from '@/lib/legislation/catalog';

export const metadata: Metadata = {
  title: 'ספריית החקיקה',
};

export const dynamic = 'force-dynamic';

/**
 * `/legislation` — ספריית-החקיקה: כל 42 נוסחי-החוק והתקנות של קורס ממונה-הבטיחות,
 * מסודרים ב-4 פרקים (חוק > תקנותיו) עם חיפוש-מהיר. מסך-נפרד תחת אותה כניסה, נגיש
 * מהטאב החמישי ב-BottomNav. מקור-הנתונים: legislation-manifest (42 · מאומת L1–L5).
 */
export default async function LegislationPage() {
  await requireAuth('/legislation');

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-4 pb-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">ספריית החקיקה</h1>
          <p className="text-foreground/60 text-sm">
            כל החוקים והתקנות של מבחן-ההסמכה — חוק › תקנותיו, עם קישור לנוסח-המלא.
          </p>
        </header>

        <LegislationLibrary
          chapters={LEGISLATION_CHAPTERS}
          topicShelves={LEGISLATION_BY_TOPIC}
          total={LEGISLATION_TOTAL}
        />
      </main>
      <BottomNav />
    </div>
  );
}

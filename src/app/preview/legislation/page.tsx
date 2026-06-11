/**
 * /preview/legislation — תצוגה-מקדימה זמנית (ציבורית · dev) של ספריית-החקיקה החדשה
 * (מדפים-מתקפלים · StudiesGo), להדגמה למוטי לפני המסך-המוגן `/legislation`.
 */
import { LegislationLibrary } from '@/components/legislation/LegislationLibrary';
import {
  LEGISLATION_CHAPTERS,
  LEGISLATION_BY_TOPIC,
  LEGISLATION_TOTAL,
} from '@/lib/legislation/catalog';

export const dynamic = 'force-dynamic';

export default function PreviewLegislationPage() {
  return (
    <main dir="rtl" className="mx-auto min-h-screen max-w-2xl space-y-4 px-4 py-8 font-hebrew">
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
  );
}

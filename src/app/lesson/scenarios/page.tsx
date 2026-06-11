import type { Metadata } from 'next';
import { asc, eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { simulations } from '../../../../drizzle/schema';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { ScenarioLab } from '@/features/simulation/ScenarioLab';
import type { Simulation } from '@/features/simulation/types';
import bank from '@/features/simulation/data/committee-sim-bank.json';
import verdicts from '@/features/simulation/data/committee-sim-bank.verify.json';

export const metadata: Metadata = {
  title: 'תרחישי וועדת-הסמכה',
};

/** תלוי-session + DB → רינדור-דינמי. */
export const dynamic = 'force-dynamic';

/**
 * `/lesson/scenarios` — מיני-קורס "תרחישי וועדת-הסמכה" (בלוק-5 · ADR-016).
 *
 * route-סטטי (גובר על `/lesson/[id]`): סימולציות-וועדה אינטראקטיביות (3 מפקחים ·
 * 4 שלבים · ציון 0-100) במקום ה-walkthrough הסטטי. מקור: טבלת-`simulations`
 * (status='מאומת' · `pnpm sim:import --execute`); fallback לבנק-הסטטי-המאומת
 * (אם ה-DB ריק/לא-זמין) — הלומד לעולם לא רואה מסך-ריק.
 */
export default async function ScenariosPage() {
  await requireAuth('/lesson/scenarios');

  let sims: Simulation[] = [];
  try {
    const rows = await db
      .select()
      .from(simulations)
      .where(eq(simulations.status, 'מאומת'))
      .orderBy(asc(simulations.branch), asc(simulations.title));
    sims = rows.map((r) => r.data as Simulation);
  } catch {
    // DB לא-זמין — ניפול ל-bank (resilience · אותו-תוכן-מאומת).
  }

  if (sims.length === 0) {
    const okTitles = new Set(
      (verdicts as { title: string; overallOk: boolean }[])
        .filter((v) => v.overallOk)
        .map((v) => v.title),
    );
    sims = (bank as Simulation[]).filter((s) => okTitles.has(s.title));
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-4 pb-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">תרחישי וועדת-הסמכה</h1>
          <p className="text-foreground/60 text-sm">
            תרגול-הוועדה האמיתי: דיאלוג-חי מול שלושה מפקחים, ענף-אחר-ענף.
          </p>
        </header>
        <ScenarioLab sims={sims} />
      </main>
      <BottomNav />
    </div>
  );
}

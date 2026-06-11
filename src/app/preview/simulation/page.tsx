/**
 * /preview/simulation — תצוגה-מקדימה (dev · ציבורי) של מיני-קורס תרחישי-הוועדה.
 *
 * מרנדר את <ScenarioLab> עם הבנק-הסטטי-המאומת (committee-sim-bank · 11 מאומתים) —
 * אותו-תוכן כמו `/lesson/scenarios` המוגן, בלי auth/DB. להדגמה למוטי בכל-מכונה.
 */
import { ScenarioLab } from '@/features/simulation/ScenarioLab';
import type { Simulation } from '@/features/simulation/types';
import bank from '@/features/simulation/data/committee-sim-bank.json';
import verdicts from '@/features/simulation/data/committee-sim-bank.verify.json';

export const dynamic = 'force-dynamic';

export default function PreviewSimulationPage() {
  const okTitles = new Set(
    (verdicts as { title: string; overallOk: boolean }[])
      .filter((v) => v.overallOk)
      .map((v) => v.title),
  );
  const sims = (bank as Simulation[]).filter((s) => okTitles.has(s.title));

  return (
    <main dir="rtl" className="mx-auto min-h-screen max-w-2xl bg-background px-4 py-8 font-hebrew">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-quiz-text-secondary">
          תצוגה-מקדימה (dev)
        </p>
        <h1 className="text-lg font-extrabold text-quiz-text-primary">
          תרחישי וועדת-הסמכה · בנק-מלא
        </h1>
      </div>
      <ScenarioLab sims={sims} />
    </main>
  );
}

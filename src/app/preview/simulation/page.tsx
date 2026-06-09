/**
 * /preview/simulation — תצוגה-מקדימה זמנית של סימולציית-הוועדה (ADR-016 · vertical-slice).
 *
 * מרנדר את <SimulationPlayer> עם תרחיש-מחובר מ-`.cache/notebooklm/simulations/sim-loto.json`
 * (תוצר חיבור-Claude+פרומפט-מגן). **ציבורי · dev-preview בלבד** — להדגמה למוטי לפני שילוב
 * ב-`/lesson/scenarios` המוגן. אם ה-fixture חסר → הודעה.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SimulationPlayer } from '@/features/simulation/SimulationPlayer';
import type { Simulation } from '@/features/simulation/types';

export const dynamic = 'force-dynamic';

function loadSim(): Simulation | null {
  try {
    const raw = readFileSync(
      join(process.cwd(), '.cache', 'notebooklm', 'simulations', 'sim-loto.json'),
      'utf8',
    );
    return JSON.parse(raw) as Simulation;
  } catch {
    return null;
  }
}

export default function PreviewSimulationPage() {
  const sim = loadSim();
  return (
    <main dir="rtl" className="mx-auto min-h-screen max-w-2xl bg-quiz-bg/30 px-4 py-8 font-hebrew">
      {sim ? (
        <SimulationPlayer simulation={sim} />
      ) : (
        <p className="rounded-card border border-quiz-border bg-white px-4 py-3 text-start text-sm text-quiz-text-secondary">
          התרחיש-המחובר טרם נוצר (`.cache/notebooklm/simulations/sim-loto.json`). הרץ את
          author-simulation Workflow.
        </p>
      )}
    </main>
  );
}

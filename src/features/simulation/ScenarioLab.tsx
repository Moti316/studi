'use client';

/**
 * <ScenarioLab> — מיני-קורס "תרחישי וועדת-הסמכה" (בלוק-5 · ADR-016 · B1).
 *
 * בוחר-סימולציות: רשימת כרטיסי-ענף (כל-סימולציה = ועדה-מלאה: 3 מפקחים · 4 שלבים ·
 * ציון 0-100) → לחיצה פותחת את <SimulationPlayer>. "חזרה לרשימה" בכל-עת.
 * presentational (מקבל sims) → משמש גם `/lesson/scenarios` (auth · DB) וגם
 * `/preview/simulation` (dev · bank-סטטי).
 */

import { useState } from 'react';
import { ChevronLeft, ArrowRight, Gavel } from 'lucide-react';
import { SimulationPlayer } from './SimulationPlayer';
import type { Simulation } from './types';

export interface ScenarioLabProps {
  sims: readonly Simulation[];
}

export function ScenarioLab({ sims }: ScenarioLabProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const active = activeIdx !== null ? sims[activeIdx] : null;

  // ── נגן-סימולציה פעיל ──
  if (active) {
    return (
      <div dir="rtl" className="flex flex-col gap-4 font-hebrew" data-testid="scenario-lab-player">
        <button
          type="button"
          data-testid="lab-back-btn"
          onClick={() => setActiveIdx(null)}
          className="inline-flex w-fit items-center gap-1.5 rounded-pill border border-quiz-border bg-card px-4 py-2 text-sm font-semibold text-quiz-text-secondary transition-colors hover:border-primary-500 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <ArrowRight aria-hidden="true" className="size-4" />
          חזרה לרשימת-התרחישים
        </button>
        {/* key מאלץ ריסט-נגן במעבר-סימולציה */}
        <SimulationPlayer key={activeIdx} simulation={active} />
      </div>
    );
  }

  // ── empty-state (DB ריק + אין fallback) ──
  if (sims.length === 0) {
    return (
      <div
        dir="rtl"
        role="status"
        data-testid="scenario-lab-empty"
        className="flex flex-col items-center gap-3 rounded-card border border-quiz-border bg-card px-6 py-12 text-center font-hebrew"
      >
        <span aria-hidden="true" className="text-4xl">
          ⚖️
        </span>
        <p className="text-base font-bold text-quiz-text-primary">אין סימולציות זמינות עדיין</p>
        <p className="text-sm text-quiz-text-secondary">בנק-התרחישים בייבוא. נסו שוב בקרוב.</p>
      </div>
    );
  }

  // ── רשימת-הבחירה ──
  return (
    <div dir="rtl" className="flex flex-col gap-4 font-hebrew" data-testid="scenario-lab">
      {/* hero-הסבר (תבנית-B1) */}
      <section className="relative overflow-hidden rounded-modal bg-gradient-to-bl from-primary-700 via-primary-600 to-primary-500 px-5 py-5 text-white shadow-button ring-1 ring-primary-700/20">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-8 -top-10 h-32 w-32 rounded-full bg-accent-500/25 blur-3xl"
        />
        <div className="relative flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-card bg-white/15 ring-1 ring-inset ring-white/25 backdrop-blur"
          >
            <Gavel className="size-5 text-accent-100" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-extrabold leading-tight">סימולציית וועדת-ההסמכה</h2>
            <p className="text-sm leading-relaxed text-white/80">
              שלושה מפקחים — טכני, גיהותי ורגולטורי — בדיאלוג-חי בארבעה שלבים, עד "השאלה האכזרית".
              בחר ענף והתחל. ציון 0–100.
            </p>
          </div>
        </div>
      </section>

      <ol className="flex flex-col gap-3" role="list" aria-label="תרחישי-ועדה לפי ענף">
        {sims.map((sim, i) => (
          <li key={sim.title}>
            <button
              type="button"
              data-testid={`sim-card-${i}`}
              onClick={() => setActiveIdx(i)}
              className="group flex w-full items-center gap-3 rounded-card border border-quiz-border bg-card p-4 text-start shadow-card transition-all hover:-translate-y-0.5 hover:border-primary-500/40 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="inline-flex w-fit items-center rounded-pill bg-accent-50 px-2.5 py-0.5 text-[11px] font-bold text-[#7a4d00] ring-1 ring-inset ring-accent-100">
                  {sim.branch}
                </span>
                <span className="text-sm font-extrabold leading-snug text-quiz-text-primary">
                  {sim.title}
                </span>
                <span className="line-clamp-2 text-xs leading-relaxed text-quiz-text-secondary">
                  {sim.intro}
                </span>
              </span>
              <ChevronLeft
                aria-hidden="true"
                className="size-5 shrink-0 text-quiz-text-secondary transition-transform group-hover:-translate-x-0.5"
              />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

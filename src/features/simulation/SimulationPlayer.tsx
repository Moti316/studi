'use client';

/**
 * <SimulationPlayer> — נגן סימולציית-וועדת-ההסמכה (ADR-016).
 *
 * מציג דיאלוג צ'אט-כמו בין 3 המפקחים (טכני/גיהותי/רגולטורי) למועמד: כל תור =
 * הודעת-מפקח + בחירות-מועמד; הבחירה מציגה משוב-מפקח (+ ציטוט-חקיקה) ומתקדמת לתור-הבא,
 * עד מסך-ציון (0-100 + חולשות + פירוק-פר-שלב). מונע ע"י `SimulationEngine` (כרגע
 * `PrebakedEngine` · פרה-בנוי · אפס-runtime) — אותו חוזה ישרת גם את LiveEngine העתידי.
 *
 * RTL-first · design-tokens בלבד · a11y (aria-live לשיח · כפתורים native).
 */
import { useMemo, useState, type ReactNode } from 'react';
import type { Simulation, SimTurn, SimResponse, SimResult, Inspector } from './types';
import { PrebakedEngine, INSPECTOR_LABELS } from './engine';

const INSPECTOR_ICON: Record<Inspector, string> = {
  technical: '🔧',
  hygiene: '⚗️',
  regulatory: '⚖️',
};

interface HistoryEntry {
  turn: SimTurn;
  optionText: string;
  good: boolean;
  response: SimResponse;
}

export type SimulationPlayerProps = {
  simulation: Simulation;
  /** נקרא פעם-אחת בסיום, עם הציון. */
  onComplete?: (result: SimResult) => void;
};

function InspectorBubble({ turn, children }: { turn: SimTurn; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5" data-testid={`turn-${turn.id}`}>
      <span className="flex items-center gap-2 text-xs font-bold text-accent-700">
        <span
          aria-hidden="true"
          className="grid size-7 place-items-center rounded-full bg-accent-50 text-base ring-1 ring-inset ring-accent-100"
        >
          {INSPECTOR_ICON[turn.inspector]}
        </span>
        {INSPECTOR_LABELS[turn.inspector]}
      </span>
      <div className="rounded-card rounded-ss-none border border-quiz-border bg-card px-4 py-3 text-start text-sm leading-relaxed text-quiz-text-primary shadow-card">
        {children}
      </div>
    </div>
  );
}

export function SimulationPlayer({ simulation, onComplete }: SimulationPlayerProps) {
  const engine = useMemo(() => new PrebakedEngine(simulation), [simulation]);
  const [current, setCurrent] = useState<SimTurn | null>(() => engine.start());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [result, setResult] = useState<SimResult | null>(null);

  function choose(idx: number) {
    if (!current) return;
    const option = current.options[idx];
    if (!option) return;
    const response = engine.respond(current.id, idx);
    setHistory((h) => [
      ...h,
      { turn: current, optionText: option.text, good: option.quality === 'good', response },
    ]);
    if (response.done) {
      const r = engine.result();
      setResult(r);
      setCurrent(null);
      onComplete?.(r);
    } else {
      setCurrent(response.nextTurn);
    }
  }

  return (
    <section
      dir="rtl"
      data-testid="simulation-player"
      data-done={result ? 'true' : 'false'}
      className="flex flex-col gap-4 font-hebrew text-quiz-text-primary"
    >
      {/* ── סצנת-פתיחה ── */}
      <header className="flex flex-col gap-1">
        <span className="text-xs font-bold text-accent-600">
          סימולציית-וועדה · {simulation.branch}
        </span>
        <h2 data-testid="simulation-title" className="text-xl font-extrabold leading-snug">
          {simulation.title}
        </h2>
        <p className="rounded-card bg-quiz-explanation px-4 py-3 text-start text-sm leading-relaxed text-quiz-text-secondary">
          {simulation.intro}
        </p>
      </header>

      {/* ── היסטוריית-השיח ── */}
      <div className="flex flex-col gap-4" aria-live="polite">
        {history.map((h, i) => (
          <div key={i} className="flex flex-col gap-2">
            <InspectorBubble turn={h.turn}>{h.turn.prompt}</InspectorBubble>
            {/* תשובת-המועמד (בועה מיושרת-התחלה-הפוכה) */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-bold text-quiz-text-secondary">התשובה שלך</span>
              <div className="max-w-[85%] rounded-card rounded-se-none bg-gradient-to-bl from-primary-500 to-primary-600 px-4 py-2 text-start text-sm font-medium text-white shadow-button">
                {h.optionText}
              </div>
            </div>
            {/* משוב-המפקח */}
            <div
              data-testid={`feedback-${h.turn.id}`}
              className={`flex flex-col gap-1 rounded-card border px-4 py-2 text-start text-sm leading-relaxed ${
                h.good
                  ? 'border-quiz-success-border bg-quiz-success-bg'
                  : 'border-quiz-border bg-quiz-bg'
              }`}
            >
              <span className={`text-xs font-bold ${h.good ? 'text-success' : 'text-accent-600'}`}>
                {h.good ? '✓ ' : '↩ '}
                {INSPECTOR_LABELS[h.turn.inspector]}
              </span>
              <p className="text-quiz-text-primary">{h.response.feedback}</p>
              {h.response.citation && (
                <span className="text-xs font-bold text-quiz-text-secondary">
                  📖 {h.response.citation}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── התור-הנוכחי + בחירות ── */}
      {current && (
        <div className="flex flex-col gap-3">
          <InspectorBubble turn={current}>{current.prompt}</InspectorBubble>
          <div className="flex flex-col gap-2" role="group" aria-label="בחר את תשובתך">
            {current.options.map((o, idx) => (
              <button
                key={idx}
                type="button"
                data-testid={`option-${idx}`}
                onClick={() => choose(idx)}
                className="w-full select-none rounded-card border border-quiz-border bg-card px-4 py-3 text-start text-sm font-medium leading-snug text-quiz-text-primary shadow-card transition-all hover:-translate-y-0.5 hover:border-primary-500/50 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
              >
                {o.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── מסך-ציון-סופי ── */}
      {result && (
        <div
          data-testid="simulation-result"
          role="status"
          aria-live="polite"
          className="flex flex-col gap-3 rounded-card border border-quiz-border bg-quiz-bg px-4 py-4"
        >
          <p className="text-base font-extrabold">
            ציון-הסימולציה:{' '}
            <span data-testid="simulation-score" className="text-accent-600">
              {result.score}/100
            </span>
          </p>
          {result.perCriterion.length > 0 && (
            <ul className="flex flex-col gap-1.5" role="list" aria-label="פירוק-פר-שלב">
              {result.perCriterion.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-start text-sm">
                  <span className="text-quiz-text-primary">{c.name}</span>
                  <span className="font-bold text-quiz-text-secondary">{c.score}/100</span>
                </li>
              ))}
            </ul>
          )}
          {result.weaknesses.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-accent-600">לחיזוק:</span>
              <ul className="flex list-disc flex-col gap-1 pe-5 text-start text-sm text-quiz-text-secondary">
                {result.weaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

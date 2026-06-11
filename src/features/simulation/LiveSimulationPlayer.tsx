'use client';

/**
 * <LiveSimulationPlayer> — נגן סימולציית-וועדה **פתוחה-חיה** (ADR-018 · LiveEngine).
 *
 * כל תור = המפקח שואל → המועמד מקליד תשובה-חופשית (textarea) → server-action → Claude
 * (פרומפט-מגן) מעריך ומגיב **כמפקח** (משוב + partial-credit + הערת-אימון + ציון-פר-תור),
 * מתקדם על 4 השלבים, עד דו"ח-סיום (0-100 + חולשות + 3 חיזוקים). בלי-מפתח → fallback
 * דטרמיניסטי (ה-action מטפל). RTL · design-tokens · a11y (aria-live · native textarea).
 */
import { useState, useTransition } from 'react';
import type { LiveFinalReport } from './live-types';
import { initLiveState, toInput, applyResult, runningScore, type LiveState } from './live-engine';
import { respondLiveAction } from './respond-live.action';
import { InspectorBubble } from './InspectorBubble';
import { INSPECTOR_LABELS } from './engine';

const QUALITY_BADGE: Record<'good' | 'partial' | 'poor', { icon: string; cls: string }> = {
  good: { icon: '✓', cls: 'border-quiz-success-border bg-quiz-success-bg' },
  partial: { icon: '≈', cls: 'border-quiz-border bg-quiz-explanation' },
  poor: { icon: '↩', cls: 'border-quiz-border bg-quiz-bg' },
};

export type LiveSimulationPlayerProps = {
  branch: string;
  title: string;
  intro: string;
  onComplete?: (result: LiveFinalReport) => void;
};

export function LiveSimulationPlayer({
  branch,
  title,
  intro,
  onComplete,
}: LiveSimulationPlayerProps) {
  const [state, setState] = useState<LiveState>(() => initLiveState(branch));
  const [draft, setDraft] = useState('');
  const [pending, startTransition] = useTransition();

  function submit() {
    const answer = draft.trim();
    if (!answer || pending || state.done) return;
    const input = toInput(state, answer);
    startTransition(async () => {
      const res = await respondLiveAction(input);
      setState((s) => applyResult(s, answer, res));
      setDraft('');
      if (res.done && res.finalReport) onComplete?.(res.finalReport);
    });
  }

  const score = runningScore(state.transcript);
  // הכרזת-קורא-מסך מבודדת: רק התור-האחרון-שהוערך (תגובת-המפקח) + השאלה-הבאה.
  const lastTurn = state.transcript[state.transcript.length - 1];

  return (
    <section
      dir="rtl"
      data-testid="live-simulation-player"
      data-done={state.done ? 'true' : 'false'}
      className="flex flex-col gap-4 font-hebrew text-quiz-text-primary"
    >
      {/* ── סצנת-פתיחה + ציון-רץ ── */}
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-accent-600">סימולציית-וועדה חיה · {branch}</span>
          {state.transcript.length > 0 && (
            <span
              data-testid="live-running-score"
              className="rounded-pill bg-quiz-explanation px-3 py-1 text-xs font-bold text-primary-600"
            >
              ציון-רץ {score}/100
            </span>
          )}
        </div>
        <h2 data-testid="live-simulation-title" className="text-xl font-extrabold leading-snug">
          {title}
        </h2>
        <p className="rounded-card bg-quiz-explanation px-4 py-3 text-start text-sm leading-relaxed text-quiz-text-secondary">
          {intro}
        </p>
      </header>

      {/* ── הכרזת-a11y מבודדת (sr-only · aria-live) — רק התגובה-האחרונה + השאלה-הבאה ── */}
      <div data-testid="live-announcer" aria-live="polite" className="sr-only">
        {lastTurn?.reply ?? ''}
        {!state.done && state.question ? ` ${state.question}` : ''}
      </div>

      {/* ── היסטוריית-השיח (ללא aria-live — אחרת קורא-המסך מכריז-מחדש את כל השיחה בכל תור) ── */}
      <div className="flex flex-col gap-4">
        {state.transcript.map((t, i) => {
          const badge = QUALITY_BADGE[t.quality ?? 'partial'];
          return (
            <div key={i} className="flex flex-col gap-2">
              <InspectorBubble inspector={t.inspector}>{t.question}</InspectorBubble>
              {/* תשובת-המועמד */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-bold text-quiz-text-secondary">התשובה שלך</span>
                <div className="max-w-[85%] whitespace-pre-wrap rounded-card rounded-se-none bg-gradient-to-bl from-primary-500 to-primary-600 px-4 py-2 text-start text-sm font-medium text-white shadow-button">
                  {t.answer}
                </div>
              </div>
              {/* תגובת-המפקח */}
              {t.reply && (
                <div
                  data-testid={`live-feedback-${i}`}
                  className={`flex flex-col gap-1 rounded-card border px-4 py-2 text-start text-sm leading-relaxed ${badge.cls}`}
                >
                  <span className="flex items-center justify-between text-xs font-bold text-accent-600">
                    <span>
                      {badge.icon} {INSPECTOR_LABELS[t.inspector]}
                    </span>
                    {t.mode && (
                      <span className="font-medium text-quiz-text-secondary">[{t.mode}]</span>
                    )}
                  </span>
                  <p className="whitespace-pre-wrap text-quiz-text-primary">{t.reply}</p>
                </div>
              )}
              {/* הערת-אימון (מחוץ-לדמות) */}
              {t.coaching && (
                <div className="rounded-card border-s-4 border-accent-500 bg-accent-50 px-4 py-2 text-start text-xs leading-relaxed text-quiz-text-secondary">
                  🦺 {t.coaching}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── התור-הנוכחי (textarea) ── */}
      {!state.done && (
        <div className="flex flex-col gap-3">
          <InspectorBubble inspector={state.inspector} testId="live-current-turn">
            {state.question}
          </InspectorBubble>
          {pending ? (
            <p
              data-testid="live-thinking"
              role="status"
              aria-live="polite"
              className="rounded-card border border-quiz-border bg-quiz-bg px-4 py-3 text-start text-sm text-quiz-text-secondary"
            >
              המפקחים מתייעצים…
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <label htmlFor="live-answer" className="sr-only">
                התשובה שלך
              </label>
              <textarea
                id="live-answer"
                data-testid="live-answer-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
                }}
                rows={4}
                placeholder="כתוב את תשובתך המלאה… (Ctrl+Enter לשליחה)"
                className="w-full resize-y rounded-card border border-quiz-border bg-white px-4 py-3 text-start text-sm leading-relaxed text-quiz-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
              />
              <button
                type="button"
                data-testid="live-submit"
                onClick={submit}
                disabled={!draft.trim()}
                className="self-start rounded-pill bg-gradient-to-bl from-primary-500 to-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-button transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                שלח תשובה
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── דו"ח-סיום ── */}
      {state.done && state.result && (
        <div
          data-testid="live-result"
          role="status"
          aria-live="polite"
          className="flex flex-col gap-3 rounded-card border border-quiz-border bg-quiz-bg px-4 py-4"
        >
          <p className="text-base font-extrabold">
            ציון-הסימולציה:{' '}
            <span data-testid="live-score" className="text-accent-600">
              {state.result.score}/100
            </span>
          </p>
          {state.result.weaknesses.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-accent-600">חולשות שזוהו:</span>
              <ul className="flex list-disc flex-col gap-1 pe-5 text-start text-sm text-quiz-text-secondary">
                {state.result.weaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-success">3 פעולות-חיזוק:</span>
            <ol
              data-testid="live-strengthening"
              className="flex list-decimal flex-col gap-1 pe-5 text-start text-sm text-quiz-text-primary"
            >
              {state.result.strengtheningActions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}

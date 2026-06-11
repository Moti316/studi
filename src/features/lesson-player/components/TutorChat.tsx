'use client';

/**
 * <TutorChat> — מורה-AI על שאלת-שיעור (בלוק-4 · B1 design).
 *
 * הלומד שואל שאלת-המשך חופשית על השאלה → askTutorAction (Claude author-model · corpus-grounded
 * · fallback) → תשובת-מורה. שיח פשוט (שאלה→תשובה, חוזר). RTL · design-tokens · a11y.
 *
 * @see ../tutor-explain.action.ts
 */

import { useId, useRef, useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { askTutorAction, type TutorResponse } from '../tutor-explain.action';

export interface TutorChatProps {
  /** השאלה בשיעור (הקשר למורה). */
  questionPrompt: string;
  /** התשובה-הנכונה (הקשר · אופציונלי). */
  correctAnswer?: string;
  /** נושא/תווית (אופציונלי). */
  topic?: string;
}

interface Exchange {
  q: string;
  a: string;
  source: TutorResponse['source'];
}

export function TutorChat({ questionPrompt, correctAnswer, topic }: TutorChatProps) {
  const [draft, setDraft] = useState('');
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const liveRef = useRef<HTMLDivElement>(null);

  async function handleAsk() {
    const q = draft.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setDraft('');
    try {
      const res = await askTutorAction({ questionPrompt, correctAnswer, topic, userQuestion: q });
      setExchanges((prev) => [...prev, { q, a: res.answer, source: res.source }]);
    } catch {
      // ה-action לעולם לא זורק; הגנה-נוספת.
      setError('המורה אינו זמין כרגע. נסה שוב בעוד רגע.');
      setDraft(q);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      dir="rtl"
      data-testid="tutor-chat"
      aria-label="מורה-AI"
      className="flex flex-col gap-3 rounded-card border border-quiz-border bg-quiz-bg p-4 font-hebrew"
    >
      {/* ── כותרת ── */}
      <header className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-card bg-gradient-to-bl from-primary-500 to-primary-600 text-white shadow-button"
        >
          <Sparkles className="size-4" />
        </span>
        <div className="flex flex-col">
          <h3 className="text-sm font-extrabold text-quiz-text-primary">מורה-AI</h3>
          <p className="text-[11px] text-quiz-text-secondary">
            שאל כל דבר על השאלה — ההסבר מעוגן-חומר
          </p>
        </div>
      </header>

      {/* ── שיח ── */}
      {exchanges.length > 0 && (
        <ul className="flex flex-col gap-3" data-testid="tutor-exchanges">
          {exchanges.map((ex, i) => (
            <li key={i} className="flex flex-col gap-2">
              {/* שאלת-הלומד */}
              <p className="self-end rounded-card rounded-se-sm bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 ring-1 ring-inset ring-primary-100">
                {ex.q}
              </p>
              {/* תשובת-המורה */}
              <div className="flex items-start gap-2 self-start">
                <span aria-hidden="true" className="mt-1 text-base">
                  🎓
                </span>
                <p
                  data-testid={`tutor-answer-${i}`}
                  className="whitespace-pre-line rounded-card rounded-ss-sm bg-card px-3 py-2 text-sm leading-relaxed text-quiz-text-primary shadow-card ring-1 ring-inset ring-quiz-border"
                >
                  {ex.a}
                  {ex.source === 'fallback' && (
                    <span className="mt-1 block text-[11px] italic text-quiz-text-secondary">
                      (תשובה בסיסית — המורה-החי אינו זמין כעת)
                    </span>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ── מצב-טעינה ── */}
      {loading && (
        <div
          ref={liveRef}
          aria-live="polite"
          data-testid="tutor-loading"
          className="flex items-center gap-2 self-start text-sm text-quiz-text-secondary"
        >
          <span aria-hidden="true" className="animate-pulse text-base">
            🎓
          </span>
          המורה חושב…
        </div>
      )}

      {/* ── שגיאה ── */}
      {error && (
        <p role="alert" data-testid="tutor-error" className="text-xs font-semibold text-error">
          {error}
        </p>
      )}

      {/* ── קלט ── */}
      <div className="flex items-end gap-2">
        <label htmlFor={inputId} className="sr-only">
          שאל את המורה
        </label>
        <textarea
          id={inputId}
          data-testid="tutor-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void handleAsk();
            }
          }}
          rows={2}
          placeholder='מה לא התברר? לדוגמה: למה צמ"א הוא אחרון במדרג?'
          disabled={loading}
          className="min-h-[44px] flex-1 resize-y rounded-card border border-quiz-border bg-card px-3 py-2 text-sm text-quiz-text-primary placeholder:text-quiz-text-secondary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-60"
        />
        <button
          type="button"
          data-testid="tutor-ask-btn"
          onClick={() => void handleAsk()}
          disabled={loading || draft.trim().length === 0}
          aria-label="שאל את המורה"
          className="flex shrink-0 select-none items-center gap-1.5 rounded-pill bg-gradient-to-bl from-primary-500 to-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-button transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="size-4" aria-hidden="true" />
          שאל
        </button>
      </div>
    </section>
  );
}

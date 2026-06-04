'use client';

import { useState } from 'react';
// type-only — מבוטל בקומפילציה (ללא import-runtime של ה-action/db בעת-render; קריטי לטסטים).
import type { DeepExplanationResult } from '../deep-explanation.action';

type Status = 'idle' | 'loading' | 'done' | 'error';

/**
 * <DeepExplanationButton> — כפתור "הסבר לעומק". בלחיצה מפעיל Server Action שמאחזר
 * מקורות-חקיקה (RAG · pgvector) ומחבר הסבר מעוגן + ציטוט-מקור. on-demand (עולה כסף).
 */
export function DeepExplanationButton({ questionId }: { questionId: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<DeepExplanationResult | null>(null);

  async function handleClick() {
    setStatus('loading');
    try {
      // dynamic-import: ה-action (וכך db/Gemini) נטען רק בלחיצה, לא בעת-render.
      const { generateDeepExplanation } = await import('../deep-explanation.action');
      const r = await generateDeepExplanation(questionId);
      setResult(r);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done' && result) {
    return (
      <section
        dir="rtl"
        aria-label="הסבר לעומק מבוסס-חקיקה"
        data-testid="deep-explanation"
        className="rounded-card border border-quiz-border bg-quiz-explanation px-4 py-3 text-start"
      >
        <p className="mb-1 text-xs font-bold text-quiz-primary-active">
          ✨ הסבר לעומק (מבוסס-חקיקה)
        </p>
        <p className="text-sm leading-relaxed text-quiz-text-primary">{result.explanation}</p>
        {result.sources.length > 0 && (
          <p className="mt-2 text-xs text-quiz-text-secondary">
            מקורות:{' '}
            {result.sources
              .map((s) => (s.scopeIds.length ? `${s.title} (§${s.scopeIds.join(', ')})` : s.title))
              .join(' · ')}
          </p>
        )}
      </section>
    );
  }

  return (
    <div dir="rtl" className="text-start">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === 'loading'}
        data-testid="deep-explanation-button"
        className="inline-flex items-center gap-1 rounded-pill border border-quiz-border bg-quiz-bg px-4 py-2 text-sm font-bold text-quiz-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active disabled:opacity-60"
      >
        {status === 'loading' ? 'מחפש במקורות…' : '✨ הסבר לעומק'}
      </button>
      {status === 'error' && (
        <p role="alert" className="mt-1 text-xs text-quiz-text-secondary">
          לא ניתן להפיק הסבר כרגע — נסו שוב.
        </p>
      )}
    </div>
  );
}

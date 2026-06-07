'use client';

import { useState } from 'react';
import type { Question } from '../../../../drizzle/schema';
import type { QuestionResult } from './types';
import { DeepExplanationButton } from './DeepExplanationButton';

/**
 * <ExplanationCard> — נגן לשאלת `explanation` (שו"ת פתוח) ולכל סוג ללא-נגן-ייעודי.
 * זרימת active-recall: מציג את השאלה → "הצג תשובה" → חושף את תשובת-המודל
 * (correct_answer:{text} שמגיע מבנק-השו"ת, או explanation) → "הסבר לעומק" (RAG) → "המשך".
 * "המשך" מדווח correct=true כדי שלולאת-השיעור תתקדם (read-card אינו "נכשל").
 */

/** מחלץ טקסט-תשובת-מודל: correct_answer:{text} (בנק-שו"ת) או explanation (rationale). */
function modelAnswer(question: Question): string | null {
  const ca: unknown = question.correctAnswer;
  if (ca && typeof ca === 'object' && 'text' in ca) {
    const t = (ca as { text?: unknown }).text;
    if (typeof t === 'string' && t.trim().length > 0) return t;
  }
  if (typeof question.explanation === 'string' && question.explanation.trim().length > 0) {
    return question.explanation;
  }
  return null;
}

export function ExplanationCard({
  question,
  onResult,
  disabled,
}: {
  question: Question;
  onResult: (result: QuestionResult) => void;
  disabled: boolean;
}) {
  const answer = modelAnswer(question);
  const [revealed, setRevealed] = useState(false);

  return (
    <div dir="rtl" data-testid="explanation-card" className="flex flex-col gap-3 font-hebrew">
      <p className="text-start text-lg font-bold leading-relaxed text-quiz-text-primary">
        {question.prompt}
      </p>

      {/* תשובת-המודל — מוסתרת עד "הצג תשובה" (active-recall) */}
      {answer &&
        (revealed ? (
          <div
            data-testid="model-answer"
            className="rounded-card border border-quiz-success-border bg-quiz-success-bg px-3 py-2 text-start"
          >
            <p className="mb-1 text-xs font-bold text-success">✓ תשובת-מודל</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-quiz-text-primary">
              {answer}
            </p>
          </div>
        ) : (
          <button
            type="button"
            data-testid="reveal-answer"
            onClick={() => setRevealed(true)}
            className="self-start rounded-pill border border-quiz-border bg-quiz-bg px-4 py-2 text-sm font-bold text-quiz-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
          >
            הצג תשובה
          </button>
        ))}

      <DeepExplanationButton questionId={question.id} />

      <button
        type="button"
        data-testid="explanation-continue"
        disabled={disabled}
        onClick={() => onResult({ correct: true })}
        className="w-full select-none rounded-pill bg-quiz-primary-active py-4 text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active disabled:opacity-60"
      >
        הבנתי, המשך
      </button>
    </div>
  );
}

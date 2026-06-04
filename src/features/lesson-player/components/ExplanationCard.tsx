'use client';

import type { Question } from '../../../../drizzle/schema';
import type { QuestionResult } from './types';
import { DeepExplanationButton } from './DeepExplanationButton';

/**
 * <ExplanationCard> — נגן לשאלת `explanation` (שו"ת פתוח) ולכל סוג ללא-נגן-ייעודי.
 * מציג: השאלה + תשובת-המודל (אם קיימת) + "הסבר לעומק" (RAG מעוגן-חקיקה) + "הבנתי, המשך".
 * "המשך" מדווח correct=true כדי שלולאת-השיעור תתקדם (read-card אינו "נכשל" ולא תוקע).
 */
export function ExplanationCard({
  question,
  onResult,
  disabled,
}: {
  question: Question;
  onResult: (result: QuestionResult) => void;
  disabled: boolean;
}) {
  return (
    <div dir="rtl" data-testid="explanation-card" className="flex flex-col gap-3 font-hebrew">
      <p className="text-start text-lg font-bold leading-relaxed text-quiz-text-primary">
        {question.prompt}
      </p>
      {question.explanation && (
        <p className="rounded-card bg-quiz-explanation px-3 py-2 text-start text-sm leading-relaxed text-quiz-text-primary">
          {question.explanation}
        </p>
      )}
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

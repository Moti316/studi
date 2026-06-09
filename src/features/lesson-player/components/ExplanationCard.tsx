'use client';

import { useState } from 'react';
import type { Question } from '../../../../drizzle/schema';
import type { QuestionResult } from './types';
import { gradeOpenAnswer, type OpenGrade, type OpenGradeResult } from '@/lib/grading/keyword-match';
import { DeepExplanationButton } from './DeepExplanationButton';

/**
 * <ExplanationCard> — נגן לשאלת `explanation` (שו"ת-פתוח · בחינת-ועדה אוֹרָלית).
 *
 * זרימת active-recall (העדכון: מוטי 2026-06-07):
 *   1. הלומד **כותב** את תשובתו בשדה-טקסט.
 *   2. "בדוק תשובה" → המערכת מזהה מילות-מפתח ונותנת **ציון-עצמי** (נכונה/חלקית/לא-נכונה),
 *      חושפת את תשובת-המודל + "הסבר לעומק" המוטמע.
 *   3. "המשך" → מתקדם לשאלה הבאה **בלי משוב-MCQ** (שו"ת אינו "נכשל" ואין +XP-overlay
 *      של "תשובה נכונה"; זה שמור לשאלות-אמריקאיות).
 */

/** מחלץ טקסט-תשובת-מודל מ-correct_answer:{text}. */
function modelAnswer(question: Question): string | null {
  const ca: unknown = question.correctAnswer;
  if (ca && typeof ca === 'object' && 'text' in ca) {
    const t = (ca as { text?: unknown }).text;
    if (typeof t === 'string' && t.trim().length > 0) return t;
  }
  return null;
}

const GRADE_UI: Record<OpenGrade, { label: string; cls: string; icon: string }> = {
  correct: {
    label: 'תשובה נכונה',
    cls: 'border-quiz-success-border bg-quiz-success-bg text-success',
    icon: '✓',
  },
  partial: {
    label: 'תשובה חלקית',
    cls: 'border-accent-300 bg-accent-50 text-accent-700',
    icon: '◐',
  },
  incorrect: {
    label: 'כדאי לחזור על החומר',
    cls: 'border-quiz-border bg-quiz-bg text-quiz-text-secondary',
    icon: '✗',
  },
};

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
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState<OpenGradeResult | null>(null);
  const revealed = result !== null;
  const grade = result?.grade ?? null;

  function handleCheck() {
    if (!answer) return;
    setResult(gradeOpenAnswer(draft, answer));
  }

  function handleContinue() {
    onResult({ correct: grade === 'correct', openGrade: grade ?? 'partial' });
  }

  return (
    <div dir="rtl" data-testid="explanation-card" className="flex flex-col gap-3 font-hebrew">
      <p className="text-start text-lg font-bold leading-relaxed text-quiz-text-primary">
        {question.prompt}
      </p>

      {/* שלב-כתיבה (active-recall) — רק כשיש תשובת-מודל להשוואה */}
      {answer && !revealed && (
        <>
          <textarea
            data-testid="open-answer-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={disabled}
            rows={3}
            placeholder="כתוב את תשובתך כאן…"
            aria-label="כתוב את תשובתך"
            className="w-full resize-y rounded-card border border-quiz-border bg-white px-3 py-2 text-start text-sm leading-relaxed text-quiz-text-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-quiz-primary-active"
          />
          <button
            type="button"
            data-testid="check-answer"
            disabled={disabled}
            onClick={handleCheck}
            className="self-start rounded-pill bg-quiz-primary-active px-5 py-2 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active disabled:opacity-60"
          >
            בדוק תשובה
          </button>
        </>
      )}

      {/* שלב-חשיפה: התשובה-שלך (נשארת) + מידת-קשר + תשובת-מודל */}
      {revealed && result && grade && (
        <>
          {/* התשובה-שלך — נשמרת גלויה להשוואה (בקשת-מוטי) */}
          <div
            data-testid="your-answer"
            className="rounded-card border border-quiz-border bg-quiz-bg px-3 py-2 text-start"
          >
            <p className="mb-1 text-xs font-bold text-quiz-text-secondary">התשובה שלך</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-quiz-text-primary">
              {draft.trim() || '— (לא נכתבה תשובה)'}
            </p>
          </div>

          <p
            data-testid="open-grade"
            className={`flex items-center gap-2 rounded-card border px-3 py-2 text-sm font-bold ${GRADE_UI[grade].cls}`}
          >
            <span aria-hidden="true">{GRADE_UI[grade].icon}</span>
            {GRADE_UI[grade].label}
            {result.total > 0 && (
              <span className="font-normal">
                · נגעת ב-{result.matched} מתוך {result.total} מושגי-מפתח
              </span>
            )}
          </p>

          {/* "ראה את הקשר" — מושגי-מפתח שכוסו/הוחמצו (מנגון-הקשר הדטרמיניסטי) */}
          {result.total > 0 && (
            <div
              data-testid="key-concepts"
              className="flex flex-col gap-1.5 rounded-card border border-quiz-border bg-white px-3 py-2"
            >
              <p className="text-xs font-bold text-quiz-text-secondary">מושגי-מפתח בתשובת-המודל</p>
              <div className="flex flex-wrap gap-1.5">
                {result.matchedWords.map((w) => (
                  <span
                    key={`m-${w}`}
                    className="rounded-full border border-quiz-success-border bg-quiz-success-bg px-2 py-0.5 text-xs font-medium text-success"
                  >
                    ✓ {w}
                  </span>
                ))}
                {result.missedWords.map((w) => (
                  <span
                    key={`x-${w}`}
                    className="rounded-full border border-quiz-border bg-quiz-bg px-2 py-0.5 text-xs font-medium text-quiz-text-secondary"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          {answer && (
            <div
              data-testid="model-answer"
              className="rounded-card border border-quiz-success-border bg-quiz-success-bg px-3 py-2 text-start"
            >
              <p className="mb-1 text-xs font-bold text-success">תשובת-מודל</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-quiz-text-primary">
                {answer}
              </p>
            </div>
          )}
          <DeepExplanationButton explanation={question.explanation} />
        </>
      )}

      {/* "המשך" — זמין מיד כשאין מה לכתוב (אין תשובת-מודל), אחרת רק אחרי חשיפה */}
      {(revealed || !answer) && (
        <button
          type="button"
          data-testid="explanation-continue"
          disabled={disabled}
          onClick={handleContinue}
          className="w-full select-none rounded-pill bg-quiz-primary-active py-4 text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active disabled:opacity-60"
        >
          המשך
        </button>
      )}
    </div>
  );
}

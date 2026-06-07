'use client';

import { useState } from 'react';

/**
 * <DeepExplanationButton> — חושף "הסבר לעומק" מעוגן-חקיקה.
 *
 * ⚡ ההסבר **מוטמע-מראש** ב-questions.explanation (נוצר offline ע"י
 * scripts/precompute-explanations.ts) ומגיע כ-prop — לכן החשיפה **מיידית ואפס-Gemini
 * בזמן-ריצה** (אין קריאת-רשת/AI, אין תלות ב-GEMINI_API_KEY בפרודקשן). שאלה ללא
 * הסבר-מוטמע (עדיין לא חושב) פשוט לא מציגה את הכפתור.
 */
export function DeepExplanationButton({ explanation }: { explanation: string | null }) {
  const [open, setOpen] = useState(false);

  if (!explanation || explanation.trim().length === 0) return null;

  if (open) {
    return (
      <section
        dir="rtl"
        aria-label="הסבר לעומק מבוסס-חקיקה"
        data-testid="deep-explanation"
        className="rounded-card border border-quiz-border bg-quiz-explanation px-4 py-3 text-start"
      >
        <p className="mb-1 text-xs font-bold text-quiz-primary-active">✨ הסבר לעומק (מבוסס-חקיקה)</p>
        <p className="whitespace-pre-line text-sm leading-relaxed text-quiz-text-primary">
          {explanation}
        </p>
      </section>
    );
  }

  return (
    <div dir="rtl" className="text-start">
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="deep-explanation-button"
        className="inline-flex items-center gap-1 rounded-pill border border-quiz-border bg-quiz-bg px-4 py-2 text-sm font-bold text-quiz-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
      >
        ✨ הסבר לעומק
      </button>
    </div>
  );
}

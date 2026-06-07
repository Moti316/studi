import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExplanationCard } from '@/features/lesson-player/components/ExplanationCard';
import type { Question } from '../../../drizzle/schema';

// ה-DeepExplanationButton טוען db/Gemini ב-dynamic-import בלחיצה — לא בעת-render,
// אך נמקמק אותו כדי שהטסט יישאר טהור-UI.
vi.mock('@/features/lesson-player/components/DeepExplanationButton', () => ({
  DeepExplanationButton: () => null,
}));

function q(over: Partial<Question> = {}): Question {
  return {
    id: 'q1',
    type: 'explanation',
    prompt: 'על מי חלה האחריות?',
    correctAnswer: { text: 'ממונה בטיחות\nמפקח עבודה' },
    explanation: null,
    // שאר-השדות אינם נדרשים ע"י הרכיב.
    ...over,
  } as Question;
}

describe('ExplanationCard — active-recall reveal', () => {
  it('מסתיר את התשובה עד "הצג תשובה", ואז חושף את תשובת-המודל', () => {
    render(<ExplanationCard question={q()} onResult={vi.fn()} disabled={false} />);
    expect(screen.queryByTestId('model-answer')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('reveal-answer'));
    expect(screen.getByTestId('model-answer')).toHaveTextContent('ממונה בטיחות');
  });

  it('explanation אינו משמש כתשובת-מודל (שמור להסבר-לעומק הנפרד)', () => {
    render(
      <ExplanationCard
        question={q({ correctAnswer: null, explanation: 'הסבר-לעומק מוטמע' })}
        onResult={vi.fn()}
        disabled={false}
      />,
    );
    // אין correct_answer:{text} → אין כפתור "הצג תשובה" (ה-explanation מוצג בנפרד).
    expect(screen.queryByTestId('reveal-answer')).not.toBeInTheDocument();
  });

  it('ללא תשובה כלל → אין כפתור-חשיפה (רק "הבנתי, המשך")', () => {
    render(
      <ExplanationCard
        question={q({ correctAnswer: null, explanation: null })}
        onResult={vi.fn()}
        disabled={false}
      />,
    );
    expect(screen.queryByTestId('reveal-answer')).not.toBeInTheDocument();
    expect(screen.getByTestId('explanation-continue')).toBeInTheDocument();
  });

  it('"הבנתי, המשך" מדווח correct=true', () => {
    const onResult = vi.fn();
    render(<ExplanationCard question={q()} onResult={onResult} disabled={false} />);
    fireEvent.click(screen.getByTestId('explanation-continue'));
    expect(onResult).toHaveBeenCalledWith({ correct: true });
  });
});

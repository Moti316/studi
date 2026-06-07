import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExplanationCard } from '@/features/lesson-player/components/ExplanationCard';
import type { Question } from '../../../drizzle/schema';

vi.mock('@/features/lesson-player/components/DeepExplanationButton', () => ({
  DeepExplanationButton: () => null,
}));

function q(over: Partial<Question> = {}): Question {
  return {
    id: 'q1',
    type: 'explanation',
    prompt: 'מי אחראי לבירור תאונות עבודה?',
    correctAnswer: { text: 'מפקח עבודה, ממונה בטיחות וועדת בטיחות' },
    explanation: null,
    ...over,
  } as Question;
}

describe('ExplanationCard — זרימת שו"ת (כתיבה→בדיקה→חשיפה→המשך)', () => {
  it('מתחיל בשדה-כתיבה ו-"בדוק תשובה" (אין "המשך" עד חשיפה)', () => {
    render(<ExplanationCard question={q()} onResult={vi.fn()} disabled={false} />);
    expect(screen.getByTestId('open-answer-input')).toBeInTheDocument();
    expect(screen.getByTestId('check-answer')).toBeInTheDocument();
    expect(screen.queryByTestId('explanation-continue')).not.toBeInTheDocument();
    expect(screen.queryByTestId('model-answer')).not.toBeInTheDocument();
  });

  it('"בדוק תשובה" חושף ציון-עצמי + תשובת-מודל + "המשך"', () => {
    render(<ExplanationCard question={q()} onResult={vi.fn()} disabled={false} />);
    fireEvent.change(screen.getByTestId('open-answer-input'), {
      target: { value: 'מפקח עבודה, ממונה בטיחות, וועדת בטיחות' },
    });
    fireEvent.click(screen.getByTestId('check-answer'));
    expect(screen.getByTestId('open-grade')).toHaveTextContent('נכונה');
    expect(screen.getByTestId('model-answer')).toHaveTextContent('מפקח עבודה');
    expect(screen.getByTestId('explanation-continue')).toBeInTheDocument();
  });

  it('תשובה לא-קשורה → ציון "לא-נכונה" (אך עדיין חושף את המודל)', () => {
    render(<ExplanationCard question={q()} onResult={vi.fn()} disabled={false} />);
    fireEvent.change(screen.getByTestId('open-answer-input'), {
      target: { value: 'צבע כחול' },
    });
    fireEvent.click(screen.getByTestId('check-answer'));
    expect(screen.getByTestId('open-grade')).toHaveTextContent('לחזור');
    expect(screen.getByTestId('model-answer')).toBeInTheDocument();
  });

  it('"המשך" מדווח openGrade (בלי משוב-MCQ)', () => {
    const onResult = vi.fn();
    render(<ExplanationCard question={q()} onResult={onResult} disabled={false} />);
    fireEvent.change(screen.getByTestId('open-answer-input'), {
      target: { value: 'מפקח עבודה ממונה בטיחות וועדת בטיחות' },
    });
    fireEvent.click(screen.getByTestId('check-answer'));
    fireEvent.click(screen.getByTestId('explanation-continue'));
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ openGrade: 'correct', correct: true }),
    );
  });

  it('ללא תשובת-מודל → כרטיס-קריאה: "המשך" מיידי (ללא שדה-כתיבה)', () => {
    const onResult = vi.fn();
    render(
      <ExplanationCard
        question={q({ correctAnswer: null })}
        onResult={onResult}
        disabled={false}
      />,
    );
    expect(screen.queryByTestId('open-answer-input')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('explanation-continue'));
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ openGrade: 'partial' }));
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonPlayer } from '@/features/lesson-player/LessonPlayer';
import type { Question } from '../../../drizzle/schema';
import type { ScenarioInput } from '@/features/lesson-player/components/types';

function scenarioQ(id = 's1'): Question {
  return {
    id,
    type: 'scenario_walkthrough',
    prompt: 'תרחיש',
    correctAnswer: null,
    explanation: null,
    scenarioId: 'sc1',
  } as Question;
}

const SCENARIO: ScenarioInput = {
  title: 'נפילה מפיגום',
  background: 'עובד נפל מפיגום ללא גידור.',
  data: null,
  task: 'נתח את האירוע והמלץ על בקרות.',
  solution: 'יש לגדר את הפיגום בגובה מעל 2 מ׳ (אזן יד/תיכון/לוח רגל).',
  rubric: [{ criterion: 'זיהוי מפגע — היעדר גידור', points: 1 }],
};

describe('LessonPlayer — חיווט תרחישים (scenario_walkthrough)', () => {
  it('עם נתוני-תרחיש → ScenarioWalkthrough (לא read-card)', () => {
    render(<LessonPlayer questions={[scenarioQ()]} scenarios={{ s1: SCENARIO }} />);
    expect(screen.getByTestId('scenario-walkthrough')).toBeInTheDocument();
    expect(screen.queryByTestId('explanation-card')).not.toBeInTheDocument();
  });

  it('חוסר נתוני-תרחיש → read-card fallback', () => {
    render(<LessonPlayer questions={[scenarioQ()]} scenarios={{}} />);
    expect(screen.getByTestId('explanation-card')).toBeInTheDocument();
    expect(screen.queryByTestId('scenario-walkthrough')).not.toBeInTheDocument();
  });

  it('סיום-תרחיש מתקדם **בלי** משוב-MCQ (openGrade bypass → summary)', () => {
    render(<LessonPlayer questions={[scenarioQ()]} scenarios={{ s1: SCENARIO }} />);
    fireEvent.click(screen.getByTestId('reveal-button')); // work → review
    fireEvent.click(screen.getByTestId('finish-button')); // review → onResult → ANSWER_OPEN
    // שאלה-אחרונה → summary; ללא overlay נכון/שגוי.
    expect(screen.getByTestId('lesson-summary')).toBeInTheDocument();
    expect(screen.queryByTestId('feedback-correct')).not.toBeInTheDocument();
    expect(screen.queryByTestId('feedback-wrong')).not.toBeInTheDocument();
  });
});

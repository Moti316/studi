/**
 * Tests for <LessonPlayer> — the lesson orchestrator.
 *
 * Mirrors MatchingPairs.test (framer-motion fully mocked to plain elements).
 *
 * Covers:
 * - routing by question.type (mcq_long / mcq_short / matching / fallback)
 * - sequence advance + correct/wrong feedback
 * - scoring + accumulated XP + streak
 * - summary screen with totals
 * - empty state
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type FramerMotion from 'framer-motion';
import { LessonPlayer, XP_PER_CORRECT } from '@/features/lesson-player/LessonPlayer';
import type { Question } from '../../../drizzle/schema';

// ─── Framer Motion mock: render motion.* as plain elements (no animation) ──────
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof FramerMotion>('framer-motion');
  const React = await import('react');

  const makeMotion = (tag: string) => {
    const MotionMock = React.forwardRef(
      (
        {
          children,
          className,
          onClick,
          onKeyDown,
          role,
          tabIndex,
          'aria-label': ariaLabel,
          'aria-pressed': ariaPressed,
          'aria-disabled': ariaDisabled,
          'aria-modal': ariaModal,
          'aria-hidden': ariaHidden,
          'aria-live': ariaLive,
          'aria-current': ariaCurrent,
          'data-testid': dataTestId,
          disabled,
          type,
          ..._rest
        }: React.HTMLAttributes<HTMLElement> & {
          'aria-pressed'?: boolean | 'false' | 'true';
          'aria-disabled'?: boolean | string;
          'aria-modal'?: boolean | string;
          'aria-hidden'?: boolean | string;
          'aria-live'?: string;
          'aria-current'?: string;
          'data-testid'?: string;
          disabled?: boolean;
          type?: string;
          variants?: unknown;
          initial?: unknown;
          animate?: unknown;
          exit?: unknown;
          transition?: unknown;
          whileTap?: unknown;
          layout?: unknown;
          layoutId?: unknown;
        },
        ref: React.Ref<HTMLElement>,
      ) => {
        const props: Record<string, unknown> = {
          className,
          onClick,
          onKeyDown,
          ref,
          'data-testid': dataTestId,
        };
        if (role !== undefined) props['role'] = role;
        if (tabIndex !== undefined) props['tabIndex'] = tabIndex;
        if (ariaLabel !== undefined) props['aria-label'] = ariaLabel;
        if (ariaPressed !== undefined) props['aria-pressed'] = ariaPressed;
        if (ariaDisabled !== undefined) props['aria-disabled'] = ariaDisabled;
        if (ariaModal !== undefined) props['aria-modal'] = ariaModal;
        if (ariaHidden !== undefined) props['aria-hidden'] = ariaHidden;
        if (ariaLive !== undefined) props['aria-live'] = ariaLive;
        if (ariaCurrent !== undefined) props['aria-current'] = ariaCurrent;
        if (disabled !== undefined) props['disabled'] = disabled;
        if (type !== undefined) props['type'] = type;
        return React.createElement(tag, props, children);
      },
    );
    MotionMock.displayName = `Motion(${tag})`;
    return MotionMock;
  };

  return {
    ...actual,
    motion: {
      div: makeMotion('div'),
      button: makeMotion('button'),
      ul: makeMotion('ul'),
      li: makeMotion('li'),
      span: makeMotion('span'),
      header: makeMotion('header'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// ─── Test data factory ─────────────────────────────────────────────────────────

let qSeq = 0;
function makeQuestion(overrides: Partial<Question>): Question {
  qSeq += 1;
  return {
    id: `q-${qSeq}`,
    type: 'mcq_long',
    prompt: `שאלה ${qSeq}`,
    options: ['א', 'ב', 'ג', 'ד'],
    correctAnswer: { index: 0 },
    explanation: null,
    sourceChunkId: null,
    scenarioId: null,
    scopeRefs: [],
    inScope: true,
    status: 'מאומת',
    difficulty: null,
    sourceRef: null,
    createdAt: new Date(),
    ...overrides,
  } as Question;
}

const MCQ_LONG = (over: Partial<Question> = {}) => makeQuestion({ type: 'mcq_long', ...over });
const MCQ_SHORT = (over: Partial<Question> = {}) =>
  makeQuestion({ type: 'mcq_short', options: ['א', 'ב', 'ג', 'ד'], ...over });
const MATCHING = (over: Partial<Question> = {}) =>
  makeQuestion({
    type: 'matching',
    prompt: 'התאם',
    options: [
      { left: 'הגדרה 1', right: 'מונח 1' },
      { left: 'הגדרה 2', right: 'מונח 2' },
    ],
    correctAnswer: null,
    ...over,
  });

/** Answer the currently-shown MCQ by clicking option `idx` then "בדוק תשובה". */
function answerMcq(idx: number) {
  fireEvent.click(screen.getByTestId(`mcq-option-${idx}`));
  fireEvent.click(screen.getByTestId('check-answer-button'));
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('LessonPlayer', () => {
  // ── Empty state ──
  it('מציג empty-state כשאין שאלות', () => {
    render(<LessonPlayer questions={[]} />);
    expect(screen.getByTestId('lesson-empty')).toBeInTheDocument();
  });

  // ── Routing ──
  it('mcq_long → מנתב ל-MCQ (מציג prompt + 4 אפשרויות)', () => {
    render(<LessonPlayer questions={[MCQ_LONG()]} />);
    expect(screen.getByTestId('mcq-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('mcq-option-0')).toBeInTheDocument();
    expect(screen.getByTestId('mcq-option-3')).toBeInTheDocument();
  });

  it('mcq_short → מנתב ל-MCQ (מציג prompt + אפשרויות)', () => {
    render(<LessonPlayer questions={[MCQ_SHORT({ prompt: 'קצרה' })]} />);
    expect(screen.getByTestId('mcq-prompt')).toHaveTextContent('קצרה');
    expect(screen.getByTestId('mcq-option-0')).toBeInTheDocument();
  });

  it('matching → מנתב ל-MatchingPairs (מציג כרטיסי-התאמה)', () => {
    render(<LessonPlayer questions={[MATCHING()]} />);
    expect(screen.getByTestId('right-card-0')).toBeInTheDocument();
    expect(screen.getByTestId('left-card-0')).toBeInTheDocument();
  });

  it('type explanation → ExplanationCard (prompt + "הבנתי, המשך")', () => {
    render(<LessonPlayer questions={[MCQ_LONG({ type: 'explanation' as Question['type'] })]} />);
    expect(screen.getByTestId('explanation-card')).toBeInTheDocument();
    expect(screen.getByTestId('explanation-continue')).toBeInTheDocument();
  });

  it('matching עם options פגום → ExplanationCard (read-card)', () => {
    render(<LessonPlayer questions={[MATCHING({ options: ['not', 'pairs'] })]} />);
    expect(screen.getByTestId('explanation-card')).toBeInTheDocument();
  });

  // ── Correct feedback + scoring ──
  it('תשובה נכונה → XP-floater + ניקוד מצטבר ב-header', () => {
    render(<LessonPlayer questions={[MCQ_LONG({ correctAnswer: { index: 1 } })]} />);
    answerMcq(1);
    expect(screen.getByTestId('feedback-correct')).toBeInTheDocument();
    expect(screen.getByTestId('xp-floater')).toBeInTheDocument();
    // header XP updated
    expect(screen.getByTestId('xp-counter')).toHaveTextContent(String(XP_PER_CORRECT));
  });

  // ── Wrong feedback ──
  it('תשובה שגויה → bottom-sheet + mascot + התשובה הנכונה', () => {
    render(
      <LessonPlayer
        questions={[
          MCQ_LONG({ options: ['אלף', 'בית', 'גימל', 'דלת'], correctAnswer: { index: 2 } }),
        ]}
      />,
    );
    answerMcq(0); // wrong (correct is 2)
    expect(screen.getByTestId('feedback-wrong')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-mascot')).toBeInTheDocument();
    expect(screen.getByTestId('correct-answer-text')).toHaveTextContent('גימל');
  });

  it('תשובה שגויה אינה מוסיפה XP', () => {
    render(<LessonPlayer questions={[MCQ_LONG({ correctAnswer: { index: 2 } })]} />);
    answerMcq(0);
    expect(screen.getByTestId('xp-counter')).toHaveTextContent('0');
  });

  // ── Sequence advance ──
  it('המשך אחרי שאלה ראשונה → מציג את השאלה השנייה', () => {
    render(
      <LessonPlayer
        questions={[
          MCQ_LONG({ prompt: 'ראשונה', correctAnswer: { index: 0 } }),
          MCQ_LONG({ prompt: 'שנייה', correctAnswer: { index: 0 } }),
        ]}
      />,
    );
    expect(screen.getByTestId('mcq-prompt')).toHaveTextContent('ראשונה');
    answerMcq(0);
    fireEvent.click(screen.getByTestId('continue-button'));
    expect(screen.getByTestId('mcq-prompt')).toHaveTextContent('שנייה');
  });

  // ── Summary ──
  it('סיום כל השאלות → מסך-סיכום עם ניקוד-כולל ו-correct/total', () => {
    const onFinish = vi.fn();
    render(
      <LessonPlayer
        onFinish={onFinish}
        questions={[
          MCQ_LONG({ correctAnswer: { index: 0 } }),
          MCQ_LONG({ correctAnswer: { index: 0 } }),
        ]}
      />,
    );
    // Q1 correct
    answerMcq(0);
    fireEvent.click(screen.getByTestId('continue-button'));
    // Q2 wrong
    answerMcq(1);
    fireEvent.click(screen.getByTestId('continue-button'));

    expect(screen.getByTestId('lesson-summary')).toBeInTheDocument();
    expect(screen.getByTestId('summary-correct')).toHaveTextContent('1');
    expect(screen.getByTestId('summary-total')).toHaveTextContent('2');
    expect(screen.getByTestId('summary-xp')).toHaveTextContent(String(XP_PER_CORRECT));
    expect(onFinish).toHaveBeenCalledWith({ total: 2, correct: 1, xp: XP_PER_CORRECT });
  });

  // ── Streak ──
  it('שתי תשובות נכונות ברצף → streak=2 ב-header', () => {
    render(
      <LessonPlayer
        questions={[
          MCQ_LONG({ correctAnswer: { index: 0 } }),
          MCQ_LONG({ correctAnswer: { index: 0 } }),
          MCQ_LONG({ correctAnswer: { index: 0 } }),
        ]}
      />,
    );
    answerMcq(0);
    fireEvent.click(screen.getByTestId('continue-button'));
    answerMcq(0);
    // now on Q3, streak should read 2
    expect(screen.getByTestId('streak-badge')).toHaveTextContent('2');
  });

  it('תשובה שגויה מאפסת את ה-streak', () => {
    render(
      <LessonPlayer
        questions={[
          MCQ_LONG({ correctAnswer: { index: 0 } }),
          MCQ_LONG({ correctAnswer: { index: 0 } }),
        ]}
      />,
    );
    answerMcq(0); // correct → streak 1
    fireEvent.click(screen.getByTestId('continue-button'));
    answerMcq(1); // wrong → streak resets to 0 (badge hidden)
    expect(screen.queryByTestId('streak-badge')).not.toBeInTheDocument();
  });

  // ── a11y ──
  it('dir="rtl" על הקונטיינר הראשי', () => {
    const { container } = render(<LessonPlayer questions={[MCQ_LONG()]} />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('dir', 'rtl');
  });

  it('מסך-הסיכום הוא role=status עם aria-live', () => {
    render(<LessonPlayer questions={[MCQ_LONG({ correctAnswer: { index: 0 } })]} />);
    answerMcq(0);
    fireEvent.click(screen.getByTestId('continue-button'));
    const summary = screen.getByTestId('lesson-summary');
    expect(summary).toHaveAttribute('role', 'status');
    expect(summary).toHaveAttribute('aria-live', 'polite');
  });
});

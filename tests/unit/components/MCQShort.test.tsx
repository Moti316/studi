/**
 * Tests for <MCQShort>
 *
 * Variant of MCQLong: 2×2 grid of short options, identical selection/submit logic.
 * Covers: render grid, tap-select, keyboard 1-4 + Enter, onResult contract,
 * loading/empty/error states, a11y.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type FramerMotion from 'framer-motion';
import { MCQShort } from '@/features/lesson-player/components/MCQShort';
import type { Question } from '@/../drizzle/schema';

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
          'aria-checked': ariaChecked,
          'aria-disabled': ariaDisabled,
          'data-testid': dataTestId,
          disabled,
          type,
          ..._rest
        }: React.HTMLAttributes<HTMLElement> & {
          'aria-pressed'?: boolean | 'false' | 'true';
          'aria-checked'?: boolean | 'false' | 'true';
          'aria-disabled'?: boolean | string;
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
        if (ariaChecked !== undefined) props['aria-checked'] = ariaChecked;
        if (ariaDisabled !== undefined) props['aria-disabled'] = ariaDisabled;
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
      span: makeMotion('span'),
      ul: makeMotion('ul'),
      li: makeMotion('li'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

const QUESTION: Question = {
  id: '00000000-0000-0000-0000-000000000002',
  type: 'mcq_short',
  prompt: 'ממונה בטיחות הוא הגורם המקצועי האחראי על _____ נהלי הבטיחות בארגון.',
  options: ['ניסוח', 'פרסום', 'אכיפת', 'מימון'],
  correctAnswer: { index: 2 },
  explanation: null,
  sourceChunkId: null,
  scenarioId: null,
  scopeRefs: [],
  inScope: true,
  status: 'מאומת',
  difficulty: 1,
  sourceRef: null,
  createdAt: new Date(),
};

function renderDefault(onResult = vi.fn(), question: Question = QUESTION) {
  return render(<MCQShort question={question} onResult={onResult} />);
}

describe('MCQShort', () => {
  it('מציג את ה-prompt', () => {
    renderDefault();
    expect(screen.getByText(QUESTION.prompt)).toBeInTheDocument();
  });

  it('מציג 4 כרטיסי-אופציה בגריד', () => {
    renderDefault();
    for (let i = 0; i < 4; i++) {
      expect(screen.getByTestId(`mcq-option-${i}`)).toBeInTheDocument();
    }
  });

  it('הקונטיינר מסומן כגריד (grid-cols-2)', () => {
    renderDefault();
    const grid = screen.getByRole('radiogroup');
    expect(grid.className).toContain('grid-cols-2');
  });

  it('כפתור "בדוק תשובה" לא מוצג לפני בחירה', () => {
    renderDefault();
    expect(screen.queryByTestId('check-answer-button')).not.toBeInTheDocument();
  });

  it('לחיצה על אופציה → aria-checked=true + הכפתור מופיע', () => {
    renderDefault();
    const opt = screen.getByTestId('mcq-option-2');
    fireEvent.click(opt);
    expect(opt).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('check-answer-button')).toBeInTheDocument();
  });

  it('מקש 3 בוחר את האופציה השלישית', () => {
    renderDefault();
    fireEvent.keyDown(window, { key: '3' });
    expect(screen.getByTestId('mcq-option-2')).toHaveAttribute('aria-checked', 'true');
  });

  it('בחירה נכונה + "בדוק תשובה" → onResult({correct:true, selectedIndex:2})', () => {
    const onResult = vi.fn();
    renderDefault(onResult);
    fireEvent.click(screen.getByTestId('mcq-option-2'));
    fireEvent.click(screen.getByTestId('check-answer-button'));
    expect(onResult).toHaveBeenCalledWith({ correct: true, selectedIndex: 2 });
  });

  it('בחירה שגויה + "בדוק תשובה" → onResult({correct:false, selectedIndex:0})', () => {
    const onResult = vi.fn();
    renderDefault(onResult);
    fireEvent.click(screen.getByTestId('mcq-option-0'));
    fireEvent.click(screen.getByTestId('check-answer-button'));
    expect(onResult).toHaveBeenCalledWith({ correct: false, selectedIndex: 0 });
  });

  it('Enter גלובלי אחרי בחירה שולח את התשובה', () => {
    const onResult = vi.fn();
    renderDefault(onResult);
    fireEvent.keyDown(window, { key: '3' }); // index 2 (correct)
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onResult).toHaveBeenCalledWith({ correct: true, selectedIndex: 2 });
  });

  // ── Loading / Empty / Error ──

  it('מצב loading: skeleton', () => {
    render(<MCQShort question={QUESTION} onResult={vi.fn()} isLoading />);
    expect(screen.getByTestId('mcq-loading')).toBeInTheDocument();
  });

  it('מצב empty: options ריק', () => {
    render(<MCQShort question={{ ...QUESTION, options: [] }} onResult={vi.fn()} />);
    expect(screen.getByTestId('mcq-empty')).toBeInTheDocument();
  });

  it('מצב error: correct_answer לא תקין', () => {
    const broken = { ...QUESTION, correctAnswer: null } as Question;
    render(<MCQShort question={broken} onResult={vi.fn()} />);
    expect(screen.getByTestId('mcq-error')).toBeInTheDocument();
  });

  // ── Accessibility ──

  it('dir="rtl" על הקונטיינר הראשי', () => {
    const { container } = renderDefault();
    expect(container.firstChild).toHaveAttribute('dir', 'rtl');
  });

  it('role=radiogroup וכל אופציה role=radio', () => {
    renderDefault();
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    for (let i = 0; i < 4; i++) {
      expect(screen.getByTestId(`mcq-option-${i}`)).toHaveAttribute('role', 'radio');
    }
  });
});

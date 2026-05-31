/**
 * Tests for <MCQLong>
 *
 * Covers:
 * - render: prompt + 4 vertical option cards, "בדוק תשובה" hidden until selection
 * - tap-select → aria-pressed=true, button appears, re-tap → reselect
 * - keyboard 1-4 selects, Enter submits
 * - submit נכון → onResult({ correct:true, selectedIndex })
 * - submit שגוי → onResult({ correct:false, selectedIndex })
 * - loading / empty (no options) / error (malformed correct_answer) states
 * - a11y: dir=rtl, role=radiogroup/radio, aria-label, data-testid
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type FramerMotion from 'framer-motion';
import { MCQLong } from '@/features/lesson-player/components/MCQLong';
import type { Question } from '@/../drizzle/schema';

// Framer Motion: mock all motion.* wrappers to plain elements (no animation in tests)
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

// ─── Test data ────────────────────────────────────────────────────────────────

const QUESTION: Question = {
  id: '00000000-0000-0000-0000-000000000001',
  type: 'mcq_long',
  prompt: 'מהו תפקידו העיקרי של ממונה הבטיחות?',
  options: [
    'פיקוח על קיום הוראות הבטיחות במפעל',
    'ניהול משאבי האנוש בארגון',
    'אחריות בלעדית על תקציב המפעל',
    'ייצוג העובדים מול ההנהלה',
  ],
  correctAnswer: { index: 0 },
  explanation: null,
  sourceChunkId: null,
  scenarioId: null,
  scopeRefs: [],
  inScope: true,
  status: 'מאומת',
  difficulty: 2,
  sourceRef: null,
  createdAt: new Date(),
};

function renderDefault(onResult = vi.fn(), question: Question = QUESTION) {
  return render(<MCQLong question={question} onResult={onResult} />);
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('MCQLong', () => {
  // ── Initial render ──

  it('מציג את ה-prompt', () => {
    renderDefault();
    expect(screen.getByText(QUESTION.prompt)).toBeInTheDocument();
  });

  it('מציג 4 כרטיסי-אופציה', () => {
    renderDefault();
    for (let i = 0; i < 4; i++) {
      expect(screen.getByTestId(`mcq-option-${i}`)).toBeInTheDocument();
    }
  });

  it('כפתור "בדוק תשובה" לא מוצג לפני בחירה', () => {
    renderDefault();
    expect(screen.queryByTestId('check-answer-button')).not.toBeInTheDocument();
  });

  // ── Selection ──

  it('לחיצה על אופציה → aria-checked=true', () => {
    renderDefault();
    const opt = screen.getByTestId('mcq-option-1');
    fireEvent.click(opt);
    expect(opt).toHaveAttribute('aria-checked', 'true');
  });

  it('בחירת אופציה אחרת מעבירה את הסימון', () => {
    renderDefault();
    const opt0 = screen.getByTestId('mcq-option-0');
    const opt2 = screen.getByTestId('mcq-option-2');
    fireEvent.click(opt0);
    expect(opt0).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(opt2);
    expect(opt0).toHaveAttribute('aria-checked', 'false');
    expect(opt2).toHaveAttribute('aria-checked', 'true');
  });

  it('כפתור "בדוק תשובה" מופיע אחרי בחירה', () => {
    renderDefault();
    fireEvent.click(screen.getByTestId('mcq-option-0'));
    expect(screen.getByTestId('check-answer-button')).toBeInTheDocument();
  });

  // ── Keyboard ──

  it('מקש 1 בוחר את האופציה הראשונה', () => {
    renderDefault();
    fireEvent.keyDown(window, { key: '1' });
    expect(screen.getByTestId('mcq-option-0')).toHaveAttribute('aria-checked', 'true');
  });

  it('מקש 4 בוחר את האופציה הרביעית', () => {
    renderDefault();
    fireEvent.keyDown(window, { key: '4' });
    expect(screen.getByTestId('mcq-option-3')).toHaveAttribute('aria-checked', 'true');
  });

  it('Enter על כרטיס-אופציה בוחר אותו', () => {
    renderDefault();
    const opt = screen.getByTestId('mcq-option-2');
    fireEvent.keyDown(opt, { key: 'Enter' });
    expect(opt).toHaveAttribute('aria-checked', 'true');
  });

  it('Enter (גלובלי) אחרי בחירה → שולח את התשובה', () => {
    const onResult = vi.fn();
    renderDefault(onResult);
    fireEvent.keyDown(window, { key: '1' }); // select index 0 (correct)
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onResult).toHaveBeenCalledWith({ correct: true, selectedIndex: 0 });
  });

  // ── Submit ──

  it('בחירה נכונה + "בדוק תשובה" → onResult({correct:true, selectedIndex:0})', () => {
    const onResult = vi.fn();
    renderDefault(onResult);
    fireEvent.click(screen.getByTestId('mcq-option-0'));
    fireEvent.click(screen.getByTestId('check-answer-button'));
    expect(onResult).toHaveBeenCalledWith({ correct: true, selectedIndex: 0 });
  });

  it('בחירה שגויה + "בדוק תשובה" → onResult({correct:false, selectedIndex:2})', () => {
    const onResult = vi.fn();
    renderDefault(onResult);
    fireEvent.click(screen.getByTestId('mcq-option-2'));
    fireEvent.click(screen.getByTestId('check-answer-button'));
    expect(onResult).toHaveBeenCalledWith({ correct: false, selectedIndex: 2 });
  });

  it('אחרי שליחה הכפתור נעלם (נעילה — onResult פעם אחת בלבד)', () => {
    const onResult = vi.fn();
    renderDefault(onResult);
    fireEvent.click(screen.getByTestId('mcq-option-0'));
    fireEvent.click(screen.getByTestId('check-answer-button'));
    // After submit the component locks: the button is removed, blocking a second report.
    expect(screen.queryByTestId('check-answer-button')).not.toBeInTheDocument();
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('בחירה נוספת אחרי שליחה אינה מפעילה onResult שוב', () => {
    const onResult = vi.fn();
    renderDefault(onResult);
    fireEvent.click(screen.getByTestId('mcq-option-0'));
    fireEvent.click(screen.getByTestId('check-answer-button'));
    // Try to change selection + re-submit via keyboard after lock.
    fireEvent.keyDown(window, { key: '2' });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  // ── Loading / Empty / Error ──

  it('מצב loading: מציג skeleton ולא כרטיסים', () => {
    render(<MCQLong question={QUESTION} onResult={vi.fn()} isLoading />);
    expect(screen.getByTestId('mcq-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('mcq-option-0')).not.toBeInTheDocument();
  });

  it('מצב empty: options ריק → מצב-empty', () => {
    const empty = { ...QUESTION, options: [] };
    render(<MCQLong question={empty} onResult={vi.fn()} />);
    expect(screen.getByTestId('mcq-empty')).toBeInTheDocument();
  });

  it('מצב error: correct_answer לא תקין → מצב-error', () => {
    const broken = { ...QUESTION, correctAnswer: { foo: 'bar' } as unknown };
    render(<MCQLong question={broken as Question} onResult={vi.fn()} />);
    expect(screen.getByTestId('mcq-error')).toBeInTheDocument();
  });

  // ── Accessibility ──

  it('dir="rtl" על הקונטיינר הראשי', () => {
    const { container } = renderDefault();
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('dir', 'rtl');
  });

  it('רשימת האופציות היא role=radiogroup', () => {
    renderDefault();
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('כל אופציה היא role=radio עם aria-label', () => {
    renderDefault();
    for (let i = 0; i < 4; i++) {
      const opt = screen.getByTestId(`mcq-option-${i}`);
      expect(opt).toHaveAttribute('role', 'radio');
      expect(opt).toHaveAttribute('aria-label');
    }
  });
});

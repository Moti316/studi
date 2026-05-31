/**
 * Tests for <QuestionTagger>
 *
 * Covers (mirrors the MatchingPairs.test.tsx contract):
 * - framer-motion fully mocked → plain div/button/ul/li (no animation in tests)
 * - dir="rtl" + role="form" + aria on the root
 * - getByTestId throughout (stable selectors)
 * - all 57 scope IDs are present & accessible in the picker
 * - the Gemini suggestion is shown and one-click "approve" applies it
 * - status (3 values) + in_scope radio-groups toggle aria-checked
 * - the server action (onSave) is mocked and called with the validated patch
 * - empty-state (DB empty until import runs) and save-error state
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type FramerMotion from 'framer-motion';
import {
  QuestionTagger,
  STATUS_OPTIONS,
  type QuestionTaggerProps,
} from '@/features/admin-tagging/components/QuestionTagger';
import { SCOPE_REFS } from '@/lib/db/constants/scope-refs';
import type { Question } from '../../../drizzle/schema';

// ─── Framer Motion mock (same strategy as MatchingPairs.test.tsx) ───────────────

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
          'aria-checked': ariaChecked,
          'aria-busy': ariaBusy,
          'aria-pressed': ariaPressed,
          'aria-disabled': ariaDisabled,
          'data-testid': dataTestId,
          disabled,
          type,
          ..._rest
        }: React.HTMLAttributes<HTMLElement> & {
          'aria-checked'?: boolean | 'false' | 'true';
          'aria-busy'?: boolean | string;
          'aria-pressed'?: boolean | 'false' | 'true';
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
        if (ariaChecked !== undefined) props['aria-checked'] = ariaChecked;
        if (ariaBusy !== undefined) props['aria-busy'] = ariaBusy;
        if (ariaPressed !== undefined) props['aria-pressed'] = ariaPressed;
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
      ul: makeMotion('ul'),
      li: makeMotion('li'),
      p: makeMotion('p'),
      span: makeMotion('span'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// ─── Test data ──────────────────────────────────────────────────────────────

/** Minimal Question row matching the schema-as-is (only fields the UI reads). */
function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q-1',
    type: 'mcq_short',
    prompt: 'מי אחראי למינוי ממונה בטיחות במפעל?',
    options: null,
    correctAnswer: null,
    explanation: null,
    sourceChunkId: null,
    scenarioId: null,
    scopeRefs: [
      { id: '1.1', confidence: 0.82 },
      { id: '1.0', confidence: 0.6 },
    ],
    inScope: true,
    status: 'מוסקנא',
    difficulty: null,
    sourceRef: null,
    createdAt: new Date('2026-05-01T00:00:00Z'),
    ...overrides,
  } as Question;
}

function renderTagger(
  props: Partial<QuestionTaggerProps> = {},
): { onSave: ReturnType<typeof vi.fn> } & ReturnType<typeof render> {
  const onSave = props.onSave
    ? (props.onSave as ReturnType<typeof vi.fn>)
    : vi.fn().mockResolvedValue({ ok: true });
  const questions = props.questions ?? [makeQuestion()];
  const utils = render(<QuestionTagger questions={questions} onSave={onSave} />);
  return { onSave, ...utils };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('QuestionTagger', () => {
  // ── Layout / RTL / a11y ──

  it('dir="rtl" + role="form" על הקונטיינר הראשי', () => {
    renderTagger();
    const root = screen.getByTestId('question-tagger');
    expect(root).toHaveAttribute('dir', 'rtl');
    expect(root).toHaveAttribute('role', 'form');
    expect(root).toHaveAttribute('aria-label');
  });

  it('מציג את נוסח-השאלה', () => {
    renderTagger();
    expect(screen.getByTestId('tagger-prompt')).toHaveTextContent('מי אחראי למינוי ממונה בטיחות');
  });

  it('מציג מונה-התקדמות (שאלה X מתוך Y)', () => {
    renderTagger({ questions: [makeQuestion({ id: 'a' }), makeQuestion({ id: 'b' })] });
    expect(screen.getByTestId('tagger-progress')).toHaveTextContent('שאלה 1 מתוך 2');
  });

  // ── 57-ID picker ──

  it('כל 57 מזהי-ההיקף נגישים בבורר (role=checkbox עם aria-label)', () => {
    renderTagger();
    expect(SCOPE_REFS).toHaveLength(57);
    for (const ref of SCOPE_REFS) {
      const toggle = screen.getByTestId(`scope-toggle-${ref.id}`);
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('role', 'checkbox');
      expect(toggle).toHaveAttribute('aria-label', `${ref.id} — ${ref.label}`);
    }
  });

  it('toggle על מזהה → aria-checked מתהפך', () => {
    renderTagger({ questions: [makeQuestion({ scopeRefs: [] })] });
    const toggle = screen.getByTestId('scope-toggle-2.1');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('המזהים מהשאלה מסומנים מראש (pre-selected)', () => {
    renderTagger(); // scopeRefs = 1.1, 1.0
    expect(screen.getByTestId('scope-toggle-1.1')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('scope-toggle-1.0')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('scope-toggle-2.1')).toHaveAttribute('aria-checked', 'false');
  });

  // ── Gemini suggestion ──

  it('מציג את הצעת-Gemini עם המזהים והאחוזים', () => {
    renderTagger();
    expect(screen.getByTestId('tagger-suggestion')).toBeInTheDocument();
    expect(screen.getByTestId('suggestion-ref-1.1')).toHaveTextContent('1.1');
    expect(screen.getByTestId('suggestion-ref-1.1')).toHaveTextContent('82%');
  });

  it('כשאין scope_refs — מציג "אין הצעה" ולא כפתור-אישור', () => {
    renderTagger({ questions: [makeQuestion({ scopeRefs: [] })] });
    expect(screen.getByTestId('tagger-no-suggestion')).toBeInTheDocument();
    expect(screen.queryByTestId('approve-suggestion-button')).not.toBeInTheDocument();
  });

  it('"אשר הצעה" מסמן בדיוק את מזהי-ההצעה', () => {
    // נתחיל ממצב נקי כדי לוודא שהאישור הוא שמסמן.
    renderTagger({
      questions: [makeQuestion({ id: 'x', scopeRefs: [{ id: '2.1', confidence: 0.9 }] })],
    });
    // ננקה ידנית ואז נאשר.
    fireEvent.click(screen.getByTestId('scope-toggle-2.1')); // deselect
    expect(screen.getByTestId('scope-toggle-2.1')).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(screen.getByTestId('approve-suggestion-button'));
    expect(screen.getByTestId('scope-toggle-2.1')).toHaveAttribute('aria-checked', 'true');
  });

  // ── status + in_scope radio-groups ──

  it('סטטוס: 3 כפתורים, לחיצה מסמנת aria-checked', () => {
    renderTagger();
    for (const s of STATUS_OPTIONS) {
      expect(screen.getByTestId(`status-${s}`)).toBeInTheDocument();
    }
    fireEvent.click(screen.getByTestId('status-מאומת'));
    expect(screen.getByTestId('status-מאומת')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('status-מוסקנא')).toHaveAttribute('aria-checked', 'false');
  });

  it('in_scope: כן/לא radio-group מתהפך', () => {
    renderTagger(); // inScope=true
    expect(screen.getByTestId('in-scope-yes')).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByTestId('in-scope-no'));
    expect(screen.getByTestId('in-scope-no')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('in-scope-yes')).toHaveAttribute('aria-checked', 'false');
  });

  // ── Save (server action) ──

  it('"שמור והמשך" קורא ל-onSave עם id ו-patch מתוקן', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    renderTagger({ onSave, questions: [makeQuestion({ id: 'q-42', scopeRefs: [] })] });

    fireEvent.click(screen.getByTestId('scope-toggle-2.1'));
    fireEvent.click(screen.getByTestId('status-מאומת'));
    fireEvent.click(screen.getByTestId('save-next-button'));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const call = onSave.mock.calls[0]!;
    const id = call[0] as string;
    const patch = call[1] as { status: string; in_scope: boolean; scope_refs: unknown };
    expect(id).toBe('q-42');
    expect(patch.status).toBe('מאומת');
    expect(patch.in_scope).toBe(true);
    expect(patch.scope_refs).toEqual([{ id: '2.1', confidence: 1 }]);
  });

  it('אחרי שמירה מתקדם לשאלה הבאה', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    renderTagger({
      onSave,
      questions: [
        makeQuestion({ id: 'a', prompt: 'שאלה ראשונה' }),
        makeQuestion({ id: 'b', prompt: 'שאלה שנייה' }),
      ],
    });
    expect(screen.getByTestId('tagger-prompt')).toHaveTextContent('שאלה ראשונה');
    fireEvent.click(screen.getByTestId('save-next-button'));
    await waitFor(() =>
      expect(screen.getByTestId('tagger-prompt')).toHaveTextContent('שאלה שנייה'),
    );
  });

  it('אחרי תיוג כל התור — מצב "סיימת את התור"', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    renderTagger({ onSave, questions: [makeQuestion({ id: 'only' })] });
    fireEvent.click(screen.getByTestId('save-next-button'));
    await waitFor(() => expect(screen.getByTestId('tagger-done')).toBeInTheDocument());
  });

  it('כשל-שמירה → מצב-שגיאה (role=alert) ולא מתקדם', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('boom'));
    renderTagger({
      onSave,
      questions: [makeQuestion({ id: 'a', prompt: 'נשאר כאן' }), makeQuestion({ id: 'b' })],
    });
    fireEvent.click(screen.getByTestId('save-next-button'));
    await waitFor(() => expect(screen.getByTestId('save-error')).toBeInTheDocument());
    expect(screen.getByTestId('tagger-prompt')).toHaveTextContent('נשאר כאן');
  });

  // ── Keyboard-first ──

  it('Enter על הקונטיינר → שומר', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    renderTagger({ onSave });
    fireEvent.keyDown(screen.getByTestId('question-tagger'), { key: 'Enter' });
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  });

  it('מקש 1 → סטטוס "מאומת"', () => {
    renderTagger();
    fireEvent.keyDown(screen.getByTestId('question-tagger'), { key: '1' });
    expect(screen.getByTestId('status-מאומת')).toHaveAttribute('aria-checked', 'true');
  });

  it('מקש A → אישור הצעת-Gemini', () => {
    renderTagger({
      questions: [makeQuestion({ id: 'x', scopeRefs: [{ id: '6.1', confidence: 0.7 }] })],
    });
    fireEvent.click(screen.getByTestId('scope-toggle-6.1')); // deselect first
    expect(screen.getByTestId('scope-toggle-6.1')).toHaveAttribute('aria-checked', 'false');
    fireEvent.keyDown(screen.getByTestId('question-tagger'), { key: 'a' });
    expect(screen.getByTestId('scope-toggle-6.1')).toHaveAttribute('aria-checked', 'true');
  });

  // ── Empty state ──

  it('תור ריק → empty-state ידידותי (אין שאלות לתיוג)', () => {
    render(<QuestionTagger questions={[]} onSave={vi.fn()} />);
    const empty = screen.getByTestId('tagger-empty');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveAttribute('dir', 'rtl');
    expect(screen.queryByTestId('question-tagger')).not.toBeInTheDocument();
  });
});

/**
 * a11y-batch.test.tsx — אצוות-נגישות #5-#8,#12 (BUGS.md).
 *
 * #5  SimulationPlayer — aria-live מבודד (announcer = משוב-אחרון בלבד, לא כל השיח).
 * #6  McqQuestion — roving-tabindex + ניווט-חיצים (RTL: שמאל=קדימה).
 * #7  LessonPlayer wrong-sheet — Escape סוגר-וממשיך + פוקוס-נכנס לדיאלוג.
 * #8  RiskMatrix — ניווט-חיצים בין תאי-ה-grid (roving-tabindex).
 * #12 LiveSimulationPlayer — שחזור-פוקוס ל-textarea אחרי תשובת-שרת. (נבדק דרך ref —
 *     ה-flow המלא דורש server-action; מכוסה ב-respond-live tests.)
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type FramerMotion from 'framer-motion';

import { SimulationPlayer } from '@/features/simulation/SimulationPlayer';
import { MCQLong } from '@/features/lesson-player/components/MCQLong';
import { RiskMatrix } from '@/features/final-project/components/RiskMatrix';
import type { Simulation } from '@/features/simulation/types';
import type { JsaRow } from '@/features/final-project/types';
import type { Question } from '../../../drizzle/schema';

// Framer Motion → אלמנטים רגילים (דפוס MCQLong.test — כולל העברת-ref ל-roving)
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof FramerMotion>('framer-motion');
  const ReactM = await import('react');
  const makeMotion = (tag: string) => {
    const MotionMock = ReactM.forwardRef(
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
          'aria-disabled': ariaDisabled,
          'data-testid': dataTestId,
          ..._rest
        }: React.HTMLAttributes<HTMLElement> & {
          'aria-checked'?: boolean | 'false' | 'true';
          'aria-disabled'?: boolean | string;
          'data-testid'?: string;
          variants?: unknown;
          initial?: unknown;
          animate?: unknown;
          exit?: unknown;
          whileTap?: unknown;
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
        if (ariaDisabled !== undefined) props['aria-disabled'] = ariaDisabled;
        return ReactM.createElement(tag, props, children);
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
      header: makeMotion('header'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// ─── fixtures ────────────────────────────────────────────────────────────────

const SIM: Simulation = {
  title: 'סימולציית-בדיקה',
  branch: 'בנייה',
  intro: 'פתיח',
  scopeRefs: [],
  maxScore: 100,
  scoringCriteria: [{ name: 'ידע', weight: 100 }],
  stages: [
    {
      key: 'opening',
      title: 'פתיחה',
      turns: [
        {
          id: 't1',
          inspector: 'technical',
          prompt: 'שאלה ראשונה?',
          options: [
            { text: 'טוב', quality: 'good', points: 10, feedback: 'משוב-ראשון', citation: '' },
            { text: 'רע', quality: 'poor', points: 0, feedback: 'משוב-רע', citation: '' },
          ],
        },
        {
          id: 't2',
          inspector: 'regulatory',
          prompt: 'שאלה שנייה?',
          options: [
            { text: 'טוב2', quality: 'good', points: 10, feedback: 'משוב-שני', citation: '' },
            { text: 'רע2', quality: 'poor', points: 0, feedback: 'משוב-רע2', citation: '' },
          ],
        },
      ],
    },
  ],
} as unknown as Simulation;

const MCQ_QUESTION: Question = {
  id: '00000000-0000-0000-0000-0000000000a1',
  type: 'mcq_long',
  prompt: 'שאלת בדיקה?',
  options: ['אפשרות א', 'אפשרות ב', 'אפשרות ג'],
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

function jsaRow(sev: 1 | 2 | 3 | 4, prob: 1 | 2 | 3 | 4): JsaRow {
  return {
    id: `row-${sev}-${prob}`,
    task: 'משימה',
    hazard: 'מפגע-בדיקה',
    riskBefore: { severity: sev, probability: prob },
    existingControls: '',
    addedControls: 'בקרה הנדסית',
    riskAfter: { severity: 1, probability: 1 },
    status: 'פתוח',
  } as unknown as JsaRow;
}

// ─── #5 SimulationPlayer announcer ──────────────────────────────────────────

describe('#5 SimulationPlayer — aria-live מבודד', () => {
  it('ה-announcer מכיל רק את משוב-התור-האחרון + השאלה-הבאה, וההיסטוריה בלי aria-live', () => {
    render(<SimulationPlayer simulation={SIM} />);
    const announcer = screen.getByTestId('sim-announcer');
    expect(announcer).toHaveAttribute('aria-live', 'polite');
    expect(announcer.textContent).toBe(''); // לפני תשובה — ריק

    fireEvent.click(screen.getByTestId('option-0')); // עונה על t1
    expect(announcer.textContent).toContain('משוב-ראשון');
    expect(announcer.textContent).toContain('שאלה שנייה?');
    // ההיסטוריה עצמה אינה אזור-חי (אחרת מוכרזת-מחדש כולה)
    const history = screen.getByTestId('turn-t1').parentElement?.parentElement;
    expect(history?.getAttribute('aria-live')).toBeNull();
  });
});

// ─── #6 McqQuestion roving-tabindex ──────────────────────────────────────────

describe('#6 McqQuestion — roving-tabindex וחיצים', () => {
  it('רק אופציה אחת ב-Tab-order; ArrowDown בוחר-וממקד את הבאה; RTL: ArrowLeft=קדימה', () => {
    render(<MCQLong question={MCQ_QUESTION} onResult={vi.fn()} />);
    const opt = (i: number) => screen.getByTestId(`mcq-option-${i}`);

    // ברירת-מחדל: הראשונה ב-Tab-order, השאר מחוץ
    expect(opt(0)).toHaveAttribute('tabindex', '0');
    expect(opt(1)).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(opt(0), { key: 'ArrowDown' });
    expect(opt(1)).toHaveAttribute('aria-checked', 'true');
    expect(opt(1)).toHaveAttribute('tabindex', '0');
    expect(opt(0)).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(opt(1), { key: 'ArrowLeft' }); // RTL: קדימה
    expect(opt(2)).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(opt(2), { key: 'ArrowDown' }); // wrap לתחילה
    expect(opt(0)).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(opt(0), { key: 'End' });
    expect(opt(2)).toHaveAttribute('aria-checked', 'true');
    fireEvent.keyDown(opt(2), { key: 'Home' });
    expect(opt(0)).toHaveAttribute('aria-checked', 'true');
  });
});

// ─── #8 RiskMatrix arrow navigation ──────────────────────────────────────────

describe('#8 RiskMatrix — ניווט-חיצים ב-grid', () => {
  it('roving-tabindex: תא-ברירת-מחדל = התא-המאוכלס; חיצים נעים בין-תאים (RTL)', () => {
    render(<RiskMatrix rows={[jsaRow(2, 3)]} />);
    const cell = (s: number, p: number) => screen.getByTestId(`matrix-cell-s${s}-p${p}`);

    // התא-המאוכלס הוא נקודת-הכניסה היחידה
    expect(cell(2, 3)).toHaveAttribute('tabindex', '0');
    expect(cell(1, 4)).toHaveAttribute('tabindex', '-1');

    // ArrowLeft (RTL) = חומרה+1
    fireEvent.keyDown(cell(2, 3), { key: 'ArrowLeft' });
    expect(cell(3, 3)).toHaveAttribute('tabindex', '0');
    expect(document.activeElement).toBe(cell(3, 3));

    // ArrowUp = סבירות+1
    fireEvent.keyDown(cell(3, 3), { key: 'ArrowUp' });
    expect(cell(3, 4)).toHaveAttribute('tabindex', '0');

    // קצוות לא-עוברים את הגבול (clamp)
    fireEvent.keyDown(cell(3, 4), { key: 'ArrowUp' });
    expect(cell(3, 4)).toHaveAttribute('tabindex', '0');

    // Home/End בתוך-שורה
    fireEvent.keyDown(cell(3, 4), { key: 'End' });
    expect(cell(4, 4)).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(cell(4, 4), { key: 'Home' });
    expect(cell(1, 4)).toHaveAttribute('tabindex', '0');
  });

  it('Enter על תא-מאוכלס עדיין פותח tooltip (ההתנהגות-הקיימת נשמרה)', () => {
    render(<RiskMatrix rows={[jsaRow(2, 3)]} />);
    const cell = screen.getByTestId('matrix-cell-s2-p3');
    fireEvent.keyDown(cell, { key: 'Enter' });
    expect(screen.getByTestId('matrix-cell-s2-p3-tooltip')).toBeInTheDocument();
  });
});

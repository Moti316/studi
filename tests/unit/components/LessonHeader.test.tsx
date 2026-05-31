/**
 * Tests for <LessonHeader>
 *
 * Covers:
 * - progress dots: total + current rendering, active/inactive state
 * - XP counter
 * - streak (🔥) — shown when > 0, hidden when 0
 * - AI notice ("המידע נוצר על-ידי AI ועלול להכיל שגיאות")
 * - a11y: dir=rtl, role/aria, data-testid
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type FramerMotion from 'framer-motion';
import { LessonHeader } from '@/features/lesson-player/components/LessonHeader';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof FramerMotion>('framer-motion');
  const React = await import('react');

  const makeMotion = (tag: string) => {
    const MotionMock = React.forwardRef(
      (
        {
          children,
          className,
          role,
          'aria-label': ariaLabel,
          'aria-current': ariaCurrent,
          'aria-valuenow': ariaValueNow,
          'aria-valuemin': ariaValueMin,
          'aria-valuemax': ariaValueMax,
          'data-testid': dataTestId,
          ..._rest
        }: React.HTMLAttributes<HTMLElement> & {
          'aria-current'?: string | boolean;
          'aria-valuenow'?: number;
          'aria-valuemin'?: number;
          'aria-valuemax'?: number;
          'data-testid'?: string;
          variants?: unknown;
          initial?: unknown;
          animate?: unknown;
          exit?: unknown;
          transition?: unknown;
        },
        ref: React.Ref<HTMLElement>,
      ) => {
        const props: Record<string, unknown> = {
          className,
          ref,
          'data-testid': dataTestId,
        };
        if (role !== undefined) props['role'] = role;
        if (ariaLabel !== undefined) props['aria-label'] = ariaLabel;
        if (ariaCurrent !== undefined) props['aria-current'] = ariaCurrent;
        if (ariaValueNow !== undefined) props['aria-valuenow'] = ariaValueNow;
        if (ariaValueMin !== undefined) props['aria-valuemin'] = ariaValueMin;
        if (ariaValueMax !== undefined) props['aria-valuemax'] = ariaValueMax;
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
      span: makeMotion('span'),
      header: makeMotion('header'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

const DEFAULT_PROPS = {
  totalQuestions: 5,
  currentIndex: 2,
  xp: 30,
  streak: 3,
};

function renderDefault(overrides: Partial<typeof DEFAULT_PROPS> = {}) {
  return render(<LessonHeader {...DEFAULT_PROPS} {...overrides} />);
}

describe('LessonHeader', () => {
  // ── Progress dots ──

  it('מציג מספר נקודות-התקדמות לפי totalQuestions', () => {
    renderDefault();
    const dots = screen.getAllByTestId(/^progress-dot-/);
    expect(dots).toHaveLength(5);
  });

  it('הנקודה הנוכחית מסומנת aria-current', () => {
    renderDefault();
    const current = screen.getByTestId('progress-dot-2');
    expect(current).toHaveAttribute('aria-current', 'step');
  });

  it('progressbar עם aria-valuenow/min/max נכונים', () => {
    renderDefault();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '3'); // currentIndex+1
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '5');
  });

  // ── XP ──

  it('מציג את מונה ה-XP', () => {
    renderDefault({ xp: 42 });
    const xp = screen.getByTestId('xp-counter');
    expect(xp).toHaveTextContent('42');
  });

  // ── Streak ──

  it('מציג streak עם 🔥 כאשר > 0', () => {
    renderDefault({ streak: 7 });
    const streak = screen.getByTestId('streak-badge');
    expect(streak).toHaveTextContent('7');
    expect(streak).toHaveTextContent('🔥');
  });

  it('לא מציג streak כאשר 0', () => {
    renderDefault({ streak: 0 });
    expect(screen.queryByTestId('streak-badge')).not.toBeInTheDocument();
  });

  // ── AI notice ──

  it('מציג את הודעת-ה-AI', () => {
    renderDefault();
    const notice = screen.getByTestId('ai-notice');
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(/AI/);
    expect(notice).toHaveTextContent(/שגיאות/);
  });

  it('הודעת-ה-AI היא role=note', () => {
    renderDefault();
    expect(screen.getByTestId('ai-notice')).toHaveAttribute('role', 'note');
  });

  // ── Accessibility ──

  it('dir="rtl" על הקונטיינר הראשי', () => {
    const { container } = renderDefault();
    expect(container.firstChild).toHaveAttribute('dir', 'rtl');
  });

  it('הקונטיינר הוא role=banner / header', () => {
    renderDefault();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});

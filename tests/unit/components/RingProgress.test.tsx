/**
 * RingProgress — טבעת-התקדמות SVG. תחת reduced-motion (mock) → ללא-rAF.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RingProgress } from '@/components/ui/RingProgress';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (q: string) => ({
      matches: true,
      media: q,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
      onchange: null,
    }),
  });
});

describe('RingProgress', () => {
  it('aria-label מותאם נמסר (role=img)', () => {
    render(
      <RingProgress value={15} goal={20} label="XP: 15 מתוך 20">
        <span>15</span>
      </RingProgress>,
    );
    expect(screen.getByRole('img', { name: 'XP: 15 מתוך 20' })).toBeInTheDocument();
  });

  it('label ברירת-מחדל = אחוז מחושב', () => {
    render(<RingProgress value={5} goal={10} />);
    expect(screen.getByRole('img', { name: 'התקדמות 50%' })).toBeInTheDocument();
  });

  it('מרנדר children במרכז', () => {
    render(
      <RingProgress value={1} goal={1} label="שיעורים">
        <span data-testid="ring-child">1</span>
      </RingProgress>,
    );
    expect(screen.getByTestId('ring-child')).toBeInTheDocument();
  });

  it('goal=0 לא קורס (safeGoal) ו-value=0 → 0%', () => {
    render(<RingProgress value={0} goal={0} />);
    expect(screen.getByRole('img', { name: 'התקדמות 0%' })).toBeInTheDocument();
  });
});

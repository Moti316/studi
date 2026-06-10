/**
 * CountUp — מספר-מונפש (count-up). הטסטים רצים תחת reduced-motion (matchMedia mock)
 * → ללא-rAF → display=value מיידי, כך שהבדיקות דטרמיניסטיות.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { CountUp } from '@/components/ui/CountUp';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (q: string) => ({
      matches: true, // prefers-reduced-motion: reduce → ללא-אנימציה
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

describe('CountUp', () => {
  it('מציג את הערך-הסופי מעוצב (formatNumber · פסיקי-אלפים)', () => {
    const { container } = render(<CountUp value={1500} />);
    expect(container.textContent).toContain('1,500');
  });

  it('value=0 → מציג 0', () => {
    const { container } = render(<CountUp value={0} />);
    expect(container.textContent).toContain('0');
  });

  it('prefix/suffix מרונדרים', () => {
    const { container } = render(<CountUp value={5} prefix="+" suffix=" XP" />);
    expect(container.textContent).toContain('+5 XP');
  });

  it('כולל ערך-סופי ב-sr-only (נגישות — קורא-מסך שומע פעם-אחת)', () => {
    const { container } = render(<CountUp value={42} />);
    const sr = container.querySelector('.sr-only');
    expect(sr?.textContent).toBe('42');
  });
});

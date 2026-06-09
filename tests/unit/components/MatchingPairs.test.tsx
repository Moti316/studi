/**
 * Tests for <MatchingPairs> — UX-התאמה תקני (זיווג-חופשי + בדיקה).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  MatchingPairs,
  type MatchingPair,
} from '@/features/lesson-player/components/MatchingPairs';

const PAIRS: MatchingPair[] = [
  { left: 'מונח א', right: 'הגדרה א' },
  { left: 'מונח ב', right: 'הגדרה ב' },
  { left: 'מונח ג', right: 'הגדרה ג' },
];

function pairAll(correct: boolean) {
  // correct: term i ↔ def i. wrong: term0↔def1, term1↔def0, term2↔def2.
  const map = correct
    ? [
        [0, 0],
        [1, 1],
        [2, 2],
      ]
    : [
        [0, 1],
        [1, 0],
        [2, 2],
      ];
  for (const [t, d] of map) {
    fireEvent.click(screen.getByTestId(`term-card-${t}`));
    fireEvent.click(screen.getByTestId(`def-card-${d}`));
  }
}

describe('MatchingPairs', () => {
  it('מציג הסבר + כותרות-עמודה + כרטיסי מונח/הגדרה', () => {
    render(<MatchingPairs pairs={PAIRS} onComplete={vi.fn()} />);
    expect(screen.getByText('מונחים')).toBeInTheDocument();
    expect(screen.getByText('הגדרות')).toBeInTheDocument();
    expect(screen.getByText(/התאם כל/)).toBeInTheDocument();
    expect(screen.getByTestId('term-card-0')).toBeInTheDocument();
    expect(screen.getByTestId('def-card-0')).toBeInTheDocument();
  });

  it('בחירה-חוזרת מבטלת בחירה', () => {
    render(<MatchingPairs pairs={PAIRS} onComplete={vi.fn()} />);
    const term0 = screen.getByTestId('term-card-0');
    fireEvent.click(term0);
    expect(term0).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(term0);
    expect(term0).toHaveAttribute('aria-pressed', 'false');
  });

  it('«בדוק» מושבת עד שכל המונחים מזווגים', () => {
    render(<MatchingPairs pairs={PAIRS} onComplete={vi.fn()} />);
    expect(screen.getByTestId('submit-button')).toBeDisabled();
    fireEvent.click(screen.getByTestId('term-card-0'));
    fireEvent.click(screen.getByTestId('def-card-0'));
    expect(screen.getByTestId('submit-button')).toBeDisabled(); // רק 1/3
    pairAll(true);
    expect(screen.getByTestId('submit-button')).not.toBeDisabled();
  });

  it('זיווג-נכון מלא → onComplete(true) + מסך-הצלחה', () => {
    const onComplete = vi.fn();
    render(<MatchingPairs pairs={PAIRS} onComplete={onComplete} />);
    pairAll(true);
    fireEvent.click(screen.getByTestId('submit-button'));
    expect(onComplete).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('matching-result')).toBeInTheDocument();
    expect(screen.getByText(/כל ההתאמות נכונות/)).toBeInTheDocument();
  });

  it('זיווג-שגוי → onComplete(false) + מציג התאמות-נכונות', () => {
    const onComplete = vi.fn();
    render(<MatchingPairs pairs={PAIRS} onComplete={onComplete} />);
    pairAll(false);
    fireEvent.click(screen.getByTestId('submit-button'));
    expect(onComplete).toHaveBeenCalledWith(false);
    expect(screen.getByText(/חלק מההתאמות שגויות/)).toBeInTheDocument();
  });
});

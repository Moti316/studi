import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakCard } from '@/components/dashboard/StreakCard';

describe('StreakCard', () => {
  it('מצב empty (streak=0) מציג עידוד', () => {
    render(<StreakCard streakDays={0} today={2} />);
    expect(screen.getByText('אין רצף עדיין — למד היום כדי להתחיל!')).toBeInTheDocument();
  });

  it('מצב מלא מציג מספר ימים בעברית', () => {
    render(<StreakCard streakDays={3} today={2} />);
    expect(screen.getByText(/3 ימים/)).toBeInTheDocument();
  });

  it('יום אחד = "יום", לא "ימים"', () => {
    render(<StreakCard streakDays={1} today={2} />);
    expect(screen.getByText(/1 יום/)).toBeInTheDocument();
  });

  it('מציג 7 ימים בלוח', () => {
    render(<StreakCard streakDays={3} today={2} />);
    expect(screen.getByRole('list', { name: 'ימי השבוע' }).children).toHaveLength(7);
  });

  it('מסמן aria-current על היום הנוכחי', () => {
    render(<StreakCard streakDays={3} today={3} />);
    const todayCell = screen.getByLabelText('יום ד').closest('li');
    expect(todayCell).toHaveAttribute('aria-current', 'date');
  });
});

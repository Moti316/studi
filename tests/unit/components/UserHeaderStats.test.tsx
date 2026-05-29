import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserHeaderStats } from '@/components/dashboard/UserHeaderStats';

describe('UserHeaderStats', () => {
  it('מציג קרדיטים בפורמט עברי', () => {
    render(<UserHeaderStats credits={1500} xpToday={0} streakDays={0} />);
    // formatNumber('he-IL') מחזיר 1,500 או 1.500 לפי locale
    expect(screen.getByLabelText(/קרדיטים/)).toBeInTheDocument();
  });

  it('aria-label של קרדיטים כולל את המספר', () => {
    render(<UserHeaderStats credits={1500} xpToday={0} streakDays={0} />);
    expect(screen.getByLabelText(/1[,.]?500 קרדיטים/)).toBeInTheDocument();
  });

  it('aria-label של XP היום כולל את הערך הנכון', () => {
    render(<UserHeaderStats credits={0} xpToday={42} streakDays={0} />);
    expect(screen.getByLabelText(/42 XP היום/)).toBeInTheDocument();
  });

  it('aria-label של ימי רצף כולל את הערך הנכון', () => {
    render(<UserHeaderStats credits={0} xpToday={0} streakDays={7} />);
    expect(screen.getByLabelText(/7 ימי רצף/)).toBeInTheDocument();
  });

  it('כל 3 ה-counters קיימים יחד', () => {
    render(<UserHeaderStats credits={100} xpToday={20} streakDays={3} />);
    expect(screen.getByLabelText(/קרדיטים/)).toBeInTheDocument();
    expect(screen.getByLabelText(/XP היום/)).toBeInTheDocument();
    expect(screen.getByLabelText(/ימי רצף/)).toBeInTheDocument();
  });

  it('ה-group מכיל aria-label "סיכום-משתמש"', () => {
    render(<UserHeaderStats credits={0} xpToday={0} streakDays={0} />);
    expect(screen.getByRole('group', { name: 'סיכום-משתמש' })).toBeInTheDocument();
  });

  it('ערכי אפס מוצגים ללא שגיאה', () => {
    render(<UserHeaderStats credits={0} xpToday={0} streakDays={0} />);
    const labels = screen.getAllByLabelText(/0/);
    expect(labels.length).toBeGreaterThanOrEqual(3);
  });
});

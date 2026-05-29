import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DailyGoalSelector } from '@/components/settings/DailyGoalSelector';

describe('DailyGoalSelector', () => {
  it('מסמן את הברירת-המחדל (15 דק׳ "מאוזן")', () => {
    render(<DailyGoalSelector value={15} onChange={() => {}} />);
    const fifteen = screen.getByRole('radio', { name: /15/ });
    expect(fifteen).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('מאוזן')).toBeInTheDocument();
  });

  it('קורא ל-onChange עם הערך החדש', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DailyGoalSelector value={15} onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: /20/ }));
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it('יש 4 כפתורים: 5/10/15/20', () => {
    render(<DailyGoalSelector value={15} onChange={() => {}} />);
    expect(screen.getAllByRole('radio')).toHaveLength(4);
  });
});

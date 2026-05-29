import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeSelector } from '@/components/settings/ThemeSelector';

describe('ThemeSelector', () => {
  it('מציג 3 אפשרויות: מערכת/בהיר/כהה', () => {
    render(<ThemeSelector value="system" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: /מערכת/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /בהיר/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /כהה/ })).toBeInTheDocument();
  });

  it('מסמן aria-checked על הערכה הנבחרת', () => {
    render(<ThemeSelector value="dark" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: /כהה/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /בהיר/ })).toHaveAttribute('aria-checked', 'false');
  });

  it('קורא ל-onChange עם הערך החדש', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ThemeSelector value="system" onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: /כהה/ }));
    expect(onChange).toHaveBeenCalledWith('dark');
  });
});

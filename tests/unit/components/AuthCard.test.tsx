import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthCard } from '@/components/auth/AuthCard';

const sendMagicLink = vi.fn();
const signInWithGoogle = vi.fn();
vi.mock('@/lib/auth/actions', () => ({
  sendMagicLink: (e: string) => sendMagicLink(e),
  signInWithGoogle: () => signInWithGoogle(),
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  sendMagicLink.mockReset();
  signInWithGoogle.mockReset();
});

describe('AuthCard', () => {
  it('מציג את שתי דרכי-ההתחברות במצב choices', () => {
    render(<AuthCard />);
    expect(screen.getByRole('button', { name: /המשך עם Google/ })).toBeInTheDocument();
    expect(screen.getByLabelText('אימייל')).toBeInTheDocument();
    expect(screen.getByText('או')).toBeInTheDocument();
  });

  it('עובר למצב magic-sent אחרי שליחה מוצלחת', async () => {
    sendMagicLink.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<AuthCard />);

    await user.type(screen.getByLabelText('אימייל'), 'motilev8@gmail.com');
    await user.click(screen.getByRole('button', { name: 'שלח קישור התחברות' }));

    expect(await screen.findByText('בדוק את המייל שלך! ✉')).toBeInTheDocument();
    expect(screen.getByText('motilev8@gmail.com')).toBeInTheDocument();
  });

  it('שגיאת Google נמחקת אחרי חזרה דרך "שנה אימייל" (BUG-1)', async () => {
    signInWithGoogle.mockResolvedValue({ ok: false, error: 'ההתחברות עם Google נכשלה. נסה שוב.' });
    sendMagicLink.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<AuthCard />);

    // 1. שגיאת Google מוצגת
    await user.click(screen.getByRole('button', { name: /המשך עם Google/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('ההתחברות עם Google נכשלה');

    // 2. שליחת magic link → magic-sent
    await user.type(screen.getByLabelText('אימייל'), 'a@b.com');
    await user.click(screen.getByRole('button', { name: 'שלח קישור התחברות' }));
    await screen.findByText('בדוק את המייל שלך! ✉');

    // 3. חזרה — השגיאה הישנה לא אמורה להופיע
    await user.click(screen.getByRole('button', { name: 'שנה אימייל' }));
    expect(screen.queryByText('ההתחברות עם Google נכשלה. נסה שוב.')).not.toBeInTheDocument();
  });

  it('"שנה אימייל" חוזר למצב choices', async () => {
    sendMagicLink.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<AuthCard />);

    await user.type(screen.getByLabelText('אימייל'), 'a@b.com');
    await user.click(screen.getByRole('button', { name: 'שלח קישור התחברות' }));
    await screen.findByText('בדוק את המייל שלך! ✉');

    await user.click(screen.getByRole('button', { name: 'שנה אימייל' }));
    expect(screen.getByRole('button', { name: /המשך עם Google/ })).toBeInTheDocument();
  });
});

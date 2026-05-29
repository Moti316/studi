import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MagicSentView } from '@/components/auth/MagicSentView';

const sendMagicLink = vi.fn();
vi.mock('@/lib/auth/actions', () => ({
  sendMagicLink: (email: string, next?: string) => sendMagicLink(email, next),
}));

beforeEach(() => {
  sendMagicLink.mockReset();
});

describe('MagicSentView', () => {
  it('מציג את האימייל ואת תוקף-הקישור', () => {
    render(<MagicSentView email="motilev8@gmail.com" onChangeEmail={vi.fn()} />);
    expect(screen.getByText('motilev8@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('הקישור תקף ל-60 דקות')).toBeInTheDocument();
  });

  it('כפתור "שלח שוב" נעול בזמן ה-cooldown ההתחלתי', () => {
    render(<MagicSentView email="a@b.com" onChangeEmail={vi.fn()} />);
    // הספירה מתחילה ב-60 → הכפתור מציג "(60)" ונעול
    const resend = screen.getByRole('button', { name: /שלח שוב/ });
    expect(resend).toBeDisabled();
    expect(resend).toHaveTextContent('60');
  });

  it('"שנה אימייל" קורא ל-onChangeEmail', async () => {
    const onChangeEmail = vi.fn();
    const user = userEvent.setup();
    render(<MagicSentView email="a@b.com" onChangeEmail={onChangeEmail} />);
    await user.click(screen.getByRole('button', { name: 'שנה אימייל' }));
    expect(onChangeEmail).toHaveBeenCalledOnce();
  });

  // הערה: זרימת ה-resend אחרי cooldown (כולל BUG-2 ו-העברת next) מכוסה
  // ב-e2e (tests/e2e/auth.spec.ts) — דפוס recursive-timer + React state
  // אינו ניתן ל-fast-forward אמין תחת jsdom.
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

const signInWithGoogle = vi.fn();
vi.mock('@/lib/auth/actions', () => ({
  signInWithGoogle: (next?: string) => signInWithGoogle(next),
}));

beforeEach(() => {
  signInWithGoogle.mockReset();
});

describe('GoogleSignInButton', () => {
  it('מנתב ל-URL שמתקבל בהצלחה', async () => {
    signInWithGoogle.mockResolvedValue({
      ok: true,
      data: { url: 'https://accounts.google.com/x' },
    });

    // jsdom: לתפוס assignment ל-window.location.href
    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        get href() {
          return '';
        },
        set href(v: string) {
          hrefSetter(v);
        },
      },
    });

    const user = userEvent.setup();
    render(<GoogleSignInButton next="/settings" />);
    await user.click(screen.getByRole('button', { name: /המשך עם Google/ }));

    expect(signInWithGoogle).toHaveBeenCalledWith('/settings');
    await waitFor(() => expect(hrefSetter).toHaveBeenCalledWith('https://accounts.google.com/x'));
  });

  it('קורא ל-onError בכישלון ומשחרר את הכפתור', async () => {
    signInWithGoogle.mockResolvedValue({ ok: false, error: 'ההתחברות עם Google נכשלה. נסה שוב.' });
    const onError = vi.fn();
    const user = userEvent.setup();
    render(<GoogleSignInButton onError={onError} />);

    const btn = screen.getByRole('button', { name: /המשך עם Google/ });
    await user.click(btn);

    expect(onError).toHaveBeenCalledWith('ההתחברות עם Google נכשלה. נסה שוב.');
    await waitFor(() => expect(btn).toBeEnabled());
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

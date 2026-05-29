import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteAccountModal } from '@/components/auth/DeleteAccountModal';

const deleteAccount = vi.fn();
const push = vi.fn();

vi.mock('@/lib/auth/actions', () => ({
  deleteAccount: (email: string) => deleteAccount(email),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  deleteAccount.mockReset();
  push.mockReset();
});

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'מחק חשבון' }));
}

describe('DeleteAccountModal', () => {
  it('כפתור המחיקה נעול עד שהאימייל תואם', async () => {
    const user = userEvent.setup();
    render(<DeleteAccountModal userEmail="motilev8@gmail.com" />);
    await open(user);

    const confirmBtn = screen.getByRole('button', { name: 'מחק לצמיתות' });
    expect(confirmBtn).toBeDisabled();

    await user.type(screen.getByLabelText(/הקלד את האימייל/), 'motilev8@gmail.com');
    expect(confirmBtn).toBeEnabled();
  });

  it('התאמה case-insensitive', async () => {
    const user = userEvent.setup();
    render(<DeleteAccountModal userEmail="Moti@Example.com" />);
    await open(user);

    await user.type(screen.getByLabelText(/הקלד את האימייל/), 'moti@example.com');
    expect(screen.getByRole('button', { name: 'מחק לצמיתות' })).toBeEnabled();
  });

  it('קורא ל-deleteAccount ומנתב לבית בהצלחה', async () => {
    deleteAccount.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<DeleteAccountModal userEmail="a@b.com" />);
    await open(user);

    await user.type(screen.getByLabelText(/הקלד את האימייל/), 'a@b.com');
    await user.click(screen.getByRole('button', { name: 'מחק לצמיתות' }));

    expect(deleteAccount).toHaveBeenCalledWith('a@b.com');
    expect(push).toHaveBeenCalledWith('/');
  });

  it('מציג שגיאה ונשאר בדף בכישלון', async () => {
    deleteAccount.mockResolvedValue({ ok: false, error: 'מחיקת החשבון נכשלה. נסה שוב.' });
    const user = userEvent.setup();
    render(<DeleteAccountModal userEmail="a@b.com" />);
    await open(user);

    await user.type(screen.getByLabelText(/הקלד את האימייל/), 'a@b.com');
    await user.click(screen.getByRole('button', { name: 'מחק לצמיתות' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('מחיקת החשבון נכשלה');
    expect(push).not.toHaveBeenCalled();
  });
});

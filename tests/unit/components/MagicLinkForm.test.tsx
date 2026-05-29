import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MagicLinkForm } from '@/components/auth/MagicLinkForm';

const sendMagicLink = vi.fn();
vi.mock('@/lib/auth/actions', () => ({
  sendMagicLink: (email: string) => sendMagicLink(email),
}));

beforeEach(() => {
  sendMagicLink.mockReset();
});

describe('MagicLinkForm', () => {
  it('מציג שגיאה ולא שולח כשהאימייל לא תקין', async () => {
    const user = userEvent.setup();
    const onSent = vi.fn();
    render(<MagicLinkForm onSent={onSent} />);

    await user.type(screen.getByLabelText('אימייל'), 'not-valid');
    await user.click(screen.getByRole('button', { name: 'שלח קישור התחברות' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('כתובת האימייל אינה תקינה');
    expect(sendMagicLink).not.toHaveBeenCalled();
    expect(onSent).not.toHaveBeenCalled();
  });

  it('שולח וקורא ל-onSent כשהאימייל תקין', async () => {
    sendMagicLink.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    const onSent = vi.fn();
    render(<MagicLinkForm onSent={onSent} />);

    await user.type(screen.getByLabelText('אימייל'), 'motilev8@gmail.com');
    await user.click(screen.getByRole('button', { name: 'שלח קישור התחברות' }));

    expect(sendMagicLink).toHaveBeenCalledWith('motilev8@gmail.com');
    expect(onSent).toHaveBeenCalledWith('motilev8@gmail.com');
  });

  it('מציג שגיאת-שרת כשהשליחה נכשלת', async () => {
    sendMagicLink.mockResolvedValue({ ok: false, error: 'שליחת הקישור נכשלה. נסה שוב.' });
    const user = userEvent.setup();
    const onSent = vi.fn();
    render(<MagicLinkForm onSent={onSent} />);

    await user.type(screen.getByLabelText('אימייל'), 'a@b.com');
    await user.click(screen.getByRole('button', { name: 'שלח קישור התחברות' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('שליחת הקישור נכשלה');
    expect(onSent).not.toHaveBeenCalled();
  });

  it('שדה האימייל מסומן aria-invalid בשגיאה (נגישות)', async () => {
    const user = userEvent.setup();
    render(<MagicLinkForm onSent={vi.fn()} />);
    const field = screen.getByLabelText('אימייל');

    await user.type(field, 'bad');
    await user.tab();

    expect(field).toHaveAttribute('aria-invalid', 'true');
  });
});

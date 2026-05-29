import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceGrid } from '@/components/settings/VoiceGrid';

describe('VoiceGrid', () => {
  it('מציג 4 קולות: יואב/טלי/מיכל/אורי', () => {
    render(<VoiceGrid value="yoav" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: /יואב/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /טלי/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /מיכל/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /אורי/ })).toBeInTheDocument();
  });

  it('יואב מסומן כברירת-מחדל', () => {
    render(<VoiceGrid value="yoav" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: /יואב/ })).toHaveAttribute('aria-checked', 'true');
  });

  it('שינוי קול קורא ל-onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<VoiceGrid value="yoav" onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: /טלי/ }));
    expect(onChange).toHaveBeenCalledWith('tali');
  });

  it('כפתור-דוגמה נעול כשאין onPreview (Phase 7)', () => {
    render(<VoiceGrid value="yoav" onChange={() => {}} />);
    const previews = screen.getAllByRole('button', { name: /האזן לדוגמה/ });
    previews.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('כפתור-דוגמה פעיל כשמועבר onPreview', () => {
    render(<VoiceGrid value="yoav" onChange={() => {}} onPreview={() => {}} />);
    const previews = screen.getAllByRole('button', { name: /האזן לדוגמה/ });
    previews.forEach((btn) => expect(btn).toBeEnabled());
  });
});

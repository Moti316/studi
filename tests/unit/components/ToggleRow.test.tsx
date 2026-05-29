import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleRow } from '@/components/settings/ToggleRow';

describe('ToggleRow', () => {
  it('מציג label', () => {
    render(<ToggleRow label="התראות" checked={false} onCheckedChange={() => {}} />);
    expect(screen.getByText('התראות')).toBeInTheDocument();
  });

  it('מציג description כשמועבר', () => {
    render(
      <ToggleRow label="TTS" description="קריאה בקול" checked={false} onCheckedChange={() => {}} />,
    );
    expect(screen.getByText('קריאה בקול')).toBeInTheDocument();
  });

  it('description לא מוצג כשלא מועבר', () => {
    const { container } = render(
      <ToggleRow label="התראות" checked={false} onCheckedChange={() => {}} />,
    );
    // אין אלמנט p של תיאור כשלא מועבר description
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('Switch מוצג', () => {
    render(<ToggleRow label="התראות" checked={false} onCheckedChange={() => {}} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('Switch מסומן כ-checked כשהערך true', () => {
    render(<ToggleRow label="התראות" checked={true} onCheckedChange={() => {}} />);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('Switch לא מסומן כשהערך false', () => {
    render(<ToggleRow label="התראות" checked={false} onCheckedChange={() => {}} />);
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('לחיצה קוראת ל-onCheckedChange', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<ToggleRow label="התראות" checked={false} onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
  });

  it('כשdisabled — לא ניתן ללחוץ', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ToggleRow
        label="התראות"
        checked={false}
        onCheckedChange={onCheckedChange}
        disabled={true}
      />,
    );
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toBeDisabled();
    await user.click(switchEl);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('label מקושר ל-Switch (htmlFor)', () => {
    render(<ToggleRow label="TTS" checked={false} onCheckedChange={() => {}} />);
    const label = screen.getByText('TTS').closest('label');
    const switchEl = screen.getByRole('switch');
    expect(label).toHaveAttribute('for', switchEl.id);
  });

  it('description מקושר ל-Switch ב-aria-describedby', () => {
    render(
      <ToggleRow label="TTS" description="קריאה בקול" checked={false} onCheckedChange={() => {}} />,
    );
    const switchEl = screen.getByRole('switch');
    const descId = switchEl.getAttribute('aria-describedby');
    expect(descId).toBeTruthy();
    const descEl = document.getElementById(descId!);
    expect(descEl).toHaveTextContent('קריאה בקול');
  });
});

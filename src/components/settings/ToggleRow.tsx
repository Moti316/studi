'use client';

import { useId } from 'react';
import { Switch } from '@/components/ui/switch';

interface Props {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
}

/**
 * שורת-toggle: תווית מימין (RTL), Switch משמאל, תיאור-משנה אופציונלי.
 */
export function ToggleRow({ label, description, checked, onCheckedChange, disabled }: Props) {
  const id = useId();
  const descId = description ? `${id}-desc` : undefined;
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex-1 space-y-1">
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        {description && (
          <p id={descId} className="text-foreground/60 text-xs">
            {description}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={descId}
      />
    </div>
  );
}

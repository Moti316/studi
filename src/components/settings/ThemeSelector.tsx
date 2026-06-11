'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ThemePref } from '@/lib/mock/user';

interface Props {
  value: ThemePref;
  onChange: (next: ThemePref) => void;
}

const OPTIONS: { value: ThemePref; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'מערכת', Icon: Monitor },
  { value: 'light', label: 'בהיר', Icon: Sun },
  { value: 'dark', label: 'כהה', Icon: Moon },
];

/**
 * בחירת ערכת-נושא: מערכת / בהיר / כהה.
 * השינוי **מוחל בפועל** (SettingsForm → applyTheme · class `dark` על <html> · src/lib/theme.ts)
 * ונשמר ב-localStorage (no-flash init ב-layout).
 */
export function ThemeSelector({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="ערכת-נושא" className="grid grid-cols-3 gap-2">
      {OPTIONS.map(({ value: v, label, Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-md border px-2 py-4 text-sm transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
              active
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-border bg-card hover:border-primary-500/50',
            )}
          >
            <Icon className="size-6" aria-hidden="true" />
            <span className="font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';
import type { DailyGoalMin } from '@/lib/mock/user';

interface Props {
  value: DailyGoalMin;
  onChange: (next: DailyGoalMin) => void;
}

const OPTIONS: { value: DailyGoalMin; label: string; sub?: string }[] = [
  { value: 5, label: '5 דק׳' },
  { value: 10, label: '10 דק׳' },
  { value: 15, label: '15 דק׳', sub: 'מאוזן' },
  { value: 20, label: '20 דק׳' },
];

/**
 * בחירת יעד-יומי. 4 כפתורים, ה-15 דק׳ הוא ברירת-המחדל ("מאוזן").
 */
export function DailyGoalSelector({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="יעד-יומי בדקות" className="grid grid-cols-4 gap-2">
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-md border px-2 py-3 text-sm transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
              active
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-border bg-card hover:border-primary-500/50',
            )}
          >
            <span className="font-bold">{opt.label}</span>
            {opt.sub && <span className="text-foreground/60 text-xs">{opt.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

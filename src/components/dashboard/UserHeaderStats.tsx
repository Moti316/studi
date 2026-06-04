import { Coins, Zap, Flame } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface Props {
  credits: number;
  xpToday: number;
  streakDays: number;
}

/**
 * 3 counters בראש הדאשבורד: credits / XP today / streak.
 * אייקונים decorative; הטקסט קורא לעצמו ב-aria-label.
 */
export function UserHeaderStats({ credits, xpToday, streakDays }: Props) {
  return (
    <div className="flex items-center gap-3 text-sm" role="group" aria-label="סיכום-משתמש">
      <Stat
        icon={<Coins className="size-4 text-accent-600" />}
        value={formatNumber(credits)}
        label="קרדיטים"
      />
      <Stat
        icon={<Zap className="size-4 text-primary-500" />}
        value={formatNumber(xpToday)}
        label="XP היום"
      />
      <Stat
        icon={<Flame className="size-4 text-accent-600" />}
        value={formatNumber(streakDays)}
        label="ימי רצף"
      />
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1">
      {icon}
      <span className="font-semibold" aria-label={`${value} ${label}`}>
        {value}
      </span>
    </div>
  );
}

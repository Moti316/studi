import { Award } from 'lucide-react';

interface Props {
  level: string;
}

/**
 * תג-רמה (מתחיל / מתקדם / וכו'). Placeholder ל-Phase 6 (gamification מלאה).
 */
export function LevelBadge({ level }: Props) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-sm font-medium text-accent-700">
      <Award className="size-4" aria-hidden="true" />
      <span>רמה: {level}</span>
    </div>
  );
}

import { Progress } from '@/components/ui/progress';

interface Props {
  title: string;
  current: number;
  goal: number;
  /** "עוד 20 XP" / "עוד שיעור אחד" */
  encouragement?: string;
}

/**
 * כרטיסיית-יעד יומי. XP / lessons-today / time-today.
 */
export function DailyProgressCard({ title, current, goal, encouragement }: Props) {
  const safeGoal = Math.max(1, goal);
  const value = Math.min(100, Math.round((current / safeGoal) * 100));

  return (
    <section className="card space-y-2">
      <header className="flex items-baseline justify-between">
        <h3 className="text-sm font-bold">{title}</h3>
        <span className="text-foreground/60 text-xs" aria-label={`${current} מתוך ${goal}`}>
          {current}/{goal}
        </span>
      </header>
      <Progress value={value} aria-label={`התקדמות: ${value}%`} />
      {encouragement && <p className="text-foreground/60 text-xs">{encouragement}</p>}
    </section>
  );
}

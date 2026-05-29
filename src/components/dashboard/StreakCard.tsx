import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  streakDays: number;
  /** המספור-בעברית: ראשון..שבת. ה-index הוא היום-בשבוע של תאריך-היום (0=ראשון). */
  today: number;
}

const DAY_LABELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

/**
 * כרטיסיית-רצף עם מיני-לוח 7 ימים. היום מודגש.
 * אם streakDays=0 → מצב empty עידוד.
 */
export function StreakCard({ streakDays, today }: Props) {
  const empty = streakDays === 0;

  return (
    <section aria-labelledby="streak-heading" className="card space-y-3">
      <header className="flex items-center justify-between">
        <h2 id="streak-heading" className="text-base font-bold">
          רצף-למידה
        </h2>
        {!empty && (
          <span className="flex items-center gap-1 text-sm font-bold text-accent-600">
            <Flame className="size-4" aria-hidden="true" />
            <span>
              {streakDays} {streakDays === 1 ? 'יום' : 'ימים'}
            </span>
          </span>
        )}
      </header>

      {empty ? (
        <p className="text-foreground/60 text-sm">אין רצף עדיין — למד היום כדי להתחיל!</p>
      ) : (
        <p className="text-foreground/60 text-sm">המשך כך — כל יום נחשב.</p>
      )}

      <ol className="flex justify-between gap-1" aria-label="ימי השבוע">
        {DAY_LABELS.map((label, i) => (
          <li
            key={label}
            className={cn(
              'flex size-9 flex-col items-center justify-center rounded-full text-xs font-medium',
              i === today ? 'bg-primary-500 text-white' : 'text-foreground/60 bg-background',
            )}
            aria-current={i === today ? 'date' : undefined}
          >
            <span aria-label={`יום ${label}`}>{label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

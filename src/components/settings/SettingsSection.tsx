import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * SettingsSection — כל סעיף בהגדרות עטוף בקרטיסיה עם כותרת ותיאור אופציונלי.
 * שימוש נכון של aria-labelledby להבטחת a11y landmark.
 */
export function SettingsSection({ title, description, children, className }: Props) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn('card space-y-4', className)}>
      <header className="space-y-1">
        <h2 id={id} className="text-lg font-bold">
          {title}
        </h2>
        {description && <p className="text-foreground/60 text-sm">{description}</p>}
      </header>
      {children}
    </section>
  );
}

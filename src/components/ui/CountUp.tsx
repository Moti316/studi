'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatNumber } from '@/lib/utils';

interface Props {
  /** הערך-הסופי שאליו סופרים. */
  value: number;
  /** משך-האנימציה ב-ms (ברירת-מחדל 900). */
  durationMs?: number;
  /** עיכוב-התחלה ב-ms (לאפקט-מדורג). */
  delayMs?: number;
  /** מחרוזת-תחילית (למשל "+"). */
  prefix?: string;
  /** מחרוזת-סיומת (למשל " XP"). */
  suffix?: string;
  className?: string;
}

/** useLayoutEffect ב-client (לאיפוס-לפני-paint · ללא-flash) · useEffect ב-SSR (ללא-warning). */
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * CountUp — מספר שמטפס מ-0 לערכו עם easing (StudiesGo-feel · gamified).
 *
 * - מכבד `prefers-reduced-motion` ו-`value===0` → מציג מיד את הערך-הסופי בלי-אנימציה.
 * - איפוס-ל-0 ב-`useLayoutEffect` (לפני-paint) → אין flash של value→0 על-המסך.
 * - a11y: המספר-המונפש `aria-hidden`; ערך-סופי ב-`sr-only` (קורא-מסך שומע פעם-אחת, לא כל-tick).
 * - SSR-safe: הערך-ההתחלתי = הערך-הסופי (match עם ה-HTML), והאיפוס קורה לפני-paint בלקוח.
 */
export function CountUp({
  value,
  durationMs = 900,
  delayMs = 0,
  prefix = '',
  suffix = '',
  className,
}: Props) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);

  useIsoLayoutEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || value === 0) {
      setDisplay(value);
      return;
    }

    setDisplay(0); // לפני-paint → אין flash
    let start: number | null = null;
    const timeout = window.setTimeout(() => {
      const tick = (ts: number) => {
        if (start === null) start = ts;
        const t = Math.min(1, (ts - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        setDisplay(Math.round(eased * value));
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      window.clearTimeout(timeout);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs, delayMs]);

  const text = `${prefix}${formatNumber(value)}${suffix}`;
  return (
    <span className={className}>
      <span aria-hidden="true">
        {prefix}
        {formatNumber(display)}
        {suffix}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface Props {
  /** ערך נוכחי. */
  value: number;
  /** יעד. */
  goal: number;
  /** קוטר ה-SVG בפיקסלים (ברירת-מחדל 72). */
  size?: number;
  /** עובי-הטבעת (ברירת-מחדל 7). */
  stroke?: number;
  /** צבע-הקשת (CSS color · ברירת-מחדל token primary · dark-aware). */
  color?: string;
  /** תווית-מרכז (ReactNode) — אם לא נמסר, מציג value. */
  children?: React.ReactNode;
  /** aria-label לנגישות. */
  label?: string;
}

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * RingProgress — טבעת-התקדמות מעגלית מונפשת (SVG · sweep + easing).
 *
 * מחליפה את ה-progress-bar השטוח בטבעת-gamified (StudiesGo/Duolingo-feel).
 * - מכבדת reduced-motion ו-value=0 (מציגה מיד את הערך-הסופי · ללא-flash).
 * - איפוס-ל-0 ב-useLayoutEffect (לפני-paint). RTL-neutral (מעגל).
 * - צבעים מ-CSS-vars (--ring-fill/--ring-track) → dark-mode עובד אוטומטית.
 * - a11y: role=img + aria-label עם הערך-הסופי (לא מושפע מהאנימציה).
 */
export function RingProgress({
  value,
  goal,
  size = 72,
  stroke = 7,
  color = 'var(--ring-fill)',
  children,
  label,
}: Props) {
  const safeGoal = Math.max(1, goal);
  const target = Math.min(1, value / safeGoal);
  const [progress, setProgress] = useState(target);
  const rafRef = useRef<number | null>(null);

  useIsoLayoutEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const goalSafe = Math.max(1, goal);
    const tgt = Math.min(1, value / goalSafe);
    if (reduce || value === 0) {
      setProgress(tgt);
      return;
    }
    setProgress(0); // לפני-paint → אין flash
    let start: number | null = null;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / 1000);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased * tgt);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, goal]);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * progress;
  const center = size / 2;
  const pct = Math.round(target * 100);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `התקדמות ${pct}%`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--ring-track)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
        />
      </svg>
      <span
        className="absolute inset-0 flex flex-col items-center justify-center"
        aria-hidden="true"
      >
        {children}
      </span>
    </div>
  );
}

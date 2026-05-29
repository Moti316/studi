import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn - merge Tailwind class names safely
 * pattern used by shadcn/ui
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * formatHebrewDate - format date for Hebrew RTL display
 */
export function formatHebrewDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * formatNumber - format number with Hebrew locale (thousands separator)
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('he-IL').format(n);
}

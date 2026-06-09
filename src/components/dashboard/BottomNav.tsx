'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Scale, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  Icon: typeof Home;
  matchPrefix?: string;
}

const ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'בית', Icon: Home },
  { href: '/courses', label: 'קורסים', Icon: BookOpen, matchPrefix: '/courses' },
  { href: '/legislation', label: 'חקיקה', Icon: Scale, matchPrefix: '/legislation' },
  { href: '/settings', label: 'הגדרות', Icon: Settings },
];

/** @internal — מיוצא לטסטים */
export function isActive(pathname: string, item: NavItem): boolean {
  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.matchPrefix}/`);
  }
  return pathname === item.href;
}

/**
 * BottomNav — ניווט תחתון 4-טאבים. mobile-first, sticky-bottom.
 * RTL: הסדר ב-DOM הוא בית→קורסים→חקיקה→הגדרות; flex משאיר זאת חזותית בעברית.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="ניווט ראשי" className="sticky bottom-0 z-40 border-t border-border bg-card">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 text-xs transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
                  active ? 'text-primary-600' : 'text-foreground/60 hover:text-foreground',
                )}
              >
                <item.Icon className="size-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

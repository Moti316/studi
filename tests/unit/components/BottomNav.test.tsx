import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottomNav, isActive } from '@/components/dashboard/BottomNav';

const usePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => usePathname(),
}));

beforeEach(() => {
  usePathname.mockReset();
});

describe('isActive', () => {
  const home = { href: '/dashboard', label: 'בית', Icon: () => null } as never;
  const courses = {
    href: '/courses',
    label: 'קורסים',
    Icon: () => null,
    matchPrefix: '/courses',
  } as never;

  it('exact match', () => {
    expect(isActive('/dashboard', home)).toBe(true);
    expect(isActive('/settings', home)).toBe(false);
  });

  it('prefix match לקורס פרטני (/courses/123)', () => {
    expect(isActive('/courses/123', courses)).toBe(true);
    expect(isActive('/courses', courses)).toBe(true);
  });

  it('לא חוטף prefix דומה (/coursesx)', () => {
    expect(isActive('/coursesx', courses)).toBe(false);
  });
});

describe('BottomNav', () => {
  it('מציג 4 טאבים בעברית (כולל חקיקה)', () => {
    usePathname.mockReturnValue('/dashboard');
    render(<BottomNav />);
    expect(screen.getByRole('link', { name: /בית/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /קורסים/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /חקיקה/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /הגדרות/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /סטטיסטיקות/ })).not.toBeInTheDocument();
  });

  it('מסמן חקיקה כפעיל ב-/legislation', () => {
    usePathname.mockReturnValue('/legislation');
    render(<BottomNav />);
    expect(screen.getByRole('link', { name: /חקיקה/ })).toHaveAttribute('aria-current', 'page');
  });

  it('מסמן aria-current על הטאב הנוכחי', () => {
    usePathname.mockReturnValue('/courses');
    render(<BottomNav />);
    expect(screen.getByRole('link', { name: /קורסים/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /בית/ })).not.toHaveAttribute('aria-current');
  });

  it('יש landmark עם תוית-נגישות "ניווט ראשי"', () => {
    usePathname.mockReturnValue('/dashboard');
    render(<BottomNav />);
    expect(screen.getByRole('navigation', { name: 'ניווט ראשי' })).toBeInTheDocument();
  });
});

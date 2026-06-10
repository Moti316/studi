/**
 * DashboardView — מסך-הבית (מהפך-עיצוב). מאמת greeting, CTA, קורסים, ולוגיקת-הרצף
 * (כולל את תיקון today=0 / יום-ראשון · המקרה ששבר את הגרסה הקודמת).
 *
 * מוקים: next/navigation (BottomNav→usePathname) + matchMedia (reduced-motion → ללא-rAF).
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));

import { DashboardView } from '@/components/dashboard/DashboardView';
import type { MockUserProfile } from '@/lib/mock/user';
import type { MockCourse } from '@/lib/mock/courses';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (q: string) => ({
      matches: true,
      media: q,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
      onchange: null,
    }),
  });
});

function user(over: Partial<MockUserProfile> = {}): MockUserProfile {
  return {
    displayName: 'מוטי לוי',
    email: 'demo@x.dev',
    credits: 1500,
    xpToday: 15,
    xpDailyGoal: 20,
    lessonsToday: 1,
    lessonsDailyGoal: 1,
    streakDays: 5,
    level: 'מתקדם',
    ...over,
  };
}

const COURSES: MockCourse[] = [
  {
    id: 'c1',
    title: 'ממונה בטיחות בעבודה',
    totalLessons: 8,
    completedLessons: 3,
    lastAccessedIso: '2026-06-04T08:00:00.000Z',
    href: '/courses/safety-officer',
  },
];

describe('DashboardView', () => {
  it('greeting תלוי-שעה + שם-המשתמש', () => {
    render(<DashboardView user={user()} courses={COURSES} hour={9} today={3} />);
    expect(screen.getByText('בוקר טוב,')).toBeInTheDocument();
    expect(screen.getByText('מוטי לוי')).toBeInTheDocument();
  });

  it('CTA פרויקט-גמר מרונדר', () => {
    render(<DashboardView user={user()} courses={COURSES} hour={9} today={3} />);
    expect(screen.getByTestId('dashboard-capstone-cta')).toBeInTheDocument();
  });

  it('קורסים מרונדרים', () => {
    render(<DashboardView user={user()} courses={COURSES} hour={9} today={3} />);
    expect(screen.getByText('ממונה בטיחות בעבודה')).toBeInTheDocument();
  });

  it('רצף today=3 (אמצע-שבוע) → רק ימי-עבר-השבוע מסומנים "הושלם"', () => {
    render(<DashboardView user={user({ streakDays: 5 })} courses={COURSES} hour={9} today={3} />);
    // today=3 (ד): ימי-עבר-השבוע = ג(2),ב(1),א(0) → 3 הושלמו. ה'/ו'/ש' (עתיד) לא נדלקים.
    expect(screen.getAllByLabelText(/הושלם/)).toHaveLength(3);
  });

  it('★ רצף today=0 (יום-ראשון) → 0 הושלמו (תחילת-שבוע · תקין · ללא ימים-עתידיים)', () => {
    render(<DashboardView user={user({ streakDays: 5 })} courses={COURSES} hour={9} today={0} />);
    // א' = תחילת-השבוע → אין ימי-עבר-השבוע. (הרצף-המלא מוצג כמספר "<n> ימים".)
    expect(screen.queryAllByLabelText(/הושלם/)).toHaveLength(0);
  });

  it('★ ימים-עתידיים-השבוע לעולם לא נדלקים (גם ברצף-ארוך)', () => {
    render(<DashboardView user={user({ streakDays: 10 })} courses={COURSES} hour={9} today={4} />);
    // today=4 (ה), רצף 10: ימי-עבר = ד(3),ג(2),ב(1),א(0) → 4 בלבד. ו'(5)/ש'(6) עתיד → לא.
    expect(screen.getAllByLabelText(/הושלם/)).toHaveLength(4);
  });

  it('streak=0 → מצב-empty (אין-רצף)', () => {
    render(<DashboardView user={user({ streakDays: 0 })} courses={COURSES} hour={9} today={3} />);
    expect(screen.getByText(/אין רצף עדיין/)).toBeInTheDocument();
    expect(screen.queryAllByLabelText(/הושלם/)).toHaveLength(0);
  });
});

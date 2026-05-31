import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from '@supabase/supabase-js';

/**
 * שער-יוצר (creator gate). `requireCreator()` מאמת שהמשתמש מחובר **וגם**
 * שהאימייל שלו הוא של היוצר (motilev8) — אחרת מנתב הרחק (forbid).
 *
 * מוקים (לפי דפוס הטסטים הקיים):
 * - `@/lib/auth/server` → `getUser` כדי לשלוט במשתמש המוחזר בלי Supabase אמיתי.
 * - `next/navigation` → `redirect` זורק sentinel (כמו ב-Next runtime) כדי
 *   שנוכל לאמת שהפונקציה לא "ממשיכה" אחרי redirect.
 */

const getUserMock = vi.fn<() => Promise<User | null>>();

vi.mock('@/lib/auth/server', () => ({
  getUser: () => getUserMock(),
}));

class RedirectError extends Error {
  constructor(public target: string) {
    super(`NEXT_REDIRECT:${target}`);
    this.name = 'RedirectError';
  }
}

vi.mock('next/navigation', () => ({
  redirect: (target: string) => {
    throw new RedirectError(target);
  },
}));

import { requireCreator, CREATOR_EMAIL } from '@/lib/auth/creator';

/** בונה משתמש-מוק מינימלי עם אימייל נתון. */
function userWith(email: string | undefined): User {
  return { id: 'u_1', email } as unknown as User;
}

beforeEach(() => {
  getUserMock.mockReset();
});

describe('requireCreator (creator gate)', () => {
  it('מחזיר את המשתמש כשהאימייל הוא של היוצר', async () => {
    const creator = userWith(CREATOR_EMAIL);
    getUserMock.mockResolvedValue(creator);

    await expect(requireCreator()).resolves.toBe(creator);
  });

  it('מקבל את אימייל-היוצר ללא תלות ברישיות (case-insensitive)', async () => {
    const creator = userWith(CREATOR_EMAIL.toUpperCase());
    getUserMock.mockResolvedValue(creator);

    await expect(requireCreator()).resolves.toBe(creator);
  });

  it('דוחה משתמש מחובר שאינו היוצר (משתמש-בטא) — מנתב הרחק', async () => {
    getUserMock.mockResolvedValue(userWith('beta-user@example.com'));

    await expect(requireCreator()).rejects.toMatchObject({
      name: 'RedirectError',
      target: '/dashboard',
    });
  });

  it('דוחה משתמש מחובר ללא אימייל כלל', async () => {
    getUserMock.mockResolvedValue(userWith(undefined));

    await expect(requireCreator()).rejects.toMatchObject({ name: 'RedirectError' });
  });

  it('דוחה משתמש לא-מחובר — מנתב להתחברות (/beta-access)', async () => {
    getUserMock.mockResolvedValue(null);

    await expect(requireCreator()).rejects.toMatchObject({
      name: 'RedirectError',
      target: '/beta-access',
    });
  });

  it('מעביר nextPath ל-redirect של ההתחברות כשלא-מחובר', async () => {
    getUserMock.mockResolvedValue(null);

    await expect(requireCreator('/admin/courses')).rejects.toMatchObject({
      name: 'RedirectError',
      target: '/beta-access?next=%2Fadmin%2Fcourses',
    });
  });
});

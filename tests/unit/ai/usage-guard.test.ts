/**
 * usage-guard.test.ts — שער-מכסות-AI (שחרור-לחברים).
 * נבדקת ליבת-הזיכרון (consumeInMemory) — ה-DB-path עטוף try/catch ונופל אליה.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { consumeInMemory, dayKey, __resetUsageForTests } from '@/lib/ai/usage-guard';

const DAY = '2026-06-11';
const CAPS = { user: 3, global: 5 };

beforeEach(() => __resetUsageForTests());

describe('consumeInMemory — מכסות-יומיות', () => {
  it('מתיר עד-תקרת-המשתמש ואז חוסם (user-cap)', () => {
    expect(consumeInMemory('u1', DAY, CAPS).allowed).toBe(true);
    expect(consumeInMemory('u1', DAY, CAPS).allowed).toBe(true);
    expect(consumeInMemory('u1', DAY, CAPS).allowed).toBe(true);
    const blocked = consumeInMemory('u1', DAY, CAPS);
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe('user-cap');
  });

  it('מכסה-גלובלית חוסמת גם-משתמש-חדש', () => {
    // u1 צורך 3, u2 צורך 2 → גלובלי=5 (מלא) → u3 נחסם global-cap
    for (let i = 0; i < 3; i++) consumeInMemory('u1', DAY, CAPS);
    for (let i = 0; i < 2; i++) consumeInMemory('u2', DAY, CAPS);
    const blocked = consumeInMemory('u3', DAY, CAPS);
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe('global-cap');
  });

  it('חסימה אינה-צורכת — מונה-המשתמש לא-עולה אחרי-חסימה', () => {
    for (let i = 0; i < 3; i++) consumeInMemory('u1', DAY, CAPS);
    const b1 = consumeInMemory('u1', DAY, CAPS);
    const b2 = consumeInMemory('u1', DAY, CAPS);
    expect(b1.userCount).toBe(3);
    expect(b2.userCount).toBe(3);
  });

  it('יום-חדש = מכסה-חדשה', () => {
    for (let i = 0; i < 3; i++) consumeInMemory('u1', DAY, CAPS);
    expect(consumeInMemory('u1', DAY, CAPS).allowed).toBe(false);
    expect(consumeInMemory('u1', '2026-06-12', CAPS).allowed).toBe(true);
  });
});

describe('dayKey', () => {
  it('YYYY-MM-DD (UTC)', () => {
    expect(dayKey(new Date('2026-06-11T23:59:00Z'))).toBe('2026-06-11');
    expect(dayKey(new Date('2026-06-11T00:00:01Z'))).toBe('2026-06-11');
  });
});

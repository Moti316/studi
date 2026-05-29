import { describe, it, expect, beforeEach } from 'vitest';
import { sendMagicLink, signInWithGoogle, deleteAccount } from '@/lib/auth/actions';
import { magicLinkRateLimiter } from '@/lib/auth/rate-limit';

/**
 * בדיקות לענפים הדטרמיניסטיים (ללא Supabase מוגדר):
 * validation, rate-limit, ו-not-configured.
 */
beforeEach(() => {
  magicLinkRateLimiter.reset();
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

describe('sendMagicLink', () => {
  it('דוחה אימייל לא-תקין לפני כל קריאת-רשת', async () => {
    const res = await sendMagicLink('not-an-email');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('validation');
  });

  it('מחזיר not-configured כשאין keys (אך אימייל תקין)', async () => {
    const res = await sendMagicLink('a@b.com');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('not-configured');
  });

  it('rate-limit נכנס לפעולה לפני בדיקת התצורה', async () => {
    await sendMagicLink('a@b.com'); // hit ראשון נרשם
    const res = await sendMagicLink('a@b.com'); // cooldown
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('cooldown');
  });
});

describe('signInWithGoogle', () => {
  it('מחזיר not-configured כשאין keys', async () => {
    const res = await signInWithGoogle();
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('not-configured');
  });
});

describe('deleteAccount', () => {
  it('דוחה אימייל לא-תקין', async () => {
    const res = await deleteAccount('x');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('validation');
  });

  it('מחזיר not-configured כשאין keys (אימייל תקין)', async () => {
    const res = await deleteAccount('a@b.com');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('not-configured');
  });
});

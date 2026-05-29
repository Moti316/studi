import { describe, it, expect } from 'vitest';
import { MagicLinkRateLimiter } from '@/lib/auth/rate-limit';

describe('MagicLinkRateLimiter', () => {
  it('מאפשר את השליחה הראשונה', () => {
    const rl = new MagicLinkRateLimiter();
    expect(rl.check('a@b.com').allowed).toBe(true);
  });

  it('חוסם שליחה שנייה בתוך ה-cooldown (60s)', () => {
    let t = 0;
    const rl = new MagicLinkRateLimiter({ now: () => t });
    expect(rl.check('a@b.com').allowed).toBe(true);
    t = 30_000; // 30s אחרי
    const res = rl.check('a@b.com');
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('cooldown');
    expect(res.retryAfterSec).toBe(30);
  });

  it('מאפשר שוב אחרי שה-cooldown חלף', () => {
    let t = 0;
    const rl = new MagicLinkRateLimiter({ now: () => t });
    rl.check('a@b.com');
    t = 61_000;
    expect(rl.check('a@b.com').allowed).toBe(true);
  });

  it('חוסם אחרי 3 שליחות בשעה (hourly-quota)', () => {
    let t = 0;
    const rl = new MagicLinkRateLimiter({ now: () => t });
    expect(rl.check('a@b.com').allowed).toBe(true); // 1
    t = 61_000;
    expect(rl.check('a@b.com').allowed).toBe(true); // 2
    t = 122_000;
    expect(rl.check('a@b.com').allowed).toBe(true); // 3
    t = 183_000;
    const res = rl.check('a@b.com'); // 4 — חסום
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('hourly-quota');
  });

  it('מטפל באימיילים שונים בנפרד', () => {
    const t = 0;
    const rl = new MagicLinkRateLimiter({ now: () => t });
    expect(rl.check('a@b.com').allowed).toBe(true);
    expect(rl.check('c@d.com').allowed).toBe(true);
  });

  it('case-insensitive — אותו אימייל באותיות שונות נחשב זהה', () => {
    let t = 0;
    const rl = new MagicLinkRateLimiter({ now: () => t });
    expect(rl.check('A@B.com').allowed).toBe(true);
    t = 1000;
    expect(rl.check('a@b.com').allowed).toBe(false);
  });

  it('לא רושם hit כשהשליחה חסומה (חסימה לא מאריכה את עצמה)', () => {
    let t = 0;
    const rl = new MagicLinkRateLimiter({ now: () => t });
    rl.check('a@b.com'); // t=0, allowed
    t = 10_000;
    rl.check('a@b.com'); // blocked, cooldown
    t = 61_000; // 61s אחרי השליחה המקורית
    expect(rl.check('a@b.com').allowed).toBe(true);
  });
});

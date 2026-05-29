/**
 * Rate limiter ל-magic-link (ADR-003: max 3/שעה לכל אימייל, 60s בין שליחות).
 *
 * ⚠ מימוש in-memory — מתאים ל-mock/dev ולמופע-שרת יחיד. בפרודקשן
 * (Phase 8/9) יוחלף ב-store עמיד (Upstash Redis / Supabase) כדי לעמוד
 * בריבוי-instances של Vercel. החוזה (interface) יישאר זהה.
 */

export interface RateLimitResult {
  allowed: boolean;
  /** שניות עד שניתן לשלוח שוב (0 אם מותר עכשיו) */
  retryAfterSec: number;
  /** הסיבה לחסימה — לבחירת הודעה למשתמש */
  reason?: 'cooldown' | 'hourly-quota';
}

export interface RateLimiterOptions {
  maxPerHour?: number;
  cooldownSec?: number;
  /** הזרקת-זמן לבדיקות */
  now?: () => number;
}

const HOUR_MS = 60 * 60 * 1000;

export class MagicLinkRateLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly maxPerHour: number;
  private readonly cooldownMs: number;
  private readonly now: () => number;

  constructor(opts: RateLimiterOptions = {}) {
    this.maxPerHour = opts.maxPerHour ?? 3;
    this.cooldownMs = (opts.cooldownSec ?? 60) * 1000;
    this.now = opts.now ?? Date.now;
  }

  /** מנרמל אימייל למפתח אחיד (case-insensitive). */
  private key(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * בודק אם מותר לשלוח. אם מותר — רושם את השליחה ומחזיר allowed:true.
   * אם חסום — לא רושם, ומחזיר retryAfterSec.
   */
  check(email: string): RateLimitResult {
    const key = this.key(email);
    const t = this.now();
    const recent = (this.hits.get(key) ?? []).filter((ts) => t - ts < HOUR_MS);

    const last = recent[recent.length - 1];
    if (last !== undefined && t - last < this.cooldownMs) {
      return {
        allowed: false,
        retryAfterSec: Math.ceil((this.cooldownMs - (t - last)) / 1000),
        reason: 'cooldown',
      };
    }

    if (recent.length >= this.maxPerHour) {
      const oldest = recent[0] as number;
      return {
        allowed: false,
        retryAfterSec: Math.ceil((HOUR_MS - (t - oldest)) / 1000),
        reason: 'hourly-quota',
      };
    }

    recent.push(t);
    this.hits.set(key, recent);
    return { allowed: true, retryAfterSec: 0 };
  }

  /** ניקוי (בעיקר לבדיקות). */
  reset(): void {
    this.hits.clear();
  }
}

/** מופע משותף ל-runtime (singleton לכל מופע-שרת). */
export const magicLinkRateLimiter = new MagicLinkRateLimiter();

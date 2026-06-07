/**
 * src/lib/ai/retry.ts — עזרי-טיפול בשגיאות-Gemini זמניות (retry-with-backoff).
 *
 * ⚠️ הבעיה שזה פותר: ה-SDK של @google/genai עוטף שגיאות-שרת כ-`ApiError` עם
 * `status` מספרי, ואז `GeminiClientError` שלנו עוטף שוב עם הקשר — כך שבזמן שה-catch
 * של הקורא רץ, ה-status האמיתי יושב **שתי רמות-cause עמוק**. בדיקת `err.status`
 * נאיבית מפספסת אותו (וגם מפספסת 503/500 — ראינו 503 "high demand" מפיל ריצה).
 * העזרים כאן מטיילים בכל שרשרת-ה-`cause`, כך שהחלטת-ה-retry מבוססת על השגיאה-המקורית.
 *
 * זמני = שווה-retry-עם-backoff:
 *  - 429  RESOURCE_EXHAUSTED — rate-limit / מכסה (throttling של free-tier)
 *  - 500  INTERNAL           — שגיאת-שרת זמנית
 *  - 502 / 504               — gateway / timeout
 *  - 503  UNAVAILABLE        — מודל-עמוס ("high demand … try again later")
 *  - שגיאות-רשת              — `fetch failed` (undici) · ECONNRESET · ETIMEDOUT · …
 *                              (אין להן status מספרי; נתפסות לפי code/הודעה בשרשרת)
 * כל השאר (400 bad-request · 401/403 auth · JSON-parse) **קבוע** ואסור ל-retry —
 * retry רק יבזבז תקציב על כישלון-מובטח.
 */

/** קודי-HTTP שנחשבים זמניים (retry-with-backoff). */
export const TRANSIENT_STATUSES: ReadonlySet<number> = new Set([429, 500, 502, 503, 504]);

interface ErrLike {
  status?: unknown;
  code?: unknown;
  message?: unknown;
  cause?: unknown;
  error?: { code?: unknown; status?: unknown; message?: unknown };
}

/**
 * מטייל בשרשרת-ה-`.cause` (חסום-עומק) ואוסף את כל ה-statuses המספריים וטקסט-ההודעות.
 * חסם-העומק מונע לולאה אינסופית אם `cause` מעגלי.
 */
export function collectErrorChain(
  err: unknown,
  maxDepth = 8,
): { statuses: number[]; text: string } {
  const statuses: number[] = [];
  const parts: string[] = [];
  let cur: unknown = err;
  for (let depth = 0; cur != null && depth < maxDepth; depth++) {
    const e = cur as ErrLike;
    for (const s of [e.status, e.code, e.error?.code, e.error?.status]) {
      if (typeof s === 'number') {
        if (s !== 0) statuses.push(s);
      } else if (typeof s === 'string' && s.length > 0) {
        // code מחרוזתי: או status מספרי-כמחרוזת ("503"), או קוד-רשת ("ECONNRESET").
        const n = Number(s);
        if (Number.isFinite(n) && n !== 0) statuses.push(n);
        else parts.push(s);
      }
    }
    if (typeof e.message === 'string' && e.message.length > 0) parts.push(e.message);
    cur = e.cause;
  }
  return { statuses, text: parts.join(' | ') };
}

/**
 * True אם `err` (בכל מקום בשרשרת-ה-cause שלו) הוא כישלון-Gemini זמני שכדאי ל-retry.
 * בודק קודם status מספרי, ואז נופל-חזרה לדפוסי-טקסט (ל-SDK-ים שמחזירים status כמחרוזת).
 */
export function isTransientGeminiError(err: unknown): boolean {
  const { statuses, text } = collectErrorChain(err);
  if (statuses.some((s) => TRANSIENT_STATUSES.has(s))) return true;
  return /\b(429|500|502|503|504)\b|RESOURCE_EXHAUSTED|UNAVAILABLE|INTERNAL|DEADLINE_EXCEEDED|quota|rate.?limit|high demand|overloaded|temporarily|try again later|fetch failed|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|EPIPE|socket hang up|network|UND_ERR|terminated|other side closed/i.test(
    text,
  );
}

/** Exponential backoff עם תקרה: 4s · 8s · 16s · 32s … חסום ב-60s. */
export function backoffMs(attempt: number, base = 4_000, cap = 60_000): number {
  return Math.min(cap, base * 2 ** Math.max(0, attempt));
}

export interface RetryOptions {
  /** מספר-נסיונות-חוזרים מקסימלי אחרי הכישלון-הראשון (ברירת-מחדל 4). */
  maxRetries?: number;
  /** בסיס-ה-backoff (ms). לנתיב-אינטראקטיבי השתמש בערך נמוך (למשל 700) לחביון-קצר. */
  baseMs?: number;
  /** תקרת-ה-backoff (ms). */
  capMs?: number;
  /** callback לכל retry (ללוג/טלמטריה). */
  onRetry?: (info: { attempt: number; delayMs: number; error: unknown }) => void;
  /** sleep ניתן-להזרקה (לטסטים — מאפס המתנה אמיתית). */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * עוטף קריאת-Gemini ומריץ retry-עם-backoff על כישלון **זמני בלבד** (429/5xx/רשת).
 * שגיאות-קבע (מפתח-חסר · 400 · JSON-parse) זורקות מיד — בלי לבזבז זמן/תקציב.
 * שמור לנתיב-הפרודקשן (server-action) ולסקריפטים שרוצים retry פשוט בלי throttle ידני.
 */
export async function withGeminiRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const maxRetries = opts.maxRetries ?? 4;
  const baseMs = opts.baseMs ?? 4_000;
  const capMs = opts.capMs ?? 60_000;
  const sleep = opts.sleep ?? defaultSleep;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt < maxRetries && isTransientGeminiError(err)) {
        const delayMs = backoffMs(attempt, baseMs, capMs);
        opts.onRetry?.({ attempt, delayMs, error: err });
        await sleep(delayMs);
        continue;
      }
      throw err;
    }
  }
}

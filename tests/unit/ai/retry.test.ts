import { describe, it, expect, vi } from 'vitest';
import {
  collectErrorChain,
  isTransientGeminiError,
  backoffMs,
  withGeminiRetry,
  TRANSIENT_STATUSES,
} from '@/lib/ai/retry';

/** sleep מזויף — לא ממתין בפועל; רושם את ההשהיות שנתבקשו. */
const fakeSleep = () => {
  const delays: number[] = [];
  return {
    delays,
    sleep: (ms: number) => {
      delays.push(ms);
      return Promise.resolve();
    },
  };
};
const status503 = () => Object.assign(new Error('high demand'), { status: 503 });

/** משחזר את העטיפה-הכפולה האמיתית: ApiError(status) → GeminiClientError → GeminiClientError. */
function wrapTwice(status: number, statusText: string) {
  const apiError = Object.assign(
    new Error(`{"error":{"code":${status},"message":"...","status":"${statusText}"}}`),
    { status },
  );
  const inner = new Error(
    `Gemini generateJSON failed (model=gemini-2.5-flash): ${apiError.message}`,
    {
      cause: apiError,
    },
  );
  return new Error('generate failed (scope=1.0)', { cause: inner });
}

describe('collectErrorChain', () => {
  it('שולף status שקבור שתי רמות-cause עמוק', () => {
    const { statuses } = collectErrorChain(wrapTwice(503, 'UNAVAILABLE'));
    expect(statuses).toContain(503);
  });
  it('עוצר בעומק-מקסימום ולא נתקע על cause מעגלי', () => {
    const a: { message: string; cause?: unknown } = { message: 'a' };
    a.cause = a; // מעגלי
    expect(() => collectErrorChain(a, 4)).not.toThrow();
  });
});

describe('isTransientGeminiError', () => {
  it('מזהה 503 UNAVAILABLE קבור (הבאג שהפיל את הפיילוט)', () => {
    expect(isTransientGeminiError(wrapTwice(503, 'UNAVAILABLE'))).toBe(true);
  });
  it('מזהה 429 / 500 / 502 / 504 קבורים', () => {
    for (const s of [429, 500, 502, 504]) {
      expect(isTransientGeminiError(wrapTwice(s, 'X'))).toBe(true);
    }
  });
  it('מזהה לפי-טקסט גם בלי status מספרי (RESOURCE_EXHAUSTED / high demand)', () => {
    expect(isTransientGeminiError(new Error('RESOURCE_EXHAUSTED: quota'))).toBe(true);
    expect(isTransientGeminiError(new Error('model is experiencing high demand'))).toBe(true);
  });
  it('מזהה שגיאות-רשת קבורות (fetch failed → ECONNRESET) — הבאג של scope=2.0', () => {
    // משחזר את undici: TypeError("fetch failed") → cause Error{code:'ECONNRESET'}
    const sys = Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' });
    const fetchFail = new TypeError('fetch failed', { cause: sys });
    const wrapped = new Error('Gemini generateJSON failed (model=gemini-2.5-flash): fetch failed', {
      cause: fetchFail,
    });
    expect(isTransientGeminiError(new Error('generate failed', { cause: wrapped }))).toBe(true);
    expect(isTransientGeminiError(new TypeError('fetch failed'))).toBe(true);
    expect(
      isTransientGeminiError(Object.assign(new Error('connect ETIMEDOUT'), { code: 'ETIMEDOUT' })),
    ).toBe(true);
  });
  it('אינו מזהה שגיאות-קבע כזמניות (400 · 401 · JSON-parse)', () => {
    expect(isTransientGeminiError(wrapTwice(400, 'INVALID_ARGUMENT'))).toBe(false);
    expect(isTransientGeminiError(wrapTwice(401, 'UNAUTHENTICATED'))).toBe(false);
    expect(isTransientGeminiError(new Error('returned non-JSON text'))).toBe(false);
    expect(isTransientGeminiError(null)).toBe(false);
    expect(isTransientGeminiError(undefined)).toBe(false);
  });
  it('כל TRANSIENT_STATUSES מזוהים', () => {
    for (const s of TRANSIENT_STATUSES) {
      expect(isTransientGeminiError(Object.assign(new Error('x'), { status: s }))).toBe(true);
    }
  });
});

describe('backoffMs', () => {
  it('מכפיל-מעריכית וחסום ב-60s', () => {
    expect(backoffMs(0)).toBe(4_000);
    expect(backoffMs(1)).toBe(8_000);
    expect(backoffMs(2)).toBe(16_000);
    expect(backoffMs(10)).toBe(60_000); // תקרה
  });
  it('מטפל ב-attempt שלילי כ-0', () => {
    expect(backoffMs(-5)).toBe(4_000);
  });
});

describe('withGeminiRetry', () => {
  it('מצליח בנסיון-ראשון ללא-המתנה', async () => {
    const { delays, sleep } = fakeSleep();
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(withGeminiRetry(fn, { sleep })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledOnce();
    expect(delays).toEqual([]);
  });

  it('עושה retry על 503 זמני ואז מצליח (backoff קצר אינטראקטיבי)', async () => {
    const { delays, sleep } = fakeSleep();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(status503())
      .mockRejectedValueOnce(status503())
      .mockResolvedValue('ok');
    await expect(
      withGeminiRetry(fn, { sleep, maxRetries: 3, baseMs: 700, capMs: 4_000 }),
    ).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(delays).toEqual([700, 1400]); // 2 backoffs לפני ההצלחה
  });

  it('מוותר אחרי maxRetries וזורק את השגיאה האחרונה', async () => {
    const { delays, sleep } = fakeSleep();
    const fn = vi.fn().mockRejectedValue(status503());
    await expect(withGeminiRetry(fn, { sleep, maxRetries: 2 })).rejects.toMatchObject({
      status: 503,
    });
    expect(fn).toHaveBeenCalledTimes(3); // נסיון-ראשון + 2 retries
    expect(delays).toHaveLength(2);
  });

  it('אינו עושה retry על שגיאת-קבע (מפתח-חסר) — זורק מיד', async () => {
    const { delays, sleep } = fakeSleep();
    const fn = vi.fn().mockRejectedValue(new Error('GEMINI_API_KEY is not set'));
    await expect(withGeminiRetry(fn, { sleep })).rejects.toThrow(/not set/);
    expect(fn).toHaveBeenCalledOnce();
    expect(delays).toEqual([]);
  });
});

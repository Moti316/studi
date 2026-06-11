/**
 * src/lib/ai/usage-guard.ts — שער-מכסות לקריאות-AI-בתשלום (שחרור-לחברים · 2026-06-11).
 *
 * מוטי משחרר לקבוצת-חברים ורוצה ודאות שהטוקנים לא-ייגמרו. כל action-בתשלום עובר
 * דרך `guardAiCall(userId, action)` **אחרי** auth ו**לפני** הקריאה ל-Claude:
 *   - מכסת-משתמש-יומית  (ברירת-מחדל 40 · `AI_USER_DAILY_CAP`).
 *   - מכסה-גלובלית-יומית (ברירת-מחדל 400 · `AI_GLOBAL_DAILY_CAP`).
 * חריגה ⇒ {allowed:false} → ה-action נופל ל-fallback-הדטרמיניסטי שלו (אפס-עלות ·
 * הלומד מקבל חוויה-מלאה, פשוט בלי-LLM).
 *
 * אחסון: טבלת-`ai_usage` (אם-קיימת · cross-instance אמת) → fallback למונה-בזיכרון
 * (פר-instance · הגנה-סבירה גם-בלי-מיגרציה). ⚠️ **קו-הגנה-אחרון:** הגדר Spend-Limit
 * חודשי גם ב-console.anthropic.com — זו הערובה-הקשיחה.
 *
 * server-only. היום מחושב UTC (איפוס-יומי אחיד).
 */

import { sql } from 'drizzle-orm';

export type AiAction =
  | 'tutor'
  | 'grade-open'
  | 'sim-live'
  | 'jsa-draft'
  | 'capstone-eval'
  | 'narrative';

export interface GuardResult {
  allowed: boolean;
  reason?: 'user-cap' | 'global-cap';
  /** מונה-המשתמש-להיום אחרי-הצריכה (לטלמטריה). */
  userCount: number;
}

function intEnv(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;
}

export function userDailyCap(): number {
  return intEnv('AI_USER_DAILY_CAP', 40);
}
export function globalDailyCap(): number {
  return intEnv('AI_GLOBAL_DAILY_CAP', 400);
}

/** מפתח-יום UTC (YYYY-MM-DD) — איפוס אחיד לכל-המשתמשים. */
export function dayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// מונה-בזיכרון (fallback · פר-instance)
// ---------------------------------------------------------------------------

const memUser = new Map<string, number>(); // `${day}:${userId}` → count
const memGlobal = new Map<string, number>(); // day → count

/** ליבת-הזיכרון (טהורה-יחסית · ניתנת-לטסט). */
export function consumeInMemory(
  userId: string,
  day: string,
  caps: { user: number; global: number } = { user: userDailyCap(), global: globalDailyCap() },
): GuardResult {
  const uKey = `${day}:${userId}`;
  const u = (memUser.get(uKey) ?? 0) + 1;
  const g = (memGlobal.get(day) ?? 0) + 1;

  if (u > caps.user) return { allowed: false, reason: 'user-cap', userCount: u - 1 };
  if (g > caps.global) return { allowed: false, reason: 'global-cap', userCount: u - 1 };

  memUser.set(uKey, u);
  memGlobal.set(day, g);
  return { allowed: true, userCount: u };
}

/** איפוס-לטסטים בלבד. */
export function __resetUsageForTests(): void {
  memUser.clear();
  memGlobal.clear();
}

// ---------------------------------------------------------------------------
// guardAiCall — DB-מועדף · fallback-זיכרון · לעולם-לא-זורק
// ---------------------------------------------------------------------------

/**
 * בודק-וצורך יחידת-שימוש. fail-open רק-בין-המנגנונים (DB→זיכרון), לעולם-לא-זורק —
 * שגיאה-כפולה תחזיר allowed:true (עדיף-זמינות; ה-Spend-Limit ב-Anthropic הוא הגב).
 */
export async function guardAiCall(userId: string, action: AiAction): Promise<GuardResult> {
  const day = dayKey();
  try {
    const { db } = await import('@/lib/db');

    // increment-or-insert אטומי + RETURNING — בלי race בין-בקשות.
    const userRows = (await db.execute(
      sql`INSERT INTO ai_usage (day, user_id, action, count)
          VALUES (${day}, ${userId}, ${action}, 1)
          ON CONFLICT (day, user_id, action)
          DO UPDATE SET count = ai_usage.count + 1
          RETURNING count`,
    )) as unknown as { count: number }[];
    const perAction = Number(userRows[0]?.count ?? 1);

    const sumRows = (await db.execute(
      sql`SELECT
            COALESCE(SUM(count) FILTER (WHERE user_id = ${userId}), 0) AS user_total,
            COALESCE(SUM(count), 0) AS global_total
          FROM ai_usage WHERE day = ${day}`,
    )) as unknown as { user_total: number; global_total: number }[];
    const userTotal = Number(sumRows[0]?.user_total ?? perAction);
    const globalTotal = Number(sumRows[0]?.global_total ?? perAction);

    if (userTotal > userDailyCap())
      return { allowed: false, reason: 'user-cap', userCount: userTotal };
    if (globalTotal > globalDailyCap())
      return { allowed: false, reason: 'global-cap', userCount: userTotal };
    return { allowed: true, userCount: userTotal };
  } catch {
    // טבלה-חסרה / DB-לא-זמין → מונה-בזיכרון (הגנה פר-instance).
    try {
      return consumeInMemory(userId, day);
    } catch {
      return { allowed: true, userCount: 0 };
    }
  }
}

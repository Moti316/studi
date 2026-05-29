'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase/env';
import { magicLinkSchema, deleteAccountSchema } from './schema';
import { magicLinkRateLimiter } from './rate-limit';
import { sanitizeNext } from './redirect';
import { logError, maskEmail } from './telemetry';
import { getUser } from './server';

/**
 * תוצאת-action אחידה. "שגיאות הן מצב מתוכנן" — אנו מחזירים מצב
 * במקום לזרוק, כדי שה-UI ירנדר הודעה בעברית.
 */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; code?: string };

const NOT_CONFIGURED = 'ההתחברות אינה זמינה כרגע (שירות לא מוגדר). נסה שוב מאוחר יותר.';

/**
 * מקור-האפליקציה לבניית redirect-URLs. בפרודקשן **חובה** NEXT_PUBLIC_APP_URL —
 * לא סומכים על Origin/Host headers (הזרקת-host → זיוף ה-callback). בפיתוח
 * נופלים חזרה ל-headers לנוחות.
 */
async function getOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, '');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_APP_URL is required in production');
  }
  const h = await headers();
  return h.get('origin') ?? `http://${h.get('host') ?? 'localhost:3000'}`;
}

/** בונה את כתובת ה-callback עם פרמטר next מנוקה (מאומת שוב ב-callback). */
function callbackUrl(origin: string, next?: string): string {
  const safeNext = sanitizeNext(next ?? null);
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

/**
 * מתחיל זרימת Google OAuth (login scope בלבד — openid email profile).
 * מחזיר URL לניתוב; ה-client מבצע את ההפניה.
 */
export async function signInWithGoogle(next?: string): Promise<ActionResult<{ url: string }>> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED, code: 'not-configured' };

  try {
    const supabase = await createServerSupabase();
    const origin = await getOrigin();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl(origin, next),
        scopes: 'openid email profile',
        queryParams: { access_type: 'online', prompt: 'select_account' },
      },
    });

    if (error || !data.url) {
      throw error ?? new Error('no oauth url returned');
    }
    return { ok: true, data: { url: data.url } };
  } catch (error) {
    logError(error, { scope: 'auth.signInWithGoogle' });
    return { ok: false, error: 'ההתחברות עם Google נכשלה. נסה שוב.' };
  }
}

/**
 * שולח magic link לאימייל. כפוף ל-rate-limit (3/שעה, 60s cooldown).
 */
export async function sendMagicLink(rawEmail: string, next?: string): Promise<ActionResult> {
  const parsed = magicLinkSchema.safeParse({ email: rawEmail });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'כתובת האימייל אינה תקינה',
      code: 'validation',
    };
  }
  const { email } = parsed.data;

  const limit = magicLinkRateLimiter.check(email);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterSec / 60));
    const msg =
      limit.reason === 'cooldown'
        ? `כבר שלחנו קישור. נסה שוב בעוד ${limit.retryAfterSec} שניות.`
        : `שלחת יותר מדי בקשות. נסה שוב בעוד ${minutes} דקות.`;
    return { ok: false, error: msg, code: limit.reason };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: NOT_CONFIGURED, code: 'not-configured' };
  }

  try {
    const supabase = await createServerSupabase();
    const origin = await getOrigin();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl(origin, next),
        shouldCreateUser: true,
      },
    });
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    logError(error, { scope: 'auth.sendMagicLink', meta: { email: maskEmail(email) } });
    return { ok: false, error: 'שליחת הקישור נכשלה. נסה שוב.' };
  }
}

/**
 * מנתק את המשתמש ומנקה session. מנתב ל-/.
 */
export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      await supabase.auth.signOut();
    } catch (error) {
      logError(error, { scope: 'auth.signOut' });
    }
  }
  redirect('/');
}

/**
 * מוחק חשבון. דורש אימות-מייל תואם (ADR-003 / GDPR Article 17).
 *
 * מוחק בפועל את משתמש-ה-Auth דרך service-role admin client (לפי user.id
 * מה-session בצד-שרת — לעולם לא מקלט-המשתמש). מחיקת טבלאות-משנה
 * (user_settings, courses, attempts, storage) תתווסף כ-cascade עם
 * מודל-הנתונים (data-engineer); החוזה מתועד ב-account-delete.md.
 *
 * אם service-role אינו מוגדר — מחזיר שגיאה מפורשת (לא "הצלחה") כדי
 * שהמשתמש לא יחשוב בטעות שנמחק.
 */
export async function deleteAccount(rawEmail: string): Promise<ActionResult> {
  const parsed = deleteAccountSchema.safeParse({ emailConfirm: rawEmail });
  if (!parsed.success) {
    return { ok: false, error: 'כתובת האימייל אינה תקינה', code: 'validation' };
  }

  if (!isServiceRoleConfigured()) {
    return {
      ok: false,
      error: 'מחיקת חשבון אינה זמינה כרגע. פנה לתמיכה כדי להשלים את המחיקה.',
      code: 'not-configured',
    };
  }

  try {
    const user = await getUser();
    if (!user) return { ok: false, error: 'עליך להתחבר כדי למחוק חשבון.', code: 'unauthenticated' };

    if (user.email?.toLowerCase() !== parsed.data.emailConfirm.toLowerCase()) {
      return { ok: false, error: 'האימייל אינו תואם לחשבון.', code: 'mismatch' };
    }

    // TODO(Phase: schema): cascade delete לטבלאות-המשנה + Storage לפני מחיקת ה-Auth user.
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    // ניקוי ה-session המקומי אחרי מחיקה מוצלחת.
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();

    return { ok: true };
  } catch (error) {
    logError(error, { scope: 'auth.deleteAccount' });
    return { ok: false, error: 'מחיקת החשבון נכשלה. נסה שוב או פנה לתמיכה.' };
  }
}

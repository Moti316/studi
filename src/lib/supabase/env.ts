import { z } from 'zod';

/**
 * Supabase env access — validated, mock-first.
 *
 * בשלב Phase 1 אין פרויקט Supabase אמיתי. ה-clients מחווטים אך
 * env-gated: אם המפתחות חסרים, `getSupabaseEnv()` זורק שגיאה מטופסת
 * שה-actions/middleware תופסים וממירים למצב-שגיאה ידידותי בעברית.
 *
 * כשמוטי יוסיף keys ל-`.env.local`, הכול יתחבר ללא שינוי קוד.
 */

/** נזרק כשחסרה קונפיגורציית Supabase (מצב mock/dev ללא keys). */
export class MissingSupabaseConfigError extends Error {
  constructor(missing: string[]) {
    super(
      `Supabase אינו מוגדר. חסרים משתני-סביבה: ${missing.join(', ')}. ` +
        `העתק את .env.example ל-.env.local ומלא את הערכים.`,
    );
    this.name = 'MissingSupabaseConfigError';
  }
}

const publicEnvSchema = z.object({
  url: z.string().url(),
  anonKey: z.string().min(1),
});

export type SupabasePublicEnv = z.infer<typeof publicEnvSchema>;

/**
 * מחזיר את ה-env הציבורי של Supabase (URL + anon key).
 * @throws {MissingSupabaseConfigError} אם חסר אחד מהם.
 */
export function getSupabaseEnv(): SupabasePublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const missing: string[] = [];
  if (!url || url.includes('YOUR_PROJECT')) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!anonKey || anonKey.startsWith('eyJh...')) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (missing.length > 0) throw new MissingSupabaseConfigError(missing);

  return publicEnvSchema.parse({ url, anonKey });
}

/**
 * בדיקה לא-זורקת: האם Supabase מוגדר?
 * משמש את ה-middleware כדי לעשות no-op במצב mock.
 */
export function isSupabaseConfigured(): boolean {
  try {
    getSupabaseEnv();
    return true;
  } catch {
    return false;
  }
}

/**
 * האם ה-service-role key מוגדר? נדרש לפעולות-admin (מחיקת-משתמש).
 * לא-זורק. ה-key הוא server-only (אינו NEXT_PUBLIC_).
 */
export function isServiceRoleConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(key && !key.startsWith('eyJh...') && isSupabaseConfigured());
}

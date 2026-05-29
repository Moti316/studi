import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from './env';

/**
 * Supabase server client (Server Components / Route Handlers / Server Actions).
 *
 * משתמש ב-cookies של Next 15 (async). כתיבת cookies מ-Server Component
 * עלולה להיכשל — נעטף ב-try/catch כי ה-middleware מרענן את ה-session.
 *
 * @throws {MissingSupabaseConfigError} כשאין keys.
 */
export async function createServerSupabase() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // נקרא מ-Server Component — ה-middleware יטפל ברענון. בטוח להתעלם.
        }
      },
    },
  });
}

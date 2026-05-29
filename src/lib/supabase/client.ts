import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseEnv } from './env';

/**
 * Supabase browser client (Client Components).
 *
 * @throws {MissingSupabaseConfigError} כשאין keys — נתפס במצב mock ומומר
 * להודעת-שגיאה ידידותית ב-UI.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}

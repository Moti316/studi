import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv, MissingSupabaseConfigError } from './env';

/**
 * Supabase admin client (service-role). **server-only** — מיובא אך-ורק
 * מ-actions.ts ('use server'), לעולם לא ב-client bundle. מעוקף RLS;
 * להשתמש רק לפעולות-admin מאומתות-server (מחיקת-משתמש).
 *
 * @throws {MissingSupabaseConfigError} כשאין service-role key.
 */
export function createAdminClient() {
  const { url } = getSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey.startsWith('eyJh...')) {
    throw new MissingSupabaseConfigError(['SUPABASE_SERVICE_ROLE_KEY']);
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

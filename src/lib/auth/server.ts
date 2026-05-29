import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { logError } from './telemetry';

/**
 * מחזיר את המשתמש המחובר, או null.
 * במצב mock (ללא keys) מחזיר null במקום לזרוק — כך דפים מוגנים מנתבים
 * להתחברות באלגנטיות במקום לקרוס.
 */
export async function getUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    logError(error, { scope: 'auth.getUser' });
    return null;
  }
}

/**
 * דורש משתמש מחובר. אם אין — מנתב ל-/beta-access (לא חוזר).
 * שימוש בראש Server Components/Actions מוגנים.
 */
export async function requireAuth(nextPath?: string): Promise<User> {
  const user = await getUser();
  if (!user) {
    const target = nextPath ? `/beta-access?next=${encodeURIComponent(nextPath)}` : '/beta-access';
    redirect(target);
  }
  return user;
}

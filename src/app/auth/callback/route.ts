import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { sanitizeNext } from '@/lib/auth/redirect';
import { logError } from '@/lib/auth/telemetry';

/**
 * OAuth / Magic-Link callback. Supabase מפנה לכאן עם `code` שמומר ל-session.
 *
 * תומך ב-`next` להפניה-בחזרה ליעד המקורי (PKCE flow).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = sanitizeNext(searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(`${origin}/beta-access?error=missing_code`);
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/beta-access?error=not_configured`);
  }

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return NextResponse.redirect(`${origin}${next}`);
  } catch (error) {
    logError(error, { scope: 'auth.callback' });
    return NextResponse.redirect(`${origin}/beta-access?error=auth_failed`);
  }
}

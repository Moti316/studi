import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv, isSupabaseConfigured } from './env';

/** routes שדורשים התחברות. (/admin נאכף סופית server-side ב-requireCreator —
 * נכלל כאן ל-defence-in-depth: חסימת-קצה + fail-closed בפרודקשן-ללא-env.) */
const PROTECTED_PREFIXES = ['/dashboard', '/courses', '/settings', '/create', '/admin'];

/** routes של auth — משתמש מחובר ינותב מהם ל-/dashboard. */
const AUTH_ROUTES = ['/login', '/beta-access'];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * מרענן את ה-session ומגן על routes.
 *
 * מצב mock: אם Supabase לא מוגדר — no-op (האפליקציה רצה, ה-UI נטען,
 * actions יחזירו שגיאה ידידותית). כך אפשר לפתח את ה-UI ללא keys.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    // Fail-closed: אם deploy לפרודקשן ללא env (טעות-תפעול נפוצה), אל תשאיר
    // routes מוגנים פתוחים — נתב להתחברות. בפיתוח: no-op לנוחות.
    if (process.env.NODE_ENV === 'production' && isProtected(request.nextUrl.pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/beta-access';
      redirectUrl.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // חשוב: אין קוד בין יצירת ה-client ל-getUser (מונע bugs ברענון session).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtected(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/beta-access';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const __test = { isProtected, isAuthRoute };

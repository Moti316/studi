import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * כל ה-routes פרט ל:
     * - _next/static, _next/image
     * - favicon, קבצי-מדיה סטטיים
     * - /api (route handlers מטפלים ב-auth בעצמם)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)',
  ],
};

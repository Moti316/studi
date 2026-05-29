import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/server';

/** דף-בית חייב לבדוק session ב-runtime, לא ב-static. */
export const dynamic = 'force-dynamic';

/**
 * `/` — מנתב לפי סטטוס-התחברות:
 * - מחובר → `/dashboard`
 * - לא-מחובר → `/beta-access`
 *
 * דף-נחיתה שיווקי ייבנה ב-Phase 9 (Polish & launch) ויחליף את ה-redirect הזה.
 */
export default async function Home() {
  const user = await getUser();
  redirect(user ? '/dashboard' : '/beta-access');
}

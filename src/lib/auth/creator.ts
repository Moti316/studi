import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { getUser } from './server';

/**
 * creator gate — שער-היוצר.
 *
 * StudiBuilder הוא creator-gated: רק היוצר (מוטי) מייצר קורסים, והלומדים
 * (משתמשי-בטא) צורכים בלבד. `requireCreator()` שומר על `/admin/**` כך
 * שמשתמש-בטא מחובר רגיל לא ייגש למסכי-היצירה.
 *
 * האכיפה היא **בצד-השרת בלבד** — נשענת על `getUser` (server) ו-`redirect`
 * (Next runtime), בדיוק כמו `requireAuth`; לעולם אינה נסמכת על ה-UI.
 */

/**
 * אימייל-היוצר היחיד המורשה לאזור-ה-admin. מקור-אמת יחיד; ההשוואה
 * case-insensitive (כמו ב-`deleteAccount`) כי Supabase עשוי להחזיר רישיות שונה.
 */
export const CREATOR_EMAIL = 'motilev8@gmail.com';

/**
 * דורש שהמשתמש יהיה **מחובר וגם היוצר**.
 *
 * - לא-מחובר → מנתב ל-/beta-access (כמו `requireAuth`; משמר `nextPath`).
 * - מחובר אך אינו-היוצר (משתמש-בטא) → forbid: מנתב ל-/dashboard, הרחק מ-/admin.
 * - היוצר → מחזיר את ה-User.
 *
 * אינו חוזר במסלולי-הדחייה (`redirect` זורק). שימוש בראש Server Components/
 * Actions תחת `/admin/**`.
 */
export async function requireCreator(nextPath?: string): Promise<User> {
  const user = await getUser();

  if (!user) {
    const target = nextPath ? `/beta-access?next=${encodeURIComponent(nextPath)}` : '/beta-access';
    redirect(target);
  }

  const email = user.email?.trim().toLowerCase();
  if (email !== CREATOR_EMAIL) {
    // מחובר אך לא-מורשה: לא חושפים את קיום /admin — מחזירים ל-dashboard.
    redirect('/dashboard');
  }

  return user;
}

/**
 * בדיקה **לא-מנתבת**: האם המשתמש-המחובר הוא היוצר?
 *
 * ל-conditional-UI בלבד (למשל הסתרת CTA-יצירת-קורס מלומדים בדשבורד) — לא תחליף
 * ל-`requireCreator` כשער-אבטחה. הפרדת פלטפורמה↔קורס: כלי-היצירה (פלטפורמה) הם של
 * היוצר; הלומד בקורס-המשוּוָק לא רואה אותם. אינו זורק (מחזיר false על לא-מחובר).
 */
export async function isCreator(): Promise<boolean> {
  const user = await getUser();
  return user?.email?.trim().toLowerCase() === CREATOR_EMAIL;
}

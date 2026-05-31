import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/server';
import { requireCreator } from '@/lib/auth/creator';

export const metadata: Metadata = {
  title: 'ניהול',
  // אזור-היוצר אינו לאינדוקס.
  robots: { index: false, follow: false },
};

/**
 * `/admin/**` layout — שער-היוצר (creator gate) לכל אזור-הניהול.
 *
 * Server Component: מריץ `requireAuth` ואז `requireCreator` בראש כל בקשה ל-/admin,
 * כך ששום מסך-יצירה לא מרונדר למשתמש-בטא או לאורח. שני השערים נשענים על
 * `getUser` (server) + `redirect` (Next runtime) — לעולם לא על ה-UI.
 *
 * `requireCreator` כבר כולל את בדיקת-ההתחברות, אבל אנו קוראים תחילה ל-`requireAuth`
 * כדי שמשתמש לא-מחובר ינותב ל-/beta-access עם `next=/admin` (שחזור-נתיב), ורק
 * אז נאכף שהמחובר הוא אכן היוצר. shell בעברית RTL.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAuth('/admin');
  await requireCreator('/admin');

  return (
    <div dir="rtl" className="flex min-h-dvh flex-col bg-background font-sans">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/admin" className="text-lg font-bold">
            ניהול · StudiBuilder
          </Link>
          <nav aria-label="ניווט-ניהול" className="flex items-center gap-4 text-sm">
            <Link
              href="/admin/questions"
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              תיוג שאלות
            </Link>
            <Link
              href="/dashboard"
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              חזרה לאפליקציה
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}

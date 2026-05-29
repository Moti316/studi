import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/server';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'לוח הבקרה',
};

/** תלוי-session — לא ניתן לרינדור-סטטי. */
export const dynamic = 'force-dynamic';

/**
 * `/dashboard` — stub מוגן ל-Phase 1 (היעד אחרי התחברות). ה-skeleton
 * המלא נבנה ב-Phase 2. requireAuth מנתב ל-/beta-access אם אין session.
 */
export default async function DashboardPage() {
  const user = await requireAuth('/dashboard');

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">לוח הבקרה</h1>
        <Button asChild variant="ghost" size="sm">
          <Link href="/settings">הגדרות</Link>
        </Button>
      </header>

      <div className="card space-y-2">
        <p className="text-foreground/70 text-sm">שלום,</p>
        <p dir="ltr" className="text-start font-medium">
          {user.email ?? 'משתמש'}
        </p>
      </div>

      <p className="text-foreground/50 text-sm">
        ה-Dashboard המלא (קורסים, סטטיסטיקות, יצירה) נבנה ב-Phase 2.
      </p>
    </main>
  );
}

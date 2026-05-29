import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth/server';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { DeleteAccountModal } from '@/components/auth/DeleteAccountModal';

export const metadata: Metadata = {
  title: 'הגדרות',
};

/** תלוי-session — לא ניתן לרינדור-סטטי. */
export const dynamic = 'force-dynamic';

/**
 * `/settings` — Phase 1: סעיף "חשבון" + פעולות-חשבון (התנתק / מחק).
 * שאר הסעיפים (למידה, מראה, קול, נגישות, התראות) נבנים ב-Phase 2/6/7
 * לפי docs/screens-spec/settings.md.
 */
export default async function SettingsPage() {
  const user = await requireAuth('/settings');
  const email = user.email ?? '';
  const isGoogle = user.app_metadata?.provider === 'google';

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 p-6">
      <h1 className="text-2xl font-bold">הגדרות</h1>

      <section aria-labelledby="account-heading" className="card space-y-4">
        <h2 id="account-heading" className="text-lg font-bold">
          חשבון
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-foreground/60">אימייל</dt>
            <dd dir="ltr" className="font-medium">
              {email}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-foreground/60">חיבור Google</dt>
            <dd className="font-medium">{isGoogle ? 'מחובר ✓' : 'לא מחובר'}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="danger-heading" className="card space-y-4">
        <h2 id="danger-heading" className="text-lg font-bold">
          פעולות חשבון
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <SignOutButton />
          <DeleteAccountModal userEmail={email} />
        </div>
      </section>
    </main>
  );
}

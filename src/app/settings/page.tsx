import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth/server';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { DeleteAccountModal } from '@/components/auth/DeleteAccountModal';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { MOCK_USER_SETTINGS } from '@/lib/mock/user';

export const metadata: Metadata = {
  title: 'הגדרות',
};

export const dynamic = 'force-dynamic';

/**
 * `/settings` — Phase 2: סעיף חשבון (קיים) + 5 סעיפים חדשים (למידה, מראה,
 * קול, נגישות, התראות) + פעולות-חשבון. שמירה אמיתית של ההגדרות תחובר
 * ב-Phase 6/7 עם user_settings ב-DB.
 */
export default async function SettingsPage() {
  const user = await requireAuth('/settings');
  const email = user.email ?? '';
  const isGoogle = user.app_metadata?.provider === 'google';

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4 pb-8">
        <h1 className="text-2xl font-bold">הגדרות</h1>

        <SettingsSection title="חשבון">
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
        </SettingsSection>

        <SettingsForm initial={MOCK_USER_SETTINGS} />

        <SettingsSection title="עזרה">
          <a
            href="mailto:hello@studibuilder.app"
            className="text-sm text-primary-600 hover:underline"
          >
            צור קשר עם הצוות
          </a>
        </SettingsSection>

        <SettingsSection title="פעולות חשבון">
          <div className="flex flex-wrap items-center gap-3">
            <SignOutButton />
            <DeleteAccountModal userEmail={email} />
          </div>
        </SettingsSection>
      </main>
      <BottomNav />
    </div>
  );
}

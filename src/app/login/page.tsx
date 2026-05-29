import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthModal } from '@/components/auth/AuthModal';

export const metadata: Metadata = {
  title: 'התחברות',
};

/**
 * `/login` — overlay-style auth (modal מעל רקע). למובייל מלא ראה
 * `/beta-access`. Suspense נדרש כי AuthCard משתמש ב-useSearchParams.
 */
export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-background">
      <Suspense fallback={null}>
        <AuthModal />
      </Suspense>
    </main>
  );
}

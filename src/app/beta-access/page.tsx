import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';

export const metadata: Metadata = {
  title: 'כניסה',
};

/**
 * `/beta-access` — זרימת-התחברות full-screen (חוויית-מובייל נקייה).
 * יעד הניתוב מ-routes מוגנים כשאין session. Suspense נדרש כי AuthCard
 * משתמש ב-useSearchParams (קריאת ?next=).
 */
export default function BetaAccessPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <AuthCard />
      </Suspense>
    </AuthLayout>
  );
}

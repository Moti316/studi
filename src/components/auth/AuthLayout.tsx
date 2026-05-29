import { type ReactNode } from 'react';

/**
 * AuthLayout — מכל full-screen לזרימת-התחברות במובייל (`/beta-access`).
 * mobile-first, ממורכז, ללא header.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background p-6">
      <div className="card w-full max-w-sm">{children}</div>
    </main>
  );
}

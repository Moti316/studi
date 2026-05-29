'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BobMascot } from './BobMascot';
import { GoogleSignInButton } from './GoogleSignInButton';
import { MagicLinkForm } from './MagicLinkForm';
import { MagicSentView } from './MagicSentView';

type AuthState = { step: 'choices' } | { step: 'magic-sent'; email: string };

/**
 * AuthCard — לב זרימת-ההתחברות. משותף ל-AuthModal (overlay) ול-AuthLayout
 * (full-screen). מנהל את המעבר choices → magic-sent ומעביר את יעד-ה-next.
 */
export function AuthCard() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? undefined;
  const [state, setState] = useState<AuthState>({ step: 'choices' });
  const [error, setError] = useState<string | null>(null);

  if (state.step === 'magic-sent') {
    return (
      <MagicSentView
        email={state.email}
        next={next}
        onChangeEmail={() => {
          setState({ step: 'choices' });
          setError(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <BobMascot pose="curious" />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">
            ברוך הבא ל-Studi<span className="text-primary-500">Builder</span>
          </h1>
          <p className="text-foreground/70 text-sm">צור קורסים מהמסמכים שלך</p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-4">
        <GoogleSignInButton next={next} onError={setError} />

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="text-foreground/50 text-xs">או</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <MagicLinkForm next={next} onSent={(email) => setState({ step: 'magic-sent', email })} />

        {error && (
          <p role="alert" className="text-center text-sm text-error">
            {error}
          </p>
        )}
      </div>

      <p className="text-foreground/50 text-center text-xs">
        בהרשמה או התחברות, אתה מסכים ל
        <Link href="/terms" className="text-primary-600 hover:underline">
          תנאי השימוש
        </Link>{' '}
        ול
        <Link href="/privacy" className="text-primary-600 hover:underline">
          מדיניות הפרטיות
        </Link>
      </p>
    </div>
  );
}

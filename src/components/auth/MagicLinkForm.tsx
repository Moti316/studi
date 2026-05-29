'use client';

import { useState, useId, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isValidEmail } from '@/lib/auth/schema';
import { sendMagicLink } from '@/lib/auth/actions';

/**
 * טופס Magic Link: שדה אימייל עם ולידציה בזמן-אמת + שליחה.
 * בהצלחה קורא ל-onSent(email) כדי שההורה יציג את מסך magic-sent.
 */
export function MagicLinkForm({
  next,
  onSent,
}: {
  next?: string;
  onSent: (email: string) => void;
}) {
  const emailId = useId();
  const errId = useId();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const showInvalid = touched && email.length > 0 && !isValidEmail(email);
  const fieldError = showInvalid ? 'כתובת האימייל אינה תקינה' : serverError;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    if (!isValidEmail(email)) return;

    setSubmitting(true);
    try {
      const res = await sendMagicLink(email, next);
      if (res.ok) {
        onSent(email);
      } else {
        setServerError(res.error);
      }
    } catch {
      setServerError('שליחת הקישור נכשלה. נסה שוב.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={emailId}>אימייל</Label>
        <Input
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          className="text-start"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? errId : undefined}
          disabled={submitting}
        />
        {fieldError && (
          <p id={errId} role="alert" className="text-sm text-error">
            {fieldError}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        className="w-full"
        disabled={submitting}
        aria-busy={submitting}
      >
        {submitting ? 'שולח…' : 'שלח קישור התחברות'}
      </Button>
    </form>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { BobMascot } from './BobMascot';
import { sendMagicLink } from '@/lib/auth/actions';

const RESEND_COOLDOWN_SEC = 60;

/**
 * מסך "בדוק את המייל שלך" אחרי שליחת magic link.
 * כולל resend עם cooldown של 60s ו"שנה אימייל".
 */
export function MagicSentView({
  email,
  next,
  onChangeEmail,
}: {
  email: string;
  next?: string;
  onChangeEmail: () => void;
}) {
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setNotice(null);
    try {
      const res = await sendMagicLink(email, next);
      if (res.ok) {
        setNotice('שלחנו קישור חדש ✓');
      } else {
        setNotice(res.error);
      }
    } catch {
      setNotice('השליחה נכשלה. נסה שוב.');
    } finally {
      // תמיד מפעילים cooldown מחדש — גם בכישלון (rate-limit) — כדי למנוע
      // לחיצות חוזרות שפוגעות בשרת ומקבלות את אותה שגיאה (BUG-2).
      setCooldown(RESEND_COOLDOWN_SEC);
      setResending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <BobMascot pose="happy" />
      <div className="space-y-1">
        <h2 className="text-xl font-bold">בדוק את המייל שלך! ✉</h2>
        <p className="text-foreground/70 text-sm">שלחנו קישור התחברות אל</p>
        <p dir="ltr" className="text-foreground font-medium">
          {email}
        </p>
      </div>
      <p className="text-foreground/60 text-sm">הקישור תקף ל-60 דקות</p>

      {notice && (
        <p role="status" className="text-sm text-primary-600">
          {notice}
        </p>
      )}

      <div className="flex w-full flex-col gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          aria-busy={resending}
        >
          {cooldown > 0 ? `שלח שוב (${cooldown})` : 'שלח שוב'}
        </Button>
        <Button type="button" variant="link" onClick={onChangeEmail}>
          שנה אימייל
        </Button>
      </div>
    </div>
  );
}

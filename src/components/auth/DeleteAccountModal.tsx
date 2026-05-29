'use client';

import { useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteAccount } from '@/lib/auth/actions';
import { maskEmail } from '@/lib/auth/telemetry';

/**
 * מודאל מחיקת-חשבון. הכפתור המסוכן נעול עד שהמשתמש מקליד את האימייל
 * שלו (אימות חוזר נגד מחיקה בטעות) — ADR-003 / GDPR Article 17.
 */
export function DeleteAccountModal({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const inputId = useId();
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = confirmText.trim().toLowerCase() === userEmail.toLowerCase();

  async function handleDelete() {
    if (!matches || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await deleteAccount(confirmText.trim());
      if (res.ok) {
        router.push('/');
      } else {
        setError(res.error);
        setSubmitting(false);
      }
    } catch {
      setError('מחיקת החשבון נכשלה. נסה שוב.');
      setSubmitting(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="danger" size="md">
          מחק חשבון
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-error">⚠ מחיקת חשבון</DialogTitle>
          <DialogDescription>
            פעולה זו אינה ניתנת לביטול. כל הנתונים יימחקו לצמיתות.
          </DialogDescription>
        </DialogHeader>

        <ul className="text-foreground/70 space-y-1 text-sm">
          <li>• הפרופיל שלך</li>
          <li>• הקורסים שיצרת</li>
          <li>• היסטוריית הלמידה</li>
          <li>• הקרדיטים שנותרו</li>
        </ul>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={inputId}>הקלד את האימייל שלך כדי לאשר:</Label>
          <Input
            id={inputId}
            type="email"
            dir="ltr"
            className="text-start"
            autoComplete="off"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={maskEmail(userEmail)}
            disabled={submitting}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={!matches || submitting}
            aria-busy={submitting}
          >
            {submitting ? 'מוחק…' : 'מחק לצמיתות'}
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={submitting}>
              ביטול
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

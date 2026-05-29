'use client';

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AuthCard } from './AuthCard';

/**
 * AuthModal — overlay של זרימת-ההתחברות (route `/login`).
 * סגירה מנתבת אחורה. שימוש ב-VisuallyHidden לכותרת נגישות.
 */
export function AuthModal() {
  const router = useRouter();

  return (
    <Dialog
      defaultOpen
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent>
        <DialogTitle className="sr-only">התחברות ל-StudiBuilder</DialogTitle>
        <DialogDescription className="sr-only">
          בחר אפשרות התחברות: Google או קישור למייל
        </DialogDescription>
        <AuthCard />
      </DialogContent>
    </Dialog>
  );
}

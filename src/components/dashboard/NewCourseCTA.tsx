import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BobMascot } from '@/components/auth/BobMascot';

/**
 * כרטיסיית הזמנה ליצירת קורס חדש. CTA ראשי של הדאשבורד.
 */
export function NewCourseCTA() {
  return (
    <div className="card flex items-center gap-4">
      <BobMascot pose="happy" />
      <div className="flex-1 space-y-2">
        <p className="font-medium">בוא נתחיל ללמוד היום!</p>
        <Button asChild variant="gradient" size="md">
          <Link href="/create">
            <Plus className="size-4" aria-hidden="true" />
            <span>קורס חדש</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}

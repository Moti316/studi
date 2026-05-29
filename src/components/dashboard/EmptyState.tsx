import type { ReactNode } from 'react';
import { BobMascot, type BobPose } from '@/components/auth/BobMascot';

interface Props {
  title: string;
  description: string;
  pose?: BobPose;
  action?: ReactNode;
}

/**
 * EmptyState — Bob + טקסט עידוד + פעולה אופציונלית.
 * משותף ל-/courses (empty), /stats (empty), ועוד מסכים מאוחר יותר.
 */
export function EmptyState({ title, description, pose = 'curious', action }: Props) {
  return (
    <div className="card flex flex-col items-center gap-4 py-10 text-center">
      <BobMascot pose={pose} />
      <div className="space-y-1">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-foreground/70 mx-auto max-w-sm text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}

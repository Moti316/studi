import { cn } from '@/lib/utils';

export type BobPose = 'curious' | 'happy' | 'thinking';

const POSE_EMOJI: Record<BobPose, string> = {
  curious: '🤖',
  happy: '🎉',
  thinking: '💭',
};

const POSE_LABEL: Record<BobPose, string> = {
  curious: 'בוב, העוזר החכם',
  happy: 'בוב שמח',
  thinking: 'בוב חושב',
};

/**
 * BobMascot — קמע המוצר. Placeholder מבוסס-אמוji עד שיתווסף איור-מותג
 * (visual-designer). aria-label בעברית, decorative role.
 */
export function BobMascot({ pose = 'curious', className }: { pose?: BobPose; className?: string }) {
  return (
    <div
      role="img"
      aria-label={POSE_LABEL[pose]}
      className={cn(
        'flex size-16 items-center justify-center rounded-full bg-primary-50 text-3xl',
        pose === 'happy' && 'animate-spring-pop',
        className,
      )}
    >
      <span aria-hidden="true">{POSE_EMOJI[pose]}</span>
    </div>
  );
}

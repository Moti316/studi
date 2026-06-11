/**
 * <InspectorBubble> — בועת-מפקח משותפת (סימולציה פרה-בנויה + חיה).
 * RTL · design-tokens · `whitespace-pre-wrap` (לרינדור diagram-ASCII / שורות-חדשות בתגובת-המפקח).
 */
import type { ReactNode } from 'react';
import type { Inspector } from './types';
import { INSPECTOR_LABELS } from './engine';

export const INSPECTOR_ICON: Record<Inspector, string> = {
  technical: '🔧',
  hygiene: '⚗️',
  regulatory: '⚖️',
};

export function InspectorBubble({
  inspector,
  children,
  testId,
}: {
  inspector: Inspector;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5" data-testid={testId}>
      <span className="flex items-center gap-2 text-xs font-bold text-accent-700">
        <span
          aria-hidden="true"
          className="grid size-7 place-items-center rounded-full bg-accent-50 text-base ring-1 ring-inset ring-accent-100"
        >
          {INSPECTOR_ICON[inspector]}
        </span>
        {INSPECTOR_LABELS[inspector]}
      </span>
      <div className="whitespace-pre-wrap rounded-card rounded-ss-none border border-quiz-border bg-card px-4 py-3 text-start text-sm leading-relaxed text-quiz-text-primary shadow-card">
        {children}
      </div>
    </div>
  );
}

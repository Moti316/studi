'use client';

/**
 * <MCQShort> — Multiple-choice question, short-word options (e.g. fill-in-blank).
 *
 * 4 compact options in a 2×2 grid on mobile (4×1 on wide desktop).
 * Identical selection + submit logic to <MCQLong>, only the layout differs.
 *
 * Spec: docs/screens-spec/lesson-mcq-short.md
 * Contract: props { question, onResult } · onResult({ correct, selectedIndex }).
 */

import { McqQuestion } from './McqQuestion';
import type { QuestionComponentProps } from './types';

export function MCQShort(props: QuestionComponentProps) {
  return <McqQuestion {...props} variant="short" />;
}

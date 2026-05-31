'use client';

/**
 * <MCQLong> — Multiple-choice question, full-sentence options.
 *
 * 4 option cards stacked in a single vertical column (each ≥56px tall on mobile).
 * The most common question type. Selection + submit logic lives in <McqQuestion>.
 *
 * Spec: docs/screens-spec/lesson-mcq-long.md
 * Contract: props { question, onResult } · onResult({ correct, selectedIndex }).
 */

import { McqQuestion } from './McqQuestion';
import type { QuestionComponentProps } from './types';

export function MCQLong(props: QuestionComponentProps) {
  return <McqQuestion {...props} variant="long" />;
}

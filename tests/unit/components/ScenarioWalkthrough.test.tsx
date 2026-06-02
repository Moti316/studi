/**
 * Tests for <ScenarioWalkthrough> (type-5 scenario player) + the isRubric guard.
 *
 * Covers:
 * - isRubric type-guard (valid / invalid payloads)
 * - work phase shows title/background/task; solution hidden until revealed
 * - reveal → solution + rubric checklist appear
 * - self-assessment ≥ threshold → onResult({ correct: true }); below → false
 * - onResult fires exactly once; done phase shows the score breakdown
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScenarioWalkthrough } from '@/features/lesson-player/components/ScenarioWalkthrough';
import { isRubric, type ScenarioInput } from '@/features/lesson-player/components/types';

const SCENARIO: ScenarioInput = {
  title: 'תרחיש בדיקה',
  background: 'רקע התרחיש לבדיקה',
  data: 'נתון-שטח לבדיקה',
  task: 'המשימה לבדיקה',
  solution: 'הפתרון המומחה לבדיקה',
  rubric: [
    { criterion: 'קריטריון א', points: 2 },
    { criterion: 'קריטריון ב', points: 1 },
    { criterion: 'קריטריון ג', points: 1 },
  ], // total = 4; passThreshold 0.6 → need ≥ 2.4 → ≥ 3 points
};

describe('isRubric', () => {
  it('accepts a non-empty array of {criterion, points}', () => {
    expect(isRubric([{ criterion: 'x', points: 1 }])).toBe(true);
  });

  it('rejects empty / malformed payloads', () => {
    expect(isRubric([])).toBe(false);
    expect(isRubric([{ criterion: 'x' }])).toBe(false);
    expect(isRubric([{ points: 1 }])).toBe(false);
    expect(isRubric('nope')).toBe(false);
    expect(isRubric(null)).toBe(false);
  });
});

describe('<ScenarioWalkthrough>', () => {
  it('shows the brief (title/background/task) and hides the solution in the work phase', () => {
    render(<ScenarioWalkthrough scenario={SCENARIO} onResult={vi.fn()} />);

    expect(screen.getByTestId('scenario-title')).toHaveTextContent('תרחיש בדיקה');
    expect(screen.getByTestId('scenario-background')).toHaveTextContent('רקע התרחיש');
    expect(screen.getByTestId('scenario-task')).toHaveTextContent('המשימה לבדיקה');
    // Solution + rubric are not revealed yet.
    expect(screen.queryByTestId('scenario-solution')).toBeNull();
    expect(screen.queryByTestId('rubric')).toBeNull();
    expect(screen.getByTestId('scenario-walkthrough')).toHaveAttribute('data-phase', 'work');
  });

  it('reveals the expert solution and rubric on "reveal"', () => {
    render(<ScenarioWalkthrough scenario={SCENARIO} onResult={vi.fn()} />);

    fireEvent.click(screen.getByTestId('reveal-button'));

    expect(screen.getByTestId('scenario-solution')).toHaveTextContent('הפתרון המומחה');
    expect(screen.getByTestId('rubric')).toBeInTheDocument();
    expect(screen.getByTestId('rubric-item-0')).toHaveTextContent('קריטריון א');
    expect(screen.getByTestId('scenario-walkthrough')).toHaveAttribute('data-phase', 'review');
  });

  it('reports correct=true when the self-assessed score reaches the threshold', () => {
    const onResult = vi.fn();
    render(<ScenarioWalkthrough scenario={SCENARIO} onResult={onResult} />);

    fireEvent.click(screen.getByTestId('reveal-button'));
    // Mark א (2) + ב (1) = 3 / 4 = 0.75 ≥ 0.6 → pass.
    fireEvent.click(screen.getByTestId('rubric-checkbox-0'));
    fireEvent.click(screen.getByTestId('rubric-checkbox-1'));
    fireEvent.click(screen.getByTestId('finish-button'));

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ correct: true });
    expect(screen.getByTestId('scenario-score')).toHaveTextContent('3/4');
    expect(screen.getByTestId('scenario-walkthrough')).toHaveAttribute('data-phase', 'done');
  });

  it('reports correct=false when the score is below the threshold', () => {
    const onResult = vi.fn();
    render(<ScenarioWalkthrough scenario={SCENARIO} onResult={onResult} />);

    fireEvent.click(screen.getByTestId('reveal-button'));
    // Mark only א (2) = 2 / 4 = 0.5 < 0.6 → fail.
    fireEvent.click(screen.getByTestId('rubric-checkbox-0'));
    fireEvent.click(screen.getByTestId('finish-button'));

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ correct: false });
    expect(screen.getByTestId('scenario-score')).toHaveTextContent('2/4');
  });

  it('does not re-report after finishing (single onResult)', () => {
    const onResult = vi.fn();
    render(<ScenarioWalkthrough scenario={SCENARIO} onResult={onResult} />);

    fireEvent.click(screen.getByTestId('reveal-button'));
    fireEvent.click(screen.getByTestId('rubric-checkbox-0'));
    fireEvent.click(screen.getByTestId('rubric-checkbox-1'));
    fireEvent.click(screen.getByTestId('finish-button'));
    // The finish button is gone in the done phase — no way to double-report.
    expect(screen.queryByTestId('finish-button')).toBeNull();
    expect(onResult).toHaveBeenCalledTimes(1);
  });
});

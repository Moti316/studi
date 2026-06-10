/**
 * tests/unit/final-project/capstone.test.ts — מודל פרויקט-הגמר (JSA Capstone · בלוק-3).
 * מטריצת-הסיכון (riskLevel/riskBand · מקרא-המשרד) + ה-store (zustand). טהור.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { riskLevel, riskBand } from '@/features/final-project/types';
import type { JsaRow } from '@/features/final-project/types';
import { useCapstoneStore } from '@/features/final-project/store';

describe('riskLevel — חומרה × סבירות', () => {
  it('מכפלה 1-16', () => {
    expect(riskLevel(4, 4)).toBe(16);
    expect(riskLevel(2, 3)).toBe(6);
    expect(riskLevel(1, 1)).toBe(1);
  });
});

describe('riskBand — מקרא-המשרד (ירוק ≤4 · צהוב ≤9 · אדום ≥10)', () => {
  it('ירוק', () => {
    expect(riskBand(1)).toBe('green');
    expect(riskBand(4)).toBe('green');
  });
  it('צהוב', () => {
    expect(riskBand(6)).toBe('yellow');
    expect(riskBand(9)).toBe('yellow');
  });
  it('אדום', () => {
    expect(riskBand(12)).toBe('red');
    expect(riskBand(16)).toBe('red');
  });
});

function row(id: string): JsaRow {
  return {
    id,
    hazard: 'נפילה מגובה',
    scenario: 'עבודה על קצה-קומה ללא מעקה',
    existingControls: 'מעקה זמני',
    severity: 4,
    probability: 3,
    addedControls: 'רתמת-בטיחות',
    owner: 'מנהל-עבודה',
    due: '',
  };
}

describe('useCapstoneStore', () => {
  beforeEach(() => useCapstoneStore.getState().reset());

  it('ברירת-מחדל: step=site · ללא שורות', () => {
    const s = useCapstoneStore.getState();
    expect(s.step).toBe('site');
    expect(s.jsaRows).toHaveLength(0);
  });

  it('setStep מעדכן שלב', () => {
    useCapstoneStore.getState().setStep('matrix');
    expect(useCapstoneStore.getState().step).toBe('matrix');
  });

  it('addRow / updateRow / removeRow', () => {
    const s = useCapstoneStore.getState();
    s.addRow(row('a'));
    s.addRow(row('b'));
    expect(useCapstoneStore.getState().jsaRows).toHaveLength(2);
    s.updateRow('a', { hazard: 'התחשמלות' });
    expect(useCapstoneStore.getState().jsaRows.find((r) => r.id === 'a')?.hazard).toBe('התחשמלות');
    s.removeRow('b');
    expect(useCapstoneStore.getState().jsaRows).toHaveLength(1);
  });

  it('reset מנקה הכל', () => {
    const s = useCapstoneStore.getState();
    s.addRow(row('a'));
    s.setStep('feedback');
    s.reset();
    const after = useCapstoneStore.getState();
    expect(after.jsaRows).toHaveLength(0);
    expect(after.step).toBe('site');
  });
});

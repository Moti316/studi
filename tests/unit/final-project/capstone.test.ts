/**
 * tests/unit/final-project/capstone.test.ts — מודל פרויקט-הגמר (JSA Capstone · בלוק-3).
 * מטריצת-הסיכון (riskLevel/riskBand · מקרא-המשרד) + ה-store (zustand). טהור.
 *
 * עדכון: מודל-עשיר — existingControls/addedControls הם ControlSet · riskBefore/riskAfter.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { riskLevel, riskBand, emptyJsaRow, emptyControlSet } from '@/features/final-project/types';
import type { JsaRow, CapstoneFeedback } from '@/features/final-project/types';
import { useCapstoneStore } from '@/features/final-project/store';
import { validateHierarchy } from '@/features/final-project/jsa-validation';

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

/** בונה שורת-JSA מלאה ממודל-העשיר. */
function row(id: string): JsaRow {
  return {
    ...emptyJsaRow(id),
    hazard: 'נפילה מגובה',
    scenario: 'עבודה על קצה-קומה ללא מעקה',
    existingControls: { engineering: 'מעקה זמני', administrative: '', ppe: '' },
    riskBefore: { severity: 4, probability: 3 },
    addedControls: { engineering: '', administrative: 'נוהל עבודה בגובה', ppe: 'רתמת-בטיחות' },
    riskAfter: { severity: 4, probability: 1 },
    owner: 'מנהל-עבודה',
    due: '',
    status: 'open',
  };
}

describe('useCapstoneStore', () => {
  beforeEach(() => useCapstoneStore.getState().reset());

  it('ברירת-מחדל: step=cover · ללא שורות', () => {
    const s = useCapstoneStore.getState();
    expect(s.step).toBe('cover'); // עמוד-פתיחה = שלב-ראשון (דרישת-משרד-העבודה)
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
    expect(after.step).toBe('cover');
  });

  // #5 — עריכת-JSA מאפסת משוב-קודם (אחרת הלומד רואה הערכה ל-JSA-ישן)
  it('addRow / updateRow / removeRow מאפסים feedback', () => {
    const fakeFeedback: CapstoneFeedback = {
      overall: 'good',
      sections: [{ key: 'jsa_completeness', grade: 'good', feedback: 'בדיקה' }],
      hierarchyIssues: [],
      missingHazards: [],
      source: 'deterministic',
    };

    // addRow מנקה feedback
    useCapstoneStore.getState().setFeedback(fakeFeedback);
    expect(useCapstoneStore.getState().feedback).not.toBeNull();
    useCapstoneStore.getState().addRow(row('a'));
    expect(useCapstoneStore.getState().feedback).toBeNull();

    // updateRow מנקה feedback
    useCapstoneStore.getState().setFeedback(fakeFeedback);
    expect(useCapstoneStore.getState().feedback).not.toBeNull();
    useCapstoneStore.getState().updateRow('a', { hazard: 'התחשמלות' });
    expect(useCapstoneStore.getState().feedback).toBeNull();

    // removeRow מנקה feedback
    useCapstoneStore.getState().setFeedback(fakeFeedback);
    expect(useCapstoneStore.getState().feedback).not.toBeNull();
    useCapstoneStore.getState().removeRow('a');
    expect(useCapstoneStore.getState().feedback).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// #4 — validateHierarchy שוקל existingControls + addedControls יחד ל-PPE-only
// (ControlSet מבני — engineering/administrative/ppe)
// ---------------------------------------------------------------------------

describe('validateHierarchy — PPE-only על שתי-העמודות יחד (#4)', () => {
  /** שורת-בסיס עם רמת-סיכון אדומה (כדי שבדיקת ה-PPE-only תהיה רלוונטית). */
  function ppeRow(over: Partial<JsaRow>): JsaRow {
    return {
      ...emptyJsaRow('p1'),
      hazard: 'מגע עם חלקים-נעים',
      scenario: 'יד נכנסת לאזור-העבודה של המכונה',
      existingControls: emptyControlSet(),
      riskBefore: { severity: 4, probability: 3 },
      addedControls: emptyControlSet(),
      riskAfter: { severity: 4, probability: 1 },
      owner: 'מנהל-עבודה',
      due: '',
      status: 'open',
      ...over,
    };
  }

  it('בקרה-הנדסית ב-existingControls + צמ"א ב-addedControls → לא מדגיש PPE-only', () => {
    const rows = [
      ppeRow({
        existingControls: { engineering: 'מגן מכונה הנדסי', administrative: '', ppe: '' },
        addedControls: { engineering: '', administrative: '', ppe: 'כפפות' },
      }),
    ];
    const issues = validateHierarchy(rows);
    // אסור שיופיע ליקוי-PPE-only (severity:error עם "ציוד-מגן-אישי בלבד")
    const ppeOnly = issues.filter((i) => i.description.includes('ציוד-מגן-אישי בלבד'));
    expect(ppeOnly).toHaveLength(0);
  });

  it('מנהלתי ב-addedControls + צמ"א ב-existingControls → לא מדגיש PPE-only', () => {
    const rows = [
      ppeRow({
        existingControls: { engineering: '', administrative: '', ppe: 'כפפות' },
        addedControls: { engineering: '', administrative: 'נוהל-עבודה', ppe: '' },
      }),
    ];
    const issues = validateHierarchy(rows);
    const ppeOnly = issues.filter((i) => i.description.includes('ציוד-מגן-אישי בלבד'));
    expect(ppeOnly).toHaveLength(0);
  });

  it('צמ"א בלבד בשתי-העמודות → עדיין מדגיש PPE-only (לא נשבר)', () => {
    const rows = [
      ppeRow({
        existingControls: { engineering: '', administrative: '', ppe: 'כפפות' },
        addedControls: { engineering: '', administrative: '', ppe: 'קסדה' },
      }),
    ];
    const issues = validateHierarchy(rows);
    const ppeOnly = issues.filter((i) => i.description.includes('ציוד-מגן-אישי בלבד'));
    expect(ppeOnly).toHaveLength(1);
    expect(ppeOnly[0]!.severity).toBe('error');
  });

  it('existingControls ריק לחלוטין + addedControls עם הנדסי → לא PPE-only', () => {
    const rows = [
      ppeRow({
        existingControls: emptyControlSet(),
        addedControls: { engineering: 'מיגון-מכונה', administrative: '', ppe: 'כפפות' },
      }),
    ];
    const issues = validateHierarchy(rows);
    const ppeOnly = issues.filter((i) => i.description.includes('ציוד-מגן-אישי בלבד'));
    expect(ppeOnly).toHaveLength(0);
  });

  it('שתי-העמודות ריקות לחלוטין + סיכון-אדום → ליקוי חוסר-בקרות (לא PPE-only)', () => {
    const rows = [
      ppeRow({
        existingControls: emptyControlSet(),
        addedControls: emptyControlSet(),
      }),
    ];
    const issues = validateHierarchy(rows);
    // אין PPE-only (כי אין צמ"א בכלל), אבל יש ליקוי-חוסר-בקרות (band=red, addedControls ריק)
    const ppeOnly = issues.filter((i) => i.description.includes('ציוד-מגן-אישי בלבד'));
    expect(ppeOnly).toHaveLength(0);
    const missingControls = issues.filter((i) => i.description.includes('בקרות-נוספות'));
    expect(missingControls.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// #6 — מיזוג ליקויי-Claude עם הוולידציה-הדטרמיניסטית (union + dedup)
// ---------------------------------------------------------------------------

describe('מיזוג ליקויים — union לא משכפל (#6)', () => {
  /** מחקה את לוגיקת-המיזוג ב-evaluate-capstone.action.ts (Set-dedup). */
  function mergeIssues(claude: string[], det: string[]): string[] {
    return [...new Set([...(claude || []), ...det])];
  }

  it('פריט-משותף מופיע פעם-אחת בלבד', () => {
    const claude = ['ליקוי משותף', 'ליקוי רק-של-Claude'];
    const det = ['ליקוי משותף', 'ליקוי רק-דטרמיניסטי'];
    const merged = mergeIssues(claude, det);
    expect(merged).toHaveLength(3);
    expect(merged.filter((x) => x === 'ליקוי משותף')).toHaveLength(1);
    expect(merged).toContain('ליקוי רק-של-Claude');
    expect(merged).toContain('ליקוי רק-דטרמיניסטי');
  });

  it('ליקוי-דטרמיניסטי-וודאי נשמר גם כש-Claude לא דיווח עליו', () => {
    const claude: string[] = []; // Claude פספס
    const det = ['גורם-סיכון "X": ציוד-מגן-אישי בלבד'];
    const merged = mergeIssues(claude, det);
    expect(merged).toContain('גורם-סיכון "X": ציוד-מגן-אישי בלבד');
  });

  it('עמיד מול hierarchyIssues חסר (undefined) מתשובת-Claude', () => {
    const merged = mergeIssues(undefined as unknown as string[], ['det-only']);
    expect(merged).toEqual(['det-only']);
  });
});

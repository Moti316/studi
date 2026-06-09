import { describe, it, expect } from 'vitest';
import { detectMode, enforceGrounding, stripMode } from '@/lib/ai/prompts/committee-sim/modes';
import {
  buildScenarioAuthoringPrompt,
  COMMITTEE_SIM_MASTER,
  type ScenarioSeed,
  type GroundedCitation,
} from '@/lib/ai/prompts/committee-sim/master';

describe('committee-sim modes', () => {
  it('detectMode מזהה את התג', () => {
    expect(detectMode('[מאומת] לפי תקנה 3')).toBe('מאומת');
    expect(detectMode('[לא ידוע] צריך אימות')).toBe('לא ידוע');
    expect(detectMode('בלי תג')).toBeNull();
  });
  it('enforceGrounding: ללא-עיגון → לא ידוע · עם-עיגון שומר/ברירת-מוסקנא', () => {
    expect(enforceGrounding('מאומת', false)).toBe('לא ידוע');
    expect(enforceGrounding('מאומת', true)).toBe('מאומת');
    expect(enforceGrounding(null, true)).toBe('מוסקנא');
  });
  it('stripMode מסיר את התג', () => {
    expect(stripMode('[מוסקנא] טקסט')).toBe('טקסט');
  });
});

describe('committee-sim master', () => {
  const seed: ScenarioSeed = {
    title: 'עבודה בגובה',
    background: 'עובדים על פיגום בגובה 4 מ׳.',
    task: 'נתח את האירוע.',
  };
  const grounding: GroundedCitation[] = [
    {
      scopeId: '2.2',
      quote: 'לא יועתק פיגום נייד',
      section: 'תקנה 56',
      statuteTitle: 'תקנות הבנייה',
    },
  ];

  it('המאסטר name-cleaned (אין מגן/שגיא/מוטי · יש 4-עקרונות+3-מצבים)', () => {
    expect(COMMITTEE_SIM_MASTER).not.toMatch(/מגן|שגיא|מוטי|Telegram/);
    expect(COMMITTEE_SIM_MASTER).toContain('מדרג-הבקרות');
    expect(COMMITTEE_SIM_MASTER).toContain('מאומת');
    expect(COMMITTEE_SIM_MASTER).toContain('Vision Zero');
  });

  it('buildScenarioAuthoringPrompt כולל seed + עיגון + חוזה-JSON', () => {
    const p = buildScenarioAuthoringPrompt(seed, grounding);
    expect(p).toContain('עבודה בגובה');
    expect(p).toContain('2.2');
    expect(p).toContain('לא יועתק פיגום נייד');
    expect(p).toContain('legalCitation');
  });
  it('ללא עיגון → הוראת אל-תמציא', () => {
    const p = buildScenarioAuthoringPrompt(seed, []);
    expect(p).toMatch(/אל תמציא|לא ידוע/);
  });
});

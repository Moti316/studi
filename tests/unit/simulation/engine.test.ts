import { describe, it, expect } from 'vitest';
import { PrebakedEngine, INSPECTOR_LABELS } from '@/features/simulation/engine';
import type { Simulation } from '@/features/simulation/types';

const SIM: Simulation = {
  title: 'תרחיש-בדיקה',
  branch: 'מסגריה',
  intro: 'אתה ממונה בטיחות במסגריה.',
  scopeRefs: [{ id: '2.3', confidence: 1 }],
  maxScore: 100,
  scoringCriteria: [{ name: 'ידע-בחוק', weight: 100 }],
  stages: [
    {
      key: 'opening',
      title: 'היכרות',
      turns: [
        {
          id: 't1',
          inspector: 'technical',
          prompt: 'ספר על עצמך.',
          options: [
            { text: 'רקע מלא', quality: 'good', points: 10, feedback: 'מצוין' },
            { text: 'חלקי', quality: 'partial', points: 5, feedback: 'הרחב' },
          ],
        },
      ],
    },
    {
      key: 'law',
      title: 'צלילה-לחוק',
      turns: [
        {
          id: 't2',
          inspector: 'regulatory',
          prompt: 'איזו תקנה מחייבת צמ"א?',
          options: [
            {
              text: 'תשנ"ז-1997',
              quality: 'good',
              points: 10,
              feedback: 'נכון',
              citation: 'תקנה 3',
            },
            { text: 'לא יודע', quality: 'poor', points: 0, feedback: 'יש לחזור על החומר' },
          ],
        },
      ],
    },
  ],
};

describe('PrebakedEngine', () => {
  it('start מחזיר את התור-הראשון', () => {
    const e = new PrebakedEngine(SIM);
    expect(e.start().id).toBe('t1');
  });

  it('respond מחזיר משוב + ניקוד + התור-הבא, ובסוף done', () => {
    const e = new PrebakedEngine(SIM);
    e.start();
    const r1 = e.respond('t1', 0);
    expect(r1.pointsAwarded).toBe(10);
    expect(r1.feedback).toBe('מצוין');
    expect(r1.done).toBe(false);
    expect(r1.nextTurn?.id).toBe('t2');

    const r2 = e.respond('t2', 0);
    expect(r2.citation).toBe('תקנה 3');
    expect(r2.nextTurn).toBeNull();
    expect(r2.done).toBe(true);
  });

  it('turnId לא-תואם → זורק', () => {
    const e = new PrebakedEngine(SIM);
    e.start();
    expect(() => e.respond('t2', 0)).toThrow(/turn mismatch/);
  });

  it('optionIndex פסול → זורק', () => {
    const e = new PrebakedEngine(SIM);
    e.start();
    expect(() => e.respond('t1', 9)).toThrow(/invalid optionIndex/);
  });

  it('result: ציון-מלא (כל good) = 100, אפס-חולשות', () => {
    const e = new PrebakedEngine(SIM);
    e.start();
    e.respond('t1', 0);
    e.respond('t2', 0);
    const res = e.result();
    expect(res.score).toBe(100);
    expect(res.weaknesses).toHaveLength(0);
    expect(res.perCriterion.map((c) => c.name)).toEqual(['היכרות', 'צלילה-לחוק']);
  });

  it('result: בחירות-חלשות → ציון-יחסי + חולשות מתויגות-מפקח', () => {
    const e = new PrebakedEngine(SIM);
    e.start();
    e.respond('t1', 1); // partial · 5/10
    e.respond('t2', 1); // poor · 0/10
    const res = e.result();
    expect(res.score).toBe(25); // (5+0)/(10+10)=25%
    expect(res.weaknesses).toHaveLength(2);
    expect(res.weaknesses[0]).toContain(INSPECTOR_LABELS.technical);
    expect(res.weaknesses[1]).toContain(INSPECTOR_LABELS.regulatory);
  });
});

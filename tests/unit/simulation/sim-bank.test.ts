/**
 * sim-bank.test.ts — תקינות בנק-סימולציות-הוועדה (בלוק-5) + עזרי-הייבוא.
 */
import { describe, it, expect } from 'vitest';
import bank from '@/features/simulation/data/committee-sim-bank.json';
import verdicts from '@/features/simulation/data/committee-sim-bank.verify.json';
import { simSourceRef, isValidSimulation } from '../../../scripts/import-simulations';
import type { Simulation } from '@/features/simulation/types';

const SIMS = bank as Simulation[];
const VERDICTS = verdicts as { title: string; overallOk: boolean }[];

describe('committee-sim-bank — תקינות-מבנית', () => {
  it('12 סימולציות · כותרות-ייחודיות · לכולן וורדיקט', () => {
    expect(SIMS).toHaveLength(12);
    const titles = SIMS.map((s) => s.title);
    expect(new Set(titles).size).toBe(12);
    const verdictTitles = new Set(VERDICTS.map((v) => v.title));
    for (const t of titles) expect(verdictTitles.has(t)).toBe(true);
  });

  it('כל סימולציה עוברת ולידציה-מבנית (שדות-הריצה של הנגן)', () => {
    for (const sim of SIMS) {
      expect(isValidSimulation(sim)).toBe(true);
      // 4 שלבי-המתודולוגיה · בכל תור ≥2 אפשרויות ולפחות אחת good
      expect(sim.stages.length).toBeGreaterThanOrEqual(4);
      for (const stage of sim.stages) {
        for (const turn of stage.turns) {
          expect(turn.options.length).toBeGreaterThanOrEqual(2);
          expect(turn.options.some((o) => o.quality === 'good')).toBe(true);
        }
      }
      // משקלי-הציון ≈ 100
      const weights = sim.scoringCriteria.reduce((s, c) => s + c.weight, 0);
      expect(weights).toBeGreaterThanOrEqual(95);
      expect(weights).toBeLessThanOrEqual(105);
    }
  });

  it('11 מאומתים · 1 מדוגל (גג-רעפים) — הייבוא מדלג עליו', () => {
    const ok = VERDICTS.filter((v) => v.overallOk);
    expect(ok).toHaveLength(11);
    const flagged = VERDICTS.find((v) => !v.overallOk);
    expect(flagged?.title).toContain('גג רעפים');
  });
});

describe('import helpers', () => {
  it('simSourceRef יציב וייחודי (idempotency)', () => {
    const refs = SIMS.map((s) => simSourceRef(s.title));
    expect(new Set(refs).size).toBe(12);
    expect(simSourceRef('  X ')).toBe('committee-sim:X');
  });

  it('isValidSimulation דוחה מבנים-שבורים', () => {
    expect(isValidSimulation(null)).toBe(false);
    expect(isValidSimulation({})).toBe(false);
    expect(isValidSimulation({ title: 'x', branch: 'y', intro: 'z', stages: [] })).toBe(false);
  });
});

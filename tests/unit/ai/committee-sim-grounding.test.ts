/**
 * tests/unit/ai/committee-sim-grounding.test.ts — חבילות-עיגון פר-ענף (ADR-018). טהור.
 */
import { describe, expect, it } from 'vitest';
import { packForBranch, formatGrounding } from '@/lib/ai/prompts/committee-sim/grounding';

describe('packForBranch', () => {
  it('כולל את 2 עמודי-היסוד תמיד', () => {
    const ids = packForBranch('ענף-לא-מוכר').map((s) => s.scopeId);
    expect(ids).toContain('1.0'); // ארגון הפיקוח 1954
    expect(ids).toContain('2.0'); // פקודת הבטיחות 1970
  });
  it('בנייה → עבודות-בנייה + גובה + צמ"א', () => {
    const ids = packForBranch('בנייה').map((s) => s.scopeId);
    expect(ids).toEqual(expect.arrayContaining(['2.2', '2.1', '2.3']));
  });
  it('חשמל → תקנות-חשמל', () => {
    expect(packForBranch('עבודת-חשמל').map((s) => s.scopeId)).toContain('2.4');
  });
  it('הרמה/עגורנים → תקנות-עגורנאים', () => {
    expect(packForBranch('הרמה ועגורנים').map((s) => s.scopeId)).toContain('2.6');
  });
  it('deduped (אין כפילות scopeId)', () => {
    const ids = packForBranch('בנייה').map((s) => s.scopeId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('formatGrounding', () => {
  it('מרנדר שורות scope + שם-חוק', () => {
    const out = formatGrounding(packForBranch('בנייה'));
    expect(out).toContain('scope 2.0');
    expect(out).toContain('פקודת הבטיחות');
    expect(out).toContain('עבודות בנייה');
  });
});

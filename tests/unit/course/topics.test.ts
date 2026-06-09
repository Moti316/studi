import { describe, it, expect } from 'vitest';
import { COURSE_TOPICS, getTopic, isTopicId } from '@/lib/course/topics';

describe('COURSE_TOPICS', () => {
  it('8 יחידות-נושא, ids ייחודיים, scopes לא-ריקים', () => {
    expect(COURSE_TOPICS).toHaveLength(8);
    const ids = COURSE_TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(8);
    for (const t of COURSE_TOPICS) {
      expect(t.scopes.length).toBeGreaterThan(0);
      expect(t.title.length).toBeGreaterThan(0);
    }
  });

  it('כל scope מופיע ביחידה אחת בלבד (אין כפילות בין-נושאים)', () => {
    const all = COURSE_TOPICS.flatMap((t) => t.scopes);
    expect(new Set(all).size).toBe(all.length);
  });

  it('getTopic / isTopicId — default-deny', () => {
    expect(getTopic('argun')?.title).toContain('ארגון');
    expect(isTopicId('chashmal')).toBe(true);
    expect(isTopicId('2.1')).toBe(false); // scope-id אינו topic-id
    expect(getTopic('nope')).toBeUndefined();
  });
});

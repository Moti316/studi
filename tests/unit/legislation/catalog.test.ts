/**
 * catalog.test.ts — מאמת את גזירת קטלוג-החקיקה מ-legislation-manifest.
 */
import { describe, it, expect } from 'vitest';
import {
  LEGISLATION_CHAPTERS,
  LEGISLATION_TOTAL,
  LEGISLATION_FLAT,
  LEGISLATION_BY_TOPIC,
  DEPTH_LABELS,
} from '@/lib/legislation/catalog';
import { COURSE_TOPICS, isTopicId } from '@/lib/course/topics';

describe('legislation catalog', () => {
  it('4 פרקים · 43 נוסחים', () => {
    expect(LEGISLATION_CHAPTERS).toHaveLength(4);
    expect(LEGISLATION_TOTAL).toBe(43);
    expect(LEGISLATION_FLAT).toHaveLength(43);
  });

  it('פרקים ממוספרים 1..4 עם כותרת לא-ריקה', () => {
    LEGISLATION_CHAPTERS.forEach((c, i) => {
      expect(c.num).toBe(i + 1);
      expect(c.title.length).toBeGreaterThan(3);
      expect(c.items.length).toBeGreaterThan(0);
    });
  });

  it('סכום-פריטי-הפרקים = הסך-הכולל', () => {
    const sum = LEGISLATION_CHAPTERS.reduce((s, c) => s + c.items.length, 0);
    expect(sum).toBe(LEGISLATION_TOTAL);
  });

  it('מיון נומרי נכון בתוך פרק (2.9 לפני 2.10 לפני 2.10b לפני 2.11.1)', () => {
    const ch2 = LEGISLATION_CHAPTERS.find((c) => c.num === 2)!;
    const ids = ch2.items.map((it) => it.displayId);
    expect(ids.indexOf('2.9')).toBeLessThan(ids.indexOf('2.10'));
    expect(ids.indexOf('2.10')).toBeLessThan(ids.indexOf('2.10b'));
    expect(ids.indexOf('2.10b')).toBeLessThan(ids.indexOf('2.11.1'));
  });

  it('כל פריט נושא כותרת · שנה · קישורי נבו+PDF · עומק תקף', () => {
    for (const it of LEGISLATION_FLAT) {
      expect(it.title.length).toBeGreaterThan(5);
      expect(it.year).toBeGreaterThan(1940);
      expect(it.nevoUrl).toMatch(/^https:\/\/www\.nevo\.co\.il\//);
      if (it.pdfUrl !== null) {
        expect(it.pdfUrl).toMatch(/^https:\/\/drive\.google\.com\//);
      }
      expect(Object.keys(DEPTH_LABELS)).toContain(it.depth);
    }
  });

  it('בדיוק פריט-אחד ממתין-ל-PDF (2.6.1 · נעלם כשמוטי מעלה)', () => {
    const pending = LEGISLATION_FLAT.filter((it) => it.pdfUrl === null);
    expect(pending.map((it) => it.displayId)).toEqual(['2.6.1']);
  });

  it('displayId ייחודי על-פני הקטלוג', () => {
    const ids = LEGISLATION_FLAT.map((it) => it.displayId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('LEGISLATION_BY_TOPIC — מפת-נושאים (חקיקה↔למידה)', () => {
  it('כיסוי-מלא: כל 43 הנוסחים משויכים בדיוק-פעם-אחת (יחידות + "נוספים")', () => {
    const all = LEGISLATION_BY_TOPIC.flatMap((s) => s.items.map((i) => i.displayId));
    expect(all).toHaveLength(LEGISLATION_TOTAL); // אין-כפילות בין-מדפים, אין-נשמט
    expect(new Set(all).size).toBe(LEGISLATION_TOTAL);
  });

  it('כל מדף-יחידה נושא practiceHref תקף ל-/lesson/<topic-id>; "נוספים" — בלי', () => {
    for (const s of LEGISLATION_BY_TOPIC) {
      expect(s.items.length).toBeGreaterThan(0); // אין-מדף-ריק
      if (s.id === 'extra') {
        expect(s.practiceHref).toBeUndefined();
      } else {
        expect(isTopicId(s.id)).toBe(true);
        expect(s.practiceHref).toBe(`/lesson/${s.id}`);
      }
    }
  });

  it('שיוך-נכון: כל פריט במדף-יחידה נושא scopeId מתוך scopes-היחידה', () => {
    const topicScopes = new Map(COURSE_TOPICS.map((t) => [t.id, new Set(t.scopes)]));
    for (const s of LEGISLATION_BY_TOPIC) {
      if (s.id === 'extra') continue;
      const scopes = topicScopes.get(s.id)!;
      for (const item of s.items) {
        expect(scopes.has(item.scopeId)).toBe(true);
      }
    }
  });
});

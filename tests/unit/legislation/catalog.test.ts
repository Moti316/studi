/**
 * catalog.test.ts — מאמת את גזירת קטלוג-החקיקה מ-legislation-manifest.
 */
import { describe, it, expect } from 'vitest';
import {
  LEGISLATION_CHAPTERS,
  LEGISLATION_TOTAL,
  LEGISLATION_FLAT,
  DEPTH_LABELS,
} from '@/lib/legislation/catalog';

describe('legislation catalog', () => {
  it('4 פרקים · 42 נוסחים', () => {
    expect(LEGISLATION_CHAPTERS).toHaveLength(4);
    expect(LEGISLATION_TOTAL).toBe(42);
    expect(LEGISLATION_FLAT).toHaveLength(42);
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
      expect(it.pdfUrl).toMatch(/^https:\/\/drive\.google\.com\//);
      expect(Object.keys(DEPTH_LABELS)).toContain(it.depth);
    }
  });

  it('displayId ייחודי על-פני הקטלוג', () => {
    const ids = LEGISLATION_FLAT.map((it) => it.displayId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

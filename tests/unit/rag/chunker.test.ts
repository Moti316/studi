/**
 * tests/unit/rag/chunker.test.ts — בדיקות חיתוך-מסמך ל-RAG.
 *
 * מאמת: דטרמיניזם, גודל-צ'אנק ≤ maxTokens+overlap, chunkIndex רציף, חפיפה
 * (overlap מכפיל סגמנט גבולי), פיצול פסקה-ארוכה למשפטים, פיצול-קשיח למילה-ענקית,
 * מיזוג צ'אנק-אחרון-זעיר, נרמול CRLF, וקלט לא-תקין.
 */

import { describe, expect, it } from 'vitest';
import { chunkText, estimateTokens } from '@/lib/rag/chunker';

/** פסקה ייחודית באורך ~10 טוקנים (≈40 תווים) עם מרקר ניתן-לספירה. */
function makePara(i: number): string {
  return `[[P${i}]] ` + 'דגימה '.repeat(6).trim();
}

describe('estimateTokens', () => {
  it('ריק/רווחים ⇒ 0', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('   \n  ')).toBe(0);
  });
  it('היוריסטיקת ~4 תווים/טוקן', () => {
    expect(estimateTokens('12345678')).toBe(2); // 8/4
    expect(estimateTokens('abc')).toBe(1); // ceil(3/4)=1
  });
});

describe('chunkText — בסיס', () => {
  it('ריק ⇒ מערך-ריק', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   \n\n   ')).toEqual([]);
  });

  it("טקסט-קצר ⇒ צ'אנק-אחד עם chunkIndex=0 ו-tokenCount", () => {
    const r = chunkText('שלום עולם בטיחותי', { maxTokens: 512 });
    expect(r).toHaveLength(1);
    expect(r[0]?.chunkIndex).toBe(0);
    expect(r[0]?.text).toBe('שלום עולם בטיחותי');
    expect(r[0]?.tokenCount).toBeGreaterThan(0);
  });

  it('דטרמיניסטי — אותו קלט ⇒ אותו פלט', () => {
    const text = [makePara(0), makePara(1), makePara(2)].join('\n\n');
    expect(chunkText(text, { maxTokens: 20, overlapTokens: 0 })).toEqual(
      chunkText(text, { maxTokens: 20, overlapTokens: 0 }),
    );
  });
});

describe('chunkText — פיצול וחפיפה', () => {
  const paras = [makePara(0), makePara(1), makePara(2), makePara(3)].join('\n\n');

  it('overlap=0 ⇒ כל פסקה מופיעה בדיוק פעם-אחת, chunkIndex רציף', () => {
    const r = chunkText(paras, { maxTokens: 20, overlapTokens: 0 });
    expect(r.length).toBeGreaterThan(1);
    r.forEach((c, i) => expect(c.chunkIndex).toBe(i));
    const all = r.map((c) => c.text).join('\n\n');
    for (let i = 0; i < 4; i++) {
      expect(all.split(`[[P${i}]]`).length - 1).toBe(1); // הופעה אחת בלבד
    }
  });

  it("overlap>0 ⇒ סגמנט-גבולי מופיע ב-2 צ'אנקים (חפיפה)", () => {
    const r = chunkText(paras, { maxTokens: 20, overlapTokens: 8 });
    const all = r.map((c) => c.text).join('\n\n');
    const dupes = [0, 1, 2, 3].filter((i) => all.split(`[[P${i}]]`).length - 1 >= 2);
    expect(dupes.length).toBeGreaterThan(0);
  });

  it("כל צ'אנק ≤ maxTokens + overlapTokens", () => {
    const r = chunkText(paras, { maxTokens: 20, overlapTokens: 8 });
    for (const c of r) expect(c.tokenCount).toBeLessThanOrEqual(20 + 8);
  });
});

describe('chunkText — פיצול-עומק', () => {
  it('פסקה-ארוכה ללא שורות-ריקות מתפצלת למשפטים', () => {
    const sentence = 'זוהי דגימת משפט בטיחותי ארוך לצורך בדיקה.';
    const para = Array.from({ length: 6 }, () => sentence).join(' ');
    const r = chunkText(para, { maxTokens: 20, overlapTokens: 0 });
    expect(r.length).toBeGreaterThan(1);
    for (const c of r) expect(c.tokenCount).toBeLessThanOrEqual(20);
  });

  it('מילה-ענקית ללא רווחים ⇒ פיצול-קשיח לפי-תווים', () => {
    const giant = 'א'.repeat(200); // ~50 טוקנים, ללא גבולות
    const r = chunkText(giant, { maxTokens: 10, overlapTokens: 0 });
    expect(r.length).toBeGreaterThan(1);
    for (const c of r) expect(c.tokenCount).toBeLessThanOrEqual(10);
    expect(r.map((c) => c.text).join('')).toBe(giant); // ללא-אובדן
  });

  it('נרמול CRLF', () => {
    const a = chunkText('שורה אחת\r\n\r\nשורה שתיים', { maxTokens: 512 });
    const b = chunkText('שורה אחת\n\nשורה שתיים', { maxTokens: 512 });
    expect(a).toEqual(b);
  });
});

describe('chunkText — קלט לא-תקין', () => {
  it('זורק על אופציות לא-תקינות', () => {
    expect(() => chunkText('x', { maxTokens: 0 })).toThrow(RangeError);
    expect(() => chunkText('x', { maxTokens: 10, overlapTokens: 10 })).toThrow(RangeError);
    expect(() => chunkText('x', { maxTokens: 10, overlapTokens: -1 })).toThrow(RangeError);
    expect(() => chunkText('x', { minTokens: -1 })).toThrow(RangeError);
  });
});

/**
 * tests/unit/rag/embedder.test.ts — בדיקות orchestration ההטמעה (DI).
 *
 * משתמש ב-EmbedFn **מזויף** — אפס קריאות-Gemini בתשלום. מאמת: batching, יישור-
 * וקטורים, ולידציית-count/מימד/ריק, ועקביות-מימדים חוצת-batches.
 */

import { describe, expect, it, vi } from 'vitest';
import { embedChunks, type EmbedFn } from '@/lib/rag/embedder';
import type { ChunkResult } from '@/lib/rag/chunker';

function makeChunks(n: number): ChunkResult[] {
  return Array.from({ length: n }, (_, i) => ({
    chunkIndex: i,
    text: `chunk-${i}`,
    tokenCount: 3,
  }));
}

/** EmbedFn מזויף: וקטור [אורך-הטקסט, סדר-בתוך-ה-batch] בממד קבוע. */
const fakeEmbed: EmbedFn = async (texts) => texts.map((t, j) => [t.length, j, 0]);

describe('embedChunks — בסיס', () => {
  it('ריק ⇒ מערך-ריק (ללא קריאת-embed)', async () => {
    const spy = vi.fn(fakeEmbed);
    expect(await embedChunks([], spy)).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("מצמיד embedding לכל צ'אנק, משמר chunkIndex/text/tokenCount", async () => {
    const chunks = makeChunks(3);
    const r = await embedChunks(chunks, fakeEmbed);
    expect(r).toHaveLength(3);
    r.forEach((c, i) => {
      expect(c.chunkIndex).toBe(i);
      expect(c.text).toBe(`chunk-${i}`);
      expect(c.tokenCount).toBe(3);
      expect(c.embedding).toHaveLength(3);
      expect(c.embedding[0]).toBe(`chunk-${i}`.length);
    });
  });
});

describe('embedChunks — batching', () => {
  it("מחלק ל-batches לפי batchSize (5 צ'אנקים, batch=2 ⇒ 3 קריאות)", async () => {
    const spy = vi.fn(fakeEmbed);
    await embedChunks(makeChunks(5), spy, { batchSize: 2 });
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy.mock.calls[0]?.[0]).toHaveLength(2);
    expect(spy.mock.calls[2]?.[0]).toHaveLength(1);
  });

  it('batchSize לא-תקין ⇒ זורק', async () => {
    await expect(embedChunks(makeChunks(1), fakeEmbed, { batchSize: 0 })).rejects.toThrow(
      RangeError,
    );
  });
});

describe('embedChunks — ולידציה', () => {
  it('אי-התאמת-count מ-EmbedFn ⇒ זורק', async () => {
    const bad: EmbedFn = async (texts) => texts.slice(1).map(() => [1, 2, 3]);
    await expect(embedChunks(makeChunks(3), bad)).rejects.toThrow(/count mismatch/i);
  });

  it('וקטור-ריק ⇒ זורק', async () => {
    const bad: EmbedFn = async (texts) => texts.map(() => []);
    await expect(embedChunks(makeChunks(2), bad)).rejects.toThrow(/empty/i);
  });

  it('expectedDim שגוי ⇒ זורק', async () => {
    await expect(embedChunks(makeChunks(2), fakeEmbed, { expectedDim: 1024 })).rejects.toThrow(
      /dim mismatch/i,
    );
  });

  it('מימדים לא-עקביים בין batches ⇒ זורק', async () => {
    let call = 0;
    const varying: EmbedFn = async (texts) => {
      call++;
      const dim = call === 1 ? 3 : 4; // batch שני בממד שונה
      return texts.map(() => new Array(dim).fill(0.1));
    };
    await expect(embedChunks(makeChunks(4), varying, { batchSize: 2 })).rejects.toThrow(
      /inconsistent/i,
    );
  });
});

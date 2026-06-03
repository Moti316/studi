/**
 * src/lib/rag/embedder.ts — הטמעת-צ'אנקים (embedding) ל-RAG, עם Dependency-Injection.
 *
 * מקבל צ'אנקים (מ-`chunker.ts`) ופונקציית-הטמעה (`EmbedFn`) — ומחזיר כל צ'אנק עם
 * וקטור-ההטמעה שלו, מוכן לכתיבה ל-`chunks.embedding` (pgvector).
 *
 * **DI מכוון:** ה-orchestration (batching, ולידציה, יישור) נבדק במלואו עם פונקציית-
 * הטמעה מזויפת — **אפס קריאות-Gemini בתשלום בבדיקות**. ה-EmbedFn הפרודקשני (Gemini)
 * נמצא ב-`gemini-embed.ts` ומוזרק כאן רק בזמן-ריצה אמיתי.
 *
 * ⚠️ אי-התאמת-מימדים ידועה (לתיעוד-מוטי): `chunks.embedding` הוגדר `vector(1024)`
 * עבור Voyage, אך הפרודקשן עבר ל-Gemini (מימדים שונים — 768/3072). יישור-המימדים
 * (מיגרציה/בחירת-מודל) דורש החלטה לפני הרצת-embedding אמיתית. `expectedDim` כאן
 * מאפשר לאכוף את המימד-הנבחר ברגע שיוחלט.
 */

import type { ChunkResult } from './chunker';

/** פונקציית-הטמעה: טקסטים → וקטורים (באותו סדר, באותו אורך). */
export type EmbedFn = (texts: string[]) => Promise<number[][]>;

/** צ'אנק עם וקטור-ההטמעה שלו. */
export interface EmbeddedChunk extends ChunkResult {
  embedding: number[];
}

export interface EmbedChunksOptions {
  /** גודל-batch לקריאת-הטמעה (ברירת-מחדל 32). */
  batchSize?: number;
  /** מימד-וקטור צפוי לאכיפה (אופציונלי — כשיוחלט המודל/הסכמה). */
  expectedDim?: number;
}

/**
 * מטמיע מערך-צ'אנקים ב-batches, מאמת יישור-ומימדים, ומחזיר צ'אנקים-מוטמעים.
 *
 * @throws {Error} אם מספר-הוקטורים אינו תואם ל-batch · וקטור-ריק · אי-התאמת-מימד.
 */
export async function embedChunks(
  chunks: ChunkResult[],
  embed: EmbedFn,
  options: EmbedChunksOptions = {},
): Promise<EmbeddedChunk[]> {
  const batchSize = options.batchSize ?? 32;
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new RangeError(`batchSize must be a positive integer, got ${batchSize}`);
  }
  if (chunks.length === 0) return [];

  const out: EmbeddedChunk[] = [];
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const vectors = await embed(batch.map((c) => c.text));
    if (vectors.length !== batch.length) {
      throw new Error(
        `Embedding count mismatch: got ${vectors.length} vectors for ${batch.length} chunks (batch @${i}).`,
      );
    }
    for (const [j, chunk] of batch.entries()) {
      const v = vectors[j];
      if (!Array.isArray(v) || v.length === 0) {
        throw new Error(`Empty/invalid embedding for chunk ${chunk.chunkIndex}.`);
      }
      if (options.expectedDim !== undefined && v.length !== options.expectedDim) {
        throw new Error(
          `Embedding dim mismatch for chunk ${chunk.chunkIndex}: expected ${options.expectedDim}, got ${v.length}.`,
        );
      }
      out.push({ ...chunk, embedding: v });
    }
  }

  // אכיפת-עקביות: כל הוקטורים באותו מימד (תנאי pgvector).
  const dim = out[0]?.embedding.length ?? 0;
  for (const c of out) {
    if (c.embedding.length !== dim) {
      throw new Error(
        `Inconsistent embedding dims: chunk ${c.chunkIndex} has ${c.embedding.length}, expected ${dim}.`,
      );
    }
  }
  return out;
}

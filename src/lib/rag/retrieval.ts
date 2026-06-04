/**
 * src/lib/rag/retrieval.ts — חיפוש-דמיון (pgvector cosine) על `chunks`. SERVER-ONLY.
 *
 * מחזיר את ה-top-K chunks הקרובים-ביותר לשאילתה (לפי `embedding <=> queryVec`),
 * עם כותרת-המקור (לציטוט). דורש קורפוס מוטמע (ראה scripts/ingest-legislation.ts).
 */
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export interface RetrievedChunk {
  id: string;
  text: string;
  scopeRefs: Array<{ id: string; confidence?: number }>;
  sourceTitle: string;
  /** 1 − cosine-distance (גבוה = דומה-יותר). */
  score: number;
}

export async function retrieveRelevantChunks(
  queryEmbedding: number[],
  topK = 5,
): Promise<RetrievedChunk[]> {
  if (queryEmbedding.length === 0) return [];
  const vec = `[${queryEmbedding.join(',')}]`;
  const rows = await db.execute(sql`
    SELECT c.id::text                              AS id,
           c.text                                  AS text,
           c.scope_refs                            AS scope_refs,
           s.title                                 AS source_title,
           1 - (c.embedding <=> ${vec}::vector)    AS score
    FROM chunks c
    JOIN content_sources s ON s.id = c.source_id
    WHERE c.in_scope = true AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> ${vec}::vector ASC
    LIMIT ${topK}
  `);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[]).map((r) => ({
    id: String(r.id),
    text: String(r.text),
    scopeRefs: Array.isArray(r.scope_refs) ? r.scope_refs : [],
    sourceTitle: String(r.source_title ?? ''),
    score: Number(r.score),
  }));
}

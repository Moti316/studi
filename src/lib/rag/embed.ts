/**
 * src/lib/rag/embed.ts — מטמיע-RAG קנוני (gemini-embedding-001 @ 1024 · L2-normalized).
 *
 * ⚠️ קריטי: חייב להיות **זהה** בין הטמעת-הקורפוס (RETRIEVAL_DOCUMENT, ב-
 * `scripts/ingest-legislation.ts`) לבין הטמעת-השאילתה (RETRIEVAL_QUERY, כאן) — אותו
 * מודל + אותו מימד + אותה נורמליזציה — אחרת הדמיון-הקוסינוסי ב-pgvector חסר-משמעות.
 *
 * SERVER-ONLY · קורא ל-Gemini ⇒ עולה כסף.
 */
import { getGeminiClient, GeminiClientError } from '@/lib/ai/client';

export const RAG_EMBED_MODEL = process.env.GEMINI_MODEL_EMBEDDING_RAG ?? 'gemini-embedding-001';
export const RAG_EMBED_DIM = 1024; // מתיישר עם chunks.embedding = vector(1024)

type RagTaskType = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';

function l2normalize(v: number[]): number[] {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
}

/** מטמיע טקסטים (batch) ב-1024 מימדים, L2-normalized. */
export async function embedRag(texts: string[], taskType: RagTaskType): Promise<number[][]> {
  if (texts.length === 0) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const models = getGeminiClient().models as any;
  let res: { embeddings?: Array<{ values?: number[] }> };
  try {
    res = await models.embedContent({
      model: RAG_EMBED_MODEL,
      contents: texts,
      config: { outputDimensionality: RAG_EMBED_DIM, taskType },
    });
  } catch (err) {
    throw new GeminiClientError(`RAG embedContent failed (model=${RAG_EMBED_MODEL})`, err);
  }
  const vecs = (res.embeddings ?? []).map((e) => l2normalize(e.values ?? []));
  if (vecs.length !== texts.length) {
    throw new GeminiClientError(`RAG embed count mismatch: ${vecs.length}/${texts.length}`);
  }
  return vecs;
}

/** מטמיע שאילתה בודדת (RETRIEVAL_QUERY) → וקטור 1024. */
export async function embedRagQuery(text: string): Promise<number[]> {
  const [v] = await embedRag([text], 'RETRIEVAL_QUERY');
  if (!v) throw new GeminiClientError('RAG query embed returned no vector');
  return v;
}

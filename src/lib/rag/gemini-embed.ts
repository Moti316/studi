/**
 * src/lib/rag/gemini-embed.ts — EmbedFn פרודקשני מגובה-Gemini ל-RAG.
 *
 * ⚠️⚠️ **קוראת ל-Gemini ⇒ עולה כסף.** אינה נקראת בבדיקות ולא בזמן-import. מוזרקת
 * ל-`embedChunks` רק בריצת-embedding אמיתית, ורק לאחר אישור-מוטי (כלל אפס-כסף).
 *
 * ⚠️ **טעון-אימות לפני שימוש-ראשון:**
 *  1. חתימת-ה-SDK `models.embedContent` (@google/genai) — מאומתת-מבנית כאן דרך
 *     interface מינימלי; לאמת מול הגרסה בפועל לפני הרצה.
 *  2. בחירת-מודל + מימד: `text-embedding-004` (768) מול `gemini-embedding-001`
 *     (3072) — חייב להתיישר עם `chunks.embedding` (כיום `vector(1024)` של Voyage).
 *     נדרשת מיגרציה/החלטה (ראה embedder.ts). זו הסיבה ש-EmbedFn מוזרק ולא קשיח.
 *
 * SERVER-ONLY (משתמש ב-getGeminiClient שקורא process.env.GEMINI_API_KEY).
 */

import { getGeminiClient, GeminiClientError } from '@/lib/ai/client';
import type { EmbedFn } from './embedder';

/** מודל-ההטמעה. מ-env, עם fallback מתועד. */
export const EMBEDDING_MODEL_DEFAULT = process.env.GEMINI_MODEL_EMBEDDING ?? 'text-embedding-004';

/** מבנה-מינימלי לקריאת-ההטמעה (מבודד מ-type-churn של ה-SDK). */
interface EmbeddingsCapableModels {
  embedContent(args: {
    model: string;
    contents: string[];
  }): Promise<{ embeddings?: Array<{ values?: number[] }> }>;
}

/**
 * יוצר EmbedFn פרודקשני (Gemini). **קוראת ל-Gemini ⇒ עולה כסף בכל הפעלה.**
 * @param model מודל-הטמעה (ברירת-מחדל מ-env).
 */
export function createGeminiEmbedFn(model: string = EMBEDDING_MODEL_DEFAULT): EmbedFn {
  return async (texts: string[]): Promise<number[][]> => {
    if (texts.length === 0) return [];
    const models = getGeminiClient().models as unknown as EmbeddingsCapableModels;
    let res: { embeddings?: Array<{ values?: number[] }> };
    try {
      res = await models.embedContent({ model, contents: texts });
    } catch (err) {
      throw new GeminiClientError(`Gemini embedContent failed (model=${model})`, err);
    }
    const vectors = (res.embeddings ?? []).map((e) => e.values ?? []);
    if (vectors.length !== texts.length) {
      throw new GeminiClientError(
        `Gemini embedContent returned ${vectors.length} vectors for ${texts.length} inputs (model=${model}).`,
      );
    }
    return vectors;
  };
}

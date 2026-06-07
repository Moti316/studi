/**
 * src/lib/rag/deep-explanation-core.ts — ליבת "הסבר לעומק" מעוגן-חקיקה (RAG).
 *
 * משותפת לשני צרכנים:
 *  - ה-Server-Action (on-demand) — מריץ זאת חי.
 *  - סקריפט ה-precompute (offline) — מריץ פעם-אחת ושומר את התוצאה ב-questions.explanation,
 *    כך שה-runtime מציג מה-DB **ללא Gemini כלל** (הדרך לבטל את תלות-ה-Gemini בזמן-ריצה).
 *
 * זרימה: בנה-שאילתה (שאלה+תשובת-מודל) → embed → אחזר top-K chunks (pgvector cosine)
 * → Gemini מחבר הסבר מעוגן + ציטוט-מקור. כל קריאת-Gemini עטופה ב-withGeminiRetry.
 * SERVER-ONLY (db/Gemini).
 */
import { embedRagQuery } from './embed';
import { retrieveRelevantChunks } from './retrieval';
import { geminiGenerateText } from '../ai/client';
import { withGeminiRetry, type RetryOptions } from '../ai/retry';
import { DEEP_EXPLANATION_SYSTEM, buildDeepExplanationPrompt } from '../ai/prompts/deep-explanation';

export interface DeepExplanationResult {
  explanation: string;
  sources: Array<{ title: string; scopeIds: string[] }>;
}

export interface DeepExplanationInput {
  /** טקסט-השאלה. */
  prompt: string;
  /** תשובת-המודל (אם קיימת) — מחזקת את עיגון-ה-RAG. */
  correctAnswer?: string | null;
}

/** retry קצר לנתיב-אינטראקטיבי (UI · ≤~5s). */
const INTERACTIVE_RETRY: RetryOptions = { maxRetries: 3, baseMs: 700, capMs: 4_000 };

/**
 * מחבר הסבר-RAG מעוגן-חקיקה לשאלה. ניתן להזריק מדיניות-retry (offline = backoff ארוך).
 * זורק אם Gemini/אחזור נכשלים סופית (שגיאת-קבע · או מיצוי-retry על זמני).
 */
export async function buildDeepExplanation(
  input: DeepExplanationInput,
  retry: RetryOptions = INTERACTIVE_RETRY,
): Promise<DeepExplanationResult> {
  const queryText = [input.prompt, input.correctAnswer].filter(Boolean).join('\n');

  const queryEmbedding = await withGeminiRetry(() => embedRagQuery(queryText), retry);
  const chunks = await retrieveRelevantChunks(queryEmbedding, 5);
  const prompt = buildDeepExplanationPrompt({
    question: input.prompt,
    correctAnswer: input.correctAnswer ?? undefined,
    chunks,
  });
  const explanation = await withGeminiRetry(
    () => geminiGenerateText({ system: DEEP_EXPLANATION_SYSTEM, prompt }),
    retry,
  );

  // קיבוץ-מקורות לפי כותרת (ציטוט נקי) + scope-ids.
  const byTitle = new Map<string, Set<string>>();
  for (const c of chunks) {
    const set = byTitle.get(c.sourceTitle) ?? new Set<string>();
    for (const r of c.scopeRefs) if (r?.id) set.add(r.id);
    byTitle.set(c.sourceTitle, set);
  }
  const sources = [...byTitle.entries()].map(([title, ids]) => ({ title, scopeIds: [...ids] }));

  return { explanation, sources };
}

'use server';

/**
 * src/features/lesson-player/deep-explanation.action.ts — Server Action ל-"הסבר לעומק"
 * מעוגן-חקיקה (RAG). קולוקציה עם הנגן (LessonPlayer) שצורך אותה.
 *
 * זרימה: טען שאלה → הטמע שאילתה (gemini-embedding-001@1024) → אחזר top-K chunks
 * מקורפוס-החקיקה (pgvector cosine) → Gemini מחבר הסבר מעוגן + ציטוט-מקור.
 * SERVER-ONLY · קורא ל-Gemini ⇒ עולה כסף (on-demand, רק בלחיצת-המשתמש).
 */
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { embedRagQuery } from '@/lib/rag/embed';
import { retrieveRelevantChunks } from '@/lib/rag/retrieval';
import { geminiGenerateText } from '@/lib/ai/client';
import { withGeminiRetry } from '@/lib/ai/retry';
import {
  DEEP_EXPLANATION_SYSTEM,
  buildDeepExplanationPrompt,
} from '@/lib/ai/prompts/deep-explanation';

export interface DeepExplanationResult {
  explanation: string;
  sources: Array<{ title: string; scopeIds: string[] }>;
}

/**
 * מדיניות-retry לנתיב-אינטראקטיבי: backoff קצר (≤~5s סה"כ) כדי לרכוב על 503/429/רשת
 * זמניים מבלי להשאיר את המשתמש תקוע. שגיאות-קבע (מפתח-חסר) זורקות מיד.
 */
const INTERACTIVE_RETRY = { maxRetries: 3, baseMs: 700, capMs: 4_000 } as const;

export async function generateDeepExplanation(questionId: string): Promise<DeepExplanationResult> {
  const rows = await db.execute(
    sql`SELECT prompt, correct_answer, explanation FROM questions WHERE id = ${questionId} LIMIT 1`,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = (rows as any[])[0];
  if (!q) throw new Error('deep-explanation: question not found');

  const correctAnswer =
    deriveAnswerText(q.correct_answer) ??
    (typeof q.explanation === 'string' ? q.explanation : undefined);
  const queryText = [q.prompt, correctAnswer].filter(Boolean).join('\n');

  // עטוף ב-retry: Gemini מחזיר 503 ("high demand") / 429 / נפילות-רשת זמניות לעיתים
  // קרובות תחת-עומס; בלי-retry המשתמש רואה "לא ניתן להפיק הסבר". backoff קצר (אינטראקטיבי).
  const queryEmbedding = await withGeminiRetry(() => embedRagQuery(queryText), INTERACTIVE_RETRY);
  const chunks = await retrieveRelevantChunks(queryEmbedding, 5);
  const prompt = buildDeepExplanationPrompt({
    question: String(q.prompt),
    correctAnswer,
    chunks,
  });
  // ברירת-מחדל Flash (GEMINI_MODEL_CLASSIFICATION) — gemini-2.5-pro חסום ב-free-tier (limit 0).
  const explanation = await withGeminiRetry(
    () => geminiGenerateText({ system: DEEP_EXPLANATION_SYSTEM, prompt }),
    INTERACTIVE_RETRY,
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

/** מחלץ טקסט-תשובה מ-correct_answer (string / {text}). */
function deriveAnswerText(correctAnswer: unknown): string | undefined {
  if (!correctAnswer) return undefined;
  if (typeof correctAnswer === 'string') return correctAnswer;
  if (typeof correctAnswer === 'object') {
    const o = correctAnswer as Record<string, unknown>;
    if (typeof o.text === 'string') return o.text;
  }
  return undefined;
}

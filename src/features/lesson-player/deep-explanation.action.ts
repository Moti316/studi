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
import {
  DEEP_EXPLANATION_SYSTEM,
  buildDeepExplanationPrompt,
} from '@/lib/ai/prompts/deep-explanation';

export interface DeepExplanationResult {
  explanation: string;
  sources: Array<{ title: string; scopeIds: string[] }>;
}

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

  const queryEmbedding = await embedRagQuery(queryText);
  const chunks = await retrieveRelevantChunks(queryEmbedding, 5);
  const prompt = buildDeepExplanationPrompt({
    question: String(q.prompt),
    correctAnswer,
    chunks,
  });
  const explanation = await geminiGenerateText({
    system: DEEP_EXPLANATION_SYSTEM,
    prompt,
    model: process.env.GEMINI_MODEL_GENERATION,
  });

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

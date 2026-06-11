'use server';

/**
 * src/features/lesson-player/deep-explanation.action.ts — Server Action ל-"הסבר לעומק"
 * מעוגן-חקיקה (RAG). קולוקציה עם הנגן (LessonPlayer) שצורך אותה.
 *
 * טוען את השאלה מה-DB ומאציל ל-buildDeepExplanation (ליבת-ה-RAG המשותפת). ⚠️ קורא
 * ל-Gemini ⇒ עולה כסף. הערה: ה-UI עבר להציג הסבר **מוטמע-מראש** (questions.explanation)
 * שנוצר offline — לכן הנתיב הזה נשאר כ-fallback/תאימות, לא כמסלול-הראשי בזמן-ריצה.
 */
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { buildDeepExplanation, type DeepExplanationResult } from '@/lib/rag/deep-explanation-core';
import { getUser } from '@/lib/auth/server';

export type { DeepExplanationResult };

export async function generateDeepExplanation(questionId: string): Promise<DeepExplanationResult> {
  // שער-auth (cost-abuse · BUGS#system-bug-hunt · #11): נתיב יקר (Gemini embed+gen) →
  // fail-closed למשתמש-לא-מחובר. (ה-UI ממילא צורך הסבר-מוטמע-מראש; זהו fallback/תאימות.)
  const user = await getUser();
  if (!user) throw new Error('deep-explanation: unauthenticated');

  const rows = await db.execute(
    sql`SELECT prompt, correct_answer, explanation FROM questions WHERE id = ${questionId} LIMIT 1`,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = (rows as any[])[0];
  if (!q) throw new Error('deep-explanation: question not found');

  const correctAnswer =
    deriveAnswerText(q.correct_answer) ??
    (typeof q.explanation === 'string' ? q.explanation : undefined);

  return buildDeepExplanation({ prompt: String(q.prompt), correctAnswer });
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

/**
 * src/lib/ai/prompts/deep-explanation.ts — system + builder ל-"הסבר לעומק" מעוגן-מקורות.
 * עיקרון-יסוד: ההסבר נשען **אך ורק** על מקורות-החקיקה שאוחזרו (RAG) — לא על הזיכרון.
 */
import type { RetrievedChunk } from '@/lib/rag/retrieval';

export const DEEP_EXPLANATION_SYSTEM = [
  'אתה מורה-מומחה להכשרת "ממונה בטיחות בעבודה" בישראל.',
  'תפקידך: לכתוב הסבר-לעומק לשאלה, **מבוסס אך ורק על מקורות-החקיקה שסופקו לך למטה**.',
  'כללים מחייבים:',
  '- בסס כל טענה על המקורות בלבד. אל תמציא עובדות / מספרים / סעיפים שאינם במקורות.',
  '- צטט את התקנה / החוק הספציפי הרלוונטי (לפי כותרת-המקור). נוסח-ה-PDF הוא מקור-האמת.',
  '- אם המקורות אינם מכסים את השאלה — אמור זאת בכנות ואל תשלים מהזיכרון.',
  '- עברית תקנית, תמציתי וברור (2-5 משפטים). ללא הקדמות וללא חזרה על השאלה.',
].join('\n');

export function buildDeepExplanationPrompt(args: {
  question: string;
  correctAnswer?: string;
  chunks: RetrievedChunk[];
}): string {
  const sources = args.chunks
    .map((c, i) => `[מקור ${i + 1} · ${c.sourceTitle}]\n${c.text}`)
    .join('\n\n');
  return [
    `שאלה: ${args.question}`,
    args.correctAnswer ? `תשובה נכונה: ${args.correctAnswer}` : '',
    '',
    'מקורות-חקיקה (השתמש אך ורק בהם):',
    sources || '(לא נמצאו מקורות רלוונטיים)',
    '',
    'כתוב הסבר-לעומק מעוגן-מקורות, עם ציטוט התקנה / החוק הרלוונטי.',
  ]
    .filter(Boolean)
    .join('\n');
}

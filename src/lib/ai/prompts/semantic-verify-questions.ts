/**
 * src/lib/ai/prompts/semantic-verify-questions.ts — impl-Gemini ל-verifyFn של
 * אימות-שאלות סמנטי (Phase 1.3). מספק `geminiVerifyQuestion` שמוזרק ל-
 * `verifyQuestionsSemantically`. בודק את מה ש-G1–G3 לא בודקים: citation-fit ·
 * עברית · in-scope · קוהרנטיות.
 *
 * ⚠️ SERVER-ONLY (Gemini). נקרא מ-import-questions-nblm תחת --semantic.
 */
import { geminiGenerateJSON } from '@/lib/ai/client';
import { withGeminiRetry } from '@/lib/ai/retry';
import type { VerifyInput, QuestionVerdict } from '@/lib/import/semantic-verify-questions';

export const SEMANTIC_VERIFY_SYSTEM = [
  'אתה מבקר-תוכן עצמאי (oversight) של קורס "ממונה בטיחות בעבודה" (עברית · ישראל).',
  'תפקידך: לאמת שאלה שנוצרה אוטומטית מנוסח-חקיקה, מעבר לעיגון-המילולי שכבר נבדק.',
  'בדוק 4 קריטריונים (היה קפדן · ברירת-מחדל pass=false אם ספק-אמיתי):',
  '1. citation-fit: האם ה-scope/התקנה-המצוטטת הם הסמכות הנכונה לנושא-השאלה? (תקנה-מהתחום-הלא-נכון = הזיה-משפטית).',
  '2. עברית: ניסוח תקין, ללא typos/אותיות-משובשות.',
  '3. in-scope: בתוך תכנית-הקורס · ללא רפורמות תשפ"ה-2025 (טרם-בתוקף).',
  '4. קוהרנטיות: השאלה+התשובה נכונות, ברורות ועונות לנושא (matching: כל זוג מונח↔הגדרה נכון).',
  'החזר JSON: {"pass": boolean, "reasons": [נימוקים קצרים · ריק אם pass=true]}.',
].join('\n');

export const SEMANTIC_VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    reasons: { type: 'array', items: { type: 'string' } },
  },
  required: ['pass', 'reasons'],
} as const;

/** בונה את ה-prompt לאימות-שאלה בודדת. */
export function buildVerifyQuestionPrompt(input: VerifyInput): string {
  return [
    `סוג: ${input.type} · scope: ${input.scopeId}`,
    `שאלה: ${input.prompt}`,
    `תוכן (מסיחים/תשובה/מקור): ${input.detail}`,
    'אמת לפי 4 הקריטריונים והחזר את ה-verdict.',
  ].join('\n');
}

/**
 * verifyFn חי: שולח את השאלה ל-Gemini (עם retry על שגיאות-זמניות) ומחזיר verdict.
 * כשל-קבע/JSON-פסול זורק (ה-orchestrator יתפוס → held).
 */
export async function geminiVerifyQuestion(input: VerifyInput): Promise<QuestionVerdict> {
  const res = await withGeminiRetry(
    () =>
      geminiGenerateJSON<{ pass: boolean; reasons: string[] }>({
        system: SEMANTIC_VERIFY_SYSTEM,
        prompt: buildVerifyQuestionPrompt(input),
        schema: SEMANTIC_VERDICT_SCHEMA,
      }),
    { maxRetries: 4, baseMs: 1_000, capMs: 20_000 },
  );
  return {
    pass: res.pass === true,
    reasons: Array.isArray(res.reasons) ? res.reasons.map((r) => String(r)) : [],
  };
}

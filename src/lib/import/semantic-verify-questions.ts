/**
 * src/lib/import/semantic-verify-questions.ts — שלב-אימות-סמנטי קבוע לשאלות שנוצרו
 * ע"י AI, **לפני** כתיבה ל-DB. G1–G3 מאמתים שהציטוט verbatim — אך **לא** שהתקנה
 * נכונה-לנושא, שהעברית תקינה, או שהתוכן in-scope. ראה זיכרון
 * grounding-verifies-quote-not-citation-fit.
 *
 * אורקסטרציה **טהורה** — ה-`verifyFn` (קריאת-Gemini או Workflow) מוזרק → בר-בדיקה
 * ביחידה בלי AI. שאלה שנכשלת = **held** (לא-נכתבת · מדווחת). כשל-verifyFn (רשת) →
 * held שמרני (לא לפרסם לא-מאומת).
 */
import type { NewQuestion } from '../../../drizzle/schema';

/** קלט-אימות מנורמל (ניתוק מ-NewQuestion · קל לבדיקה). */
export interface VerifyInput {
  type: string;
  prompt: string;
  scopeId: string;
  /** סיכום-תוכן לאימות: מסיחים/תשובה/זוגות/ציטוט. */
  detail: string;
}

export interface QuestionVerdict {
  pass: boolean;
  reasons: string[];
}

/** פונקציית-האימות המוזרקת (חי = Gemini · טסט = fake). */
export type QuestionVerifyFn = (input: VerifyInput) => Promise<QuestionVerdict>;

export interface HeldQuestion {
  row: NewQuestion;
  reasons: string[];
}

export interface SemanticVerifyResult {
  passed: NewQuestion[];
  held: HeldQuestion[];
}

/** בונה קלט-אימות מנורמל מ-NewQuestion. */
export function toVerifyInput(row: NewQuestion): VerifyInput {
  const scopeId =
    Array.isArray(row.scopeRefs) && row.scopeRefs[0] ? String(row.scopeRefs[0].id) : '';
  let detail = '';
  if (Array.isArray(row.options)) detail = JSON.stringify(row.options);
  if (row.correctAnswer) detail += ` | answer: ${JSON.stringify(row.correctAnswer)}`;
  if (row.explanation) detail += ` | ${String(row.explanation)}`;
  return { type: String(row.type), prompt: String(row.prompt), scopeId, detail: detail.trim() };
}

/**
 * מאמת-סמנטית רשימת-שאלות **ברצף** (ידידותי-ל-rate-limit · ה-verifyFn מטפל ב-retry).
 * מחזיר passed (לכתיבה) ו-held (עם נימוקים · לדו"ח). כשל-verifyFn → held.
 */
export async function verifyQuestionsSemantically(
  rows: NewQuestion[],
  verifyFn: QuestionVerifyFn,
): Promise<SemanticVerifyResult> {
  const passed: NewQuestion[] = [];
  const held: HeldQuestion[] = [];

  for (const row of rows) {
    let verdict: QuestionVerdict;
    try {
      verdict = await verifyFn(toVerifyInput(row));
    } catch (err) {
      held.push({
        row,
        reasons: [`verify-error: ${err instanceof Error ? err.message : String(err)}`],
      });
      continue;
    }
    if (verdict.pass) passed.push(row);
    else
      held.push({
        row,
        reasons: verdict.reasons.length > 0 ? verdict.reasons : ['failed-semantic'],
      });
  }

  return { passed, held };
}

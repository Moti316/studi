/**
 * src/lib/notebooklm/compact-question-prompt.ts — בניית prompt קצר פר-נוסח-חקיקה
 * לייצור שאלות רב-סוגיות דרך NotebookLM (מיני-קורס שו"ת).
 *
 * נועד לעבוד בגבול-האורך של NotebookLM-chat (~800 תווים תקינים) → prompt פר-(נוסח,סוג).
 * המקורות מעוגנים-במחברת; כל פריט חייב `sourceQuote` **מילולי** מהנוסח (שער-G3).
 *
 * סוגים:
 *   mcq      → אמריקאית: {questions:[{prompt,options[4],correctIndex,explanation,sourceQuote,citation}]}
 *   matching → התאמה מונח↔הגדרה: {pairs:[{term,definition,sourceQuote,citation}]}
 *   open     → שו"ת-פתוח: {qas:[{prompt,answer,sourceQuote,citation}]}
 *
 * טהור לחלוטין — ללא IO/DB.
 */
import type { StatuteSource } from '@/lib/import/generated-mcq';

export type QuestionType = 'mcq' | 'matching' | 'open';

export interface CompactQuestionOptions {
  type: QuestionType;
  /** כמה פריטים לייצר (mcq/open=שאלות · matching=זוגות). */
  n: number;
}

/** הוראת-פלט פר-סוג (חוזה-JSON · flat · ללא fences). */
function shapeLine(type: QuestionType, n: number): string {
  switch (type) {
    case 'mcq':
      return `החזר JSON: {"questions":[ ${n}× {"prompt":"שאלה","options":["א","ב","ג","ד"],"correctIndex":0,"explanation":"נימוק","sourceQuote":"ציטוט-מילולי-מהנוסח","citation":"תקנה/סעיף"} ]}`;
    case 'matching':
      return `החזר JSON: {"pairs":[ ${n}× {"term":"מונח מהנוסח","definition":"הגדרתו המדויקת","sourceQuote":"ציטוט-מילולי-מהנוסח","citation":"תקנה/סעיף"} ]}`;
    case 'open':
      return `החזר JSON: {"qas":[ ${n}× {"prompt":"שאלה פתוחה","answer":"תשובת-מודל","sourceQuote":"ציטוט-מילולי-מהנוסח","citation":"תקנה/סעיף"} ]}`;
  }
}

/**
 * בונה prompt עברי קצר לייצור `n` שאלות מסוג `type` מנוסח-חקיקה בודד.
 * מורה ל-NotebookLM להחזיר JSON flat (ללא fences) עם ציטוט-מילולי-מהנוסח לכל פריט.
 */
export function buildCompactQuestionPrompt(
  statute: StatuteSource,
  opts: CompactQuestionOptions,
): string {
  const n = Math.max(1, Math.floor(opts.n));
  const lines: string[] = [
    `בהתבסס אך-ורק על נוסח-החוק "${statute.title}" (scope ${statute.scopeId}) שבמחברת,`,
    `צור ${n} פריטי-לימוד מסוג ${opts.type}. ענה ב-JSON בלבד (ללא fences).`,
    shapeLine(opts.type, n),
    'sourceQuote = רצף-מילים אחד ורצוף **בדיוק** מהנוסח (לא לפרפז · לא "..." · לא לדלג מילים).',
    'citation = התקנה/הסעיף הספציפי המסמיך. אל תמציא תוכן שאינו בנוסח.',
  ];
  return lines.join('\n');
}

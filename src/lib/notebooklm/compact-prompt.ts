/**
 * src/lib/notebooklm/compact-prompt.ts — בניית prompt קצר פר-תרחיש ל-NotebookLM.
 *
 * נועד לעבוד בגבול-האורך של NotebookLM (~800 תווים תקינים).
 * ה-prompt לא מטמיע סכמה מלאה — המקורות מעוגנים-במחברת.
 * הפלט הצפוי: JSON flat (ללא fences):
 *   { title, immediateAction, legalBackup, legalCitation:{scopeId,quote,section}, engineeringMgmt }
 *
 * טהור לחלוטין — ללא IO, ללא DB.
 */

/** קלט מינימלי לתרחיש-בודד. */
export interface CompactScenarioInput {
  title: string;
  background: string;
  task: string;
}

/**
 * בונה prompt עברי קצר (~600-900 תווים) לתרחיש-בודד.
 * מורה ל-NotebookLM להחזיר JSON flat ללא code fences.
 *
 * @param s תרחיש-בודד (title, background, task).
 * @returns מחרוזת-prompt מוכנה לכתיבה לקובץ-זמני ושליחה ל-CLI.
 */
export function buildCompactScenarioPrompt(s: CompactScenarioInput): string {
  const lines: string[] = [
    'בהתבסס אך-ורק על מסמכי-המחברת, הרחב את התרחיש לפתרון 3-חלקים.',
    'ענה ב-JSON בלבד (ללא fences) בפורמט:',
    '{title, immediateAction, legalBackup, legalCitation:{scopeId,quote,section}, engineeringMgmt}',
    'ה-legalBackup חייב ציטוט-מילולי מהנוסח + תקנה/סעיף.',
    'אל תמציא תקנות שאינן במסמכי-המחברת.',
    '',
    `תרחיש: ${s.title}`,
    `רקע: ${s.background}`,
    `משימה: ${s.task}`,
  ];
  return lines.join('\n');
}

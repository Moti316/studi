/**
 * src/lib/notebooklm/compact-prompt.ts — בניית prompt קצר פר-תרחיש ל-NotebookLM.
 *
 * נועד לעבוד בגבול-האורך של NotebookLM (~800 תווים תקינים).
 * ה-prompt לא מטמיע סכמה מלאה — המקורות מעוגנים-במחברת.
 * הפלט הצפוי: JSON flat (ללא fences) — 4 שדות-תוכן:
 *   { title, immediateAction, controlsHierarchy, legalBackup,
 *     legalCitation:{scopeId,quote,section}, managerialAction }
 *
 * (א) פעולה מיידית בשטח      → immediateAction
 * (ב) שימוש במדרג-הבקרות     → controlsHierarchy
 * (ג) גיבוי-חוקי מובהק       → legalBackup + legalCitation
 * (ד) פעולה ניהולית-מתקנת     → managerialAction
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
 * בונה prompt עברי קצר (<1000 תווים) לתרחיש-בודד.
 * מורה ל-NotebookLM להחזיר JSON flat ללא code fences — 4 שדות-תוכן.
 *
 * @param s תרחיש-בודד (title, background, task).
 * @returns מחרוזת-prompt מוכנה לכתיבה לקובץ-זמני ושליחה ל-CLI.
 */
export function buildCompactScenarioPrompt(s: CompactScenarioInput): string {
  const lines: string[] = [
    'בהתבסס אך-ורק על מסמכי-המחברת, הרחב את התרחיש לפתרון 4-חלקים.',
    'ענה ב-JSON בלבד (ללא fences) בפורמט:',
    '{title, immediateAction, controlsHierarchy, legalBackup, legalCitation:{scopeId,quote,section}, managerialAction}',
    'immediateAction=פעולה מיידית בשטח.',
    'controlsHierarchy=מדרג-הבקרות לפי-סדר: סילוק/החלפה→הנדסי→מנהלי, וצמ"א תמיד **אחרון** (מוצא-אחרון · קולקטיבי לפני אישי). חריג: בעבודה-בגובה מערכת-מניעת-נפילה/רתמה נדרשת-בחוק (לא נדחית).',
    'legalBackup=גיבוי חוקי עם ציטוט-מילולי+תקנה/סעיף. managerialAction=פעולה ניהולית לטווח-ארוך.',
    'legalCitation.quote=העתק רצף-מילים אחד ורצוף **בדיוק** מנוסח-המחברת — בלי "...", בלי לדלג מילים, בלי לשנות פיסוק. אם אינך בטוח שהוא מילולי, קצר לקטע-רצוף קצר שאתה בטוח בו.',
    'אל תמציא תקנות שאינן במסמכי-המחברת.',
    '',
    `תרחיש: ${s.title}`,
    `רקע: ${s.background}`,
    `משימה: ${s.task}`,
  ];
  return lines.join('\n');
}

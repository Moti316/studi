/**
 * src/lib/notebooklm/extract-json.ts — primitives משותפים לחילוץ JSON מפלט-CLI של
 * NotebookLM. נחלצו מ-`adapt-flat.ts` כדי לשמש גם את צינור-התרחישים וגם את
 * צינור-השאלות (`adapt-flat-questions.ts`) — אפס-שכפול.
 *
 * טהור לחלוטין (ללא IO/DB). הפלט-הגולמי של NotebookLM-chat מגיע כטקסט בין
 * "Answer:" ל-"Resumed conversation:" ועשוי לשאת מרכאות-תוכן לא-escaped (עברית-
 * משפטית) ותווי-בקרה-ממש — שני אלה מטופלים כאן.
 */
import { stripJsonFences } from '@/lib/notebooklm/parse-output';

/**
 * מנקה תווי-בקרה-ממש (קוד < 0x20) ומחליפם ברווח. LLM מחזיר לעתים מחרוזות רב-שורתיות
 * עם שורה-חדשה-ממש בתוך הערך — לא-חוקי ב-JSON. רצף-escaped `\n` (backslash+n) הוא שני
 * תווי-ASCII רגילים ואינו נפגע; רק בייטי-בקרה-ממש מומרים.
 */
export function sanitizeControlChars(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    out += s.charCodeAt(i) < 0x20 ? ' ' : s[i];
  }
  return out;
}

/** האם התו הוא whitespace (ללא regex בלולאה החמה). */
function isWs(ch: string | undefined): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}

/**
 * repairJsonQuotes — מבריח מרכאות-תוכן לא-escaped בתוך ערכי-מחרוזת.
 *
 * מודלים מחזירים לעתים `"...בעל רישיון "חשמלאי" מוסמך..."` — המרכאות הפנימיות סוגרות
 * את המחרוזת מוקדם ושוברות JSON.parse. מודע-הקשר: מחרוזת-מפתח נסגרת על `"` שאחריו
 * `:`, מחרוזת-ערך נסגרת על `"` שאחריו `, } ]` (או סוף). מרכאה לא-מבנית בערך → \".
 * היוריסטי · מנוסה רק כ-fallback אחרי כשל-parse.
 */
export function repairJsonQuotes(s: string): string {
  let out = '';
  let inStr = false;
  let isKey = false;
  let expectKey = true;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (ch === '\\') {
        out += ch + (s[i + 1] ?? '');
        i++;
        continue;
      }
      if (ch === '"') {
        let j = i + 1;
        while (j < s.length && isWs(s[j])) j++;
        const next = s[j];
        const structural = isKey
          ? next === ':'
          : next === ',' || next === '}' || next === ']' || next === undefined;
        if (structural) {
          inStr = false;
          out += ch;
        } else {
          out += '\\"';
        }
        continue;
      }
      out += ch;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      isKey = expectKey;
      out += ch;
      continue;
    }
    if (ch === ':') expectKey = false;
    else if (ch === ',' || ch === '{') expectKey = true;
    else if (ch === '[') expectKey = false;
    out += ch;
  }
  return out;
}

/**
 * מחלץ בלוק JSON מאוזן ראשון (מסוגריים {}) מתוך מחרוזת. מחזיר null אם אין בלוק מאוזן.
 * (לא מתחשב בסוגריים בתוך מחרוזות — מספיק ל-schema-השטוח של NotebookLM.)
 */
export function extractBalancedJson(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * מצמיד את אזור-התשובה (בין "Answer:" ל-"Resumed conversation:" · או עד-סוף) ומחלץ
 * את בלוק-ה-JSON המאוזן הראשון. מחזיר null אם אין בלוק.
 */
export function extractJsonBlock(stdout: string): string | null {
  const afterAnswer = stdout.indexOf('Answer:');
  const segment = afterAnswer !== -1 ? stdout.slice(afterAnswer + 'Answer:'.length) : stdout;
  const resumedIdx = segment.indexOf('Resumed conversation:');
  const searchIn = resumedIdx !== -1 ? segment.slice(0, resumedIdx) : segment;
  return extractBalancedJson(searchIn);
}

/**
 * parse עמיד: מנקה fences+תווי-בקרה → JSON.parse; בכשל → repairJsonQuotes → JSON.parse.
 * @throws Error אם שני הניסיונות נכשלו.
 */
export function parseJsonWithRepair(jsonBlock: string): unknown {
  const cleaned = sanitizeControlChars(stripJsonFences(jsonBlock));
  try {
    return JSON.parse(cleaned);
  } catch (firstErr) {
    try {
      return JSON.parse(repairJsonQuotes(cleaned));
    } catch {
      throw new Error(
        `extract-json: JSON.parse נכשל (גם אחרי repair) — ${firstErr instanceof Error ? firstErr.message : String(firstErr)}. קטע: ${cleaned.slice(0, 200)}`,
      );
    }
  }
}

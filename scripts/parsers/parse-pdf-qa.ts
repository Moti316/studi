/**
 * parse-pdf-qa.ts
 *
 * קורא PDF של מצגת-שו"ת (PowerPoint→PDF · למשל "מאגר שאלות הכנה לוועדה") ומחזיר
 * זוגות שאלה+תשובת-מודל פתוחה (open Q&A · ללא מסיחים). דטרמיניסטי — **אפס Gemini**.
 *
 * מבנה-המקור (כפי ש-pdf-parse מחלץ אותו, בסדר-לוגי תקין — לא הפוך):
 *
 *   -- N of TOTAL --        ← מפריד-שקופית (גבול-עמוד מ-pdf-parse)
 *   שאלה  N  :              ← מרקר-שאלה (טאבים בין הרכיבים)
 *   <טקסט השאלה, ייתכן רב-שורתי, מסתיים ב-?>
 *   מבדק סיכום              ← מפריד שאלה↔תשובה (כותרת-השקופית)
 *   <טקסט התשובה, ייתכן רב-שורתי>
 *
 * שקופיות ללא מרקר-"שאלה" (כותרת/פתיח) מדולגות. ה-answer נשמר ב-correctAnswerText
 * (→ correct_answer:{text} ב-DB דרך mapQuestion · type 'open' → 'explanation').
 *
 * Usage:
 *   pnpm tsx scripts/parsers/parse-pdf-qa.ts path/to/file.pdf > output.json
 */

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { PDFParse } from 'pdf-parse';
import type { ParsedQuestion, ParseResult } from './types.js';

/** מפריד-שקופית של pdf-parse: "-- 12 of 570 --". */
const SLIDE_SEP = /-- \d+ of \d+ --/g;
/** מרקר-שאלה: "שאלה <מס'> :" (טאבים/רווחים בין הרכיבים). */
const Q_MARKER = /שאלה\s*(\d+)\s*:/;
/**
 * שורות-רעש להשמטה: כותרת-השקופית "מבדק סיכום" (אינה מפריד אמין — מיקומה בזרם-הטקסט
 * משתנה לפי ייצוא-ה-PPT, לעיתים אחרי-התשובה) + פתיח-המצגת + שורות-זכויות.
 */
const NOISE_LINE =
  /^(?:מבדק סיכום|מצגת של PowerPoint|שאלות חזרה לממוני בטיחות|מתוך ועדות הסמכה|ב- ?\d+ שנים האחרונות|מאת:.*|©.*|כל הזכויות שמורות.*)$/u;

/** תיקון-פיסוק: pdf-parse עוטף סימני-פיסוק ברווחים/טאבים → ריווח עברי תקין. */
function tidyPunct(s: string): string {
  return s
    .replace(/\s+([?!.,;:)"])/g, '$1') // רווח לפני סוגר/פיסוק → הצמד
    .replace(/([("])\s+/g, '$1') // רווח אחרי פותח → הצמד
    .replace(/ {2,}/g, ' ')
    .trim();
}

/** ניקוי קטע-טקסט: טאבים→רווח, צמצום-רווחים, השמטת שורות-ריקות/רעש, trim. */
function cleanText(s: string): string {
  return s
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim())
    .filter((l) => l.length > 0 && !NOISE_LINE.test(l))
    .join('\n')
    .trim();
}

/** האם הטקסט נושא לפחות תו-עברי אחד (סינון שקופיות-רעש לא-עבריות). */
function hasHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}

/**
 * parsePdfQaFromText — לוגיקת-ה-parsing הטהורה (ללא I/O · בר-בדיקה ביחידה).
 * מפצל לשקופיות, ובכל שקופית עם מרקר-"שאלה": חוצה שאלה↔תשובה לפי "מבדק סיכום"
 * (ובהיעדרו — לפי ה-"?" הראשון). מדלג על שקופית ללא-שאלה או ללא-תשובה.
 */
export function parsePdfQaFromText(text: string, sourceBase: string): ParseResult {
  const blocks = text.split(SLIDE_SEP);
  const questions: ParsedQuestion[] = [];

  for (const block of blocks) {
    const m = Q_MARKER.exec(block);
    if (!m) continue; // שקופית-כותרת/פתיח — אין שאלה.
    const num = m[1] ?? String(questions.length + 1);

    // גוף-השקופית אחרי מרקר-השאלה, מנוקה מרעש (כולל כותרת "מבדק סיכום").
    const body = cleanText(block.slice(m.index + m[0].length));

    // חצייה שאלה↔תשובה לפי ה-"?" הראשון — אמין יותר מכותרת-השקופית (שמיקומה משתנה).
    const qEnd = body.indexOf('?');
    if (qEnd === -1) continue; // אין סימן-שאלה → גבול לא-ברור, דלג.
    // שאלה = שורה-אחת (איחוד שבירות-שורה אמצע-משפט); תשובה = שמירת מבנה-שורות.
    const question = tidyPunct(body.slice(0, qEnd + 1).replace(/\n+/g, ' '));
    const answer = body
      .slice(qEnd + 1)
      .split(/\n/)
      .map((l) => tidyPunct(l))
      .filter(Boolean)
      .join('\n')
      .trim();
    if (!question || !answer || !hasHebrew(question)) continue;

    questions.push({
      sourceId: `${sourceBase}#q${num}`,
      type: 'open',
      question,
      correctAnswerText: answer,
      scopeRefs: [],
      rawText: cleanText(block),
    });
  }

  return { source: sourceBase, totalQuestions: questions.length, questions };
}

export async function parsePdfQa(filePath: string): Promise<ParseResult> {
  const sourceBase = basename(filePath);
  process.stderr.write(`[parse-pdf-qa] קורא: ${filePath}\n`);

  const rawBuffer = readFileSync(filePath);
  let fullText: string;
  try {
    const parser = new PDFParse({ data: new Uint8Array(rawBuffer) });
    const result = await parser.getText();
    fullText = result.text;
    process.stderr.write(`[parse-pdf-qa] חולצו ${result.total} עמודים\n`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`שגיאה בפענוח PDF: ${msg}`);
  }

  if (!fullText || fullText.trim().length === 0) {
    process.stderr.write('[parse-pdf-qa] אזהרה: לא חולץ טקסט (PDF סריק?)\n');
    return { source: filePath, totalQuestions: 0, questions: [] };
  }

  const inner = parsePdfQaFromText(fullText, sourceBase);
  return { ...inner, source: filePath };
}

// --- CLI entry-point ---
if (process.argv[1]?.endsWith('parse-pdf-qa.ts') || process.argv[1]?.endsWith('parse-pdf-qa')) {
  const filePath = process.argv[2];
  if (!filePath) {
    process.stderr.write('שימוש: pnpm tsx scripts/parsers/parse-pdf-qa.ts <path-to-file.pdf>\n');
    process.exit(1);
  }
  parsePdfQa(filePath)
    .then((result) => process.stdout.write(JSON.stringify(result, null, 2) + '\n'))
    .catch((err: unknown) => {
      process.stderr.write(`[parse-pdf-qa] שגיאה: ${err instanceof Error ? err.message : err}\n`);
      process.exit(1);
    });
}

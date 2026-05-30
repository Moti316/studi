/**
 * parse-pdf-mcq.ts
 *
 * קורא PDF של מאגר MCQ (אייל פלטק וכו'), מזהה שאלות עם 4 אופציות ותשובה נכונה.
 *
 * פורמטים נתמכים ב-PDF:
 *
 * 1. MCQ קלאסי עם ממספור ישיר:
 *    1. מהי...?
 *    א. אפשרות א
 *    ב. אפשרות ב
 *    ג. אפשרות ג
 *    ד. אפשרות ד
 *    תשובה: ב
 *
 * 2. MCQ עם סוגריים:
 *    1) שאלה...
 *    (א) אפשרות...
 *
 * 3. PDF ללא שכבת-text (סריק) — מוחזרת אזהרה, questions=[].
 *
 * Usage:
 *   pnpm tsx scripts/parsers/parse-pdf-mcq.ts path/to/file.pdf > output.json
 *
 * stdout: JSON (ParseResult)
 * stderr: progress + errors
 */

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { PDFParse } from 'pdf-parse';
import type { ParsedQuestion, ParseResult, QuestionType } from './types.js';

// --- Regex patterns ---

// שורת שאלה ממוספרת: "1." | "1)" | "שאלה 1."
const Q_LINE = /^(?:שאלה\s*)?(\d+)[.)]\s+(.+)$/u;

// אפשרות MCQ עברית: "א." | "א)" | "(א)"
const OPT_HEB = /^[(\s]*([אבגד])[.)]\s*(.+)$/u;
// אפשרות MCQ מספרית: "1." | "1)"
const OPT_NUM = /^[(\s]*([1-4])[.)]\s*(.+)$/u;

// שורת תשובה — \b לא עובד עם עברית ב-JS Unicode; מוסיפים end-of-string או space
const ANS_LINE = /^(?:תשובה\s*(?:נכונה)?|תשובה\s*:)\s*[:‒–-]?\s*([אבגד1-4])(?:\s|$)/iu;

// מיפוי אות עברית → אינדקס 0-based
const HEB_IDX: Record<string, number> = { א: 0, ב: 1, ג: 2, ד: 3 };

type ParsedOption = { index: number; text: string };

function resolveOptionIndex(raw: string): number | undefined {
  const t = raw.trim();
  if (t in HEB_IDX) return HEB_IDX[t];
  const n = parseInt(t, 10);
  if (!isNaN(n) && n >= 1 && n <= 4) return n - 1;
  return undefined;
}

function classifyType(question: string): QuestionType {
  return question.length > 120 ? 'mcq_long' : 'mcq_short';
}

// ניקוי שורות: מסיר מספרי-עמוד, שורות ריקות
function cleanLines(raw: string): string[] {
  return (
    raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      // מסנן שורות שהן רק מספרים (מספרי עמוד)
      .filter((l) => !/^\d+$/.test(l))
  );
}

interface QuestionDraft {
  num: number;
  questionText: string;
  rawLines: string[];
  options: ParsedOption[];
  correctIndex?: number;
  correctAnswerText?: string;
}

/**
 * finite-state machine:
 *   IDLE → IN_QUESTION → IN_OPTIONS → IDLE
 */
type State = 'IDLE' | 'IN_QUESTION' | 'IN_OPTIONS';

function extractQuestions(lines: string[]): QuestionDraft[] {
  const drafts: QuestionDraft[] = [];
  let state: State = 'IDLE';
  let current: QuestionDraft | null = null;

  const flush = (): void => {
    if (current !== null) {
      drafts.push(current);
      current = null;
    }
  };

  for (const line of lines) {
    const qMatch = Q_LINE.exec(line);
    if (qMatch) {
      flush();
      const num = parseInt(qMatch[1] ?? '0', 10);
      current = {
        num,
        questionText: qMatch[2] ?? line,
        rawLines: [line],
        options: [],
      };
      state = 'IN_QUESTION';
      continue;
    }

    if (state === 'IDLE' || current === null) continue;

    current.rawLines.push(line);

    const optMatch = OPT_HEB.exec(line) ?? OPT_NUM.exec(line);
    if (optMatch) {
      const letter = optMatch[1] ?? '';
      const text = optMatch[2]?.trim() ?? line;
      const idx = resolveOptionIndex(letter);
      if (idx !== undefined) {
        current.options.push({ index: idx, text });
        state = 'IN_OPTIONS';
      }
      continue;
    }

    const ansMatch = ANS_LINE.exec(line);
    if (ansMatch) {
      const raw = ansMatch[1] ?? '';
      current.correctIndex = resolveOptionIndex(raw);
      continue;
    }

    // המשך שאלה (שאלה ב-2 שורות)
    if (state === 'IN_QUESTION') {
      current.questionText += ' ' + line;
    }
  }

  flush();
  return drafts;
}

function draftToQuestion(draft: QuestionDraft, sourceBase: string): ParsedQuestion {
  const options = draft.options.sort((a, b) => a.index - b.index).map((o) => o.text);

  const type = classifyType(draft.questionText);

  const q: ParsedQuestion = {
    sourceId: `${sourceBase}#q${draft.num}`,
    type,
    question: draft.questionText,
    scopeRefs: [],
    rawText: draft.rawLines.join('\n'),
  };

  if (options.length > 0) {
    q.options = options;
  }
  if (draft.correctIndex !== undefined) {
    q.correctIndex = draft.correctIndex;
  }
  if (draft.correctAnswerText) {
    q.correctAnswerText = draft.correctAnswerText;
  }

  return q;
}

/**
 * parsePdfMcqFromText — בדיקת לוגיקת-parsing ללא I/O.
 * @internal נחשף לצורך בדיקות יחידה בלבד.
 */
export function parsePdfMcqFromText(text: string, sourceBase: string): ParseResult {
  const lines = cleanLines(text);
  const drafts = extractQuestions(lines);
  const questions = drafts.map((d) => draftToQuestion(d, sourceBase));
  return { source: sourceBase, totalQuestions: questions.length, questions };
}

export async function parsePdfMcq(filePath: string): Promise<ParseResult> {
  const sourceBase = basename(filePath);
  process.stderr.write(`[parse-pdf-mcq] קורא: ${filePath}\n`);

  let rawBuffer: Buffer;
  try {
    rawBuffer = readFileSync(filePath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`לא ניתן לקרוא קובץ: ${filePath} — ${msg}`);
  }

  let fullText: string;
  try {
    const data = new Uint8Array(rawBuffer);
    const parser = new PDFParse({ data });
    const result = await parser.getText();
    fullText = result.text;
    process.stderr.write(`[parse-pdf-mcq] חולצו ${result.total} עמודים\n`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`שגיאה בפענוח PDF: ${msg}`);
  }

  if (!fullText || fullText.trim().length === 0) {
    process.stderr.write(
      '[parse-pdf-mcq] אזהרה: לא חולץ טקסט — ייתכן שה-PDF הוא סריק ללא text-layer\n',
    );
    return { source: filePath, totalQuestions: 0, questions: [] };
  }

  const inner = parsePdfMcqFromText(fullText, sourceBase);
  // החזר filePath המלא ב-source (לא רק basename)
  return { ...inner, source: filePath };
}

// --- CLI entry-point ---
if (process.argv[1]?.endsWith('parse-pdf-mcq.ts') || process.argv[1]?.endsWith('parse-pdf-mcq')) {
  const [, , filePath] = process.argv;

  if (!filePath) {
    process.stderr.write('שימוש: pnpm tsx scripts/parsers/parse-pdf-mcq.ts <path-to-file.pdf>\n');
    process.exit(1);
  }

  parsePdfMcq(filePath)
    .then((result) => {
      process.stdout.write(JSON.stringify(result, null, 2));
      process.stdout.write('\n');
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[parse-pdf-mcq] שגיאה: ${msg}\n`);
      process.exit(1);
    });
}

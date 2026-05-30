/**
 * parse-docx-qa.ts
 *
 * קורא קובץ DOCX של "לקט שאלות ותשובות" (Q&A format חופשי) ומחזיר JSON של שאלות.
 *
 * פורמטים נתמכים ב-DOCX:
 *
 * 1. שאלה/תשובה עם תוויות מפורשות:
 *    שאלה: מהי...?
 *    תשובה: ...
 *
 * 2. ממוספר:
 *    1. מהי...?
 *    תשובה: ...
 *
 * 3. MCQ עם אפשרויות (א/ב/ג/ד. או א). עד ד). ):
 *    מהי...?
 *    א. אפשרות אחת
 *    ב. אפשרות שנייה
 *    ג. אפשרות שלישית
 *    ד. אפשרות רביעית
 *    תשובה: א  (או: תשובה נכונה: ב)
 *
 * Usage:
 *   pnpm tsx scripts/parsers/parse-docx-qa.ts path/to/file.docx > output.json
 *
 * stdout: JSON (ParseResult)
 * stderr: progress + errors
 */

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import mammoth from 'mammoth';
import type { ParsedQuestion, ParseResult, QuestionType } from './types.js';

// אות עברית לאינדקס (0-based): א=0, ב=1, ג=2, ד=3
const HEB_LETTER_TO_INDEX: Record<string, number> = {
  א: 0,
  ב: 1,
  ג: 2,
  ד: 3,
};

// Regex לזיהוי שורת אפשרות MCQ: "א. טקסט" | "א) טקסט" | "(א) טקסט"
const OPTION_PATTERN = /^[(\s]*([אבגד])[.)]\s*(.+)$/u;

// Regex לזיהוי שורת תשובה
const ANSWER_PATTERN =
  /^(?:תשובה\s*(?:נכונה)?|תשובה\s*:)\s*[:‒–-]?\s*([אבגד1-4]|\d+)?[.):\s]*(.*)/iu;

// Regex לזיהוי שורת שאלה ממוספרת: "1." | "שאלה 1:" | "שאלה:"
const QUESTION_NUMBER_PATTERN = /^(?:שאלה\s*\d*\s*[:.]|\d+[.)]\s+)(.+)$/u;

// Regex לשאלה עם תווית מפורשת
const QUESTION_LABEL_PATTERN = /^שאלה\s*[:‒–-]\s*(.+)$/iu;

interface RawBlock {
  questionText: string;
  lines: string[];
}

function classifyType(question: string, hasOptions: boolean): QuestionType {
  if (!hasOptions) return 'open';
  return question.length > 120 ? 'mcq_long' : 'mcq_short';
}

function parseOptionLetter(raw: string): number | undefined {
  const trimmed = raw.trim();
  // אות עברית
  if (trimmed in HEB_LETTER_TO_INDEX) {
    return HEB_LETTER_TO_INDEX[trimmed];
  }
  // מספר (1-4) → 0-based
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num >= 1 && num <= 4) {
    return num - 1;
  }
  return undefined;
}

/**
 * מפצל את הטקסט הגולמי לבלוקי שאלה.
 * לוגיקה: כל שורה שנראית כ"שאלה חדשה" פותחת בלוק חדש.
 */
function splitIntoBlocks(lines: string[]): RawBlock[] {
  const blocks: RawBlock[] = [];
  let current: RawBlock | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isNewQuestion =
      QUESTION_LABEL_PATTERN.test(trimmed) ||
      QUESTION_NUMBER_PATTERN.test(trimmed) ||
      // שאלה שמסתיימת ב-? ואין לה תוויית-תשובה בשורה הקודמת
      (trimmed.endsWith('?') && !OPTION_PATTERN.test(trimmed) && !ANSWER_PATTERN.test(trimmed));

    if (isNewQuestion && current !== null) {
      blocks.push(current);
      current = null;
    }

    if (isNewQuestion || current === null) {
      const qMatch = QUESTION_LABEL_PATTERN.exec(trimmed) ?? QUESTION_NUMBER_PATTERN.exec(trimmed);
      const questionText = qMatch ? (qMatch[1] ?? trimmed) : trimmed;
      current = { questionText, lines: [] };
    } else {
      current.lines.push(trimmed);
    }
  }

  if (current !== null) {
    blocks.push(current);
  }

  return blocks;
}

function blockToQuestion(block: RawBlock, sourceBase: string, idx: number): ParsedQuestion {
  const options: string[] = [];
  let correctIndex: number | undefined;
  let correctAnswerText: string | undefined;
  const rawLines: string[] = [block.questionText, ...block.lines];

  for (const line of block.lines) {
    const optMatch = OPTION_PATTERN.exec(line);
    if (optMatch) {
      options.push(optMatch[2]?.trim() ?? line);
      continue;
    }

    const ansMatch = ANSWER_PATTERN.exec(line);
    if (ansMatch) {
      const letterOrNum = ansMatch[1]?.trim();
      const answerText = ansMatch[2]?.trim();
      if (letterOrNum) {
        correctIndex = parseOptionLetter(letterOrNum);
      }
      if (answerText) {
        correctAnswerText = answerText;
      }
    }
  }

  const hasOptions = options.length > 0;
  const type = classifyType(block.questionText, hasOptions);

  const question: ParsedQuestion = {
    sourceId: `${sourceBase}#q${idx + 1}`,
    type,
    question: block.questionText,
    scopeRefs: [],
    rawText: rawLines.join('\n'),
  };

  if (hasOptions) {
    question.options = options;
    if (correctIndex !== undefined) {
      question.correctIndex = correctIndex;
    }
  }

  if (correctAnswerText) {
    question.correctAnswerText = correctAnswerText;
  }

  return question;
}

/**
 * parseDocxQAFromText — בדיקת לוגיקת-parsing ללא I/O.
 * @internal נחשף לצורך בדיקות יחידה בלבד.
 */
export function parseDocxQAFromText(text: string, sourceBase: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const blocks = splitIntoBlocks(lines);
  const questions = blocks.map((block, idx) => blockToQuestion(block, sourceBase, idx));
  return { source: sourceBase, totalQuestions: questions.length, questions };
}

export async function parseDocxQA(filePath: string): Promise<ParseResult> {
  const sourceBase = basename(filePath);
  process.stderr.write(`[parse-docx-qa] קורא: ${filePath}\n`);

  let rawBuffer: Buffer;
  try {
    rawBuffer = readFileSync(filePath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`לא ניתן לקרוא קובץ: ${filePath} — ${msg}`);
  }

  let extractedText: string;
  try {
    const result = await mammoth.extractRawText({ buffer: rawBuffer });
    if (result.messages.length > 0) {
      for (const m of result.messages) {
        process.stderr.write(`[parse-docx-qa] אזהרת mammoth: ${m.message}\n`);
      }
    }
    extractedText = result.value;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`שגיאה בפענוח DOCX: ${msg}`);
  }

  const lines = extractedText.split(/\r?\n/);
  process.stderr.write(`[parse-docx-qa] נקראו ${lines.length} שורות\n`);

  const blocks = splitIntoBlocks(lines);
  process.stderr.write(`[parse-docx-qa] זוהו ${blocks.length} שאלות\n`);

  const questions = blocks.map((block, idx) => blockToQuestion(block, sourceBase, idx));

  return {
    source: filePath,
    totalQuestions: questions.length,
    questions,
  };
}

// --- CLI entry-point ---
if (process.argv[1]?.endsWith('parse-docx-qa.ts') || process.argv[1]?.endsWith('parse-docx-qa')) {
  const [, , filePath] = process.argv;

  if (!filePath) {
    process.stderr.write('שימוש: pnpm tsx scripts/parsers/parse-docx-qa.ts <path-to-file.docx>\n');
    process.exit(1);
  }

  parseDocxQA(filePath)
    .then((result) => {
      process.stdout.write(JSON.stringify(result, null, 2));
      process.stdout.write('\n');
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[parse-docx-qa] שגיאה: ${msg}\n`);
      process.exit(1);
    });
}

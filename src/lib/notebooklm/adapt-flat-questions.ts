/**
 * src/lib/notebooklm/adapt-flat-questions.ts — חילוץ פריטי-שאלה (r
 * רב-סוגיים) מפלט-CLI של NotebookLM. מקביל ל-`adapt-flat.ts` (תרחישים) אך
 * לשו"ת: mcq / matching / open. משתמש ב-primitives של `extract-json.ts`.
 *
 * "parse, don't validate" — פריט פסול מסונן (לא זורק על הבאץ' כולו), כדי
 * שכשל-פריט-בודד לא יפיל את שאר השאלות. טהור (ללא IO/DB).
 */
import { extractJsonBlock, parseJsonWithRepair } from '@/lib/notebooklm/extract-json';
import { isValidMcq, type GeneratedMCQ } from '@/lib/import/generated-mcq';

// ── טיפוסים ──────────────────────────────────────────────────────────────────

/** זוג מונח↔הגדרה כפי שמגיע מ-NotebookLM (לפני G3). */
export interface FlatMatchingPair {
  term: string;
  definition: string;
  sourceQuote: string;
  citation: string;
}

/** שו"ת-פתוח כפי שמגיע מ-NotebookLM (לפני G3). */
export interface FlatOpenQa {
  prompt: string;
  answer: string;
  sourceQuote: string;
  citation: string;
}

// ── עזרי-ולידציה ─────────────────────────────────────────────────────────────

function nonEmptyStr(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function pickArray(parsed: unknown, key: string): unknown[] {
  if (parsed === null || typeof parsed !== 'object') return [];
  const arr = (parsed as Record<string, unknown>)[key];
  return Array.isArray(arr) ? arr : [];
}

// ── חולצים פר-סוג ────────────────────────────────────────────────────────────

/** מחלץ מערך MCQ תקין מ-stdout (`{questions:[...]}`). פריט פסול מסונן. */
export function extractFlatMcqs(stdout: string): GeneratedMCQ[] {
  const block = extractJsonBlock(stdout);
  if (block === null) return [];
  const parsed = parseJsonWithRepair(block);
  return pickArray(parsed, 'questions').filter((q): q is GeneratedMCQ =>
    isValidMcq(q as GeneratedMCQ),
  );
}

/** מחלץ מערך זוגות-התאמה תקין מ-stdout (`{pairs:[...]}`). פריט פסול מסונן. */
export function extractFlatMatching(stdout: string): FlatMatchingPair[] {
  const block = extractJsonBlock(stdout);
  if (block === null) return [];
  const parsed = parseJsonWithRepair(block);
  return pickArray(parsed, 'pairs')
    .map((p) => p as Record<string, unknown>)
    .filter(
      (p) =>
        nonEmptyStr(p.term) &&
        nonEmptyStr(p.definition) &&
        nonEmptyStr(p.sourceQuote) &&
        nonEmptyStr(p.citation),
    )
    .map((p) => ({
      term: (p.term as string).trim(),
      definition: (p.definition as string).trim(),
      sourceQuote: p.sourceQuote as string,
      citation: (p.citation as string).trim(),
    }));
}

/** מחלץ מערך שו"ת-פתוח תקין מ-stdout (`{qas:[...]}`). פריט פסול מסונן. */
export function extractFlatOpen(stdout: string): FlatOpenQa[] {
  const block = extractJsonBlock(stdout);
  if (block === null) return [];
  const parsed = parseJsonWithRepair(block);
  return pickArray(parsed, 'qas')
    .map((q) => q as Record<string, unknown>)
    .filter(
      (q) =>
        nonEmptyStr(q.prompt) &&
        nonEmptyStr(q.answer) &&
        nonEmptyStr(q.sourceQuote) &&
        nonEmptyStr(q.citation),
    )
    .map((q) => ({
      prompt: (q.prompt as string).trim(),
      answer: (q.answer as string).trim(),
      sourceQuote: q.sourceQuote as string,
      citation: (q.citation as string).trim(),
    }));
}

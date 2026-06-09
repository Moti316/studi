/**
 * src/lib/import/map-nblm-question.ts — ממפה פריטי-שאלה רב-סוגיים מ-NotebookLM
 * (matching / open) ל-NewQuestion, עם שער-G3 (quoteAppearsInBody). מקביל ל-
 * `buildQuestionRow` (mcq) ב-generated-mcq.ts. טהור — ללא IO/DB.
 *
 * matching → options = `{left,right}[]` (תואם isMatchingPairs + <MatchingPairs>).
 * open     → type='explanation', correctAnswer={text}.
 * status='מוסקנא' תמיד (עד content-verifier).
 */
import type { NewQuestion } from '../../../drizzle/schema';
import { quoteAppearsInBody, depthToDifficulty, type StatuteSource } from './generated-mcq';
import type { FlatMatchingPair, FlatOpenQa } from '@/lib/notebooklm/adapt-flat-questions';

/** מינימום זוגות-התאמה מעוגנים לשאלת-matching תקפה. */
export const MIN_MATCHING_PAIRS = 2;

/**
 * עיצוב שאלת-התאמה (מונח↔הגדרה) ל-NewQuestion. כל זוג חייב `sourceQuote` מעוגן
 * (G3); זוגות לא-מעוגנים מסוננים. נדרשים ≥MIN_MATCHING_PAIRS זוגות-מעוגנים, אחרת null.
 */
export function buildMatchingRow(
  pairs: FlatMatchingPair[],
  statute: StatuteSource,
  sourceRef: string,
): NewQuestion | null {
  const grounded = (pairs ?? []).filter((p) => quoteAppearsInBody(p.sourceQuote, statute.body));
  if (grounded.length < MIN_MATCHING_PAIRS) return null;

  const options = grounded.map((p) => ({ left: p.term, right: p.definition }));
  const citations = Array.from(new Set(grounded.map((p) => p.citation.trim()))).join(' · ');

  return {
    type: 'matching',
    prompt: `התאם כל מונח להגדרתו לפי ${statute.title}.`,
    options,
    correctAnswer: null,
    explanation: `מקור: ${statute.title} · ${citations}`,
    scopeRefs: [{ id: statute.scopeId, confidence: 1 }],
    inScope: true,
    status: 'מוסקנא',
    difficulty: depthToDifficulty(statute.depth),
    sourceRef,
  } as NewQuestion;
}

/**
 * עיצוב שו"ת-פתוח ל-NewQuestion (type='explanation'). הציטוט חייב להיות מעוגן (G3),
 * אחרת null. התשובה נשמרת ב-correctAnswer={text} (תואם זרימת-active-recall של ExplanationCard).
 */
export function buildOpenRow(
  qa: FlatOpenQa,
  statute: StatuteSource,
  sourceRef: string,
): NewQuestion | null {
  if (!qa || !quoteAppearsInBody(qa.sourceQuote, statute.body)) return null;

  return {
    type: 'explanation',
    prompt: qa.prompt.trim(),
    options: null,
    correctAnswer: { text: qa.answer.trim() },
    explanation: `מקור: ${statute.title} · ${qa.citation.trim()}`,
    scopeRefs: [{ id: statute.scopeId, confidence: 1 }],
    inScope: true,
    status: 'מוסקנא',
    difficulty: depthToDifficulty(statute.depth),
    sourceRef,
  } as NewQuestion;
}

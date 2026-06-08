/**
 * src/lib/notebooklm/map-scenario.ts — ממפה ParsedScenarioExpansion item → NewScenario.
 *
 * ⚠️ PURE mapping — ללא I/O, ללא DB, ללא AI, ללא grounding (grounding = import-scenarios).
 * דטרמיניסטי: אותו קלט + sourceRef + scopeRefs → אותו פלט.
 *
 * תפקיד:
 * 1. משטח solution{immediateAction, legalBackup, engineeringMgmt} → שדה-`solution`
 *    יחיד (Markdown · 3 כותרות מודגשות) כדי לתאום ל-ScenarioInput.solution.
 * 2. מעביר title/background/data/task בלי שינוי.
 * 3. מאמת rubric ב-isRubric (זורק אם פסול).
 * 4. מאמת sourceRef לא-ריק (זורק אם ריק).
 * 5. status='מוסקנא' תמיד (נוצר-מכונה · לא 'מאומת' עד content-verifier).
 * 6. scopeRefs = הפרמטר (מחושב מחוץ לפונקציה ב-import-scenarios דרך verifyScenarioCitations).
 * 7. difficulty לא נקבע כאן (undefined) — ייקבע בשלב-ביקורת.
 */

import type { NewScenario } from '../../../drizzle/schema';
import type { ParsedScenarioExpansion } from '@/lib/notebooklm/parse-output';
import { isRubric } from '@/features/lesson-player/components/types';

/** scope-ref עם confidence כפי שמחושב ע"י matchScopeKeywords / verifyScenarioCitations. */
export interface ScopeRef {
  id: string;
  confidence: number;
}

/**
 * ממפה פריט-תרחיש בודד (מפלט-NotebookLM) ל-NewScenario מוכן-לאינסרט.
 *
 * @param parsed     פריט-תרחיש אחד מ-ParsedScenarioExpansion.items.
 * @param sourceRef  מפתח-מקור דטרמיניסטי (scn:<fileId>:<index>), חובה לא-ריק.
 * @param scopeRefs  רשימת scope-refs מאומתים-grounding (מחושבת ב-import-scenarios).
 * @returns NewScenario מוכן ל-upsertScenarios.
 * @throws אם sourceRef ריק או rubric פסול.
 */
export function mapScenario(
  parsed: ParsedScenarioExpansion['items'][number],
  sourceRef: string,
  scopeRefs: ScopeRef[],
): NewScenario {
  // ── ולידציה: sourceRef חובה ──
  if (typeof sourceRef !== 'string' || sourceRef.trim().length === 0) {
    throw new Error('mapScenario: sourceRef must be a non-empty string');
  }

  // ── ולידציה: rubric (isRubric = type-guard מ-types.ts) ──
  if (!isRubric(parsed.rubric)) {
    throw new Error(
      `mapScenario: rubric is invalid for scenario "${sourceRef}". ` +
        'Expected non-empty array of { criterion: string, points: number }.',
    );
  }

  // ── משטח solution → Markdown (3 כותרות מודגשות) ──
  const { immediateAction, legalBackup, engineeringMgmt } = parsed.solution;
  const solutionMarkdown =
    `**פעולה מיידית:** ${immediateAction.text}\n\n` +
    `**גיבוי חוקי:** ${legalBackup.text}\n\n` +
    `**הנדסה וניהול:** ${engineeringMgmt.text}`;

  return {
    title: parsed.title,
    background: parsed.background,
    data: parsed.data ?? null,
    task: parsed.task,
    solution: solutionMarkdown,
    rubric: parsed.rubric,
    scopeRefs,
    sourceRef,
    status: 'מוסקנא',
    // difficulty לא נקבע כאן — נקבע בשלב-ביקורת/content-verifier.
    difficulty: undefined,
  };
}

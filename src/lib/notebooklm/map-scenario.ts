/**
 * src/lib/notebooklm/map-scenario.ts — ממפה ParsedScenarioExpansion item → NewScenario.
 *
 * ⚠️ PURE mapping — ללא I/O, ללא DB, ללא AI, ללא grounding (grounding = import-scenarios).
 * דטרמיניסטי: אותו קלט + sourceRef + scopeRefs → אותו פלט.
 *
 * תפקיד:
 * 1. משטח solution{immediateAction, controlsHierarchy, legalBackup, managerialAction}
 *    → שדה-`solution` יחיד (Markdown · 4 כותרות מודגשות) כדי לתאום ל-ScenarioInput.solution.
 *    פורמט: **פעולה מיידית בשטח:**\n\n**שימוש במדרג-הבקרות:**\n\n**גיבוי-חוקי מובהק:**\n\n**פעולה ניהולית-מתקנת לטווח-הארוך:**
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
/**
 * מנקה טקסט-פתרון מ-artifacts של NotebookLM לפני הצגה ללומד:
 * 1. סמני-מקור inline (`[1]`, `[1-3]`, `[5, 6]`) שדלפו לטקסט (לא הוסרו ע"י המודל).
 * 2. רצף-רווחים (artifact של גלישת-שורות ב-JSON) → רווח-יחיד.
 * 3. רווח לפני פיסוק (נוצר אחרי הסרת-סמן · "מכנית [4]." → "מכנית.").
 * טהור · דטרמיניסטי. הציטוט-המילולי (legalCitation.quote) אינו עובר כאן — G3 נשמר.
 */
export function cleanSolutionText(text: string): string {
  return text
    .replace(/\[\d+(?:\s*[-,]\s*\d+)*\]/g, '')
    .replace(/ {2,}/g, ' ')
    .replace(/ +([,.;:)])/g, '$1')
    .trim();
}

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

  // ── משטח solution → Markdown (4 כותרות מודגשות) ──
  const { immediateAction, controlsHierarchy, legalBackup, managerialAction } = parsed.solution;
  const solutionMarkdown =
    `**פעולה מיידית בשטח:**\n${cleanSolutionText(immediateAction.text)}\n\n` +
    `**שימוש במדרג-הבקרות:**\n${cleanSolutionText(controlsHierarchy.text)}\n\n` +
    `**גיבוי-חוקי מובהק:**\n${cleanSolutionText(legalBackup.text)}\n\n` +
    `**פעולה ניהולית-מתקנת לטווח-הארוך:**\n${cleanSolutionText(managerialAction.text)}`;

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

/**
 * src/lib/notebooklm/adapt-flat.ts — חילוץ והתאמה של פלט-flat מ-NotebookLM.
 *
 * NotebookLM מחזיר פורמט flat (ללא מבנה-batch מלא) — 4 שדות-תוכן:
 *   { title, immediateAction, controlsHierarchy, legalBackup,
 *     legalCitation:{scopeId,quote,section}, managerialAction }
 *
 * (א) immediateAction    — פעולה מיידית בשטח
 * (ב) controlsHierarchy — שימוש במדרג-הבקרות
 * (ג) legalBackup        — גיבוי-חוקי מובהק + legalCitation
 * (ד) managerialAction   — פעולה ניהולית-מתקנת לטווח-הארוך
 *
 * מודול זה:
 *   1. extractFlatJson  — מחלץ את ה-JSON מ-stdout של ה-CLI.
 *   2. adaptFlatToItem  — ממזג flat + מקור → ParsedScenarioItem.
 *   3. buildBatch       — בונה NotebookLmBatch מ-items.
 *
 * טהור לחלוטין — ללא IO, ללא DB.
 */

import type { ParsedScenarioItem, NotebookLmBatch } from '@/lib/notebooklm/parse-output';
import {
  sanitizeControlChars,
  repairJsonQuotes,
  extractJsonBlock,
  parseJsonWithRepair,
} from '@/lib/notebooklm/extract-json';

// re-export ל-תאימות-אחורה (adapt-flat.test.ts מייבא sanitizeControlChars/repairJsonQuotes מכאן)
export { sanitizeControlChars, repairJsonQuotes };

// ---------------------------------------------------------------------------
// טיפוס FlatScenario — פלט-המחברת הגולמי (flat)
// ---------------------------------------------------------------------------

/** פלט-flat כפי שמחזיר NotebookLM (ללא מעטפת batch) — 4 שדות-תוכן. */
export interface FlatScenario {
  title: string;
  /** (א) פעולה מיידית בשטח */
  immediateAction: string;
  /** (ב) שימוש במדרג-הבקרות */
  controlsHierarchy: string;
  /** (ג) גיבוי-חוקי מובהק */
  legalBackup: string;
  legalCitation: {
    scopeId: string;
    quote: string;
    section?: string;
  };
  /** (ד) פעולה ניהולית-מתקנת לטווח-הארוך */
  managerialAction: string;
}

// ---------------------------------------------------------------------------
// חילוץ JSON מ-stdout
// ---------------------------------------------------------------------------

/**
 * מחלץ את ה-JSON הflat מ-stdout של ה-CLI.
 *
 * מחפש בלוק JSON מאוזן ({...}) בין "Answer:" ל-"Resumed conversation:"
 * (או עד סוף-המחרוזת אם אין "Resumed conversation:").
 *
 * @throws Error אם לא נמצא JSON תקין או חסרים שדות-חובה.
 */
export function extractFlatJson(stdout: string): FlatScenario {
  const jsonBlock = extractJsonBlock(stdout);
  if (jsonBlock === null) {
    throw new Error(`adapt-flat: לא נמצא בלוק-JSON מאוזן ב-stdout. קטע: ${stdout.slice(0, 200)}`);
  }
  return validateFlatScenario(parseJsonWithRepair(jsonBlock));
}

/**
 * מאמת ומקליד FlatScenario — זורק Error ברורה על כל חריגה.
 */
function validateFlatScenario(raw: unknown): FlatScenario {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`adapt-flat: הפלט אינו אובייקט — קיבלנו ${JSON.stringify(raw)}`);
  }
  const obj = raw as Record<string, unknown>;

  const title = requireString(obj, 'title');
  const immediateAction = requireString(obj, 'immediateAction');
  const controlsHierarchy = requireString(obj, 'controlsHierarchy');
  const legalBackup = requireString(obj, 'legalBackup');
  const managerialAction = requireString(obj, 'managerialAction');

  // legalCitation
  if (
    obj['legalCitation'] === null ||
    typeof obj['legalCitation'] !== 'object' ||
    Array.isArray(obj['legalCitation'])
  ) {
    throw new Error(
      `adapt-flat: שדה "legalCitation" חייב להיות אובייקט — קיבלנו ${JSON.stringify(obj['legalCitation'])}`,
    );
  }
  const lc = obj['legalCitation'] as Record<string, unknown>;
  const scopeId = requireString(lc, 'scopeId', 'legalCitation.scopeId');
  const quote = requireString(lc, 'quote', 'legalCitation.quote');
  const legalCitation: FlatScenario['legalCitation'] = { scopeId, quote };
  if (lc['section'] !== undefined && lc['section'] !== null) {
    legalCitation.section = requireString(lc, 'section', 'legalCitation.section');
  }

  return {
    title,
    immediateAction,
    controlsHierarchy,
    legalBackup,
    legalCitation,
    managerialAction,
  };
}

function requireString(obj: Record<string, unknown>, key: string, label?: string): string {
  const v = obj[key];
  if (typeof v !== 'string' || v.trim().length === 0) {
    throw new Error(
      `adapt-flat: שדה "${label ?? key}" חייב להיות string לא-ריק — קיבלנו ${JSON.stringify(v)}`,
    );
  }
  return v;
}

// ---------------------------------------------------------------------------
// מקור-תרחיש (מ-committee-scenarios.json)
// ---------------------------------------------------------------------------

/** שדות-מקור כפי שמגיעים מ-committee-scenarios.json. */
export interface ScenarioSource {
  title: string;
  background: string;
  data?: string | null;
  task: string;
  rubric: Array<{ criterion: string; points: number }>;
}

// ---------------------------------------------------------------------------
// adaptFlatToItem — מיזוג flat + מקור → ParsedScenarioItem
// ---------------------------------------------------------------------------

/**
 * ממזג פלט-flat מ-NotebookLM עם נתוני-מקור (background/task/data/rubric)
 * לכדי ParsedScenarioItem מלא — 4 חלקי-solution.
 *
 * legalBackup.citations = [legalCitation] (הציטוט מהמחברת).
 * immediateAction/controlsHierarchy/managerialAction.citations = [] (ללא ציטוט-חקיקה ישיר).
 *
 * title, background, task, data, rubric — נלקחים מ-source (source of truth).
 */
export function adaptFlatToItem(flat: FlatScenario, source: ScenarioSource): ParsedScenarioItem {
  return {
    title: source.title,
    background: source.background,
    data: source.data ?? null,
    task: source.task,
    solution: {
      immediateAction: {
        text: flat.immediateAction,
        citations: [],
      },
      controlsHierarchy: {
        text: flat.controlsHierarchy,
        citations: [],
      },
      legalBackup: {
        text: flat.legalBackup,
        citations: [
          {
            scopeId: flat.legalCitation.scopeId,
            quote: flat.legalCitation.quote,
            ...(flat.legalCitation.section !== undefined
              ? { section: flat.legalCitation.section }
              : {}),
          },
        ],
      },
      managerialAction: {
        text: flat.managerialAction,
        citations: [],
      },
    },
    rubric: source.rubric,
  };
}

// ---------------------------------------------------------------------------
// buildBatch — בניית NotebookLmBatch ממערך items
// ---------------------------------------------------------------------------

/**
 * עוטף items ב-NotebookLmBatch מוכן לכתיבה ל-json.
 *
 * @param items מערך ParsedScenarioItem (≥0 — אפשר ריק לפלט-חלקי).
 * @param batchName שם הבאץ' (ברירת-מחדל: 'scenarios-expand').
 */
export function buildBatch(
  items: ParsedScenarioItem[],
  batchName = 'scenarios-expand',
): NotebookLmBatch {
  return {
    batch: batchName,
    contentType: 'scenario_expansion',
    items,
  };
}

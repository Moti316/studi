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

import { stripJsonFences } from '@/lib/notebooklm/parse-output';
import type { ParsedScenarioItem, NotebookLmBatch } from '@/lib/notebooklm/parse-output';

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
 * מנקה תווי-בקרה-ממש (newline/tab/CR · קוד < 0x20) מה-JSON לפני parse, ומחליפם
 * ברווח. LLM מחזיר לעתים מחרוזות רב-שורתיות עם שורה-חדשה-ממש בתוך הערך — לא-חוקי
 * ב-JSON ("Bad control character in string literal"). **בטוח:** רצף-escaped `\n`
 * (backslash+n) הוא שני תווי-ASCII רגילים (0x5C,0x6E) ואינו נפגע; רק בייטי-בקרה-ממש
 * מומרים. (מומש ב-charCodeAt כדי להימנע מ-literal-control-chars בקוד-המקור.)
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
 * מודלים מחזירים לעתים `"...בעל רישיון "חשמלאי" מוסמך..."` — המרכאות הפנימיות
 * סוגרות את המחרוזת מוקדם ושוברות JSON.parse (השורש ל-3 כשלי-ההפקה 2026-06-08).
 * הפונקציה מודעת-הקשר: מחרוזת-מפתח נסגרת על `"` שאחריו `:`, מחרוזת-ערך נסגרת על
 * `"` שאחריו `, } ]` (או סוף). מרכאה לא-מבנית בתוך ערך → מוברחת ל-\". היוריסטי
 * (מטפל במקרה-העברי הנפוץ ב-schema-השטוח) · מנוסה **רק כ-fallback** אחרי כשל-parse,
 * כך שהמסלול-המצליח אינו מושפע. ראה adapt-flat.test.ts.
 */
export function repairJsonQuotes(s: string): string {
  let out = '';
  let inStr = false;
  let isKey = false; // האם המחרוזת הנוכחית היא מפתח (נסגרת ב-`:`)
  let expectKey = true; // ההקשר הבא (אחרי { , ) הוא מפתח
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
    // מחוץ למחרוזת
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
 * מחלץ את ה-JSON הflat מ-stdout של ה-CLI.
 *
 * מחפש בלוק JSON מאוזן ({...}) בין "Answer:" ל-"Resumed conversation:"
 * (או עד סוף-המחרוזת אם אין "Resumed conversation:").
 *
 * @throws Error אם לא נמצא JSON תקין או חסרים שדות-חובה.
 */
export function extractFlatJson(stdout: string): FlatScenario {
  // הצמד לאזור Answer: ... Resumed conversation: (או סוף)
  const afterAnswer = stdout.indexOf('Answer:');
  const segment = afterAnswer !== -1 ? stdout.slice(afterAnswer + 'Answer:'.length) : stdout;

  const resumedIdx = segment.indexOf('Resumed conversation:');
  const searchIn = resumedIdx !== -1 ? segment.slice(0, resumedIdx) : segment;

  // חלץ בלוק JSON מאוזן ראשון
  const jsonBlock = extractBalancedJson(searchIn);
  if (jsonBlock === null) {
    throw new Error(`adapt-flat: לא נמצא בלוק-JSON מאוזן ב-stdout. קטע: ${searchIn.slice(0, 200)}`);
  }

  const cleaned = sanitizeControlChars(stripJsonFences(jsonBlock));

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (firstErr) {
    // fallback: מודלים מחזירים לעתים מרכאות-לא-escaped בתוך ערך-מחרוזת (נפוץ
    // בעברית-משפטית: רישיון "חשמלאי", תש"ל). repairJsonQuotes מבריח מרכאות-תוכן
    // ומשאיר את המבניות. מנוסה רק כ-fallback → המסלול-המצליח לא מושפע.
    try {
      parsed = JSON.parse(repairJsonQuotes(cleaned));
    } catch {
      throw new Error(
        `adapt-flat: JSON.parse נכשל (גם אחרי repair) — ${firstErr instanceof Error ? firstErr.message : String(firstErr)}. קטע: ${cleaned.slice(0, 200)}`,
      );
    }
  }

  return validateFlatScenario(parsed);
}

/**
 * מחלץ בלוק JSON מאוזן ראשון (מסוגריים {}) מתוך מחרוזת.
 * מחזיר null אם אין בלוק מאוזן.
 */
function extractBalancedJson(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null; // לא מאוזן
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

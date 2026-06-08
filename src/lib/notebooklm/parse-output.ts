/**
 * src/lib/notebooklm/parse-output.ts — פרסר טהור לפלט-ה-JSON של NotebookLM/גשר.
 *
 * עיקרון: "parse, don't validate" — המבנה מנותח בקפדנות ונזרקת שגיאה-ברורה על כל
 * סטייה מהחוזה. אין תיקון שקט. הקורא (importer) מקבל מבנה-מוקלד-מלא או שגיאה.
 *
 * החוזה (batch שנפלט ע"י הגשר):
 *   { batch, contentType, items: ParsedScenarioExpansion[] }
 *
 * כל item (ParsedScenarioExpansion):
 *   { sourceRef?, title, background, data?, task,
 *     solution: { immediateAction, legalBackup, engineeringMgmt },
 *     rubric: { criterion, points }[] }
 *
 * כל חלק-solution (ScenarioSolutionPart):
 *   { text: string, citations: CitationInput[] }
 *
 * כל ציטוט (CitationInput):
 *   { scopeId: string, quote: string, section?: string }
 *
 * טהור (ללא db/fs) — בר-בדיקה ביחידה ונטען בבטחה מהסקריפט ומהטסט.
 */

// ---------------------------------------------------------------------------
// טיפוסים ציבוריים
// ---------------------------------------------------------------------------

/** ציטוט-חקיקה כפי שמגיע מהגשר (לפני אימות G1-G3 בשלב ה-importer). */
export interface CitationInput {
  /** scope-ID דוטד (למשל '2.1'). */
  scopeId: string;
  /** ציטוט מילולי שאמור להופיע בנוסח-החקיקה. */
  quote: string;
  /** הסעיף/התקנה (אופציונלי — report-only ל-G5). */
  section?: string;
}

/** חלק אחד מהפתרון (immediateAction / legalBackup / engineeringMgmt). */
export interface ScenarioSolutionPart {
  text: string;
  citations: CitationInput[];
}

/**
 * פריט-תרחיש-מורחב בודד כפי שמגיע מהגשר (לפני map-scenario).
 * (alias ל-map-scenario.ts שמשתמש ב-ParsedScenarioExpansion['items'][number])
 */
export interface ParsedScenarioItem {
  /** מזהה-מקור (scn:<fileId>:<index>) — אופציונלי: ה-importer ישלים אם חסר. */
  sourceRef?: string;
  title: string;
  background: string;
  /** נתונים-מספריים (אופציונלי — שדה חופשי). */
  data?: string | null;
  task: string;
  solution: {
    immediateAction: ScenarioSolutionPart;
    legalBackup: ScenarioSolutionPart;
    engineeringMgmt: ScenarioSolutionPart;
  };
  /** מערך לא-ריק של קריטריוני-ניקוד. */
  rubric: Array<{ criterion: string; points: number }>;
}

/** המעטפת של הבאץ' השלם. */
export interface NotebookLmBatch {
  batch: string;
  contentType: string;
  items: ParsedScenarioItem[];
}

/**
 * alias לתאימות-אחורה עם map-scenario.ts שמשתמש ב-ParsedScenarioExpansion['items'][number].
 * NotebookLmBatch הוא הטיפוס המועדף — זהה במבנה.
 */
export type ParsedScenarioExpansion = NotebookLmBatch;

// ---------------------------------------------------------------------------
// פונקציות עזר פנימיות
// ---------------------------------------------------------------------------

function assertString(val: unknown, path: string): string {
  if (typeof val !== 'string') {
    throw new Error(
      `parse-output: שדה "${path}" חייב להיות string — קיבלנו ${JSON.stringify(val)}`,
    );
  }
  return val;
}

function assertNonEmptyString(val: unknown, path: string): string {
  const s = assertString(val, path);
  if (s.trim().length === 0) {
    throw new Error(`parse-output: שדה "${path}" לא יכול להיות מחרוזת-ריקה`);
  }
  return s;
}

function assertArray(val: unknown, path: string): unknown[] {
  if (!Array.isArray(val)) {
    throw new Error(`parse-output: שדה "${path}" חייב להיות מערך — קיבלנו ${JSON.stringify(val)}`);
  }
  return val;
}

function assertObject(val: unknown, path: string): Record<string, unknown> {
  if (val === null || typeof val !== 'object' || Array.isArray(val)) {
    throw new Error(
      `parse-output: שדה "${path}" חייב להיות אובייקט — קיבלנו ${JSON.stringify(val)}`,
    );
  }
  return val as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// פרסור ציטוט
// ---------------------------------------------------------------------------

function parseCitation(raw: unknown, path: string): CitationInput {
  const obj = assertObject(raw, path);
  const scopeId = assertNonEmptyString(obj['scopeId'], `${path}.scopeId`);
  const quote = assertNonEmptyString(obj['quote'], `${path}.quote`);
  const result: CitationInput = { scopeId, quote };
  if (obj['section'] !== undefined && obj['section'] !== null) {
    result.section = assertString(obj['section'], `${path}.section`);
  }
  return result;
}

// ---------------------------------------------------------------------------
// פרסור חלק-solution
// ---------------------------------------------------------------------------

function parseSolutionPart(raw: unknown, path: string): ScenarioSolutionPart {
  const obj = assertObject(raw, path);
  const text = assertNonEmptyString(obj['text'], `${path}.text`);
  const citationsRaw = assertArray(obj['citations'], `${path}.citations`);
  const citations = citationsRaw.map((c, i) => parseCitation(c, `${path}.citations[${i}]`));
  return { text, citations };
}

// ---------------------------------------------------------------------------
// פרסור item תרחיש
// ---------------------------------------------------------------------------

function parseScenarioItem(raw: unknown, index: number): ParsedScenarioItem {
  const base = `items[${index}]`;
  const obj = assertObject(raw, base);

  const title = assertNonEmptyString(obj['title'], `${base}.title`);
  const background = assertNonEmptyString(obj['background'], `${base}.background`);
  const task = assertNonEmptyString(obj['task'], `${base}.task`);

  // sourceRef אופציונלי
  let sourceRef: string | undefined;
  if (obj['sourceRef'] !== undefined && obj['sourceRef'] !== null) {
    sourceRef = assertString(obj['sourceRef'], `${base}.sourceRef`);
  }

  // data אופציונלי
  let data: string | null | undefined;
  if (obj['data'] !== undefined) {
    data = obj['data'] === null ? null : assertString(obj['data'], `${base}.data`);
  }

  // solution — 3 חלקים חובה
  const solutionRaw = assertObject(obj['solution'], `${base}.solution`);
  const solution = {
    immediateAction: parseSolutionPart(
      solutionRaw['immediateAction'],
      `${base}.solution.immediateAction`,
    ),
    legalBackup: parseSolutionPart(solutionRaw['legalBackup'], `${base}.solution.legalBackup`),
    engineeringMgmt: parseSolutionPart(
      solutionRaw['engineeringMgmt'],
      `${base}.solution.engineeringMgmt`,
    ),
  };

  // rubric — מערך לא-ריק
  const rubricRaw = assertArray(obj['rubric'], `${base}.rubric`);
  if (rubricRaw.length === 0) {
    throw new Error(`parse-output: ${base}.rubric לא יכול להיות מערך-ריק`);
  }
  const rubric = rubricRaw.map((r, i) => {
    const rObj = assertObject(r, `${base}.rubric[${i}]`);
    const criterion = assertNonEmptyString(rObj['criterion'], `${base}.rubric[${i}].criterion`);
    if (typeof rObj['points'] !== 'number') {
      throw new Error(
        `parse-output: שדה "${base}.rubric[${i}].points" חייב להיות number — קיבלנו ${JSON.stringify(rObj['points'])}`,
      );
    }
    return { criterion, points: rObj['points'] as number };
  });

  return { sourceRef, title, background, data, task, solution, rubric };
}

// ---------------------------------------------------------------------------
// ממשק-ציבורי
// ---------------------------------------------------------------------------

/**
 * מסיר עטיפת ```json ... ``` (או ``` בלי שם-שפה) אם קיימת.
 * נרמול שורות-שוליים להבטיח JSON.parse נקי.
 */
export function stripJsonFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\r?\n/, '')
    .replace(/\r?\n```$/, '')
    .trim();
}

/**
 * מנתח את פלט-הגשר (raw JSON string — עם או בלי code fences) לאובייקט-מוקלד.
 * זורק Error ברורה בכל חריגה ממבנה-החוזה. אינו מתקן שקט.
 *
 * @throws Error עם הסבר-מפורט על כל שדה-פסול.
 */
export function parseNotebookLmOutput(raw: string): NotebookLmBatch {
  const cleaned = stripJsonFences(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `parse-output: JSON.parse נכשל — ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const root = assertObject(parsed, 'root');

  const batch = assertNonEmptyString(root['batch'], 'batch');
  const contentType = assertNonEmptyString(root['contentType'], 'contentType');
  const itemsRaw = assertArray(root['items'], 'items');

  if (itemsRaw.length === 0) {
    throw new Error('parse-output: items לא יכול להיות מערך-ריק');
  }

  const items = itemsRaw.map((item, i) => parseScenarioItem(item, i));

  return { batch, contentType, items };
}

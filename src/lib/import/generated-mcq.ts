/**
 * src/lib/import/generated-mcq.ts — לוגיקה טהורה ליצירת-שאלות-MCQ-מ-AI:
 * סכמת-התגובה, שער-אנטי-הזיה (אימות ציטוט-verbatim מול הנוסח), ועיצוב-ה-row.
 *
 * טהור (ללא db/Gemini) — לכן בר-בדיקה ביחידה ונטען בבטחה גם מהסקריפט וגם מהטסט.
 * עיקרון: PDF=source-of-truth — המודל מחזיר `sourceQuote` מילולי שחייב להופיע בנוסח,
 * והקוד מאמת זאת דטרמיניסטית (drop אם לא) → ממתן הזיה ללא קריאת-Gemini נוספת.
 */
import type { NewQuestion } from '../../../drizzle/schema';

/** שאלה בודדת כפי שה-AI מחזיר (לפני אימות + עיצוב). */
export interface GeneratedMCQ {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  /** ציטוט מילולי מהנוסח — חייב להופיע מילה-במילה (שער-אנטי-הזיה). */
  sourceQuote: string;
  /** הסעיף/התקנה המסמיכים (citation פר-בקרה). */
  citation: string;
  difficulty?: number;
}

/** המקור (נוסח-חקיקה) שעליו מתבססת היצירה. */
export interface StatuteSource {
  scopeId: string;
  title: string;
  depth?: string; // core | framework | sectoral
  body: string;
  /** נתיב-הקובץ היחסי לשורש-הריפו (לאימות-Workflow שקורא/Grep מהמקור). אופציונלי. */
  path?: string;
}

/** OpenAPI-3 subset ל-responseSchema של Gemini (geminiGenerateJSON). */
export const GENERATED_MCQ_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctIndex: { type: 'integer' },
          explanation: { type: 'string' },
          sourceQuote: { type: 'string' },
          citation: { type: 'string' },
          difficulty: { type: 'integer' },
        },
        required: ['prompt', 'options', 'correctIndex', 'explanation', 'sourceQuote', 'citation'],
      },
    },
  },
  required: ['questions'],
} as const;

/** נרמול-להשוואה: איחוד גרשיים/מירכאות + צמצום-רווחים. */
export function normalizeForMatch(s: string): string {
  return s
    .replace(/[״”“"׳’‘']/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** מינימום-אורך לציטוט תקף (מונע "התאמה" טריוויאלית של מילה בודדת). */
export const MIN_QUOTE_CHARS = 12;

/** אֵליפסיס: ".." / "..." / "…" (עם רווחים מסביב) — מפריד קטעי-ציטוט תפורים. */
const ELLIPSIS_RE = /\s*(?:\.{2,}|…)\s*/g;

/**
 * שער-אנטי-הזיה: האם ה-sourceQuote מעוגן מילולית בנוסח (אחרי נרמול).
 *
 * תומך ב**ציטוט-מקוטע** (אֵליפסיס): מודלים (וגם משפטנים) מצטטים לעתים סעיפי-מפתח
 * מהנוסח ומדלגים על הביניים עם "..." → המחרוזת-המלאה אינה מופיעה ברצף בגוף.
 * הגֵייט מפצל על אֵליפסיס ודורש ש**כל** קטע-משמעותי (≥MIN_QUOTE_CHARS אחרי נרמול)
 * יופיע מילולית בנוסח. חיזוק-נאמן: כל מילה-מוצגת ללומד אכן מהמקור (לא-הזיה),
 * רק לא-רצופה. ציטוט ללא-אֵליפסיס = התנהגות-קודמת (includes יחיד · קטע אחד).
 */
export function quoteAppearsInBody(quote: string, body: string): boolean {
  if (typeof quote !== 'string' || typeof body !== 'string') return false;
  const nb = normalizeForMatch(body);
  const fragments = quote
    .split(ELLIPSIS_RE)
    .map((f) => normalizeForMatch(f))
    .filter((f) => f.length >= MIN_QUOTE_CHARS);
  if (fragments.length === 0) return false;
  return fragments.every((f) => nb.includes(f));
}

/** depth → difficulty (1 core · 2 framework · 3 sectoral). */
export function depthToDifficulty(depth?: string): number {
  switch (depth) {
    case 'core':
      return 1;
    case 'sectoral':
      return 3;
    case 'framework':
    default:
      return 2;
  }
}

/** ולידציה בסיסית למבנה-MCQ (4 מסיחים אידיאלית · ≥2 מינימום · index בתחום · prompt לא-ריק). */
export function isValidMcq(mcq: GeneratedMCQ): boolean {
  return (
    !!mcq &&
    typeof mcq.prompt === 'string' &&
    mcq.prompt.trim().length > 0 &&
    Array.isArray(mcq.options) &&
    mcq.options.length >= 2 &&
    mcq.options.every((o) => typeof o === 'string' && o.trim().length > 0) &&
    Number.isInteger(mcq.correctIndex) &&
    mcq.correctIndex >= 0 &&
    mcq.correctIndex < mcq.options.length &&
    typeof mcq.citation === 'string' &&
    mcq.citation.trim().length > 0
  );
}

/**
 * עיצוב MCQ-מאומת ל-NewQuestion. מחזיר null אם המבנה פסול או שהציטוט אינו בנוסח
 * (שער-אנטי-הזיה). status='מוסקנא' (נוצר-מכונה · לא 'מאומת' עד content-verifier).
 */
export function buildQuestionRow(
  mcq: GeneratedMCQ,
  statute: StatuteSource,
  sourceRef: string,
): NewQuestion | null {
  if (!isValidMcq(mcq)) return null;
  if (!quoteAppearsInBody(mcq.sourceQuote, statute.body)) return null;

  const type = mcq.prompt.length > 120 ? 'mcq_long' : 'mcq_short';
  const explanation = `${mcq.explanation.trim()}\n\nמקור: ${statute.title} · ${mcq.citation.trim()}`;

  return {
    type,
    prompt: mcq.prompt.trim(),
    options: mcq.options,
    correctAnswer: { index: mcq.correctIndex },
    explanation,
    scopeRefs: [{ id: statute.scopeId, confidence: 1 }],
    inScope: true,
    status: 'מוסקנא',
    difficulty: depthToDifficulty(statute.depth),
    sourceRef,
  };
}

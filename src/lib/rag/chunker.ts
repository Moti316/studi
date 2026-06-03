/**
 * src/lib/rag/chunker.ts — חיתוך-מסמך לצ'אנקים ל-RAG ("הסבר לעומק").
 *
 * שלב-ה-chunking ב-pipeline ה-RAG: מקבל טקסט-מקור (חוק/תקנה/חומר-לימוד) ומפצל
 * אותו לצ'אנקים בגודל-יעד, מודע-גבולות (פסקה → משפט → מילה → תו) עם חפיפה
 * (overlap) בין-צ'אנקים שמשמרת הקשר. כל צ'אנק מוטמע (embedded) בהמשך ונשמר ב-DB.
 *
 * **לוגיקה-טהורה, דטרמיניסטית, ללא AI ו-ללא DB** — אותו קלט ⇒ אותו פלט.
 * ה-embedding (שעולה כסף) הוא שלב נפרד (`embedder.ts`).
 *
 * Schema-as-is (drizzle/schema.ts · chunks):
 * - `chunkIndex` (integer)  — סדר-הצ'אנק במסמך.
 * - `text`       (text)     — תוכן-הצ'אנק.
 * - `tokenCount` (integer)  — אומדן-טוקנים (לבקרת-עלות ולגודל-batch).
 *
 * הערכת-הטוקנים היא **אומדן** (ספירת-הטוקנים האמיתית מגיעה מספק-ה-embedding);
 * היוריסטיקה: ~4 תווים/טוקן (מעורב עברית+מספרים+פיסוק בטקסט-משפטי).
 */

export interface ChunkResult {
  /** סדר-הצ'אנק במסמך (0-based) — תואם chunks.chunk_index. */
  chunkIndex: number;
  /** תוכן-הצ'אנק. */
  text: string;
  /** אומדן-טוקנים. */
  tokenCount: number;
}

export interface ChunkOptions {
  /** גודל-יעד לצ'אנק בטוקנים (ברירת-מחדל 512). */
  maxTokens?: number;
  /** חפיפה בין-צ'אנקים בטוקנים (ברירת-מחדל 64). 0 ⇒ ללא-חפיפה. */
  overlapTokens?: number;
  /** מינימום-טוקנים לצ'אנק-אחרון לפני מיזוג-לקודם (ברירת-מחדל 16). */
  minTokens?: number;
}

const DEFAULTS: Required<ChunkOptions> = {
  maxTokens: 512,
  overlapTokens: 64,
  minTokens: 16,
};

/** כמה תווים מייצג טוקן (היוריסטיקה לחישוב-גודל בלבד). */
const CHARS_PER_TOKEN = 4;

/**
 * אומדן-טוקנים לטקסט (היוריסטיקה: ~4 תווים/טוקן). דטרמיניסטי.
 * הספירה-האמיתית מגיעה מספק-ה-embedding — זה משמש רק לגודל-צ'אנק ובקרת-עלות.
 */
export function estimateTokens(text: string): number {
  const t = text.trim();
  if (t.length === 0) return 0;
  return Math.max(1, Math.ceil(t.length / CHARS_PER_TOKEN));
}

/** פיצול-קשיח לפי-תווים כשיחידה בודדת (מילה-ארוכה) חורגת מ-maxTokens. */
function hardSplit(s: string, maxTokens: number): string[] {
  const maxChars = Math.max(1, maxTokens * CHARS_PER_TOKEN);
  const out: string[] = [];
  for (let i = 0; i < s.length; i += maxChars) out.push(s.slice(i, i + maxChars));
  return out;
}

/** אריזת-מילים חמדנית ליחידות ≤ maxTokens. */
function packWords(words: string[], maxTokens: number): string[] {
  const out: string[] = [];
  let cur: string[] = [];
  let curTok = 0;
  for (const w of words) {
    const wTok = estimateTokens(w);
    if (curTok + wTok > maxTokens && cur.length > 0) {
      out.push(cur.join(' '));
      cur = [];
      curTok = 0;
    }
    if (wTok > maxTokens) {
      // מילה בודדת ארוכה מהגבול — פיצול-קשיח
      if (cur.length) {
        out.push(cur.join(' '));
        cur = [];
        curTok = 0;
      }
      out.push(...hardSplit(w, maxTokens));
      continue;
    }
    cur.push(w);
    curTok += wTok;
  }
  if (cur.length) out.push(cur.join(' '));
  return out;
}

/** פיצול יחידה החורגת מ-maxTokens: משפטים → מילים → תווים (רקורסיבי). */
function splitUnit(s: string, maxTokens: number): string[] {
  if (estimateTokens(s) <= maxTokens) return [s];
  const sentences = s
    .split(/(?<=[.!?…])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (sentences.length > 1) return sentences.flatMap((sn) => splitUnit(sn, maxTokens));
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length > 1) return packWords(words, maxTokens);
  return hardSplit(s, maxTokens);
}

/** פיצול-המסמך לסגמנטים (פסקאות), כשכל סגמנט ≤ maxTokens. */
function splitIntoSegments(text: string, maxTokens: number): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paragraphs.flatMap((p) => splitUnit(p, maxTokens));
}

/** לוקח מסוף-הצ'אנק סגמנטים שסכומם ≤ overlapTokens (לחפיפה לצ'אנק-הבא). */
function takeOverlap(
  segments: string[],
  overlapTokens: number,
): { segs: string[]; tokens: number } {
  if (overlapTokens <= 0) return { segs: [], tokens: 0 };
  const segs: string[] = [];
  let tokens = 0;
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (seg === undefined) continue;
    const t = estimateTokens(seg);
    if (tokens + t > overlapTokens && segs.length > 0) break;
    segs.unshift(seg);
    tokens += t;
    if (tokens >= overlapTokens) break;
  }
  return { segs, tokens };
}

/**
 * מחלק טקסט לצ'אנקים מודעי-גבולות עם חפיפה. דטרמיניסטי.
 *
 * @param input טקסט-המקור.
 * @param options גדלים (maxTokens/overlapTokens/minTokens).
 * @returns מערך-צ'אנקים עם chunkIndex רציף, text, ו-tokenCount.
 *          גודל-צ'אנק עשוי להגיע עד maxTokens+overlapTokens (החפיפה מתווספת בראש).
 * @throws {RangeError} על אופציות לא-תקינות.
 */
export function chunkText(input: string, options: ChunkOptions = {}): ChunkResult[] {
  const { maxTokens, overlapTokens, minTokens } = { ...DEFAULTS, ...options };
  if (maxTokens <= 0) throw new RangeError(`maxTokens must be > 0, got ${maxTokens}`);
  if (overlapTokens < 0 || overlapTokens >= maxTokens)
    throw new RangeError(`overlapTokens must be in [0, maxTokens), got ${overlapTokens}`);
  if (minTokens < 0) throw new RangeError(`minTokens must be >= 0, got ${minTokens}`);

  const text = input.replace(/\r\n/g, '\n').trim();
  if (text.length === 0) return [];

  const segments = splitIntoSegments(text, maxTokens);
  if (segments.length === 0) return [];

  const chunkTexts: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  const flush = () => {
    if (current.length === 0) return;
    chunkTexts.push(current.join('\n\n'));
  };

  for (const seg of segments) {
    const segTok = estimateTokens(seg);
    if (currentTokens + segTok > maxTokens && current.length > 0) {
      flush();
      const ov = takeOverlap(current, overlapTokens);
      current = [...ov.segs];
      currentTokens = ov.tokens;
    }
    current.push(seg);
    currentTokens += segTok;
  }
  flush();

  // מיזוג צ'אנק-אחרון זעיר (< minTokens) לקודמו — רק אם התוצאה אינה חורגת מ-maxTokens.
  if (chunkTexts.length >= 2) {
    const lastIdx = chunkTexts.length - 1;
    const last = chunkTexts[lastIdx] ?? '';
    const prev = chunkTexts[lastIdx - 1] ?? '';
    if (
      estimateTokens(last) < minTokens &&
      estimateTokens(prev) + estimateTokens(last) <= maxTokens
    ) {
      chunkTexts[lastIdx - 1] = prev + '\n\n' + last;
      chunkTexts.pop();
    }
  }

  return chunkTexts.map((t, i) => ({
    chunkIndex: i,
    text: t,
    tokenCount: estimateTokens(t),
  }));
}

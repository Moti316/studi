/**
 * src/lib/import/question-verification-io.ts — IO-helpers טהורים לשלב-האימות-הסמנטי
 * (Claude-Workflow · citation-fit). G1–G3 מאמתים ציטוט-verbatim בלבד; שכבה-זו מכינה
 * את הנתונים לאימות-המשמעות (התקנה-הנכונה-לנושא · עברית · in-scope · קוהרנטיות).
 *
 * שתי תפקידים:
 *   1. buildVerificationGroups — מקבץ את השורות-שנבנו פר-נוסח (+ גוף-החוק המלא),
 *      כך שכל סוכן-אימות מקבל הקשר-מקור אמיתי לעיגון citation-fit.
 *   2. parseExcludeRefs / filterExcluded — מסנן הזיות-מאומתות (held) לפני כתיבה ל-DB.
 *
 * טהור — ללא IO/DB. ה-Workflow (Claude) הוא ה-verifier; כאן רק המרת-נתונים.
 * ראה זיכרון grounding-verifies-quote-not-citation-fit.
 */
import type { NewQuestion } from '../../../drizzle/schema';
import type { StatuteSource } from './generated-mcq';

export interface VerificationQuestion {
  sourceRef: string;
  type: string;
  prompt: string;
  /** התשובה-הנכונה כטקסט-קריא (לאימות קוהרנטיות + citation-fit). */
  answer: string;
  /** מסיחים (mcq בלבד · להצגת-התשובה-הנכונה בהקשר). */
  options?: string[];
  /** הסבר/מקור (כולל ה-citation). */
  explanation: string;
}

export interface VerificationGroup {
  scopeId: string;
  title: string;
  /**
   * נתיב-קובץ-הנוסח (יחסי-לריפו) — סוכן-האימות קורא/Grep ממנו לעיגון citation-fit
   * אמיתי. נתיב ולא גוף: חלק מהנוסחים ענקיים (2.11.1 ~1.5M תווים) → Grep יעיל.
   */
  statutePath: string;
  questions: VerificationQuestion[];
}

/** מתאר את התשובה-הנכונה כטקסט קריא, פר-סוג (mcq/matching/open). */
export function describeAnswer(row: NewQuestion): string {
  const ca = row.correctAnswer as { index?: number; text?: string } | null;
  if (row.type === 'matching' && Array.isArray(row.options)) {
    return (row.options as Array<{ left: string; right: string }>)
      .map((p) => `${p.left} ⇄ ${p.right}`)
      .join(' · ');
  }
  if ((row.type === 'mcq_short' || row.type === 'mcq_long') && Array.isArray(row.options)) {
    const idx = ca?.index ?? -1;
    return typeof row.options[idx] === 'string' ? String(row.options[idx]) : '(index פסול)';
  }
  if (row.type === 'explanation') return ca?.text ? String(ca.text) : '';
  return '';
}

/** שורה-שנבנתה + הנוסח-שאליו הותאמה בפועל (G3). */
export interface BuiltMatch {
  row: NewQuestion;
  statute: StatuteSource;
}

/**
 * בונה קבוצות-אימות פר-**נוסח-מותאם** (לא פר-scope). חשוב: scopeId יחיד עשוי למפות
 * למספר נוסחים (4.3×3 · 2.8×2 · 2.10×2) — קיבוץ לפי הנוסח-שהתאים-ב-G3 מבטיח שכל
 * סוכן-אימות מקבל את נתיב-המקור הנכון לשאלותיו. ממוין דטרמיניסטית (scope→title).
 */
export function buildVerificationGroups(matches: BuiltMatch[]): VerificationGroup[] {
  const byStatute = new Map<string, VerificationGroup>();
  for (const { row, statute } of matches) {
    const key = statute.path || `${statute.scopeId}::${statute.title}`;
    let g = byStatute.get(key);
    if (!g) {
      g = {
        scopeId: statute.scopeId,
        title: statute.title,
        statutePath: statute.path ?? '',
        questions: [],
      };
      byStatute.set(key, g);
    }
    const isMcq = row.type === 'mcq_short' || row.type === 'mcq_long';
    g.questions.push({
      sourceRef: String(row.sourceRef),
      type: String(row.type),
      prompt: String(row.prompt),
      answer: describeAnswer(row),
      options: isMcq && Array.isArray(row.options) ? (row.options as string[]) : undefined,
      explanation: String(row.explanation ?? ''),
    });
  }
  return Array.from(byStatute.values()).sort(
    (a, b) =>
      a.scopeId.localeCompare(b.scopeId, undefined, { numeric: true }) ||
      a.title.localeCompare(b.title),
  );
}

/**
 * מפרסר תוכן-קובץ-החזקה ל-Set של sourceRefs. תומך בשני פורמטים:
 *   array של מחרוזות · array של {sourceRef} · {held:[{sourceRef}|string]}.
 * JSON-פסול → Set ריק (fail-safe · לא חוסם ייבוא).
 */
export function parseExcludeRefs(raw: string): Set<string> {
  const out = new Set<string>();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return out;
  }
  const push = (v: unknown): void => {
    if (typeof v === 'string' && v.trim()) out.add(v.trim());
    else if (v && typeof v === 'object') {
      const sr = (v as { sourceRef?: unknown }).sourceRef;
      if (typeof sr === 'string' && sr.trim()) out.add(sr.trim());
    }
  };
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { held?: unknown }).held)
      ? (data as { held: unknown[] }).held
      : [];
  for (const v of list) push(v);
  return out;
}

/** מסנן שורות לפי קבוצת-sourceRefs להחזקה. מחזיר {kept, excluded}. */
export function filterExcluded(
  rows: NewQuestion[],
  excludeRefs: Set<string>,
): { kept: NewQuestion[]; excluded: NewQuestion[] } {
  if (excludeRefs.size === 0) return { kept: rows, excluded: [] };
  const kept: NewQuestion[] = [];
  const excluded: NewQuestion[] = [];
  for (const row of rows) {
    if (excludeRefs.has(String(row.sourceRef))) excluded.push(row);
    else kept.push(row);
  }
  return { kept, excluded };
}

/**
 * src/lib/ai/prompts/committee-sim/modes.ts — 3 מצבי-התשובה של מתודולוגיית-הוועדה
 * (name-cleaned · ADR-009 תיקון 2026-06-09). מסייע לזהות/לאכוף את התיוג בפלט-AI:
 *   [מאומת] — מקור-חקיקה פעיל · [מוסקנא] — פרשנות-מקצועית · [לא ידוע] — אל-תמציא.
 *
 * טהור (ללא IO/AI) — בר-בדיקה. ישמש בעיקר את הסימולציה-החיה (Future) ולסיווג פלט-חיבור.
 */

export const RESPONSE_MODES = ['מאומת', 'מוסקנא', 'לא ידוע'] as const;
export type ResponseMode = (typeof RESPONSE_MODES)[number];

const MODE_RE = /\[(מאומת|מוסקנא|לא ידוע)\]/;

/** מזהה את מצב-התשובה הראשון המתויג בטקסט, או null אם אין. */
export function detectMode(text: string): ResponseMode | null {
  const m = MODE_RE.exec(text ?? '');
  return m && (RESPONSE_MODES as readonly string[]).includes(m[1]!) ? (m[1] as ResponseMode) : null;
}

/**
 * אוכף מצב כשאין עיגון: אם hasGrounding=false והמצב הוא [מאומת] — מורידים ל-[לא ידוע]
 * (אסור לטעון "מאומת" בלי מקור). מחזיר את המצב התקף.
 */
export function enforceGrounding(mode: ResponseMode | null, hasGrounding: boolean): ResponseMode {
  if (!hasGrounding) return 'לא ידוע';
  return mode ?? 'מוסקנא';
}

/** מסיר את תג-המצב מתחילת/תוך הטקסט (לתצוגה נקייה). */
export function stripMode(text: string): string {
  return (text ?? '')
    .replace(MODE_RE, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

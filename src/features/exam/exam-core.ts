/**
 * src/features/exam/exam-core.ts — לוגיקה-טהורה למבחן-הדמה (D3).
 *
 * מבחן-הסמכה-דמה: 30 שאלות-אמריקאיות · 60 דקות · ציון-עובר 70 (מקובל במבחני
 * מינהל-הבטיחות). טהור (אפס-IO) → ניתן-לטסט.
 */

import type { Question } from '../../../drizzle/schema';

/** משך-המבחן (דקות) — תואם יחס-זמן של מבחן-ההסמכה. */
export const EXAM_DURATION_MIN = 60;
/** ציון-עובר (אחוזים). */
export const EXAM_PASS_PCT = 70;
/** מספר-שאלות-יעד. */
export const EXAM_QUESTION_COUNT = 30;

/** תשובות-הנבחן: questionIndex → optionIndex שנבחר (חסר = לא-נענה). */
export type ExamAnswers = Record<number, number>;

/** מחלץ את אינדקס-התשובה-הנכונה (correctAnswer = {index}). null = לא-ניתן-לנקד. */
export function correctIndexOf(q: Question): number | null {
  const ca: unknown = q.correctAnswer;
  if (ca && typeof ca === 'object' && 'index' in ca) {
    const idx = (ca as { index?: unknown }).index;
    if (typeof idx === 'number' && idx >= 0) return idx;
  }
  return null;
}

export interface ExamScore {
  /** שאלות-שניתנות-לניקוד (עם correctAnswer.index תקין). */
  scorable: number;
  correct: number;
  answered: number;
  /** אחוז 0-100 (מעוגל) מתוך ה-scorable. */
  pct: number;
  passed: boolean;
}

/** מחשב ציון-מבחן (אחוז מתוך השאלות-הניתנות-לניקוד · עובר ≥ EXAM_PASS_PCT). */
export function scoreExam(questions: readonly Question[], answers: ExamAnswers): ExamScore {
  let scorable = 0;
  let correct = 0;
  let answered = 0;

  questions.forEach((q, i) => {
    const ci = correctIndexOf(q);
    if (ci === null) return;
    scorable++;
    const a = answers[i];
    if (a === undefined) return;
    answered++;
    if (a === ci) correct++;
  });

  const pct = scorable > 0 ? Math.round((correct / scorable) * 100) : 0;
  return { scorable, correct, answered, pct, passed: pct >= EXAM_PASS_PCT };
}

/** פורמט-טיימר mm:ss (לתצוגה · 0-padded). */
export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

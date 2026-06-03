/**
 * src/lib/srs/scheduler.ts — תזמון תור-תרגול (מה לשרת הבא).
 *
 * המוח של ה-API `next-question` (D4): בהינתן השאלות שעבר עליהן הלומד (עם מועד-
 * החזרה מ-SM-2) והשאלות-החדשות, בוחר אילו שאלות להגיש בסשן-תרגול — קודם חזרות-
 * שהגיע-זמנן (spaced repetition), עם מכסת-שאלות-חדשות מבוקרת.
 *
 * **לוגיקה-טהורה, דטרמיניסטית, ללא DB/AI** — ה-API עוטף את זה סביב שאילתות-DB.
 * משלים את `sm2.ts` (שמחשב `nextReviewAt`) — כאן מחליטים מה *להגיש*.
 *
 * Schema-as-is: שאלה "due" = ל-question_attempts שלה `next_review_at <= now`.
 * שאלה "fresh" = ללא question_attempts כלל (טרם-נראתה).
 */

/** פריט-חזרה: מזהה-שאלה + מועד-החזרה הבא (null = טרם-תוזמן). */
export interface ReviewItem {
  questionId: string;
  nextReviewAt: Date | null;
}

/**
 * מחזיר את מזהי-השאלות שהגיע-זמן-חזרתן (`nextReviewAt <= now`), ממוין מהדחוף-ביותר
 * (overdue) לפחות-דחוף. פריטים ללא `nextReviewAt` אינם "due" (הם חדשים/לא-מתוזמנים).
 */
export function selectDueQuestions(items: ReviewItem[], now: Date): string[] {
  return items
    .filter((it): it is ReviewItem & { nextReviewAt: Date } => it.nextReviewAt != null)
    .filter((it) => it.nextReviewAt.getTime() <= now.getTime())
    .sort((a, b) => a.nextReviewAt.getTime() - b.nextReviewAt.getTime())
    .map((it) => it.questionId);
}

export interface BuildQueueArgs {
  /** מזהי-שאלות-לחזרה (due), רצוי ממוינים לפי-דחיפות (פלט selectDueQuestions). */
  due: string[];
  /** מזהי-שאלות-חדשות (טרם-נראו). */
  fresh: string[];
  /** גודל-הסשן (מספר-שאלות מקסימלי). */
  limit: number;
  /** חלק-הסשן שיוקצה לשאלות-חדשות (0..1, ברירת-מחדל 0.3). */
  newRatio?: number;
}

/**
 * בונה תור-תרגול: מערבב חזרות-שהגיע-זמנן עם שאלות-חדשות לפי מכסה.
 * - מקצה עד `floor(limit×newRatio)` לשאלות-חדשות, השאר לחזרות.
 * - אם לאחד אין מספיק — ממלא מהשני (ניצול-מלא של `limit`).
 * - חזרות לפני חדשות (סדר דטרמיניסטי), ללא-כפילויות, ≤ `limit`.
 *
 * @throws {RangeError} אם limit<0 או newRatio מחוץ ל-[0,1].
 */
export function buildPracticeQueue({
  due,
  fresh,
  limit,
  newRatio = 0.3,
}: BuildQueueArgs): string[] {
  if (!Number.isFinite(limit) || limit < 0) {
    throw new RangeError(`limit must be >= 0, got ${limit}`);
  }
  if (newRatio < 0 || newRatio > 1) {
    throw new RangeError(`newRatio must be in [0,1], got ${newRatio}`);
  }
  if (limit === 0) return [];

  // dedupe תוך-שמירת-סדר, ומניעת חפיפה (fresh לא יכיל מזהה שכבר ב-due).
  const seen = new Set<string>();
  const dedupe = (ids: string[]): string[] => {
    const out: string[] = [];
    for (const id of ids) {
      if (!seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
    return out;
  };
  const dueU = dedupe(due);
  const freshU = dedupe(fresh);

  const newQuota = Math.min(freshU.length, Math.floor(limit * newRatio));
  const dueQuota = Math.min(dueU.length, limit - newQuota);

  const queue = [...dueU.slice(0, dueQuota), ...freshU.slice(0, newQuota)];

  // ניצול-מלא: אם נשאר מקום, השלם מהיתרות (קודם חזרות, אחר-כך חדשות).
  if (queue.length < limit) {
    const used = new Set(queue);
    for (const id of [...dueU, ...freshU]) {
      if (queue.length >= limit) break;
      if (!used.has(id)) {
        queue.push(id);
        used.add(id);
      }
    }
  }
  return queue.slice(0, limit);
}

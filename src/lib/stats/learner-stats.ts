/**
 * src/lib/stats/learner-stats.ts — גזירת סטטיסטיקות-לומד מתוך ניסיונות-המענה.
 *
 * הליבה-החישובית של ה-Dashboard (F2): במקום mock-data, נתוני-הלומד (XP, רצף-ימים,
 * דיוק, מענה-היום) נגזרים דטרמיניסטית מ-`question_attempts`. ה-DB-query והחיווט
 * ל-UI הם העטיפה סביב הפונקציה הזו.
 *
 * **לוגיקה-טהורה, דטרמיניסטית, ללא DB/AI.** קלט = רשומות-ניסיון מינימליות.
 *
 * Schema-as-is (drizzle/schema.ts · question_attempts):
 * - `isCorrect`   (boolean)     — האם נכון.
 * - `attemptedAt` (timestamptz) — מתי.
 *
 * הערה: "יום" לחישוב-רצף מבוסס **UTC** (דטרמיניסטי, ללא תלות-אזור-זמן). חיווט-UI
 * עם אזור-זמן-משתמש = החלטה עתידית (שדה tz בפרופיל).
 */

/** רשומת-ניסיון מינימלית הדרושה לחישוב-סטטיסטיקות. */
export interface AttemptRecord {
  isCorrect: boolean;
  attemptedAt: Date;
}

/** סיכום-סטטיסטיקות הלומד. */
export interface LearnerStats {
  /** סך-הניסיונות. */
  total: number;
  /** ניסיונות-נכונים. */
  correct: number;
  /** דיוק באחוזים (0..100, מעוגל). 0 כשאין-ניסיונות. */
  accuracy: number;
  /** נקודות-ניסיון: נכון×10 + שגוי×2. */
  xp: number;
  /** רצף-ימים נוכחי (ימים-רצופים פעילים שמסתיימים היום/אתמול; אחרת 0). */
  currentStreakDays: number;
  /** הרצף-הארוך-ביותר אי-פעם. */
  longestStreakDays: number;
  /** כמה נענו היום (UTC). */
  answeredToday: number;
}

/** XP לתשובה-נכונה. */
export const XP_CORRECT = 10;
/** XP לתשובה-שגויה (תגמול-מאמץ). */
export const XP_INCORRECT = 2;

/** מפתח-יום ב-UTC (YYYY-MM-DD). */
function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** מפתח-היום של `from` בתוספת `days` (UTC). */
function dayKeyOffset(from: Date, days: number): string {
  return dayKey(new Date(from.getTime() + days * 86_400_000));
}

/**
 * מסכם את ניסיונות-הלומד לאובייקט-סטטיסטיקות. דטרמיניסטי (תלוי רק בקלט + `now`).
 *
 * @param attempts רשומות-הניסיון (סדר לא-משנה).
 * @param now העכשיו (לחישוב "היום" והרצף) — חובה להעביר (נבדק/דטרמיניסטי).
 */
export function summarizeLearnerStats(attempts: AttemptRecord[], now: Date): LearnerStats {
  const total = attempts.length;
  if (total === 0) {
    return {
      total: 0,
      correct: 0,
      accuracy: 0,
      xp: 0,
      currentStreakDays: 0,
      longestStreakDays: 0,
      answeredToday: 0,
    };
  }

  let correct = 0;
  const activeDays = new Set<string>();
  const todayKey = dayKey(now);
  let answeredToday = 0;

  for (const a of attempts) {
    if (a.isCorrect) correct++;
    const k = dayKey(a.attemptedAt);
    activeDays.add(k);
    if (k === todayKey) answeredToday++;
  }

  const xp = correct * XP_CORRECT + (total - correct) * XP_INCORRECT;
  const accuracy = Math.round((correct / total) * 100);

  return {
    total,
    correct,
    accuracy,
    xp,
    currentStreakDays: currentStreak(activeDays, now),
    longestStreakDays: longestStreak(activeDays),
    answeredToday,
  };
}

/** רצף-נוכחי: ימים-רצופים שמסתיימים היום או אתמול (אחרת הרצף נשבר → 0). */
function currentStreak(activeDays: Set<string>, now: Date): number {
  const todayKey = dayKey(now);
  const yesterdayKey = dayKeyOffset(now, -1);
  let anchorOffset: number;
  if (activeDays.has(todayKey)) anchorOffset = 0;
  else if (activeDays.has(yesterdayKey)) anchorOffset = -1;
  else return 0;

  let streak = 0;
  let offset = anchorOffset;
  while (activeDays.has(dayKeyOffset(now, offset))) {
    streak++;
    offset--;
  }
  return streak;
}

/** הרצף-הארוך-ביותר: ריצת-הימים-הרצופים המקסימלית בכל ההיסטוריה. */
function longestStreak(activeDays: Set<string>): number {
  if (activeDays.size === 0) return 0;
  const days = [...activeDays].sort(); // YYYY-MM-DD ממיין כרונולוגית
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1];
    const cur = days[i];
    if (prev === undefined || cur === undefined) continue;
    const consecutive =
      new Date(`${prev}T00:00:00Z`).getTime() + 86_400_000 ===
      new Date(`${cur}T00:00:00Z`).getTime();
    run = consecutive ? run + 1 : 1;
    if (run > longest) longest = run;
  }
  return longest;
}

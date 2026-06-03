/**
 * src/lib/srs/sm2.ts — מנוע חזרה-מרווחת (Spaced Repetition) לפי אלגוריתם SM-2.
 *
 * זהו ה-engine של חזרה-מרווחת ב-StudiBuilder: בהינתן ביצוע-המשתמש על שאלה, הוא
 * מחשב מתי השאלה תחזור, וכמה "קל" היא לו (ease factor). זה מאפשר ללומד לחזור על
 * חומר-הוועדה ביעילות — שאלות-שקשות חוזרות תכופות, שאלות-קלות מתרחקות.
 *
 * **לוגיקה-טהורה, ללא תופעות-לוואי, ללא AI ו-ללא DB** — ה-DB (questionAttempts)
 * מאחסן את התוצאה (`sr_interval_days`, `sr_ease_factor`, `next_review_at`).
 *
 * Schema-as-is (drizzle/schema.ts · questionAttempts):
 * - `srIntervalDays`  (smallint)            — האינטרוול הנוכחי בימים.
 * - `srEaseFactor`    (numeric(3,2), def 2.5) — מקדם-הקלות.
 * - `nextReviewAt`    (timestamptz)          — מתי השאלה חוזרת.
 *
 * אין בסכמה מונה-חזרות (repetition count) נפרד — לכן את התקדמות-האינטרוול
 * (1 → 6 → interval×EF) אנו גוזרים מהאינטרוול-הקודם בלבד, מה שמתיישב במדויק עם
 * שדות-הסכמה ושומר על האלגוריתם נטול-מצב-חיצוני.
 *
 * מקור: SuperMemo SM-2 (Woźniak 1990) — הנוסחה הקנונית, עם clamp ל-EF≥1.3.
 */

/** מקדם-הקלות המינימלי (SM-2 קנוני). מתחת לזה שאלות נתקעות בלולאת-חזרה אינסופית. */
export const SM2_MIN_EASE = 1.3;

/** מקדם-הקלות ההתחלתי (ברירת-מחדל בסכמה). */
export const SM2_DEFAULT_EASE = 2.5;

/** מצב-החזרה הקודם של שאלה (כפי שנשמר ב-questionAttempts), כקלט לחישוב הבא. */
export interface Sm2State {
  /** האינטרוול הקודם בימים. 0/שלילי/לא-מוגדר ⇒ שאלה-חדשה (טרם-נחזרה). */
  intervalDays: number;
  /** ה-EF הקודם. ≤0/לא-מוגדר ⇒ ברירת-המחדל (2.5). */
  easeFactor: number;
}

/** תוצאת-חישוב: המצב-החדש + מועד-החזרה. */
export interface Sm2Review {
  /** האינטרוול-החדש בימים (≥1). */
  intervalDays: number;
  /** ה-EF-החדש (מעוגל ל-2 ספרות, ≥1.3). */
  easeFactor: number;
  /** מועד-החזרה: `now` + `intervalDays`. */
  nextReviewAt: Date;
}

/** עיגול ל-2 ספרות (להתאמה ל-numeric(3,2) בסכמה). */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** clamp ל-EF≥1.3 (קנוני). */
export function clampEase(ef: number): number {
  return ef < SM2_MIN_EASE ? SM2_MIN_EASE : round2(ef);
}

/**
 * עדכון מקדם-הקלות לפי איכות-הזכירה (q∈0..5), נוסחת-SM-2 הקנונית:
 *   EF' = EF + (0.1 − (5−q)·(0.08 + (5−q)·0.02))
 * מוחל על **כל** q (גם כשל), עם clamp ל-1.3.
 */
export function updateEase(prevEase: number, quality: number): number {
  const q = clampQuality(quality);
  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  return clampEase(prevEase + delta);
}

/** מוודא ש-q שלם בטווח 0..5; אחרת זורק (קלט-לא-תקין = מצב-שגיאה מתוכנן). */
function clampQuality(quality: number): number {
  if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
    throw new RangeError(`SM-2 quality must be an integer in 0..5, got: ${quality}`);
  }
  return quality;
}

/** מוסיף `days` ימים ל-`from` (UTC-safe; לא משנה את המקור). */
function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * החישוב המרכזי: בהינתן המצב-הקודם, איכות-הזכירה (0..5) ו-`now`, מחזיר את
 * האינטרוול-החדש, ה-EF-החדש ומועד-החזרה.
 *
 * כללי-האינטרוול (SM-2):
 * - q < 3 (כשל-זכירה): איפוס — חוזרים מחר (interval=1), ה-EF עדיין נענש.
 * - q ≥ 3 (הצלחה): interval-קודם 0 → 1 · <6 → 6 · ≥6 → round(interval×EF-קודם).
 *
 * @param now חובה להעביר (דטרמיניסטיות + נבדק) — לא קוראים `new Date()` בפנים.
 */
export function reviewCard(state: Sm2State, quality: number, now: Date): Sm2Review {
  const q = clampQuality(quality);
  const prevInterval = state.intervalDays > 0 ? Math.floor(state.intervalDays) : 0;
  const prevEase = state.easeFactor > 0 ? state.easeFactor : SM2_DEFAULT_EASE;

  let intervalDays: number;
  if (q < 3) {
    intervalDays = 1; // lapse — relearn tomorrow
  } else if (prevInterval <= 0) {
    intervalDays = 1; // first successful review
  } else if (prevInterval < 6) {
    intervalDays = 6; // second successful review
  } else {
    intervalDays = Math.round(prevInterval * prevEase); // steady-state growth
  }

  return {
    intervalDays,
    easeFactor: updateEase(prevEase, q),
    nextReviewAt: addDays(now, intervalDays),
  };
}

/** קלט למיפוי ביצוע-שאלה ל-q של SM-2. */
export interface AttemptGradeInput {
  /** האם נענה נכון. */
  isCorrect: boolean;
  /** זמן-המענה בשניות (אופציונלי — אם חסר, נכון=4/שגוי=2). */
  timeSpentSeconds?: number | null;
  /** זמן-יעד "סביר" בשניות לשאלה זו (ברירת-מחדל 30). מהיר מזה ⇒ q גבוה יותר. */
  expectedSeconds?: number;
}

/**
 * ממפה ביצוע-שאלה בינארי (נכון/שגוי + זמן) ל-q∈0..5 של SM-2.
 * שאלות-הקוויז אינן מדרגות 0..5 ישירות, אז זו ההמרה:
 * - שגוי                → 2 (ניסה אך נכשל; <3 ⇒ lapse).
 * - נכון, איטי (>2×יעד) → 3.
 * - נכון, רגיל          → 4.
 * - נכון, מהיר (≤½יעד)  → 5.
 * נכון-ללא-זמן ⇒ 4 · שגוי-ללא-זמן ⇒ 2.
 */
export function gradeFromAttempt({
  isCorrect,
  timeSpentSeconds,
  expectedSeconds = 30,
}: AttemptGradeInput): number {
  if (!isCorrect) return 2;
  if (timeSpentSeconds == null || timeSpentSeconds <= 0) return 4;
  if (timeSpentSeconds <= expectedSeconds * 0.5) return 5;
  if (timeSpentSeconds > expectedSeconds * 2) return 3;
  return 4;
}

/**
 * src/lib/grading/keyword-match.ts — ציון-עצמי לשאלות-שו"ת-פתוחות (אפס-AI).
 *
 * הלומד כותב את תשובתו, והמערכת משווה למילות-המפתח שבתשובת-המודל כדי לתת חיווי
 * עצמי: נכונה / חלקית / לא-נכונה. **היוריסטי** (עברית ללא-stemming מלא) — עזר-תרגול,
 * לא ציון-אמת אוטוריטטיבי. טהור (ללא I/O / AI) → בר-בדיקה ונטען בבטחה בלקוח.
 *
 * שיטה: נרמול (הסרת ניקוד/פיסוק) → חילוץ מילות-תוכן מתשובת-המודל (סינון מילות-קישור
 * וקצרות) → התאמת-substring דו-כיוונית (מטפלת בקידומות-עברית ו/ה/ב/ל באופן טבעי:
 * "מפקח" נמצא בתוך "ולמפקח") → יחס-התאמה → סף-ציון.
 */

export type OpenGrade = 'correct' | 'partial' | 'incorrect';

export interface OpenGradeResult {
  grade: OpenGrade;
  /** כמה ממילות-המפתח של המודל נמצאו בתשובת-הלומד. */
  matched: number;
  /** סך מילות-המפתח של המודל. */
  total: number;
  /** מילות-המפתח שכוסו בתשובת-הלומד (ל"ראה את הקשר"). */
  matchedWords: string[];
  /** מילות-המפתח שהוחמצו. */
  missedWords: string[];
}

/** ניקוד עברי (טעמים/נקודות) להסרה לפני השוואה. */
const NIQQUD = /[֑-ׇ]/g;
/** מילות-קישור/תפקוד שאינן נושאות-תוכן (לא נספרות כמילות-מפתח). */
const STOPWORDS = new Set([
  'של',
  'על',
  'את',
  'עם',
  'או',
  'גם',
  'כי',
  'אם',
  'לא',
  'יש',
  'אין',
  'זה',
  'זו',
  'זאת',
  'הוא',
  'היא',
  'הם',
  'הן',
  'אשר',
  'כל',
  'אל',
  'מן',
  'כמו',
  'בין',
  'לפי',
  'אך',
  'רק',
  'וכן',
  'כך',
  'כדי',
  'אלא',
  'עד',
  'לכן',
  'אבל',
  'לגבי',
  'תחת',
  'מעל',
  'אצל',
  'היה',
  'היו',
  'יהיה',
  'להיות',
  'אותו',
  'אותה',
  'אותם',
  'שלה',
  'שלו',
  'שהוא',
  'שיש',
  'אחד',
  'אחת',
  'שני',
  'שתי',
  'יותר',
  'פחות',
  'מאוד',
  'כאשר',
  'אותן',
  'ועל',
  'ואת',
  ' זה',
]);

/** נרמול: הסרת ניקוד+פיסוק, צמצום-רווחים. */
function normalize(s: string): string {
  return s
    .replace(NIQQUD, '')
    .replace(/["'״׳`.,;:!?()\[\]{}\-–—/\\|•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** מילות-תוכן ייחודיות (≥3 תווים · לא-stopword) — ללא-stemming. */
function contentWords(s: string): string[] {
  const out = new Set<string>();
  for (const w of normalize(s).split(' ')) {
    if (w.length >= 3 && !STOPWORDS.has(w)) out.add(w);
  }
  return [...out];
}

/**
 * משווה את תשובת-הלומד למילות-המפתח של המודל ומחזיר ציון-עצמי.
 *
 * ההתאמה היא **substring דו-כיווני** בין מילות-המודל למילות-הלומד — כך קידומות-עברית
 * (ו/ה/ב/ל) מטופלות טבעית ("מפקח" מוכל ב-"ולמפקח"). ספים: ≥60% נכונה · ≥25% חלקית ·
 * אחרת לא-נכונה. מודל קצר-מאוד (≤2 מילות-מפתח) נמדד בנדיבות (התאמה-אחת = חלקית-לפחות).
 */
export function gradeOpenAnswer(studentAnswer: string, modelAnswer: string): OpenGradeResult {
  const keywords = contentWords(modelAnswer);
  const total = keywords.length;
  if (total === 0)
    return { grade: 'partial', matched: 0, total: 0, matchedWords: [], missedWords: [] };

  const studentWords = contentWords(studentAnswer);
  const studentNorm = normalize(studentAnswer);
  const hit = (kw: string): boolean =>
    studentNorm.includes(kw) || // "מפקח" מוכל ב-"ולמפקח" (קידומת)
    studentWords.some((sw) => sw.includes(kw) || kw.includes(sw));
  const matchedWords = keywords.filter(hit);
  const missedWords = keywords.filter((kw) => !hit(kw));
  const matched = matchedWords.length;

  const ratio = matched / total;
  let grade: OpenGrade;
  if (ratio >= 0.6) grade = 'correct';
  else if (ratio >= 0.25 || (total <= 2 && matched >= 1)) grade = 'partial';
  else grade = 'incorrect';

  return { grade, matched, total, matchedWords, missedWords };
}

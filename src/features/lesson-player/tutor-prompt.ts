/**
 * src/features/lesson-player/tutor-prompt.ts — לוגיקה-טהורה למורה-AI (system + prompt + fallback).
 *
 * מופרד מ-tutor-explain.action.ts (server · IO) כדי להיות **טהור וניתן-לטסט** (ללא getUser/claude).
 * דפוס זהה ל-jsa-generation.ts מול generate-jsa.action.ts.
 */

export interface TutorRequest {
  /** השאלה בשיעור (ההקשר). */
  questionPrompt: string;
  /** התשובה-הנכונה / תשובת-המודל (הקשר · אופציונלי). */
  correctAnswer?: string;
  /** נושא/תווית (אופציונלי). */
  topic?: string;
  /** שאלת-ההמשך החופשית של הלומד. */
  userQuestion: string;
}

export interface TutorResponse {
  /** תשובת-המורה (עברית). */
  answer: string;
  /** מקור — לתצוגה + telemetry. */
  source: 'claude' | 'fallback';
}

export const SYSTEM_TUTOR = `\
אתה מורה-פרטי סבלני וחם לקורס "ממונה על הבטיחות בעבודה" (עברית · RTL).
תפקידך: להסביר ללומד את מה שלא הבין, בבהירות, מבוסס על השאלה והתשובה-הנכונה שסופקו לך
ועל ידע-הבטיחות-התעסוקתי.

עקרונות:
- הסבר את ה"למה", לא רק את ה"מה". קשר לעיקרון הרלוונטי (מדרג-הבקרות · צמ"א-אחרון ·
  הערכת-סיכון חומרה×סבירות · חובת-המעסיק).
- ציטוט-חקיקה: ציין חוק/תקנה ספציפי **רק אם אתה בטוח** (שם + שנה + סעיף). אם אינך-בטוח —
  אמור "כדאי לאמת במקור-החקיקה" במקום להמציא מספר-סעיף.
- קצר וממוקד: 2-5 משפטים. עברית בלבד. טון מעודד, לא מתנשא.
- אם השאלה אינה-קשורה לבטיחות-בעבודה — החזר את הלומד בעדינות לנושא-הקורס.`;

/** בונה prompt מובנה מהבקשה. */
export function buildTutorPrompt(req: TutorRequest): string {
  return (
    `## השאלה בשיעור\n${req.questionPrompt.trim()}\n\n` +
    (req.correctAnswer?.trim() ? `## התשובה-הנכונה\n${req.correctAnswer.trim()}\n\n` : '') +
    (req.topic?.trim() ? `## נושא\n${req.topic.trim()}\n\n` : '') +
    `## מה הלומד שואל\n${req.userQuestion.trim()}\n\n` +
    `הסבר ללומד בבהירות (2-5 משפטים · עברית · צטט-תקנה רק אם בטוח).`
  );
}

/** fallback דטרמיניסטי (ללא-Claude / כשל / לא-מחובר). */
export function tutorFallback(req: TutorRequest): TutorResponse {
  const lead = req.correctAnswer?.trim()
    ? `נקודת-המוצא: ${req.correctAnswer.trim()}`
    : 'כדאי לחזור על החומר בנושא זה, ולשים לב לעיקרון מאחורי השאלה (מדרג-הבקרות · הערכת-הסיכון).';
  return {
    answer: `${lead}\n\n(מורה-ה-AI אינו זמין כעת — עיין בהסבר-לעומק ובמקור-החקיקה לפירוט מלא.)`,
    source: 'fallback',
  };
}

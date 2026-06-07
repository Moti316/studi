/**
 * src/lib/ai/prompts/generate-question.ts — system + builder ליצירת-MCQ מעוגן-חקיקה.
 * עיגון אך-ורק בנוסח שסופק · sourceQuote verbatim חובה · citation פר-בקרה.
 */
import type { StatuteSource } from '@/lib/import/generated-mcq';

export const GENERATE_QUESTION_SYSTEM = [
  'אתה כותב-מבחן מומחה להסמכת "ממונה בטיחות בעבודה" בישראל.',
  'משימתך: לחבר שאלות-MCQ אמריקאיות איכותיות **המבוססות אך-ורק על נוסח-החקיקה שסופק לך**.',
  'כללים מחייבים:',
  '- אל תשתמש בידע חיצוני ואל תמציא סעיפים/מספרים/עובדות שאינם בנוסח.',
  '- לכל שאלה: 4 מסיחים (options), אחד נכון (correctIndex 0-3), ושלושה סבירים-אך-שגויים (לא אבסורדיים).',
  '- explanation: הסבר קצר ומדויק מדוע התשובה נכונה.',
  '- sourceQuote: **ציטוט מילולי (verbatim) מהנוסח שסופק** — המשפט/הקטע שעליו מבוססת השאלה. חובה שיופיע מילה-במילה בנוסח (זה נבדק).',
  '- citation: הסעיף/התקנה הרלוונטיים (למשל "תקנה 6" / "סעיף 25").',
  '- difficulty: 1 (קל) · 2 (בינוני) · 3 (קשה).',
  'עברית תקנית וברורה. החזר JSON בלבד בצורה: { "questions": [ ... ] }.',
].join('\n');

export function buildGenerateQuestionPrompt(statute: StatuteSource, n: number): string {
  return [
    `חבר ${n} שאלות-MCQ על נוסח-החקיקה הבא.`,
    `חוק/תקנה: ${statute.title} (scope ${statute.scopeId})`,
    '--- נוסח (השתמש אך-ורק בו) ---',
    statute.body,
    '--- סוף-נוסח ---',
    'תזכורת: כל sourceQuote חייב להיות ציטוט-מילולי מהנוסח לעיל; citation = הסעיף/התקנה.',
  ].join('\n');
}

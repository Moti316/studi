import type { Metadata } from 'next';
import { requireCreator } from '@/lib/auth/creator';
import {
  listQuestionsForTagging,
  updateQuestionTags,
} from './actions';
import { QuestionTagger } from '@/features/admin-tagging/components/QuestionTagger';
import type { Question } from '../../../../drizzle/schema';

export const metadata: Metadata = {
  title: 'תיוג שאלות',
};

/**
 * תור-התיוג תלוי-DB ו-session — חייב רינדור-דינמי (אסור static/ISR).
 */
export const dynamic = 'force-dynamic';

/**
 * `/admin/questions` — מסך תיוג-היקף ל-~540 השאלות המיובאות (creator-only).
 *
 * Server Component:
 *   1. `requireCreator` בראש (שכבת-הגנה שנייה מעל ה-layout — defence in depth;
 *      גם `listQuestionsForTagging` אוכף שוב בצד-הפעולה).
 *   2. טוען את תור-התיוג (untagged-first). כל-עוד הייבוא לא רץ ה-DB ריק —
 *      מטופל ב-empty-state ידידותי בתוך <QuestionTagger>.
 *   3. שגיאת-DB (חיבור/הרשאות) → error-state במקום קריסה.
 *   4. מרכיב את <QuestionTagger> ומעביר את הפעולה `updateQuestionTags` (server
 *      action) כ-prop — הרכיב נשאר server-agnostic ובדיק.
 */
export default async function AdminQuestionsPage() {
  await requireCreator('/admin/questions');

  let questions: Question[];
  try {
    questions = await listQuestionsForTagging();
  } catch {
    // הכשל כבר תועד דרך logError ב-listQuestionsForTagging (טלמטריה אחידה,
    // hook ל-Sentry ב-Phase 9). כאן רק מציגים מצב-שגיאה נקי בלי פרטי-תשתית.
    return (
      <div
        dir="rtl"
        role="alert"
        data-testid="questions-error"
        className="flex flex-col items-center gap-3 rounded-md border border-error/40 bg-error/5 px-6 py-12 text-center"
      >
        <span className="text-4xl" aria-hidden="true">
          ⚠️
        </span>
        <h1 className="text-lg font-bold">טעינת תור-התיוג נכשלה</h1>
        <p className="text-foreground/70 mx-auto max-w-sm text-sm">
          לא הצלחנו לטעון את השאלות כרגע. ודא שחיבור-ה-DB מוגדר ונסה לרענן.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">תיוג-היקף לשאלות</h1>
        <p className="text-foreground/70 text-sm">
          אשר או תקן את הצעת-Gemini לכל שאלה, ושייך אותה למזהי-ההיקף הרלוונטיים מתוך
          57 פריטי-הוועדה.
        </p>
      </div>

      <QuestionTagger questions={questions} onSave={updateQuestionTags} />
    </div>
  );
}

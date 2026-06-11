'use client';

/**
 * /preview/lesson — תצוגה-מקדימה (dev) של נגן-השיעור בעיצוב-החדש (B1 bold · 2026-06-11).
 *
 * מרנדר את <LessonPlayer> עם שאלות-דמה (אפס auth/DB) כדי לאמת ויזואלית את הרענון-העיצובי
 * (header-chips · כרטיסי-MCQ מוגבהים · summary gradient-hero). תוכן-דמה אמיתי לדומיין (בטיחות).
 */

import { LessonPlayer } from '@/features/lesson-player/LessonPlayer';
import type { Question } from '../../../../drizzle/schema';

/** בונה Question-דמה מלא (ממלא ברירות-מחדל · cast לטיפוס-הסכמה · preview בלבד). */
function q(partial: Partial<Question> & Pick<Question, 'id' | 'type' | 'prompt'>): Question {
  return {
    options: null,
    correctAnswer: null,
    explanation: null,
    sourceChunkId: null,
    scenarioId: null,
    scopeRefs: [],
    inScope: true,
    status: 'מאומת',
    difficulty: 2,
    sourceRef: null,
    createdAt: new Date(0),
    ...partial,
  } as Question;
}

const MOCK_QUESTIONS: Question[] = [
  q({
    id: 'p-0',
    type: 'matching',
    prompt: 'התאם כל מונח-בטיחות להגדרתו',
    options: [
      {
        left: 'מדרג-הבקרות',
        right: 'סדר-עדיפויות לטיפול בסיכון: חיסול → החלפה → הנדסי → מנהלי → צמ"א',
      },
      { left: 'JSA', right: 'ניתוח-בטיחות-עבודה — פירוק משימה לשלבים וזיהוי הסיכון בכל שלב' },
      { left: 'SDS', right: 'גיליון-בטיחות המרכז מידע על חומר מסוכן, סיכוניו ואמצעי-המניעה' },
      { left: 'צמ"א', right: 'ציוד-מגן-אישי — קו-ההגנה האחרון, מגן על העובד הבודד בלבד' },
    ],
  }),
  q({
    id: 'p-1',
    type: 'mcq_long',
    prompt: 'מהו הצעד הראשון במדרג-הבקרות (Hierarchy of Controls) להפחתת סיכון תעסוקתי?',
    options: [
      'סילוק מקור-הסיכון (חיסול)',
      'אספקת ציוד-מגן-אישי (צמ"א) לעובדים',
      'תלייה של שילוט-אזהרה באזור',
      'הדרכת-עובדים על נוהל-העבודה',
    ],
    correctAnswer: { index: 0 },
    explanation:
      'מדרג-הבקרות (ISO 45001) מורה על סדר-עדיפויות: **חיסול → החלפה → בקרה-הנדסית → בקרה-מנהלתית → צמ"א**. ' +
      'צמ"א הוא קו-ההגנה האחרון — נוקטים בו רק כשלא ניתן להפחית את הסיכון במקור.',
  }),
  q({
    id: 'p-2',
    type: 'mcq_short',
    prompt: 'איזה מסמך מרכז את המידע על חומר מסוכן, תכונותיו והסיכונים שבו?',
    options: ['SDS', 'JSA', 'ISO', 'PPE'],
    correctAnswer: { index: 0 },
    explanation:
      'גיליון-בטיחות (SDS — Safety Data Sheet) מרכז את נתוני-החומר המסוכן: תכונות, סיכונים, ' +
      'אמצעי-מניעה וטיפול-חירום. חובה להחזיקו נגיש לעובדים העובדים עם החומר.',
  }),
  q({
    id: 'p-3',
    type: 'explanation',
    prompt: 'הסבר בקצרה: מדוע צמ"א (ציוד-מגן-אישי) נחשב לקו-ההגנה האחרון במדרג-הבקרות?',
    correctAnswer: {
      text:
        'צמ"א מגן על העובד הבודד אך אינו מסיר את מקור-הסיכון עצמו — הסיכון ממשיך להתקיים בסביבת-העבודה. ' +
        'הוא תלוי בשימוש-נכון-ועקבי של העובד, עלול להיכשל, ואינו מגן על אחרים בסביבה. לכן נוקטים בו רק לאחר ' +
        'שמיצו בקרות הנדסיות ומנהלתיות המפחיתות את הסיכון במקור.',
    },
    explanation:
      'עקרון-יסוד: בקרה גבוהה-במדרג (חיסול/הנדסי) מפחיתה את הסיכון לכלל-העובדים ואינה תלויה בהתנהגות-אנוש, ' +
      'בעוד צמ"א מגן רק על הלובש ורק כשנעשה בו שימוש-נכון.',
  }),
];

export default function PreviewLessonPage() {
  return (
    <main dir="rtl" className="min-h-dvh bg-background px-4 py-8 font-hebrew">
      <div className="mx-auto mb-4 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-quiz-text-secondary">
          תצוגה-מקדימה (dev)
        </p>
        <h1 className="text-lg font-extrabold text-quiz-text-primary">נגן-שיעור · עיצוב חדש</h1>
      </div>
      <LessonPlayer questions={MOCK_QUESTIONS} />
    </main>
  );
}

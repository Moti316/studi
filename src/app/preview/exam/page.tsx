'use client';

/**
 * /preview/exam — תצוגה-מקדימה (dev) של מבחן-הדמה (D3) עם שאלות-mock (אפס auth/DB).
 * טיימר מקוצר (2 דק') לאימות-ויזואלי של זרימת-המבחן והתוצאות.
 */

import { ExamPlayer } from '@/features/exam/ExamPlayer';
import type { Question } from '../../../../drizzle/schema';

function q(id: string, prompt: string, options: string[], correct: number): Question {
  return {
    id,
    type: 'mcq_long',
    prompt,
    options,
    correctAnswer: { index: correct },
    explanation: 'הסבר-דוגמה מעוגן-חקיקה לשאלה זו.',
    sourceChunkId: null,
    scenarioId: null,
    scopeRefs: [],
    inScope: true,
    status: 'מאומת',
    difficulty: 2,
    sourceRef: null,
    createdAt: new Date(0),
  } as Question;
}

const MOCK: Question[] = [
  q('e1', 'מהו הצעד הראשון במדרג-הבקרות?', ['חיסול מקור-הסיכון', 'צמ"א', 'שילוט', 'הדרכה'], 0),
  q('e2', 'מי ממנה ממונה-בטיחות במפעל?', ['המעסיק', 'העובדים', 'המפקח', 'הוועדה'], 0),
  q('e3', 'איזה מסמך מרכז מידע על חומר מסוכן?', ['SDS', 'JSA', 'ISO', 'PPE'], 0),
];

export default function PreviewExamPage() {
  return (
    <main dir="rtl" className="mx-auto min-h-dvh max-w-2xl bg-background px-4 py-8 font-hebrew">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-quiz-text-secondary">
          תצוגה-מקדימה (dev) · טיימר-מקוצר 2 דק'
        </p>
        <h1 className="text-lg font-extrabold text-quiz-text-primary">מבחן-דמה · D3</h1>
      </div>
      <ExamPlayer questions={MOCK} durationMin={2} />
    </main>
  );
}

'use client';

/**
 * /preview/tutor — תצוגה-מקדימה (dev) של מורה-ה-AI (בלוק-4).
 * מרנדר את <TutorChat> עם הקשר-שאלה לדוגמה. (הקריאה ל-Claude דורשת auth + מפתח →
 * ב-preview לא-מחובר תתקבל תשובת-fallback; הזרימה והעיצוב נבדקים.)
 */

import { TutorChat } from '@/features/lesson-player/components/TutorChat';

export default function PreviewTutorPage() {
  return (
    <main dir="rtl" className="min-h-dvh bg-background px-4 py-8 font-hebrew">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-quiz-text-secondary">
            תצוגה-מקדימה (dev)
          </p>
          <h1 className="text-lg font-extrabold text-quiz-text-primary">מורה-AI · בלוק-4</h1>
        </div>
        <p className="rounded-card bg-quiz-explanation px-3 py-2 text-sm text-quiz-text-secondary">
          שאלת-הדוגמה: "מהו הצעד הראשון במדרג-הבקרות?" · תשובה: "סילוק מקור-הסיכון (חיסול)".
        </p>
        <TutorChat
          questionPrompt="מהו הצעד הראשון במדרג-הבקרות (Hierarchy of Controls) להפחתת סיכון תעסוקתי?"
          correctAnswer="סילוק מקור-הסיכון (חיסול) — הבקרה הגבוהה-ביותר במדרג."
          topic="ניהול-סיכונים · מדרג-הבקרות"
        />
      </div>
    </main>
  );
}

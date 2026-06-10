/**
 * /preview/capstone — תצוגה-מקדימה של פרויקט-הגמר (JSA Capstone · ADR-016/017).
 *
 * מרנדר את <CapstoneFlow>: אשף 4-שלבים (פרופיל-אתר → טבלת-JSA → מטריצת-סיכון 4×4 → משוב-AI).
 * **ציבורי · dev-preview בלבד** — להדגמה למוטי לפני ה-route המוגן `/capstone`.
 * בלי auth → ה-evaluate-capstone.action נופל ל-fallback דטרמיניסטי (האשף עצמו עובד מלא).
 */
import { CapstoneFlow } from '@/features/final-project/CapstoneFlow';

export const dynamic = 'force-dynamic';

export default function PreviewCapstonePage() {
  return (
    <div className="flex min-h-dvh flex-col" dir="rtl">
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4 pb-12 font-hebrew">
        <header className="space-y-1">
          <span className="text-xs font-bold text-quiz-primary-active">
            פרויקט גמר (תצוגה-מקדימה)
          </span>
          <h1 className="text-2xl font-bold text-quiz-text-primary">ניהול סיכונים — JSA</h1>
          <p className="text-sm text-quiz-text-secondary">
            בנה טבלת-JSA לאתר-העבודה שלך, הערך סיכונים לפי מטריצת-4×4 של משרד-העבודה, וקבל משוב על
            העבודה.
          </p>
        </header>
        <CapstoneFlow />
      </main>
    </div>
  );
}

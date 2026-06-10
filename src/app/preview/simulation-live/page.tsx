/**
 * /preview/simulation-live — תצוגה-מקדימה של סימולציית-הוועדה **הפתוחה-החיה** (ADR-018).
 *
 * מרנדר את <LiveSimulationPlayer>: דיאלוג-פתוח (textarea) → Claude (פרומפט-מגן) מעריך ומגיב
 * כמפקח. **ציבורי · dev-preview בלבד** — להדגמה למוטי לפני שילוב ב-`/lesson` המוגן.
 * בלי `ANTHROPIC_API_KEY` → fallback דטרמיניסטי (עדיין משחק, ללא הבנת-נרדפים).
 */
import { LiveSimulationPlayer } from '@/features/simulation/LiveSimulationPlayer';

export const dynamic = 'force-dynamic';

export default function PreviewSimulationLivePage() {
  return (
    <main dir="rtl" className="mx-auto min-h-screen max-w-2xl bg-quiz-bg/30 px-4 py-8 font-hebrew">
      <LiveSimulationPlayer
        branch="בנייה"
        title="סימולציית-וועדה חיה — אתר בנייה"
        intro="אתה הממונה החדש באתר בנייה: 8 קומות, 80 עובדים, פיגומים מתועשים, עגורן-צריח, חפירות פתוחות, קבלן ראשי + 4 קבלני-משנה. שלושה מפקחים — טכני, גיהותי ורגולטורי — ינהלו איתך דיאלוג חי ב-4 שלבים (היכרות → תרחיש → חוק → השאלה-האכזרית). ענה בתשובות מלאות; בסיום תקבל ציון 0-100, חולשות ו-3 פעולות-חיזוק."
      />
    </main>
  );
}

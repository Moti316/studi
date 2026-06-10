/**
 * src/app/capstone/page.tsx — מסך-פרויקט-הגמר (JSA Capstone).
 *
 * Route: /capstone
 * Guard: requireAuth('/capstone') — מנתב ל-/beta-access אם המשתמש לא מחובר.
 * Rendering: force-dynamic (תלוי-session, לא ניתן לרינדור-סטטי).
 *
 * מרנדר:
 *   - <main> max-w-2xl עם כותרת-עמוד + <CapstoneFlow />
 *   - <BottomNav /> sticky-bottom
 *
 * <CapstoneFlow /> = ה-wizard המלא (4 שלבים: site → hazards → matrix → feedback).
 * הרכיב עצמו מוגדר בנפרד (src/features/final-project/CapstoneFlow.tsx).
 * כאן — Server Component טהור: auth guard + metadata + layout בלבד.
 *
 * עיצוב: quiz-* tokens + primary-* + RTL עברית-ראשון.
 * a11y: dir="rtl" על <main>, landmark roles, data-testid.
 */

import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth/server';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { CapstoneFlow } from '@/features/final-project/CapstoneFlow';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'פרויקט גמר',
  description: 'ניהול-סיכונים בשיטת JSA — פרויקט-הגמר של קורס ממונה בטיחות בעבודה.',
};

// ---------------------------------------------------------------------------
// Rendering mode — force-dynamic (session-dependent)
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * CapstonePage — Server Component.
 *
 * אחריות בלבד:
 *   1. דורש auth (או מנתב החוצה — לא חוזר).
 *   2. מרנדר layout + Client Component.
 *
 * ה-wizard עצמו (state / actions / AI calls) מנוהל ב-<CapstoneFlow />.
 */
export default async function CapstonePage() {
  // Guard: מנתב ל-/beta-access?next=/capstone אם לא מחובר.
  await requireAuth('/capstone');

  return (
    <div className="flex min-h-dvh flex-col" dir="rtl">
      {/*
       * main — מוגבל ל-max-w-2xl, עם padding תחתון נוסף כדי לא
       * לחפוף את ה-BottomNav הדביק.
       */}
      <main
        className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4 pb-24"
        data-testid="capstone-main"
      >
        {/* כותרת-עמוד — נגישה כ-h1 יחיד בעמוד */}
        <header className="space-y-1" data-testid="capstone-header">
          <span className="text-xs font-bold text-quiz-primary-active">פרויקט גמר</span>
          <h1 className="text-2xl font-bold text-quiz-text-primary">ניהול סיכונים — JSA</h1>
          <p className="text-sm text-quiz-text-secondary">
            בנה טבלת-JSA לאתר-העבודה שלך, הערך סיכונים לפי מטריצת-4×4 של משרד-העבודה, וקבל משוב על
            העבודה.
          </p>
        </header>

        {/* CapstoneFlow — wizard מלא (Client Component) */}
        <CapstoneFlow />
      </main>

      {/* BottomNav — ניווט-תחתון 4-טאבים */}
      <BottomNav />
    </div>
  );
}

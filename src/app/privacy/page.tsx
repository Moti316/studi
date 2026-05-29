import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'מדיניות פרטיות',
};

/**
 * `/privacy` — stub ל-Phase 1 (כדי שקישור-ההסכמה לא יהיה 404). המדיניות
 * המלאה (איסוף, שמירה, מחיקה, GDPR) תיכתב לפני launch (Phase 9, privacy-officer).
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">מדיניות פרטיות</h1>
      <p className="text-foreground/70 text-sm">
        אנו אוספים את המינימום הנדרש: כתובת אימייל וזהות Google (שם, תמונה) לצורך ההתחברות בלבד.
        אינך נדרש להעניק גישה ל-Google Drive. ניתן למחוק את החשבון וכל הנתונים בכל עת מתוך ההגדרות
        (זכות-להישכח, GDPR סעיף 17). המדיניות המלאה תפורסם לפני ההשקה.
      </p>
    </main>
  );
}

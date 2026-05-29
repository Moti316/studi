import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'תנאי שימוש',
};

/**
 * `/terms` — stub ל-Phase 1 (כדי שקישור-ההסכמה לא יהיה 404). התוכן
 * המשפטי המלא ייכתב לפני launch (Phase 9, content-writer).
 */
export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">תנאי שימוש</h1>
      <p className="text-foreground/70 text-sm">
        StudiBuilder נמצאת בשלב beta. תנאי-השימוש המלאים יפורסמו לפני ההשקה הרשמית. בשימוש בשירות
        אתה מסכים שהמוצר ניתן כפי-שהוא (as-is) בתקופת ה-beta.
      </p>
    </main>
  );
}

'use client';
/**
 * /preview/matching — תצוגה-מקדימה זמנית (dev) של שאלת-ההתאמה החדשה (זיווג-חופשי +
 * כותרות + הסבר). להדגמה למוטי. נתוני-דוגמה אמיתיים (SDS · גיליון-בטיחות).
 */
import {
  MatchingPairs,
  type MatchingPair,
} from '@/features/lesson-player/components/MatchingPairs';

const PAIRS: MatchingPair[] = [
  {
    left: 'גיליון בטיחות (SDS)',
    right: 'גיליון המכיל מידע על חומר מסוכן, תכונותיו, הסיכונים ודרכי-המניעה',
  },
  { left: 'חומר מסוכן', right: 'רעל כהגדרתו בחוק החומרים המסוכנים' },
  { left: 'GHS', right: 'שיטה גלובלית-מתואמת לסיווג ותיווי חומרים מסוכנים' },
  { left: 'תיווי', right: 'סימון אריזה בתווית-אזהרה מחייבת עם פיקטוגרמות-סיכון' },
];

export default function PreviewMatchingPage() {
  return (
    <main dir="rtl" className="mx-auto min-h-screen max-w-2xl px-4 py-8 font-hebrew">
      <h2 className="mb-3 text-lg font-extrabold">התאם כל מונח להגדרתו לפי תקנות גיליון-בטיחות</h2>
      <MatchingPairs pairs={PAIRS} onComplete={() => {}} />
    </main>
  );
}

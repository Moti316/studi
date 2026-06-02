'use client';

import { useState } from 'react';

import { ScenarioWalkthrough } from '@/features/lesson-player/components/ScenarioWalkthrough';
import type { ScenarioInput } from '@/features/lesson-player/components/types';

/**
 * POC route for <ScenarioWalkthrough> (type-5). A realistic, name-clean
 * safety-officer case-study — work-at-height on a scaffold — that ties to the
 * final-project JSA format (hazard → risk → hierarchy-of-controls → regs).
 */
const SAMPLE_SCENARIO: ScenarioInput = {
  title: 'תרחיש: עבודה בגובה על פיגום-זקפים באתר-בנייה',
  background:
    'הגעת כממונה-הבטיחות לאתר-בנייה. על פיגום-זקפים בגובה כ-8 מ׳ עובד מבצע עבודות-טיח. ' +
    'הוא אינו חבוש רתמת-בטיחות, אין צופה מלמטה, וקטע ממאזן-היד בחזית הפיגום חסר. מנשבת רוח עזה.',
  data:
    'גובה הפיגום: ~8 מ׳ · מאזן-יד: חסר בקטע אחד · ריתום: אין · עובדים בקרבת-מקום: 2 · ' +
    'הפיגום הוקם לפני יומיים — אין תיעוד-בדיקה בפנקס-הכללי.',
  task:
    'כממונה-הבטיחות: (1) זהה את המפגעים, (2) הערך את דרגת-הסיכון, (3) המלץ על בקרות לפי מדרג-הבקרות, ' +
    'ו-(4) הכרע אם נדרשת הפסקת-עבודה מיידית — נמק מול התקנות.',
  solution:
    'מפגע-מרכזי: עבודה בגובה מעל 2 מ׳ ללא הגנה-מנפילה (ריתום/מאזן תקין) — חמור; דרגת-סיכון גבוהה ' +
    '(חומרה 4 × סבירות 3–4 → 12–16, לא-ליבק). נדרשת הפסקת-עבודה מיידית עד הסדרת ההגנה. מדרג-בקרות: ' +
    '(הנדסי) השלמת מאזן-יד תקני (90–115 ס״מ + אזן-תיכון + לוח-רגל) ועיגון-הפיגום; ' +
    '(מנהלי) אישור-עבודה-בגובה בתוקף, בדיקת-פיגום ותיעוד בפנקס ע״י מנהל-העבודה, צופה מלמטה, איסור-עבודה ברוח-עזה; ' +
    '(צמ״א) רתמת-בטיחות + חבל-קשירה קצר מעוגן לנקודה איתנה, קסדה ונעלי-בטיחות. ' +
    'אסמכתאות: תקנות הבטיחות בעבודה (עבודות-בנייה) — פיגומים ועבודה-בגובה; ת״י 1139.',
  rubric: [
    { criterion: 'זיהוי המפגע: עבודה בגובה ללא הגנה-מנפילה', points: 2 },
    { criterion: 'הערכת-סיכון (חומרה × סבירות → דרגה גבוהה / לא-ליבק)', points: 1 },
    { criterion: 'הוראת הפסקת-עבודה מיידית', points: 2 },
    { criterion: 'מדרג-בקרות נכון (הנדסי → מנהלי → צמ״א, לא רק PPE)', points: 2 },
    { criterion: 'הפניה לתקנות עבודות-בנייה / ת״י 1139', points: 1 },
  ],
};

export default function ScenarioPocPage() {
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle');

  return (
    <main dir="rtl" className="min-h-screen bg-quiz-bg p-6">
      <header className="mx-auto mb-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-quiz-text-primary">POC — ScenarioWalkthrough</h1>
        <p className="mt-1 text-sm text-quiz-text-secondary">
          סוג-שאלה type-5 (scenario_walkthrough) — לב חוויית-ההכנה לוועדה. (Phase 5 · D1 Demo)
        </p>
        {result !== 'idle' && (
          <p className="mt-2 text-sm font-semibold text-quiz-text-primary" data-testid="result">
            ✅ דווח onResult — תוצאה: {result === 'correct' ? 'עבר' : 'לא-עבר'}
          </p>
        )}
      </header>

      <div className="mx-auto max-w-2xl">
        <ScenarioWalkthrough
          scenario={SAMPLE_SCENARIO}
          onResult={(r) => setResult(r.correct ? 'correct' : 'wrong')}
        />
      </div>
    </main>
  );
}

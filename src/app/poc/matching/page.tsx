'use client';

import { useState } from 'react';

import { MatchingPairs } from '@/features/lesson-player/components/MatchingPairs';

const SAMPLE_PAIRS = [
  { left: 'ממונה בטיחות', right: 'אכיפת נהלי בטיחות וגיהות' },
  { left: 'ועדת בטיחות', right: 'פיקוח על קיום הוראות החוק' },
  { left: 'מפקח עבודה', right: 'קידום תרבות בטיחות וניהול סיכונים' },
];

export default function MatchingPairsPocPage() {
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle');

  return (
    <main dir="rtl" className="min-h-screen bg-quiz-bg p-6">
      <header className="mx-auto mb-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-quiz-text-primary">POC — MatchingPairs</h1>
        <p className="mt-1 text-sm text-quiz-text-secondary">
          התאם בין בעל התפקיד לתחומי אחריותו העיקריים. (Phase 5 — שאלת התאמה Demo)
        </p>
        {result !== 'idle' && (
          <p className="mt-2 text-sm font-semibold text-quiz-text-primary" data-testid="result">
            ✅ סיימת — תוצאה: {result === 'correct' ? 'נכון!' : 'יש לעבור על התשובות'}
          </p>
        )}
      </header>

      <MatchingPairs
        pairs={SAMPLE_PAIRS}
        onComplete={(correct) => setResult(correct ? 'correct' : 'wrong')}
        onDeepExplanation={() => window.alert('פתיחת מודאל "הסבר לעומק"')}
      />
    </main>
  );
}

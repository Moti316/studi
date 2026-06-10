'use client';

/**
 * FeedbackStep.tsx — שלב 4 של wizard פרויקט-הגמר: משוב-AI על טבלת-JSA.
 *
 * זרימה:
 *   1. טעינה אוטומטית בכניסה לשלב — קורא ל-evaluateCapstoneAction (Server Action).
 *   2. מצב-טעינה: "המבקן בודק…" + spinner נגיש.
 *   3. מצב-הצלחה: ציון-כולל · כרטיסי-משוב פר-סעיף · רשימת-ליקויים · מפגעים-חסרים.
 *   4. מצב-שגיאה: הודעת-שגיאה + כפתור-ניסיון-חוזר.
 *
 * עיצוב: quiz-* tokens · rounded-card · RTL native · design-system StudiBuilder.
 * נגישות: dir="rtl" · aria-live · data-testid · ניווט-מקלדת תקין.
 *
 * @see src/features/final-project/evaluate-capstone.action.ts — Server Action
 * @see src/features/final-project/types.ts                    — CapstoneFeedback · CapstoneGrade
 * @see src/features/final-project/store.ts                    — useCapstoneStore
 */

import { useEffect, useState, useCallback } from 'react';
import type { CapstoneGrade, CapstoneFeedbackSection } from '../types';
import { useCapstoneStore, selectSite, selectJsaRows, selectFeedback } from '../store';
import { evaluateCapstoneAction } from '../evaluate-capstone.action';
import { ExportButtons } from './ExportButtons';

// ---------------------------------------------------------------------------
// קונסטנטים-עיצוב לציון
// ---------------------------------------------------------------------------

interface GradeConfig {
  label: string;
  /** ציון מספרי לתצוגה */
  score: number;
  /** Tailwind classes לכרטיס-הציון הכולל */
  cardCls: string;
  /** Tailwind classes לתג-ציון שורה-קטן */
  badgeCls: string;
  /** סמל-ויזואלי */
  icon: string;
}

const GRADE_CONFIG: Record<CapstoneGrade, GradeConfig> = {
  excellent: {
    label: 'מצוין',
    score: 90,
    cardCls: 'border-quiz-success-border bg-quiz-success-bg text-quiz-text-primary',
    badgeCls: 'border border-quiz-success-border bg-quiz-success-bg text-success',
    icon: '★',
  },
  good: {
    label: 'טוב',
    score: 75,
    cardCls: 'border-accent-100 bg-accent-50 text-quiz-text-primary',
    badgeCls: 'border border-accent-100 bg-accent-50 text-accent-700',
    icon: '◆',
  },
  needs_work: {
    label: 'דורש שיפור',
    score: 50,
    cardCls: 'border-quiz-error-border bg-quiz-error-bg text-quiz-text-primary',
    badgeCls: 'border border-quiz-error-border bg-quiz-error-bg text-error',
    icon: '!',
  },
};

/** מפתחות-סעיפים לכותרות-עברית */
const SECTION_TITLES: Record<string, string> = {
  jsa_completeness: 'שלמות טבלת-JSA',
  hierarchy: 'מדרג-הבקרות',
  coverage: 'כיסוי-מפגעים',
  matrix: 'מטריצת-סיכון',
};

// ---------------------------------------------------------------------------
// קומפוננטות-עזר פנימיות
// ---------------------------------------------------------------------------

/** Spinner נגיש למצב-טעינה */
function LoadingSpinner({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col items-center gap-4 py-12">
      {/* spinner — CSS animation ללא תלות-חיצונית */}
      <div
        aria-hidden="true"
        className="h-12 w-12 animate-spin rounded-full border-4 border-quiz-border border-t-quiz-primary-active"
      />
      <p className="text-base font-semibold text-quiz-text-secondary">{label}</p>
    </div>
  );
}

/** כרטיס-שגיאה עם ניסיון-חוזר */
function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      data-testid="capstone-feedback-error"
      className="flex flex-col items-center gap-4 rounded-card border border-quiz-error-border bg-quiz-error-bg px-6 py-8 text-center"
    >
      <p className="text-base font-bold text-error">{message}</p>
      <button
        type="button"
        data-testid="capstone-feedback-retry"
        onClick={onRetry}
        className="rounded-pill bg-quiz-primary-active px-6 py-2 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
      >
        נסה שוב
      </button>
    </div>
  );
}

/** ציון-כולל + מדד-חזותי */
function OverallScoreCard({
  grade,
  source,
}: {
  grade: CapstoneGrade;
  source: 'claude' | 'deterministic';
}) {
  const cfg = GRADE_CONFIG[grade];

  return (
    <div
      data-testid="capstone-overall-grade"
      className={`flex items-center gap-4 rounded-card border px-5 py-4 ${cfg.cardCls}`}
    >
      {/* סמל-ציון גדול */}
      <span
        aria-hidden="true"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/70 text-2xl font-extrabold shadow-card"
      >
        {cfg.icon}
      </span>

      <div className="flex flex-1 flex-col gap-0.5 text-start">
        <p className="text-xs font-medium text-quiz-text-secondary">ציון-כולל</p>
        <p className="text-xl font-extrabold leading-tight">{cfg.label}</p>
        {/* מקור-הערכה — שקיפות ללומד */}
        <p className="text-xs text-quiz-text-secondary">
          {source === 'claude' ? 'הערכה: Claude AI' : 'הערכה: אוטומטית'}
        </p>
      </div>
    </div>
  );
}

/** כרטיס-משוב לסעיף-יחיד */
function SectionCard({ section }: { section: CapstoneFeedbackSection }) {
  const cfg = GRADE_CONFIG[section.grade];
  const title = SECTION_TITLES[section.key] ?? section.key;

  return (
    <div
      data-testid={`capstone-section-${section.key}`}
      className="flex flex-col gap-2 rounded-card border border-quiz-border bg-quiz-bg px-4 py-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-quiz-text-primary">{title}</p>
        <span className={`rounded-pill px-3 py-0.5 text-xs font-bold ${cfg.badgeCls}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-quiz-text-secondary">{section.feedback}</p>
    </div>
  );
}

/** רשימת-ליקויים (שגיאות-מדרג-בקרות) */
function IssueList({
  title,
  items,
  testId,
  variant,
}: {
  title: string;
  items: string[];
  testId: string;
  variant: 'error' | 'warning';
}) {
  if (items.length === 0) return null;

  const cls =
    variant === 'error'
      ? 'border-quiz-error-border bg-quiz-error-bg'
      : 'border-accent-100 bg-accent-50';

  const titleCls = variant === 'error' ? 'text-error' : 'text-accent-700';
  const dotCls = variant === 'error' ? 'bg-error' : 'bg-accent-500';

  return (
    <div data-testid={testId} className={`rounded-card border px-4 py-3 ${cls}`}>
      <p className={`mb-2 text-sm font-bold ${titleCls}`}>{title}</p>
      <ul className="flex flex-col gap-1.5" role="list">
        {items.map((item, idx) => (
          <li
            key={`${testId}-${idx}`}
            className="flex items-start gap-2 text-sm leading-relaxed text-quiz-text-primary"
          >
            <span
              aria-hidden="true"
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotCls}`}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeedbackStep — הקומפוננטה הראשית
// ---------------------------------------------------------------------------

export interface FeedbackStepProps {
  /** קולבק לניווט-חזרה לשלב-הקודם */
  onBack?: () => void;
  /** קולבק לסיום / הגשה */
  onSubmit?: () => void;
}

/**
 * FeedbackStep — מסך משוב-AI של שלב 4 ב-wizard פרויקט-הגמר.
 *
 * קורא אוטומטית ל-evaluateCapstoneAction בטעינה.
 * מציג ציון-כולל · משוב פר-סעיף · ליקויי-מדרג · מפגעים-חסרים.
 */
export function FeedbackStep({ onBack, onSubmit }: FeedbackStepProps) {
  // --- state מה-store ---
  const site = useCapstoneStore(selectSite);
  const jsaRows = useCapstoneStore(selectJsaRows);
  const feedback = useCapstoneStore(selectFeedback);
  const setFeedback = useCapstoneStore((s) => s.setFeedback);

  // --- state מקומי ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // טעינת-המשוב
  // ---------------------------------------------------------------------------

  const loadFeedback = useCallback(async () => {
    if (!site) return;

    setLoading(true);
    setError(null);

    try {
      const result = await evaluateCapstoneAction(site, jsaRows);
      setFeedback(result);
    } catch (err) {
      // Server Action אמור לא לזרוק, אבל על בטוח:
      setError('אירעה שגיאה בהערכה. בדוק חיבור-אינטרנט ונסה שוב.');
      console.error('[FeedbackStep] evaluateCapstoneAction threw:', err);
    } finally {
      setLoading(false);
    }
  }, [site, jsaRows, setFeedback]);

  // טעינה-אוטומטית בהרכבת-הקומפוננטה (או כשאין feedback בStore)
  useEffect(() => {
    if (!feedback && !loading) {
      void loadFeedback();
    }
    // loadFeedback תלוי ב-site/jsaRows — הפעלה חד-פעמית בכניסה לשלב
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div dir="rtl" data-testid="capstone-feedback" className="flex flex-col gap-5 font-hebrew">
      {/* כותרת-שלב */}
      <header className="flex flex-col gap-1 text-start">
        <h2 className="text-xl font-extrabold leading-tight text-quiz-text-primary">
          משוב על פרויקט-הגמר
        </h2>
        <p className="text-sm text-quiz-text-secondary">
          המבקן בוחן את טבלת-ה-JSA שלך לפי מדרג-הבקרות ומטריצת-הסיכון
        </p>
      </header>

      {/* === מצב-טעינה === */}
      {loading && (
        <div aria-live="polite" data-testid="capstone-feedback-loading">
          <LoadingSpinner label="המבקן בודק…" />
        </div>
      )}

      {/* === מצב-שגיאה === */}
      {!loading && error && (
        <div aria-live="assertive">
          <ErrorCard message={error} onRetry={() => void loadFeedback()} />
        </div>
      )}

      {/* === תוצאות === */}
      {!loading && !error && feedback && (
        <div
          aria-live="polite"
          aria-label="תוצאות הערכת פרויקט-גמר"
          className="flex flex-col gap-4"
        >
          {/* ציון-כולל */}
          <OverallScoreCard grade={feedback.overall} source={feedback.source} />

          {/* משוב פר-סעיף */}
          {feedback.sections.length > 0 && (
            <section aria-label="משוב לפי סעיפים">
              <p className="mb-2 text-sm font-bold text-quiz-text-primary">פירוט לפי סעיפים</p>
              <div className="flex flex-col gap-2">
                {feedback.sections.map((sec) => (
                  <SectionCard key={sec.key} section={sec} />
                ))}
              </div>
            </section>
          )}

          {/* ליקויי-מדרג-בקרות */}
          <IssueList
            title="ליקויים במדרג-הבקרות"
            items={feedback.hierarchyIssues}
            testId="capstone-hierarchy-issues"
            variant="error"
          />

          {/* מפגעים-חסרים */}
          <IssueList
            title="מפגעים-צפויים שלא טופלו בטבלה"
            items={feedback.missingHazards}
            testId="capstone-missing-hazards"
            variant="warning"
          />

          {/* הודעת-עידוד כשהכל תקין */}
          {feedback.hierarchyIssues.length === 0 && feedback.missingHazards.length === 0 && (
            <p
              data-testid="capstone-all-clear"
              className="rounded-card border border-quiz-success-border bg-quiz-success-bg px-4 py-3 text-sm font-semibold text-success"
            >
              לא זוהו ליקויים מהותיים — העבודה מוכנה להגשה.
            </p>
          )}

          {/* הורדת-המסמך-המוגש (PDF / Word) */}
          <ExportButtons />
        </div>
      )}

      {/* === כפתורי-ניווט (תחתון) === */}
      {!loading && (
        <footer className="flex flex-col gap-2 pt-1">
          {/* הגש / סיים (ראשי — זמין רק כשיש feedback) */}
          {feedback && onSubmit && (
            <button
              type="button"
              data-testid="capstone-submit"
              onClick={onSubmit}
              className="w-full select-none rounded-pill bg-quiz-primary-active py-4 text-lg font-bold text-white shadow-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
            >
              סיים והגש
            </button>
          )}

          {/* חזרה לשלב-הקודם */}
          {onBack && (
            <button
              type="button"
              data-testid="capstone-back"
              onClick={onBack}
              className="w-full rounded-pill border border-quiz-border bg-white py-3 text-base font-semibold text-quiz-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
            >
              חזרה
            </button>
          )}
        </footer>
      )}
    </div>
  );
}

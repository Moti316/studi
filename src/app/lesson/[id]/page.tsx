import type { Metadata } from 'next';
import Link from 'next/link';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { questions, scenarios, type Question } from '../../../../drizzle/schema';
import { isValidScopeId } from '@/lib/db/constants/scope-refs';
import { LessonPlayer } from '@/features/lesson-player/LessonPlayer';
import type { ScenarioInput, RubricCriterion } from '@/features/lesson-player/components/types';
import { isRubric } from '@/features/lesson-player/components/types';

export const metadata: Metadata = {
  title: 'שיעור',
};

/** תלוי-session ו-DB (שאילתה אקראית) — חייב רינדור-דינמי (אסור static/ISR). */
export const dynamic = 'force-dynamic';

/** מספר השאלות המרבי בשיעור בודד. */
const MAX_QUESTIONS = 20;

/**
 * טוען עד MAX_QUESTIONS שאלות `in_scope = true`.
 *   - id === 'practice'  → דגימה אקראית (ORDER BY random()).
 *   - אחרת               → סינון לפי scope-id (כל שאלה שה-scope_refs jsonb שלה
 *     מכיל את ה-id), בסדר אקראי בתוך ההיקף.
 * מזהה-היקף לא-תקין מטופל כ"ריק" (empty-state), לא כשגיאה.
 */
async function loadQuestions(rawId: string): Promise<Question[]> {
  const inScope = eq(questions.inScope, true);

  if (rawId === 'practice') {
    return db
      .select()
      .from(questions)
      .where(inScope)
      .orderBy(sql`random()`)
      .limit(MAX_QUESTIONS);
  }

  // scope-ref path: ID חייב להיות מוכר מתוך 57 פריטי-הוועדה (default-deny).
  if (!isValidScopeId(rawId)) return [];

  // jsonb containment: scope_refs @> '[{"id": "<rawId>"}]'. `rawId` עבר אימות
  // מול ה-allowlist, ובכל-זאת מועבר כפרמטר (sql.placeholder) — אפס-זריקת-SQL.
  const scopeMatch = sql`${questions.scopeRefs} @> ${JSON.stringify([{ id: rawId }])}::jsonb`;

  return db
    .select()
    .from(questions)
    .where(and(inScope, scopeMatch))
    .orderBy(sql`random()`)
    .limit(MAX_QUESTIONS);
}

/**
 * טוען את נתוני-התרחיש לשאלות-`scenario_walkthrough` ומחזיר מפה לפי question-id.
 * שאילתה רק כשיש שאלות-תרחיש (אחרת מחזיר מפה-ריקה ללא פגיעה-ב-DB).
 */
async function loadScenarios(qs: Question[]): Promise<Record<string, ScenarioInput>> {
  const withScenario = qs.filter((q) => q.type === 'scenario_walkthrough' && q.scenarioId);
  const ids = [...new Set(withScenario.map((q) => q.scenarioId as string))];
  if (ids.length === 0) return {};

  const rows = await db.select().from(scenarios).where(inArray(scenarios.id, ids));
  const byId = new Map(rows.map((r) => [r.id, r]));
  const map: Record<string, ScenarioInput> = {};
  for (const q of withScenario) {
    const s = byId.get(q.scenarioId as string);
    if (!s) continue;
    map[q.id] = {
      title: s.title,
      background: s.background,
      data: s.data,
      task: s.task,
      solution: s.solution,
      rubric: isRubric(s.rubric) ? (s.rubric as RubricCriterion[]) : [],
    };
  }
  return map;
}

/**
 * `/lesson/[id]` — מסך השיעור (מחליף את ה-POC `/poc/matching`).
 *
 * Server Component:
 *   1. `requireAuth` בראש (לא-מחובר → /beta-access).
 *   2. טוען עד 20 שאלות in-scope מה-DB (אקראי ל-'practice', אחרת לפי scope-id).
 *   3. שגיאת-DB → error-state נקי (לא חושפים תשתית, הלוג נשאר בשרת).
 *   4. מרכיב את <LessonPlayer> (client) שמנהל את כל לולאת-השיעור.
 *
 * הערה: עד שהייבוא רץ ה-DB ריק — מטופל ב-empty-state הידידותי בתוך <LessonPlayer>.
 */
export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAuth(`/lesson/${id}`);

  let lessonQuestions: Question[];
  try {
    lessonQuestions = await loadQuestions(id);
  } catch (error) {
    // לא חושפים פרטי-תשתית; מציגים מצב-שגיאה נקי. הלוג נשאר בצד-השרת.
    console.error('[lesson/[id]] failed to load questions', error);
    return (
      <main dir="rtl" className="mx-auto w-full max-w-2xl p-4 pb-8">
        <div
          role="alert"
          data-testid="lesson-error"
          className="flex flex-col items-center gap-3 rounded-card border border-quiz-error-border bg-quiz-error-bg px-6 py-12 text-center font-hebrew text-quiz-text-primary"
        >
          <span className="text-4xl" aria-hidden="true">
            ⚠️
          </span>
          <h1 className="text-lg font-bold">טעינת השיעור נכשלה</h1>
          <p className="mx-auto max-w-sm text-sm text-quiz-text-secondary">
            לא הצלחנו לטעון את השאלות כרגע. ודאו שחיבור-ה-DB מוגדר ונסו לרענן.
          </p>
          <BackToDashboard />
        </div>
      </main>
    );
  }

  const scenarioMap = await loadScenarios(lessonQuestions);

  return (
    <main dir="rtl" className="mx-auto w-full max-w-2xl p-4 pb-8">
      <div className="mb-4">
        <BackToDashboard />
      </div>
      <LessonPlayer questions={lessonQuestions} scenarios={scenarioMap} />
    </main>
  );
}

/** קישור-מילוט מהשיעור חזרה לדשבורד הראשי (RTL: חץ → = חזרה). */
function BackToDashboard() {
  return (
    <Link
      href="/dashboard"
      data-testid="back-to-dashboard"
      aria-label="חזרה לדשבורד הראשי"
      className="inline-flex items-center gap-1.5 rounded-pill border border-quiz-border bg-quiz-bg px-4 py-2 text-sm font-bold text-quiz-text-secondary transition-colors hover:text-quiz-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active"
    >
      <span aria-hidden="true">→</span>
      חזרה לדשבורד
    </Link>
  );
}

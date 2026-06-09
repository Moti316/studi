/**
 * src/lib/course/topic-counts.ts — ספירת-שאלות-אמת פר-יחידת-נושא (מה-DB · server-only).
 * סופר שאלות-תרגול (in-scope · לא-תרחישים) פר-scope, ומסכם לפי מיפוי-הנושאים.
 * מציג ללומד ספירות-אמת במקום אחוזי-התקדמות-מדומים.
 */
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { COURSE_TOPICS } from './topics';

/** מחזיר {topicId → מספר-שאלות}. כשל-DB → אפסים (לא מפיל את הדף). */
export async function loadTopicCounts(): Promise<Record<string, number>> {
  const out: Record<string, number> = Object.fromEntries(COURSE_TOPICS.map((t) => [t.id, 0]));
  try {
    const rows = (await db.execute(
      sql`SELECT (scope_refs->0->>'id') AS scope, count(*)::int AS n
          FROM questions
          WHERE in_scope = true AND type <> 'scenario_walkthrough'
          GROUP BY 1`,
    )) as unknown as Array<{ scope: string | null; n: number }>;
    const byScope = new Map(rows.map((r) => [r.scope ?? '', r.n]));
    for (const t of COURSE_TOPICS) {
      out[t.id] = t.scopes.reduce((s, sc) => s + (byScope.get(sc) ?? 0), 0);
    }
  } catch {
    /* כשל-DB → אפסים */
  }
  return out;
}

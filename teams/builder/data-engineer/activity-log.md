# יומן-פעילות — דנה (data-engineer)

> פורמט רשומה: `## [תאריך שעה] משימה` ואז Outcome · What changed · Verification · Follow-ups · Verdict (PASS|CONCERNS|FAIL) · Self-check (בהקשר? סטייה? red-lines?) · Bugs/Fixes.

## [2026-06-01 00:05] questions.source_ref idempotency + scope-refs catalog (57)

**Outcome:** הוספתי `source_ref` (text, nullable) + unique-index `idx_questions_source_ref` לטבלת `questions` (מאפשר `ON CONFLICT (source_ref)` בייבוא — ADR-011), יצרתי קטלוג-scope קנוני של 57 הפריטים ב-TS, ועטפתי בבדיקות vitest (10/10 ✓).

**What changed:**

- `drizzle/schema.ts` — `questions`: עמודת `sourceRef: text('source_ref')` (nullable) + `uniqueIndex('idx_questions_source_ref')`. NULLs נבדלים ב-Postgres ⇒ שאלות-ידניות (ref ריק) לא מושפעות.
- `supabase/migrations/0002_add_questions_source_ref.sql` — מיגרציה אינקרמנטלית (ADD COLUMN + CREATE UNIQUE INDEX IF NOT EXISTS) עם header+rollback בסגנון 0001 (hand-applied דרך Supabase SQL Editor, כמו 0001).
- `supabase/migrations/meta/` — יושר ה-journal+snapshots: idx0=`0001_initial_schema` (baseline pre-change), idx1=`0002_add_questions_source_ref` (post-change). `db:generate` חוזר "No schema changes".
- `src/lib/db/constants/scope-refs.ts` — `SCOPE_REFS` (57), `SCOPE_CATEGORIES` (7), `SCOPE_REF_IDS`, `SCOPE_REF_BY_ID`, `isValidScopeId`, type `ScopeRef`/`ScopeCategory`. מקור-קנוני: view `coverage_tracker` (IDs+קטגוריות); תוויות מ-content-scope.md.
- `tests/unit/db/scope-refs.test.ts` — count===57, IDs ייחודיים, כל 7 הקטגוריות קיימות+בשימוש, ספירה-פר-קטגוריה (8/17/11/6/6/5/4), תוויות לא-ריקות, lookup-map, isValidScopeId.

**Verification:** `pnpm test tests/unit/db/scope-refs.test.ts` → 10/10 ✓ · `pnpm typecheck` נקי · `pnpm test` מלא → 246/246 ✓ (33 קבצים, אפס רגרסיה) · `pnpm db:generate` סופי → "No schema changes" (ה-meta משקף מציאות). **לא** הורץ `db:push` ו**לא** commit/push (לפי ההנחיה).

**Follow-ups (נדחה + סיבה):**
- ה-import pipeline צריך לייצר `source_ref` דטרמיניסטי (למשל hash(source_id+chunk+seq)) כדי שה-`onConflict` יהיה אפקטיבי — שייך ל-`backend-engineer`/`ml-engineer` במימוש `scripts/import-content.ts`.
- שקילת `runtime` ולידציה של `scope_refs` נכנסים מול `isValidScopeId` בשכבת-הייבוא (לא רק קבוע) — לבקשת `backend-engineer`.
- 0001 הוא raw-SQL לא-מנוטר ע"י drizzle; ה-baseline-snapshot שלי משחזר אותו דרך ה-schema-שבפועל. אם 0001 ישתנה ידנית — צריך לרענן את ה-snapshot. (תיעוד לעתיד.)

**Verdict:** PASS

**Self-check:** בהקשר — כן (מול הסכמה-שבפועל: drizzle/schema.ts + 0001; idempotency משרת ADR-011; RTL/he בתוויות; אפס-secrets). סטייה — `db:generate` חד-פעמי יצר תחילה `0000` מלא (כי לא היה drizzle-baseline ל-0001 ה-hand-written); תוקן בשתי-העברות לדיף-`0002` נקי, וה-`0000` היתום (שיצרתי באותו סשן) הוסר. red-lines — אין: המיגרציה הפיכה (rollback מתועד), נעשתה סקירת-אינדקס (unique על source_ref בלבד), אין N+1. לא בוצע push/commit/db:push.

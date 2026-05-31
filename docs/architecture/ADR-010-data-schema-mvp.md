# ADR-010: Data Schema MVP — Quiz Engine (Phase 4-5)

> **Status**: Proposed
> **Date**: 2026-05-30
> **Authors**: data-engineer · motilev8
> **Phase**: 4-5 (Drive Import + Quiz Engine)
> **References**: ADR-005 (NotebookLM hybrid), ADR-009 (Magen Integration), `docs/content-scope.md`, `docs/content-inventory.md`, `docs/mvp-plan-2026-07-15.md`

---

## Context

Phase 5 (Quiz Engine) דורש schema ב-Supabase שיתמוך ב:

- **קבצי Drive** (~130 קבצים, T1-T4 tier system) — source-of-truth לפי ADR-009
- **chunks מ-T2/T3** — קטעי-טקסט עם embeddings לחיפוש סמנטי ו-"הסבר לעומק"
- **scenarios** — תרחישים מ-`megen/scenarios/*.md`, פורמט Markdown מובנה
- **questions** — 5 quiz types (MCQ-long/short, Matching, Explanation, ScenarioWalkthrough)
- **היסטוריית-תרגול** — ניסיונות, sessions, Spaced-Repetition
- **coverage_tracker** — view לפיקוח על 21 פריטי-החקיקה

---

## Decision

שבע ישויות: 6 טבלאות ו-view אחד. כולן ב-Supabase Postgres עם pgvector.

---

## Migration Plan — סדר-יצירת-טבלאות

```
1. content_sources     — אין תלויות
2. chunks              — תלוי ב-content_sources
3. scenarios           — אין תלויות (מקור נפרד: megen Markdown)
4. questions           — תלוי ב-chunks (nullable FK)
5. practice_sessions   — תלוי ב-auth.users (Supabase built-in)
6. question_attempts   — תלוי ב-questions + practice_sessions
7. coverage_tracker    — VIEW; נוצר אחרון, תלוי ב-questions + scenarios + question_attempts
```

כל מיגרציה: `drizzle-orm` schema change + SQL DDL rollback script בצד (ראה הערות rollback לכל טבלה).

---

## Schema

### 1. `content_sources`

מייצג קובץ יחיד מ-Drive (או megen). כל שורה = מקור-אחד.

```sql
CREATE TABLE content_sources (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_file_id text        NOT NULL UNIQUE,   -- Google Drive file ID
  title         text        NOT NULL,
  tier          text        NOT NULL,          -- 'T1'|'T2'|'T3'|'T4'
  mime_type     text,
  size_bytes    bigint,
  scope_refs    text[]      NOT NULL DEFAULT '{}',
  -- scope_refs: מערך של IDs מ-21 הפריטים (e.g. ['1.1','2.3'])
  in_scope      boolean     NOT NULL DEFAULT false,
  status        text        NOT NULL DEFAULT 'pending',
  -- 'pending'|'processing'|'done'|'error'|'skipped'
  drive_folder_id text,
  imported_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_tier   CHECK (tier   IN ('T1','T2','T3','T4')),
  CONSTRAINT chk_status CHECK (status IN ('pending','processing','done','error','skipped'))
);

CREATE INDEX idx_content_sources_tier        ON content_sources (tier);
CREATE INDEX idx_content_sources_in_scope    ON content_sources (in_scope) WHERE in_scope = true;
CREATE INDEX idx_content_sources_scope_refs  ON content_sources USING GIN (scope_refs);
CREATE INDEX idx_content_sources_status      ON content_sources (status);
```

**Rollback**: `DROP TABLE content_sources CASCADE;`

---

### 2. `chunks`

קטעי-טקסט מ-T2/T3 עם embedding לחיפוש סמנטי. מקור ל-"הסבר לעומק".

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id     uuid        NOT NULL REFERENCES content_sources(id) ON DELETE CASCADE,
  chunk_index   int         NOT NULL,   -- אינדקס סדרתי בתוך המסמך
  text          text        NOT NULL,
  embedding     vector(1024),           -- Gemini embedding / pgvector; NULL עד חישוב (ממד יותאם למודל-Gemini הנבחר, ADR-011)
  in_scope      boolean     NOT NULL DEFAULT false,
  scope_refs    text[]      NOT NULL DEFAULT '{}',
  answer_status text        NOT NULL DEFAULT 'unknown',
  -- 'verified'=[מאומת] | 'inferred'=[מוסקנא] | 'unknown'=[לא ידוע]
  char_count    int         GENERATED ALWAYS AS (char_length(text)) STORED,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_chunk_answer_status CHECK (answer_status IN ('verified','inferred','unknown')),
  CONSTRAINT uq_chunk_source_index   UNIQUE (source_id, chunk_index)
);

-- HNSW index לחיפוש סמנטי מהיר (cosine distance)
CREATE INDEX idx_chunks_embedding_hnsw
  ON chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_chunks_in_scope   ON chunks (in_scope) WHERE in_scope = true;
CREATE INDEX idx_chunks_scope_refs ON chunks USING GIN (scope_refs);
CREATE INDEX idx_chunks_source_id  ON chunks (source_id);
```

**הערות HNSW**: `m=16, ef_construction=64` מספיקים ל-~50K chunks. בגדילה מעבר ל-200K — לשקול `m=24`.
**Rollback**: `DROP TABLE chunks CASCADE;` (CASCADE גם על questions FK)

---

### 3. `scenarios`

תרחישי-תיק-מעשי לסוג-שאלה ScenarioWalkthrough. מקור: `megen/scenarios/*.md`, פורמט Markdown מובנה (ADR-005 §10.2).

```sql
CREATE TABLE scenarios (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  background    text        NOT NULL,   -- ## רקע
  data          jsonb       NOT NULL DEFAULT '[]',
  -- data: [{type: 'bullet'|'table', content: string}]
  task          text        NOT NULL,   -- ## משימה
  solution      text,                  -- ## פתרון [מאומת/מוסקנא]
  rubric        jsonb       NOT NULL DEFAULT '{}',
  -- rubric: {100: string, 70: string, 0: string}
  scope_refs    text[]      NOT NULL DEFAULT '{}',
  answer_status text        NOT NULL DEFAULT 'unknown',
  -- 'verified'|'inferred'|'unknown' — מצב-התשובה מ-megen
  difficulty    smallint    NOT NULL DEFAULT 2,
  -- 1=קל, 2=בינוני, 3=קשה
  megen_source  text,                  -- path ב-megen repo (לעקיבות)
  notebook_id   text,                  -- UUID ב-NotebookLM (לעקיבות)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_scenario_status     CHECK (answer_status IN ('verified','inferred','unknown')),
  CONSTRAINT chk_scenario_difficulty CHECK (difficulty BETWEEN 1 AND 3)
);

CREATE INDEX idx_scenarios_scope_refs ON scenarios USING GIN (scope_refs);
CREATE INDEX idx_scenarios_difficulty ON scenarios (difficulty);
```

**Rollback**: `DROP TABLE scenarios CASCADE;`

---

### 4. `questions`

כל 5 סוגי-השאלות. שורה אחת = שאלה אחת, ללא קשר לסוג.

```sql
CREATE TYPE question_type AS ENUM (
  'mcq_long',
  'mcq_short',
  'matching',
  'explanation',
  'scenario_walkthrough'
);

CREATE TABLE questions (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  type            question_type NOT NULL,
  prompt          text          NOT NULL,

  -- options: שימוש לפי type
  -- mcq_long/short: [{key: 'א'|'ב'|'ג'|'ד', text: string}]
  -- matching:       [{term: string, definition: string}]
  -- explanation:    null (prompt עצמו הוא הטיפ)
  -- scenario_walkthrough: null (prompt = task; scenario_id = ref)
  options         jsonb,

  correct_answer  text,
  -- mcq: 'א'|'ב'|'ג'|'ד'
  -- matching: JSON-string של {term: definition}
  -- explanation/scenario: null (LLM-graded)

  explanation     text,                 -- הסבר מפורט לאחר-תשובה
  scope_refs      text[]      NOT NULL DEFAULT '{}',
  source_chunk_id uuid        REFERENCES chunks(id) ON DELETE SET NULL,
  scenario_id     uuid        REFERENCES scenarios(id) ON DELETE SET NULL,
  difficulty      smallint    NOT NULL DEFAULT 2,
  -- 1=קל, 2=בינוני, 3=קשה
  in_scope        boolean     NOT NULL DEFAULT false,
  answer_status   text        NOT NULL DEFAULT 'unknown',
  -- 'verified'|'inferred'|'unknown'
  import_source   text,
  -- 'committee_bank'|'t1_file'|'ai_generated'|'manual'
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_question_difficulty   CHECK (difficulty BETWEEN 1 AND 3),
  CONSTRAINT chk_question_ans_status   CHECK (answer_status IN ('verified','inferred','unknown')),
  CONSTRAINT chk_question_import_src   CHECK (import_source IN ('committee_bank','t1_file','ai_generated','manual') OR import_source IS NULL),
  -- כלל-עסקי: scenario_walkthrough חייב scenario_id
  CONSTRAINT chk_scenario_ref
    CHECK (type != 'scenario_walkthrough' OR scenario_id IS NOT NULL)
);

CREATE INDEX idx_questions_type         ON questions (type);
CREATE INDEX idx_questions_in_scope     ON questions (in_scope) WHERE in_scope = true;
CREATE INDEX idx_questions_scope_refs   ON questions USING GIN (scope_refs);
CREATE INDEX idx_questions_difficulty   ON questions (difficulty);
CREATE INDEX idx_questions_source_chunk ON questions (source_chunk_id) WHERE source_chunk_id IS NOT NULL;
```

**Rollback**: `DROP TABLE questions CASCADE; DROP TYPE question_type;`

---

### 5. `question_attempts`

כל ניסיון-תשובה של מוטי. בסיס ל-Spaced-Repetition.

```sql
CREATE TABLE question_attempts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id         uuid        NOT NULL REFERENCES questions(id)  ON DELETE CASCADE,
  practice_session_id uuid,
  -- FK ל-practice_sessions נוסף אחרי יצירת אותה טבלה (migration נפרד)

  answer              text,
  -- mcq: 'א'|'ב'|'ג'|'ד'; matching: JSON; scenario: textarea; explanation: null
  correct             boolean,
  -- null = scenario_walkthrough (LLM-graded async)
  llm_score           smallint,
  -- 0-100, ל-scenario_walkthrough בלבד
  llm_feedback        text,
  -- פידבק-טקסטואלי מ-Gemini לאחר הערכת-רובריקה

  attempted_at        timestamptz NOT NULL DEFAULT now(),
  time_spent_ms       int,         -- זמן-תשובה במילישניות

  -- Spaced-Repetition fields (SM-2 simplified)
  next_due_at         timestamptz,  -- מתי השאלה אמורה לחזור
  interval_days       int,          -- מרווח-נוכחי בימים
  ease_factor         numeric(4,2) DEFAULT 2.5,

  CONSTRAINT chk_attempt_time    CHECK (time_spent_ms > 0 OR time_spent_ms IS NULL),
  CONSTRAINT chk_attempt_llm_sc  CHECK (llm_score BETWEEN 0 AND 100 OR llm_score IS NULL),
  CONSTRAINT chk_ease_factor     CHECK (ease_factor >= 1.3 OR ease_factor IS NULL)
);

CREATE INDEX idx_attempts_user_id          ON question_attempts (user_id);
CREATE INDEX idx_attempts_question_id      ON question_attempts (question_id);
CREATE INDEX idx_attempts_session_id       ON question_attempts (practice_session_id) WHERE practice_session_id IS NOT NULL;
CREATE INDEX idx_attempts_next_due         ON question_attempts (user_id, next_due_at)
  WHERE next_due_at IS NOT NULL;
-- שאילתת-due-queue: WHERE user_id = ? AND next_due_at <= now()
```

**Rollback**: `DROP TABLE question_attempts CASCADE;`

---

### 6. `practice_sessions`

הרצת mock-exam או session-תרגול.

```sql
CREATE TYPE session_mode AS ENUM ('practice', 'exam', 'review', 'spaced_repetition');

CREATE TABLE practice_sessions (
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode                session_mode NOT NULL,
  started_at          timestamptz  NOT NULL DEFAULT now(),
  ended_at            timestamptz,
  score               smallint,    -- 0-100, חישוב בסוף session
  questions_count     int          NOT NULL DEFAULT 0,
  correct_count       int          NOT NULL DEFAULT 0,
  question_ids        uuid[]       NOT NULL DEFAULT '{}',
  -- רשימת שאלות שנכללו ב-session, לסדרן-ולחשב-coverage
  scope_filter        text[],
  -- scope IDs שסוננו ל-session הזה (e.g. ['1.1','2.1'])
  created_at          timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT chk_session_score    CHECK (score BETWEEN 0 AND 100 OR score IS NULL),
  CONSTRAINT chk_session_counts   CHECK (correct_count <= questions_count)
);

-- FK נוסף ל-question_attempts: migration נפרד אחרי יצירת שתי הטבלאות
ALTER TABLE question_attempts
  ADD CONSTRAINT fk_attempts_session
  FOREIGN KEY (practice_session_id) REFERENCES practice_sessions(id) ON DELETE SET NULL;

CREATE INDEX idx_sessions_user_id    ON practice_sessions (user_id);
CREATE INDEX idx_sessions_mode       ON practice_sessions (mode);
CREATE INDEX idx_sessions_started_at ON practice_sessions (user_id, started_at DESC);
-- שאילתת-היסטוריה: ORDER BY started_at DESC LIMIT n
```

**Rollback**: `DROP TABLE practice_sessions CASCADE;`

---

### 6.5. `chat_sessions` (חדש 2026-05-30 — Mode C)

תומך ב-Mode-C (AI Tutor Chat). שיחה-מודרכת עם Gemini 2.5 Pro על scope-ID או נושא-custom.

```sql
CREATE TABLE chat_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Subject
  scope_id        TEXT,         -- '2.1' / '5.3' / NULL לcustom
  topic           TEXT NOT NULL,
  depth           TEXT NOT NULL CHECK (depth IN ('foundation','advanced','review')),

  -- Conversation
  messages        JSONB NOT NULL DEFAULT '[]',
  -- schema: [{role:'user'|'assistant', content:text, citations:[{chunk_id, snippet}], timestamp}]
  message_count   INTEGER NOT NULL DEFAULT 0,

  -- Cost tracking
  total_tokens_in   INTEGER DEFAULT 0,
  total_tokens_out  INTEGER DEFAULT 0,
  total_cost_usd    DECIMAL(10,4) DEFAULT 0,

  -- Lifecycle
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_user_started ON chat_sessions (user_id, started_at DESC);
CREATE INDEX idx_chat_scope        ON chat_sessions (scope_id) WHERE scope_id IS NOT NULL;
```

**RLS**: motilev8 בלבד ל-MVP — `auth.uid() = user_id`.

**Storage growth estimate**: 30-min סשן ≈ 20 messages ≈ 50KB JSONB. 100 סשנים/חודש = 5MB.

**Rollback**: `DROP TABLE chat_sessions CASCADE;`

---

### 7. `coverage_tracker` (VIEW)

מחשב כיסוי לכל scope_id מ-57 פריטי-החקיקה (עודכן מ-21 ב-2026-05-30 לפי `docs/content-scope.md`). מסך `/admin/coverage`.

```sql
CREATE VIEW coverage_tracker AS
WITH scope_ids AS (
  SELECT unnest(ARRAY[
    '1.0','1.1','1.2','1.3','1.4',
    '2.0','2.1','2.2','2.3','2.4','2.5','2.6','2.7','2.8',
    '3.1','3.2','3.3','3.4','3.5',
    '4.1','4.2','4.3','4.4'
  ]::text[]) AS scope_id
),
question_counts AS (
  SELECT
    s.scope_id,
    COUNT(DISTINCT q.id) FILTER (WHERE q.in_scope = true) AS question_count
  FROM scope_ids s
  LEFT JOIN questions q ON q.scope_refs @> ARRAY[s.scope_id]
  GROUP BY s.scope_id
),
scenario_counts AS (
  SELECT
    s.scope_id,
    COUNT(DISTINCT sc.id) AS scenario_count
  FROM scope_ids s
  LEFT JOIN scenarios sc ON sc.scope_refs @> ARRAY[s.scope_id]
  GROUP BY s.scope_id
),
attempt_stats AS (
  SELECT
    s.scope_id,
    COUNT(qa.id)                                    AS total_attempts,
    COUNT(qa.id) FILTER (WHERE qa.correct = true)   AS correct_attempts,
    CASE
      WHEN COUNT(qa.id) > 0
      THEN ROUND(
        COUNT(qa.id) FILTER (WHERE qa.correct = true)::numeric
        / COUNT(qa.id) * 100, 1
      )
      ELSE NULL
    END AS recall_rate
  FROM scope_ids s
  LEFT JOIN questions q  ON q.scope_refs @> ARRAY[s.scope_id] AND q.in_scope = true
  LEFT JOIN question_attempts qa ON qa.question_id = q.id
  GROUP BY s.scope_id
)
SELECT
  si.scope_id,
  COALESCE(qc.question_count, 0)  AS question_count,
  COALESCE(sc.scenario_count, 0)  AS scenario_count,
  COALESCE(ast.total_attempts, 0) AS total_attempts,
  ast.recall_rate,
  -- gap flags (יעדים מ-content-scope.md)
  COALESCE(qc.question_count, 0)  < 5  AS questions_gap,
  COALESCE(sc.scenario_count, 0)  < 2  AS scenarios_gap
FROM scope_ids       si
LEFT JOIN question_counts  qc  ON qc.scope_id  = si.scope_id
LEFT JOIN scenario_counts  sc  ON sc.scope_id  = si.scope_id
LEFT JOIN attempt_stats    ast ON ast.scope_id = si.scope_id
ORDER BY si.scope_id;
```

**Rollback**: `DROP VIEW coverage_tracker;`

---

## RLS Policies (Row Level Security)

MVP: מוטי הוא המשתמש היחיד. כל טבלה נעולה למשתמש-מחובר.

```sql
-- הפעלת RLS על כל הטבלאות
ALTER TABLE content_sources     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions   ENABLE ROW LEVEL SECURITY;

-- content_sources, chunks, scenarios, questions — קריאה למשתמש-מחובר כלשהו
-- (MVP: מוטי בלבד; post-MVP: לפי course enrollment)
CREATE POLICY "authenticated read" ON content_sources
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated read" ON chunks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated read" ON scenarios
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated read" ON questions
  FOR SELECT TO authenticated USING (true);

-- כתיבה ל-content_sources/chunks/scenarios/questions — service_role בלבד
-- (import pipeline רץ כ-service_role, לא כ-user)

-- question_attempts — user רואה רק את שלו
CREATE POLICY "own attempts" ON question_attempts
  FOR ALL TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- practice_sessions — user רואה רק את שלו
CREATE POLICY "own sessions" ON practice_sessions
  FOR ALL TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## Seed Data — 21 scope_refs

הנתונים הסטטיים עולים פעם-אחת, נשארים בקוד ולא ב-DB (לא טבלה נפרדת ל-MVP). רשימת ה-IDs נטועה ב:

1. `coverage_tracker` VIEW (ראה `scope_ids` CTE למעלה)
2. `src/lib/db/constants/scope-refs.ts` — array טייפסקריפט לולידציה ב-import pipeline

```typescript
// src/lib/db/constants/scope-refs.ts
export const SCOPE_REFS = [
  '1.0',
  '1.1',
  '1.2',
  '1.3',
  '1.4',
  '2.0',
  '2.1',
  '2.2',
  '2.3',
  '2.4',
  '2.5',
  '2.6',
  '2.7',
  '2.8',
  '3.1',
  '3.2',
  '3.3',
  '3.4',
  '3.5',
  '4.1',
  '4.2',
  '4.3',
  '4.4',
] as const;

export type ScopeRef = (typeof SCOPE_REFS)[number];
```

**הנמקה**: 21 פריטים הם קונסטנטה-של-וועדה. שמירתם ב-DB תצריך foreign-key-maintenance מיותר. הם סטטיים למשך כל ה-MVP.

---

## Validation Queries

```sql
-- 1. סנטי-צ'ק: ספירת שורות בכל טבלה
SELECT 'content_sources'   AS tbl, COUNT(*) FROM content_sources
UNION ALL
SELECT 'chunks'            AS tbl, COUNT(*) FROM chunks
UNION ALL
SELECT 'scenarios'         AS tbl, COUNT(*) FROM scenarios
UNION ALL
SELECT 'questions'         AS tbl, COUNT(*) FROM questions
UNION ALL
SELECT 'question_attempts' AS tbl, COUNT(*) FROM question_attempts
UNION ALL
SELECT 'practice_sessions' AS tbl, COUNT(*) FROM practice_sessions;

-- 2. אחוז שאלות עם in_scope=true לפי type
SELECT type,
       COUNT(*)                               AS total,
       COUNT(*) FILTER (WHERE in_scope=true)  AS in_scope_count
FROM questions
GROUP BY type;

-- 3. coverage_tracker — gap analysis לפני הוועדה
SELECT scope_id, question_count, scenario_count, recall_rate,
       questions_gap, scenarios_gap
FROM coverage_tracker
WHERE questions_gap = true OR scenarios_gap = true
ORDER BY scope_id;

-- 4. due-queue לתרגול (Spaced-Repetition)
SELECT q.id, q.type, q.prompt, qa.next_due_at
FROM question_attempts qa
JOIN questions q ON q.id = qa.question_id
WHERE qa.user_id = '<motilev8-uuid>'
  AND qa.next_due_at <= now()
ORDER BY qa.next_due_at ASC
LIMIT 20;

-- 5. בדיקת FK integrity: שאלות סוג scenario ללא scenario_id
SELECT id, type FROM questions
WHERE type = 'scenario_walkthrough' AND scenario_id IS NULL;
-- צריך להחזיר 0 שורות

-- 6. chunks ללא embedding (ממתינות ל-vectorization)
SELECT COUNT(*) AS pending_embeddings
FROM chunks
WHERE embedding IS NULL AND in_scope = true;

-- 7. join מלא: source → chunk → question
SELECT cs.title, cs.tier, c.chunk_index, q.type, q.prompt
FROM content_sources cs
JOIN chunks   c ON c.source_id = cs.id
JOIN questions q ON q.source_chunk_id = c.id
WHERE cs.in_scope = true
LIMIT 10;
```

---

## Alternatives Considered

### Option A: טבלת `scope_items` נפרדת

ישות DB ל-21 פריטי-החקיקה עם FK מ-questions/chunks.

- ✅ referential integrity מלאה
- ❌ over-engineering: הרשימה סטטית, לא תשתנה ב-MVP. FK-maintenance מוסיף migration ללא value.

### Option B: `questions` מפוצלת ל-5 טבלאות (אחת לכל type)

- ✅ schema-per-type נקי יותר
- ❌ coverage_tracker ו-attempts דורשים UNION-ים כבדים; N+1-prone ב-session-generation
- ❌ polymorphism ב-Drizzle ORM מסובך יותר לתחזוקה

### Option C: `options` + `correct_answer` כ-columns מופרדים לכל type

- ❌ sparse columns רבים + NULL בכל שדה שלא רלוונטי. jsonb גמיש יותר עם validation ב-app layer.

---

## Consequences

### Positive

- schema גמיש ל-5 quiz-types בטבלה אחת — אין N+1 ב-session-generation
- GIN index על `scope_refs` מאפשר שאילתת `@>` יעילה ל-coverage_tracker
- HNSW על embedding מאפשר semantic-search ב-"הסבר לעומק" ב-< 100ms
- RLS service-role לכתיבה = import-pipeline לא חשוף למשתמש

### Negative

- `options jsonb` — validation חייב להיות ב-app layer (Drizzle schema + Zod parser); אין DB-level type-check לפי `question_type`
- embedding NULL עד vectorization — צריך לסנן ב-queries שמחפשים similarity

### Neutral

- coverage_tracker כ-VIEW (לא materialized) — מספיק ל-n=1 משתמש; אם ה-DB יגדל ל-multi-user, יש לשקול `MATERIALIZED VIEW REFRESH CONCURRENTLY`

---

## Validation Checklist

- [ ] כל 6 הטבלאות נוצרות ב-`pnpm db:push` ללא שגיאות
- [ ] `pnpm db:studio` — ניתן להציג את coverage_tracker VIEW
- [ ] query 5 (FK integrity) מחזיר 0 שורות
- [ ] import של 5 שאלות לדוגמה → query 2 מציג `in_scope_count > 0`
- [ ] HNSW index נוצר (`\d chunks` ב-psql → רואים hnsw index)
- [ ] RLS: user שאינו motilev8 לא יכול לכתוב ל-question_attempts (Supabase RLS test)

---

## References

- ADR-005 (NotebookLM Hybrid) — scope filter + answer_status values
- ADR-009 (Magen Integration) — Drive = source-of-truth
- `docs/content-scope.md` — 21 פריטי-החקיקה
- `docs/content-inventory.md` — tier system + ~130 קבצים
- `docs/mvp-plan-2026-07-15.md §10.3` — quiz types + §10.6 coverage tracker
- [pgvector HNSW indexing](https://github.com/pgvector/pgvector#hnsw)
- [Drizzle ORM + Supabase](https://orm.drizzle.team/docs/get-started/supabase-new)

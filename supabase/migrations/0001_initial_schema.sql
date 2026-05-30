-- StudiBuilder DB Schema — Initial Migration
-- ADR-010 (Data Schema MVP) + chat_sessions extension (Mode C)
-- Date: 2026-05-30
-- Target: existing Supabase project (Phase 1 already deployed)
--
-- HOW TO RUN:
-- 1. Open Supabase Dashboard → SQL Editor (https://supabase.com/dashboard)
-- 2. New Query → paste this entire file → click RUN
-- 3. Verify with: SELECT count(*) FROM coverage_tracker; → should return 57
--
-- ROLLBACK (if needed):
-- DROP VIEW coverage_tracker;
-- DROP TABLE chat_sessions, question_attempts, practice_sessions,
--            questions, scenarios, chunks, content_sources CASCADE;
-- DROP TYPE content_tier, content_status, question_type, chat_depth, session_mode;

-- ═══════════════════════════════════════════════════════════════
-- 1. EXTENSIONS
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
-- 2. CUSTOM TYPES (Enums)
-- ═══════════════════════════════════════════════════════════════

CREATE TYPE content_tier AS ENUM ('T1', 'T2', 'T3', 'T4');
CREATE TYPE content_status AS ENUM ('מאומת', 'מוסקנא', 'לא ידוע');
CREATE TYPE question_type AS ENUM (
  'mcq_long',
  'mcq_short',
  'matching',
  'explanation',
  'scenario_walkthrough'
);
CREATE TYPE chat_depth AS ENUM ('foundation', 'advanced', 'review');
CREATE TYPE session_mode AS ENUM ('practice', 'exam', 'spaced_repetition');

-- ═══════════════════════════════════════════════════════════════
-- 3. TABLES
-- ═══════════════════════════════════════════════════════════════

-- ── 3.1 content_sources — every Drive file we import ──
CREATE TABLE content_sources (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drive_file_id    TEXT UNIQUE NOT NULL,
  title            TEXT NOT NULL,
  mime_type        TEXT NOT NULL,
  size_bytes       BIGINT,
  tier             content_tier NOT NULL,
  scope_refs       JSONB NOT NULL DEFAULT '[]'::jsonb,
  in_scope         BOOLEAN NOT NULL DEFAULT true,
  content_hash     TEXT UNIQUE,
  imported_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sources_tier      ON content_sources (tier);
CREATE INDEX idx_sources_in_scope  ON content_sources (in_scope) WHERE in_scope = true;

-- ── 3.2 chunks — semantic text chunks with embeddings ──
CREATE TABLE chunks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id        UUID NOT NULL REFERENCES content_sources(id) ON DELETE CASCADE,
  chunk_index      INTEGER NOT NULL,
  text             TEXT NOT NULL,
  embedding        vector(1024),
  in_scope         BOOLEAN NOT NULL DEFAULT true,
  scope_refs       JSONB NOT NULL DEFAULT '[]'::jsonb,
  status           content_status NOT NULL DEFAULT 'מאומת',
  token_count      INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, chunk_index)
);
CREATE INDEX idx_chunks_in_scope   ON chunks (in_scope) WHERE in_scope = true;
CREATE INDEX idx_chunks_status     ON chunks (status);
-- HNSW vector index for RAG (cosine similarity)
CREATE INDEX idx_chunks_embedding  ON chunks USING hnsw (embedding vector_cosine_ops);

-- ── 3.3 scenarios — case-studies for Mode B ──
CREATE TABLE scenarios (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  background       TEXT NOT NULL,
  data             TEXT,
  task             TEXT NOT NULL,
  solution         TEXT NOT NULL,
  rubric           JSONB NOT NULL DEFAULT '[]'::jsonb,
  scope_refs       JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_ref       TEXT,
  status           content_status NOT NULL DEFAULT 'מאומת',
  difficulty       SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_scenarios_status  ON scenarios (status);

-- ── 3.4 questions — 5 quiz types in one table ──
CREATE TABLE questions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type             question_type NOT NULL,
  prompt           TEXT NOT NULL,
  options          JSONB,
  correct_answer   JSONB,
  explanation      TEXT,
  source_chunk_id  UUID REFERENCES chunks(id)   ON DELETE SET NULL,
  scenario_id      UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  scope_refs       JSONB NOT NULL DEFAULT '[]'::jsonb,
  in_scope         BOOLEAN NOT NULL DEFAULT true,
  status           content_status NOT NULL DEFAULT 'מאומת',
  difficulty       SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Scenario type requires scenario_id
  CONSTRAINT scenario_needs_ref CHECK (
    type != 'scenario_walkthrough' OR scenario_id IS NOT NULL
  )
);
CREATE INDEX idx_questions_type      ON questions (type);
CREATE INDEX idx_questions_in_scope  ON questions (in_scope) WHERE in_scope = true;
CREATE INDEX idx_questions_status    ON questions (status);

-- ── 3.5 practice_sessions — quiz session runs ──
CREATE TABLE practice_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode                session_mode NOT NULL,
  scope_filter        JSONB,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at            TIMESTAMPTZ,
  total_questions     INTEGER DEFAULT 0,
  correct_count       INTEGER DEFAULT 0,
  score_percent       NUMERIC(5,2),
  time_limit_seconds  INTEGER
);
CREATE INDEX idx_sessions_user_started ON practice_sessions (user_id, started_at DESC);

-- ── 3.6 question_attempts — every answer event ──
CREATE TABLE question_attempts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id           UUID NOT NULL REFERENCES questions(id)  ON DELETE CASCADE,
  practice_session_id   UUID REFERENCES practice_sessions(id)   ON DELETE SET NULL,
  user_answer           JSONB,
  is_correct            BOOLEAN NOT NULL,
  score_percent         NUMERIC(5,2),
  time_spent_seconds    INTEGER,
  feedback              JSONB,
  attempted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Spaced Repetition (SM-2) fields
  next_review_at        TIMESTAMPTZ,
  sr_interval_days      SMALLINT,
  sr_ease_factor        NUMERIC(3,2) DEFAULT 2.5
);
CREATE INDEX idx_attempts_user_time     ON question_attempts (user_id, attempted_at DESC);
CREATE INDEX idx_attempts_question      ON question_attempts (question_id);
CREATE INDEX idx_attempts_review        ON question_attempts (user_id, next_review_at)
  WHERE next_review_at IS NOT NULL;

-- ── 3.7 chat_sessions — Mode C AI Tutor conversations ──
CREATE TABLE chat_sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope_id          TEXT,
  topic             TEXT NOT NULL,
  depth             chat_depth NOT NULL,
  messages          JSONB NOT NULL DEFAULT '[]'::jsonb,
  message_count     INTEGER NOT NULL DEFAULT 0,
  total_tokens_in   INTEGER DEFAULT 0,
  total_tokens_out  INTEGER DEFAULT 0,
  total_cost_usd    NUMERIC(10,4) DEFAULT 0,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at          TIMESTAMPTZ,
  last_message_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_chat_user_started ON chat_sessions (user_id, started_at DESC);
CREATE INDEX idx_chat_scope        ON chat_sessions (scope_id) WHERE scope_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- 4. VIEW: coverage_tracker (inlines 57 scope-IDs via CTE)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW coverage_tracker AS
WITH scope_ids(scope_id, category) AS (
  VALUES
    -- 1. ארגון הפיקוח (8)
    ('1.0',   'ארגון הפיקוח'),
    ('1.1',   'ארגון הפיקוח'),
    ('1.2',   'ארגון הפיקוח'),
    ('1.3',   'ארגון הפיקוח'),
    ('1.4',   'ארגון הפיקוח'),
    ('1.5',   'ארגון הפיקוח'),
    ('1.5.1', 'ארגון הפיקוח'),
    ('1.5.2', 'ארגון הפיקוח'),
    -- 2. פקודת הבטיחות (17)
    ('2.0',    'פקודת הבטיחות'),
    ('2.1',    'פקודת הבטיחות'),
    ('2.2',    'פקודת הבטיחות'),
    ('2.3',    'פקודת הבטיחות'),
    ('2.4',    'פקודת הבטיחות'),
    ('2.4.1',  'פקודת הבטיחות'),
    ('2.4.2',  'פקודת הבטיחות'),
    ('2.5',    'פקודת הבטיחות'),
    ('2.6',    'פקודת הבטיחות'),
    ('2.6.1',  'פקודת הבטיחות'),
    ('2.6.2',  'פקודת הבטיחות'),
    ('2.7',    'פקודת הבטיחות'),
    ('2.8',    'פקודת הבטיחות'),
    ('2.9',    'פקודת הבטיחות'),
    ('2.10',   'פקודת הבטיחות'),
    ('2.11',   'פקודת הבטיחות'),
    ('2.11.1', 'פקודת הבטיחות'),
    -- 3. גהות + רפואה תעסוקתית (11)
    ('3.1',   'גהות + רפואה'),
    ('3.2',   'גהות + רפואה'),
    ('3.3',   'גהות + רפואה'),
    ('3.4',   'גהות + רפואה'),
    ('3.5',   'גהות + רפואה'),
    ('3.5.1', 'גהות + רפואה'),
    ('3.5.2', 'גהות + רפואה'),
    ('3.5.3', 'גהות + רפואה'),
    ('3.6',   'גהות + רפואה'),
    ('3.7',   'גהות + רפואה'),
    ('3.8',   'גהות + רפואה'),
    -- 4. חוקים-עזר (6)
    ('4.1',   'חוקים-עזר'),
    ('4.2',   'חוקים-עזר'),
    ('4.3',   'חוקים-עזר'),
    ('4.3.1', 'חוקים-עזר'),
    ('4.4',   'חוקים-עזר'),
    ('4.5',   'חוקים-עזר'),
    -- 5. תקני-ISO (6)
    ('5.1', 'תקני ISO'),
    ('5.2', 'תקני ISO'),
    ('5.3', 'תקני ISO'),
    ('5.4', 'תקני ISO'),
    ('5.5', 'תקני ISO'),
    ('5.6', 'תקני ISO'),
    -- 6. שיטות-ניתוח (5)
    ('6.1', 'שיטות-ניתוח'),
    ('6.2', 'שיטות-ניתוח'),
    ('6.3', 'שיטות-ניתוח'),
    ('6.4', 'שיטות-ניתוח'),
    ('6.5', 'שיטות-ניתוח'),
    -- 7. גופים-מוסדיים (4)
    ('7.1', 'גופים-מוסדיים'),
    ('7.2', 'גופים-מוסדיים'),
    ('7.3', 'גופים-מוסדיים'),
    ('7.4', 'גופים-מוסדיים')
)
SELECT
  s.scope_id,
  s.category,
  COUNT(DISTINCT q.id) FILTER (WHERE q.in_scope = true) AS question_count,
  COUNT(DISTINCT sc.id)                                  AS scenario_count,
  COUNT(DISTINCT qa.id)                                  AS attempt_count,
  COALESCE(
    AVG(CASE WHEN qa.is_correct THEN 100.0 ELSE 0.0 END),
    0.0
  )::NUMERIC(5,2) AS recall_rate,
  (COUNT(DISTINCT q.id) FILTER (WHERE q.in_scope = true) < 5) AS gap_questions,
  (COUNT(DISTINCT sc.id)                                  < 2) AS gap_scenarios
FROM scope_ids s
LEFT JOIN questions q
  ON q.scope_refs ? s.scope_id AND q.in_scope = true
LEFT JOIN scenarios sc
  ON sc.scope_refs ? s.scope_id
LEFT JOIN question_attempts qa
  ON qa.question_id = q.id
GROUP BY s.scope_id, s.category
ORDER BY s.scope_id;

-- ═══════════════════════════════════════════════════════════════
-- 5. RLS POLICIES (motilev8-only for MVP)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE content_sources    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions      ENABLE ROW LEVEL SECURITY;

-- Content tables: anyone can read (public quiz), only admin can write
CREATE POLICY "content_sources_read_all"  ON content_sources  FOR SELECT USING (true);
CREATE POLICY "content_sources_admin_write" ON content_sources FOR ALL TO authenticated
  USING      (auth.jwt()->>'email' = 'motilev8@gmail.com')
  WITH CHECK (auth.jwt()->>'email' = 'motilev8@gmail.com');

CREATE POLICY "chunks_read_all" ON chunks FOR SELECT USING (true);
CREATE POLICY "chunks_admin_write" ON chunks FOR ALL TO authenticated
  USING      (auth.jwt()->>'email' = 'motilev8@gmail.com')
  WITH CHECK (auth.jwt()->>'email' = 'motilev8@gmail.com');

CREATE POLICY "scenarios_read_all" ON scenarios FOR SELECT USING (true);
CREATE POLICY "scenarios_admin_write" ON scenarios FOR ALL TO authenticated
  USING      (auth.jwt()->>'email' = 'motilev8@gmail.com')
  WITH CHECK (auth.jwt()->>'email' = 'motilev8@gmail.com');

CREATE POLICY "questions_read_all" ON questions FOR SELECT USING (true);
CREATE POLICY "questions_admin_write" ON questions FOR ALL TO authenticated
  USING      (auth.jwt()->>'email' = 'motilev8@gmail.com')
  WITH CHECK (auth.jwt()->>'email' = 'motilev8@gmail.com');

-- User-data tables: own data only
CREATE POLICY "practice_sessions_own" ON practice_sessions FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "question_attempts_own" ON question_attempts FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_sessions_own" ON chat_sessions FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- 6. TRIGGERS (updated_at auto-update)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_sources_updated_at
  BEFORE UPDATE ON content_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════
-- ✅ DONE. Verification queries:
-- ═══════════════════════════════════════════════════════════════
-- SELECT COUNT(*) FROM coverage_tracker;       -- expected: 57
-- SELECT * FROM coverage_tracker LIMIT 5;      -- expected: all zeros
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY table_name;
-- expected: chat_sessions, chunks, content_sources, practice_sessions,
--           question_attempts, questions, scenarios

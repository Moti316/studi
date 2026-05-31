-- StudiBuilder DB Schema — Migration 0002
-- Add questions.source_ref + UNIQUE index (idempotent import support)
-- Date: 2026-05-31
-- Author: data-engineer (דנה)
--
-- WHY: enables `INSERT ... ON CONFLICT (source_ref) DO ...` in the Drive import
--      pipeline (ADR-011), so re-running an import does not duplicate questions.
--      NULLs are distinct in Postgres, so manual/ad-hoc questions (NULL ref) are
--      unaffected by the unique constraint.
--
-- Generated incrementally via `drizzle-kit generate` (two-pass diff against 0001),
-- kept hand-applied per drizzle.config.ts convention (Supabase SQL Editor).
--
-- HOW TO RUN:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. New Query → paste this file → RUN (must run AFTER 0001_initial_schema.sql)
-- 3. Verify:
--    SELECT column_name FROM information_schema.columns
--      WHERE table_name='questions' AND column_name='source_ref';  -- 1 row
--    SELECT indexname FROM pg_indexes
--      WHERE tablename='questions' AND indexname='idx_questions_source_ref'; -- 1 row
--
-- ROLLBACK:
-- DROP INDEX IF EXISTS idx_questions_source_ref;
-- ALTER TABLE questions DROP COLUMN IF EXISTS source_ref;

ALTER TABLE "questions" ADD COLUMN "source_ref" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_questions_source_ref" ON "questions" USING btree ("source_ref");

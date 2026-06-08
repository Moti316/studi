/**
 * StudiBuilder DB Schema — Drizzle ORM reflection of Supabase tables.
 *
 * Source-of-truth: `supabase/migrations/0001_initial_schema.sql`
 * This file is for TypeScript queries only; the SQL file creates the actual tables.
 *
 * Conventions:
 * - Hebrew comments for product meaning, English for technical schema.
 * - All tables use UUID primary keys with `uuid_generate_v4()`.
 * - All `*_at` timestamps are `TIMESTAMPTZ` with `NOW()` default.
 * - JSONB used for: scope_refs, options, correct_answer, rubric, messages, feedback.
 */

import {
  pgTable,
  uuid,
  text,
  jsonb,
  boolean,
  integer,
  smallint,
  bigint,
  timestamp,
  numeric,
  pgEnum,
  uniqueIndex,
  index,
  check,
  customType,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

// ─── Custom type: pgvector (1024 dims for Voyage AI multilingual) ──────
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1024)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(',').map(Number);
  },
});

// ─── Enums ──────────────────────────────────────────────────────────────
export const contentTier = pgEnum('content_tier', ['T1', 'T2', 'T3', 'T4']);
export const contentStatus = pgEnum('content_status', ['מאומת', 'מוסקנא', 'לא ידוע']);
export const questionType = pgEnum('question_type', [
  'mcq_long',
  'mcq_short',
  'matching',
  'explanation',
  'scenario_walkthrough',
]);
export const chatDepth = pgEnum('chat_depth', ['foundation', 'advanced', 'review']);
export const sessionMode = pgEnum('session_mode', ['practice', 'exam', 'spaced_repetition']);

// ─── content_sources ──────────────────────────────────────────────────
export const contentSources = pgTable(
  'content_sources',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    driveFileId: text('drive_file_id').notNull().unique(),
    title: text('title').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }),
    tier: contentTier('tier').notNull(),
    scopeRefs: jsonb('scope_refs')
      .notNull()
      .default(sql`'[]'::jsonb`),
    inScope: boolean('in_scope').notNull().default(true),
    contentHash: text('content_hash').unique(),
    importedAt: timestamp('imported_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tierIdx: index('idx_sources_tier').on(t.tier),
    inScopeIdx: index('idx_sources_in_scope')
      .on(t.inScope)
      .where(sql`${t.inScope} = true`),
  }),
);

// ─── chunks ────────────────────────────────────────────────────────────
export const chunks = pgTable(
  'chunks',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => contentSources.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull(),
    text: text('text').notNull(),
    embedding: vector('embedding'),
    inScope: boolean('in_scope').notNull().default(true),
    scopeRefs: jsonb('scope_refs')
      .notNull()
      .default(sql`'[]'::jsonb`),
    status: contentStatus('status').notNull().default('מאומת'),
    tokenCount: integer('token_count'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sourceChunkIdx: uniqueIndex('chunks_source_chunk_idx').on(t.sourceId, t.chunkIndex),
    inScopeIdx: index('idx_chunks_in_scope')
      .on(t.inScope)
      .where(sql`${t.inScope} = true`),
    statusIdx: index('idx_chunks_status').on(t.status),
  }),
);

// ─── scenarios ─────────────────────────────────────────────────────────
export const scenarios = pgTable(
  'scenarios',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    title: text('title').notNull(),
    background: text('background').notNull(),
    data: text('data'),
    task: text('task').notNull(),
    solution: text('solution').notNull(),
    rubric: jsonb('rubric')
      .notNull()
      .default(sql`'[]'::jsonb`),
    scopeRefs: jsonb('scope_refs')
      .notNull()
      .default(sql`'[]'::jsonb`),
    // Stable provenance key for the NotebookLM scenario-import pipeline — lets
    // `onConflict(source_ref)` make re-imports idempotent (migration 0003).
    // Nullable: hand-authored scenarios (NULL ref) skip de-dup (NULLs distinct).
    sourceRef: text('source_ref'),
    status: contentStatus('status').notNull().default('מאומת'),
    difficulty: smallint('difficulty'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('idx_scenarios_status').on(t.status),
    // Unique on source_ref enables ON CONFLICT (source_ref) idempotent imports
    // (mirrors idx_questions_source_ref). Postgres treats NULLs as distinct.
    sourceRefIdx: uniqueIndex('idx_scenarios_source_ref').on(t.sourceRef),
  }),
);

// ─── questions ─────────────────────────────────────────────────────────
export const questions = pgTable(
  'questions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    type: questionType('type').notNull(),
    prompt: text('prompt').notNull(),
    options: jsonb('options'),
    correctAnswer: jsonb('correct_answer'),
    explanation: text('explanation'),
    sourceChunkId: uuid('source_chunk_id').references(() => chunks.id, {
      onDelete: 'set null',
    }),
    scenarioId: uuid('scenario_id').references(() => scenarios.id, {
      onDelete: 'set null',
    }),
    scopeRefs: jsonb('scope_refs')
      .notNull()
      .default(sql`'[]'::jsonb`),
    inScope: boolean('in_scope').notNull().default(true),
    status: contentStatus('status').notNull().default('מאומת'),
    difficulty: smallint('difficulty'),
    // Stable provenance key for the import pipeline — lets `onConflict(source_ref)`
    // make re-imports idempotent (e.g. a per-source-question deterministic ref).
    // Nullable: questions generated without a source-ref (manual/ad-hoc) skip de-dup.
    sourceRef: text('source_ref'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    typeIdx: index('idx_questions_type').on(t.type),
    inScopeIdx: index('idx_questions_in_scope')
      .on(t.inScope)
      .where(sql`${t.inScope} = true`),
    statusIdx: index('idx_questions_status').on(t.status),
    // Unique on source_ref enables ON CONFLICT (source_ref) idempotent imports.
    // Postgres treats NULLs as distinct, so manual questions (NULL ref) are unaffected.
    sourceRefIdx: uniqueIndex('idx_questions_source_ref').on(t.sourceRef),
    scenarioCheck: check(
      'scenario_needs_ref',
      sql`${t.type} != 'scenario_walkthrough' OR ${t.scenarioId} IS NOT NULL`,
    ),
  }),
);

// ─── practice_sessions ─────────────────────────────────────────────────
export const practiceSessions = pgTable(
  'practice_sessions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    userId: uuid('user_id').notNull(), // FK to auth.users — Supabase managed
    mode: sessionMode('mode').notNull(),
    scopeFilter: jsonb('scope_filter'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    totalQuestions: integer('total_questions').default(0),
    correctCount: integer('correct_count').default(0),
    scorePercent: numeric('score_percent', { precision: 5, scale: 2 }),
    timeLimitSeconds: integer('time_limit_seconds'),
  },
  (t) => ({
    userStartedIdx: index('idx_sessions_user_started').on(t.userId, t.startedAt),
  }),
);

// ─── question_attempts ─────────────────────────────────────────────────
export const questionAttempts = pgTable(
  'question_attempts',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    userId: uuid('user_id').notNull(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    practiceSessionId: uuid('practice_session_id').references(() => practiceSessions.id, {
      onDelete: 'set null',
    }),
    userAnswer: jsonb('user_answer'),
    isCorrect: boolean('is_correct').notNull(),
    scorePercent: numeric('score_percent', { precision: 5, scale: 2 }),
    timeSpentSeconds: integer('time_spent_seconds'),
    feedback: jsonb('feedback'),
    attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull().defaultNow(),
    // Spaced Repetition (SM-2)
    nextReviewAt: timestamp('next_review_at', { withTimezone: true }),
    srIntervalDays: smallint('sr_interval_days'),
    srEaseFactor: numeric('sr_ease_factor', { precision: 3, scale: 2 }).default('2.5'),
  },
  (t) => ({
    userTimeIdx: index('idx_attempts_user_time').on(t.userId, t.attemptedAt),
    questionIdx: index('idx_attempts_question').on(t.questionId),
    reviewIdx: index('idx_attempts_review')
      .on(t.userId, t.nextReviewAt)
      .where(sql`${t.nextReviewAt} IS NOT NULL`),
  }),
);

// ─── chat_sessions (Mode C: AI Tutor) ──────────────────────────────────
export const chatSessions = pgTable(
  'chat_sessions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    userId: uuid('user_id').notNull(),
    scopeId: text('scope_id'),
    topic: text('topic').notNull(),
    depth: chatDepth('depth').notNull(),
    messages: jsonb('messages')
      .notNull()
      .default(sql`'[]'::jsonb`),
    messageCount: integer('message_count').notNull().default(0),
    totalTokensIn: integer('total_tokens_in').default(0),
    totalTokensOut: integer('total_tokens_out').default(0),
    totalCostUsd: numeric('total_cost_usd', { precision: 10, scale: 4 }).default('0'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userStartedIdx: index('idx_chat_user_started').on(t.userId, t.startedAt),
    scopeIdx: index('idx_chat_scope')
      .on(t.scopeId)
      .where(sql`${t.scopeId} IS NOT NULL`),
  }),
);

// ─── Relations ─────────────────────────────────────────────────────────
export const contentSourcesRelations = relations(contentSources, ({ many }) => ({
  chunks: many(chunks),
}));

export const chunksRelations = relations(chunks, ({ one, many }) => ({
  source: one(contentSources, {
    fields: [chunks.sourceId],
    references: [contentSources.id],
  }),
  questions: many(questions),
}));

export const scenariosRelations = relations(scenarios, ({ many }) => ({
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  sourceChunk: one(chunks, {
    fields: [questions.sourceChunkId],
    references: [chunks.id],
  }),
  scenario: one(scenarios, {
    fields: [questions.scenarioId],
    references: [scenarios.id],
  }),
  attempts: many(questionAttempts),
}));

export const practiceSessionsRelations = relations(practiceSessions, ({ many }) => ({
  attempts: many(questionAttempts),
}));

export const questionAttemptsRelations = relations(questionAttempts, ({ one }) => ({
  question: one(questions, {
    fields: [questionAttempts.questionId],
    references: [questions.id],
  }),
  session: one(practiceSessions, {
    fields: [questionAttempts.practiceSessionId],
    references: [practiceSessions.id],
  }),
}));

// ─── Inferred types (for app code) ─────────────────────────────────────
export type ContentSource = typeof contentSources.$inferSelect;
export type NewContentSource = typeof contentSources.$inferInsert;
export type Chunk = typeof chunks.$inferSelect;
export type NewChunk = typeof chunks.$inferInsert;
export type Scenario = typeof scenarios.$inferSelect;
export type NewScenario = typeof scenarios.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type PracticeSession = typeof practiceSessions.$inferSelect;
export type NewPracticeSession = typeof practiceSessions.$inferInsert;
export type QuestionAttempt = typeof questionAttempts.$inferSelect;
export type NewQuestionAttempt = typeof questionAttempts.$inferInsert;
export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;

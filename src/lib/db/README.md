# src/lib/db - Supabase + Drizzle

> **Phase**: 1+ · Owner: data-engineer

Drizzle schemas + queries מול Supabase Postgres (+ pgvector).

## קבצים מתוכננים

- `client.ts` - Drizzle client (postgres-js driver)
- `schema/` - tables (one file per domain)
  - `auth.ts` - users, user_settings, auth_tokens
  - `courses.ts` - courses, course_files, lessons, questions
  - `chunks.ts` - chunks + embeddings (pgvector)
  - `attempts.ts` - quiz attempts + xp
  - `credits.ts` - credits + transactions
  - `streaks.ts` - daily streaks
- `queries/` - typed query helpers
- `migrations/` - drizzle-kit generated

## עקרונות

- **strict schemas**: כל column מוגדר עם type + nullable + default
- **foreign keys**: cascade-delete מסומן במפורש
- **indexes**: על כל foreign key + לפי שאילתות נפוצות
- **pgvector**: HNSW index לחיפוש סמנטי
- **RLS policies**: Supabase Row Level Security על כל הטבלאות
- **migrations**: רק forward, אסור destructive בלי ADR

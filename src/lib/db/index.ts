/**
 * Drizzle DB client (typed queries on Supabase Postgres).
 *
 * Used in:
 *   - Next.js API routes (server-only)
 *   - Scripts (import-t1.ts, import-t2.ts, ...)
 *
 * NOT for client components (use Supabase JS SDK for auth-aware queries).
 *
 * Connection: `DATABASE_URL` from `.env.local` (Supabase pooled connection).
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../drizzle/schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Add it to .env.local');
}

// `prepare: false` — Supabase Transaction Pooler doesn't support prepared statements
const queryClient = postgres(databaseUrl, { prepare: false });

export const db = drizzle(queryClient, { schema });
export { schema };
export type DB = typeof db;

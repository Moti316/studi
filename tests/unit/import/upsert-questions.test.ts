/**
 * tests/unit/import/upsert-questions.test.ts
 *
 * Unit tests for the idempotent question upsert. The Drizzle `db` (and thus the
 * real Postgres connection / DATABASE_URL) is fully mocked — NO database.
 *
 * We assert: the ON CONFLICT (source_ref) DO NOTHING chain is used, inserted vs.
 * skipped is derived from RETURNING rows, batching works, and the missing-ref
 * guard rejects rows that cannot be de-duplicated.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// ── Mock the DB module (avoids needing DATABASE_URL + a live connection). ──
// vi.hoisted: the mock factory is hoisted above the file, so the spies it
// references must be created in a hoisted block too.
const { returningMock, onConflictDoNothingMock, valuesMock, insertMock } = vi.hoisted(() => {
  const returning = vi.fn();
  const onConflictDoNothing = vi.fn((_cfg?: unknown) => ({ returning }));
  const values = vi.fn((_rows?: unknown) => ({ onConflictDoNothing }));
  const insert = vi.fn((_table?: unknown) => ({ values }));
  return {
    returningMock: returning,
    onConflictDoNothingMock: onConflictDoNothing,
    valuesMock: values,
    insertMock: insert,
  };
});

vi.mock('@/lib/db', () => ({
  db: { insert: insertMock },
}));

import { upsertQuestions } from '@/lib/import/upsert-questions';
import type { NewQuestion } from '../../../drizzle/schema';

function row(sourceRef: string | null): NewQuestion {
  return {
    type: 'mcq_short',
    prompt: 'שאלה',
    options: ['א', 'ב'],
    correctAnswer: { index: 0 },
    explanation: null,
    scopeRefs: [],
    inScope: true,
    status: 'מוסקנא',
    sourceRef,
  } as NewQuestion;
}

beforeEach(() => {
  returningMock.mockReset();
  onConflictDoNothingMock.mockClear();
  valuesMock.mockClear();
  insertMock.mockClear();
});

describe('upsertQuestions — empty input', () => {
  it('returns {0,0} and does not touch the db', async () => {
    const res = await upsertQuestions([]);
    expect(res).toEqual({ inserted: 0, skipped: 0 });
    expect(insertMock).not.toHaveBeenCalled();
  });
});

describe('upsertQuestions — idempotent insert', () => {
  it('uses ON CONFLICT (source_ref) DO NOTHING + RETURNING', async () => {
    returningMock.mockResolvedValueOnce([{ id: '1' }, { id: '2' }]);
    await upsertQuestions([row('a'), row('b')]);

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(valuesMock).toHaveBeenCalledTimes(1);
    // Conflict target must be the source_ref column.
    expect(onConflictDoNothingMock).toHaveBeenCalledTimes(1);
    const conflictArg = onConflictDoNothingMock.mock.calls[0]![0] as { target?: unknown };
    expect(conflictArg?.target).toBeDefined();
  });

  it('counts inserted = returned rows, skipped = rest', async () => {
    // 3 rows in, only 2 returned (1 was a duplicate / conflict).
    returningMock.mockResolvedValueOnce([{ id: '1' }, { id: '2' }]);
    const res = await upsertQuestions([row('a'), row('b'), row('c')]);
    expect(res).toEqual({ inserted: 2, skipped: 1 });
  });

  it('all skipped on a full re-run (returning [])', async () => {
    returningMock.mockResolvedValueOnce([]);
    const res = await upsertQuestions([row('a'), row('b')]);
    expect(res).toEqual({ inserted: 0, skipped: 2 });
  });
});

describe('upsertQuestions — batching', () => {
  it('splits > 500 rows into multiple insert statements', async () => {
    const many = Array.from({ length: 1200 }, (_, i) => row(`r${i}`));
    // 3 batches: 500 + 500 + 200.
    returningMock
      .mockResolvedValueOnce(Array.from({ length: 500 }, (_, i) => ({ id: `${i}` })))
      .mockResolvedValueOnce(Array.from({ length: 500 }, (_, i) => ({ id: `${500 + i}` })))
      .mockResolvedValueOnce(Array.from({ length: 200 }, (_, i) => ({ id: `${1000 + i}` })));

    const res = await upsertQuestions(many);
    expect(insertMock).toHaveBeenCalledTimes(3);
    expect(res).toEqual({ inserted: 1200, skipped: 0 });
  });
});

describe('upsertQuestions — missing-ref guard', () => {
  it('throws if any row lacks a source_ref (cannot de-dup)', async () => {
    await expect(upsertQuestions([row('a'), row(null)])).rejects.toThrow(/source_ref/i);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('throws on a blank source_ref', async () => {
    await expect(upsertQuestions([row('   ')])).rejects.toThrow(/source_ref/i);
  });
});

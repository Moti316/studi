/**
 * tests/unit/import/upsert-scenarios.test.ts
 *
 * Unit tests for the idempotent scenario upsert. The Drizzle `db` (and thus the
 * real Postgres connection / DATABASE_URL) is fully mocked — NO database.
 *
 * Mirrors tests/unit/import/upsert-questions.test.ts structure.
 *
 * Asserts:
 * - throws when any row lacks a sourceRef (cannot de-dup).
 * - uses ON CONFLICT (source_ref) DO NOTHING chain.
 * - counts inserted = RETURNING rows, skipped = rest.
 * - returns insertedIds from RETURNING.
 * - batches > 500 rows into multiple INSERT statements.
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

import { upsertScenarios } from '@/lib/import/upsert-scenarios';
import type { NewScenario } from '../../../drizzle/schema';

/** בונה NewScenario מינימלי לבדיקה. */
function row(sourceRef: string | null): NewScenario {
  return {
    title: 'תרחיש-בדיקה',
    background: 'רקע: פועל על פיגום ללא מעקה.',
    data: null,
    task: 'נתח את האירוע.',
    solution: '**פעולה מיידית:** הפסקה.\n\n**גיבוי חוקי:** תקנה.\n\n**הנדסה וניהול:** מעקה.',
    rubric: [{ criterion: 'זיהוי הסיכון', points: 1 }],
    scopeRefs: [{ id: '2.1', confidence: 1 }],
    sourceRef,
    status: 'מוסקנא',
  } as NewScenario;
}

beforeEach(() => {
  returningMock.mockReset();
  onConflictDoNothingMock.mockClear();
  valuesMock.mockClear();
  insertMock.mockClear();
});

describe('upsertScenarios — empty input', () => {
  it('returns {0,0,[]} and does not touch the db', async () => {
    const res = await upsertScenarios([]);
    expect(res).toEqual({ inserted: 0, skipped: 0, insertedIds: [] });
    expect(insertMock).not.toHaveBeenCalled();
  });
});

describe('upsertScenarios — idempotent insert', () => {
  it('uses ON CONFLICT (source_ref) DO NOTHING + RETURNING', async () => {
    returningMock.mockResolvedValueOnce([{ id: 'id-1' }, { id: 'id-2' }]);
    await upsertScenarios([row('scn:a:0'), row('scn:b:0')]);

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(valuesMock).toHaveBeenCalledTimes(1);
    // Conflict target must be the source_ref column.
    expect(onConflictDoNothingMock).toHaveBeenCalledTimes(1);
    const conflictArg = onConflictDoNothingMock.mock.calls[0]![0] as { target?: unknown };
    expect(conflictArg?.target).toBeDefined();
  });

  it('counts inserted = returned rows, skipped = rest', async () => {
    // 3 rows in, only 2 returned (1 was a duplicate / conflict).
    returningMock.mockResolvedValueOnce([{ id: 'id-1' }, { id: 'id-2' }]);
    const res = await upsertScenarios([row('scn:a:0'), row('scn:b:0'), row('scn:c:0')]);

    expect(res.inserted).toBe(2);
    expect(res.skipped).toBe(1);
  });

  it('populates insertedIds from RETURNING', async () => {
    returningMock.mockResolvedValueOnce([{ id: 'uuid-x' }, { id: 'uuid-y' }]);
    const res = await upsertScenarios([row('scn:a:0'), row('scn:b:0')]);

    expect(res.insertedIds).toEqual(['uuid-x', 'uuid-y']);
  });

  it('all skipped on a full re-run (returning [])', async () => {
    returningMock.mockResolvedValueOnce([]);
    const res = await upsertScenarios([row('scn:a:0'), row('scn:b:0')]);

    expect(res).toEqual({ inserted: 0, skipped: 2, insertedIds: [] });
  });
});

describe('upsertScenarios — batching', () => {
  it('splits > 500 rows into multiple insert statements', async () => {
    const many = Array.from({ length: 1200 }, (_, i) => row(`scn:file:${i}`));
    // 3 batches: 500 + 500 + 200.
    returningMock
      .mockResolvedValueOnce(Array.from({ length: 500 }, (_, i) => ({ id: `${i}` })))
      .mockResolvedValueOnce(Array.from({ length: 500 }, (_, i) => ({ id: `${500 + i}` })))
      .mockResolvedValueOnce(Array.from({ length: 200 }, (_, i) => ({ id: `${1000 + i}` })));

    const res = await upsertScenarios(many);
    expect(insertMock).toHaveBeenCalledTimes(3);
    expect(res.inserted).toBe(1200);
    expect(res.skipped).toBe(0);
    expect(res.insertedIds).toHaveLength(1200);
  });
});

describe('upsertScenarios — missing-ref guard', () => {
  it('throws if any row lacks a sourceRef (cannot de-dup)', async () => {
    await expect(upsertScenarios([row('scn:a:0'), row(null)])).rejects.toThrow(/source_ref/i);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('throws on a blank sourceRef', async () => {
    await expect(upsertScenarios([row('   ')])).rejects.toThrow(/source_ref/i);
  });

  it('throws on sourceRef that is empty string', async () => {
    await expect(upsertScenarios([row('')])).rejects.toThrow(/source_ref/i);
  });
});

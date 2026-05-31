/**
 * tests/unit/admin/questions-actions.test.ts
 *
 * Unit tests for the question-tagging Server Actions. The Drizzle `db`, the
 * creator gate, and Next's `revalidatePath` are fully mocked — NO database,
 * NO Supabase, NO Next runtime. (Same db-mock style as
 * tests/unit/import/upsert-questions.test.ts; same gate-mock style as
 * tests/unit/auth/creator.test.ts.)
 *
 * Coverage:
 *   - listQuestionsForTagging orders untagged-first by default, and by
 *     created-at when untaggedFirst=false; clamps the limit.
 *   - updateQuestionTags writes only the provided fields (jsonb scope_refs,
 *     in_scope, status), sanitises unknown scope IDs, revalidates, and rejects
 *     empty / id-less patches.
 *   - A non-creator is rejected (the gate throws) before any db write.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// ── Mock the Drizzle db. select() and update() return chainable builders whose
//    terminal call resolves to the mocked rows. vi.hoisted: the mock factory is
//    hoisted above imports, so the spies it references must be hoisted too. ──
const {
  selectRowsMock,
  limitMock,
  orderByMock,
  fromMock,
  selectMock,
  whereMock,
  setMock,
  updateMock,
} = vi.hoisted(() => {
  // SELECT chain: db.select().from().orderBy().limit() → Promise<rows>
  const selectRows = vi.fn<() => unknown[]>(() => []);
  const limit = vi.fn(() => Promise.resolve(selectRows()));
  const orderBy = vi.fn((..._args: unknown[]) => ({ limit }));
  const from = vi.fn((_table?: unknown) => ({ orderBy, limit }));
  const select = vi.fn(() => ({ from }));

  // UPDATE chain: db.update().set().where() → Promise<void>
  const where = vi.fn((_cond?: unknown) => Promise.resolve());
  const set = vi.fn((_values?: unknown) => ({ where }));
  const update = vi.fn((_table?: unknown) => ({ set }));

  return {
    selectRowsMock: selectRows,
    limitMock: limit,
    orderByMock: orderBy,
    fromMock: from,
    selectMock: select,
    whereMock: where,
    setMock: set,
    updateMock: update,
  };
});

vi.mock('@/lib/db', () => ({
  db: { select: selectMock, update: updateMock },
}));

// Creator gate: default = creator passes (resolves). A test can override to
// simulate a non-creator by making it reject (as `redirect` does at runtime).
const requireCreatorMock = vi.fn(() => Promise.resolve({ id: 'creator' }));
vi.mock('@/lib/auth/creator', () => ({
  requireCreator: () => requireCreatorMock(),
}));

const revalidatePathMock = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (p: string) => revalidatePathMock(p),
}));

import { listQuestionsForTagging, updateQuestionTags } from '@/app/admin/questions/actions';
import { questions } from '../../../drizzle/schema';

beforeEach(() => {
  selectRowsMock.mockReset();
  selectRowsMock.mockReturnValue([]);
  limitMock.mockClear();
  orderByMock.mockClear();
  fromMock.mockClear();
  selectMock.mockClear();
  whereMock.mockClear();
  setMock.mockClear();
  updateMock.mockClear();
  requireCreatorMock.mockReset();
  requireCreatorMock.mockResolvedValue({ id: 'creator' });
  revalidatePathMock.mockReset();
});

describe('listQuestionsForTagging — authz', () => {
  it('calls requireCreator before touching the db', async () => {
    requireCreatorMock.mockRejectedValueOnce(new Error('NEXT_REDIRECT:/dashboard'));
    await expect(listQuestionsForTagging()).rejects.toThrow(/redirect/i);
    expect(selectMock).not.toHaveBeenCalled();
  });
});

describe('listQuestionsForTagging — ordering', () => {
  it('orders untagged-first by default (2 order clauses)', async () => {
    await listQuestionsForTagging();
    expect(selectMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith(questions);
    expect(orderByMock).toHaveBeenCalledTimes(1);
    // untaggedFirst ⇒ priority clause + created-at tiebreak = 2 order args.
    expect(orderByMock.mock.calls[0]).toHaveLength(2);
  });

  it('orders by created-at only when untaggedFirst=false (1 order clause)', async () => {
    await listQuestionsForTagging({ untaggedFirst: false });
    expect(orderByMock).toHaveBeenCalledTimes(1);
    expect(orderByMock.mock.calls[0]).toHaveLength(1);
  });

  it('returns the rows the db yields', async () => {
    const rows = [{ id: 'q1' }, { id: 'q2' }];
    selectRowsMock.mockReturnValue(rows);
    await expect(listQuestionsForTagging()).resolves.toBe(rows);
  });
});

describe('listQuestionsForTagging — limit clamping', () => {
  it('uses the default limit when none is given', async () => {
    await listQuestionsForTagging();
    expect(limitMock).toHaveBeenCalledWith(100);
  });

  it('clamps an over-large limit to the hard max (500)', async () => {
    await listQuestionsForTagging({ limit: 100_000 });
    expect(limitMock).toHaveBeenCalledWith(500);
  });

  it('clamps a non-positive / NaN limit up to 1 / default', async () => {
    await listQuestionsForTagging({ limit: 0 });
    expect(limitMock).toHaveBeenCalledWith(1);
    limitMock.mockClear();
    await listQuestionsForTagging({ limit: Number.NaN });
    expect(limitMock).toHaveBeenCalledWith(100);
  });
});

describe('updateQuestionTags — authz', () => {
  it('rejects a non-creator before any db write', async () => {
    requireCreatorMock.mockRejectedValueOnce(new Error('NEXT_REDIRECT:/dashboard'));
    await expect(updateQuestionTags('q1', { in_scope: true })).rejects.toThrow(/redirect/i);
    expect(updateMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe('updateQuestionTags — writes the patch', () => {
  it('writes jsonb scope_refs (sanitised), in_scope and status; revalidates', async () => {
    const res = await updateQuestionTags('q1', {
      scope_refs: [{ id: '2.1', confidence: 0.9 }],
      in_scope: true,
      status: 'מאומת',
    });

    expect(res).toEqual({ ok: true });
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith(questions);

    const setArg = setMock.mock.calls[0]![0] as Record<string, unknown>;
    expect(setArg).toEqual({
      scopeRefs: [{ id: '2.1', confidence: 0.9 }],
      inScope: true,
      status: 'מאומת',
    });
    expect(whereMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/questions');
  });

  it('writes ONLY the provided fields (partial patch)', async () => {
    await updateQuestionTags('q1', { status: 'מוסקנא' });
    const setArg = setMock.mock.calls[0]![0] as Record<string, unknown>;
    expect(setArg).toEqual({ status: 'מוסקנא' });
    expect(Object.keys(setArg)).toEqual(['status']);
  });

  it('drops scope-refs with unknown IDs and clamps confidence to [0,1]', async () => {
    await updateQuestionTags('q1', {
      scope_refs: [
        { id: '2.1', confidence: 1.7 }, // valid id, over-range conf → clamp to 1
        { id: 'not-a-real-id', confidence: 0.5 }, // unknown → dropped
      ],
    });
    const setArg = setMock.mock.calls[0]![0] as { scopeRefs: unknown };
    expect(setArg.scopeRefs).toEqual([{ id: '2.1', confidence: 1 }]);
  });

  it('coerces in_scope to a strict boolean (=== true; defensive)', async () => {
    // in_scope is typed boolean, but the action coerces defensively (=== true),
    // so a non-boolean truthy value (1) is treated as NOT-true → false.
    await updateQuestionTags('q1', { in_scope: 1 as unknown as boolean });
    const setArg = setMock.mock.calls[0]![0] as { inScope: unknown };
    expect(setArg.inScope).toBe(false);

    setMock.mockClear();
    await updateQuestionTags('q2', { in_scope: false });
    const setArg2 = setMock.mock.calls[0]![0] as { inScope: unknown };
    expect(setArg2.inScope).toBe(false);
  });
});

describe('updateQuestionTags — validation guards', () => {
  it('throws on an empty patch (no SET-nothing UPDATE)', async () => {
    await expect(updateQuestionTags('q1', {})).rejects.toThrow(/no updatable fields/i);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('throws on a blank id', async () => {
    await expect(updateQuestionTags('   ', { in_scope: true })).rejects.toThrow(/id/i);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('throws on an invalid status value', async () => {
    await expect(updateQuestionTags('q1', { status: 'bogus' as unknown as never })).rejects.toThrow(
      /invalid status/i,
    );
    expect(updateMock).not.toHaveBeenCalled();
  });
});

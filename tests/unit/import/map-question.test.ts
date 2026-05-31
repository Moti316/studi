/**
 * tests/unit/import/map-question.test.ts
 *
 * Unit tests for the parser→DB row mapping. Pure function, no mocks needed.
 * Asserts mapping against the schema-in-practice (drizzle/schema.ts): type
 * remap, options/correct_answer jsonb shapes, and the default-deny status rule.
 */

import { describe, expect, it } from 'vitest';
import { mapQuestion } from '@/lib/import/map-question';
import type { ParsedQuestion } from '../../../scripts/parsers/types';

const baseMcq: ParsedQuestion = {
  sourceId: 'file.pdf#q1',
  type: 'mcq_short',
  question: 'מהי כשירות ממונה בטיחות?',
  options: ['א', 'ב', 'ג', 'ד'],
  correctIndex: 1,
  scopeRefs: [],
};

describe('mapQuestion — type mapping', () => {
  it("maps parser 'open' → DB 'explanation'", () => {
    const open: ParsedQuestion = {
      sourceId: 'f#1',
      type: 'open',
      question: 'הסבר את פקודת הבטיחות',
      correctAnswerText: 'תשובה מלאה',
      scopeRefs: [],
    };
    expect(mapQuestion(open, 'ref-1').type).toBe('explanation');
  });

  it("passes through 'mcq_long' and 'mcq_short'", () => {
    expect(mapQuestion({ ...baseMcq, type: 'mcq_long' }, 'r').type).toBe('mcq_long');
    expect(mapQuestion({ ...baseMcq, type: 'mcq_short' }, 'r').type).toBe('mcq_short');
  });
});

describe('mapQuestion — options jsonb', () => {
  it('passes MCQ options through as an array', () => {
    const row = mapQuestion(baseMcq, 'r');
    expect(row.options).toEqual(['א', 'ב', 'ג', 'ד']);
  });

  it('sets options=null for explanation (open) questions', () => {
    const open: ParsedQuestion = {
      sourceId: 'f#1',
      type: 'open',
      question: 'שאלה פתוחה',
      correctAnswerText: 'תשובה',
      scopeRefs: [],
    };
    expect(mapQuestion(open, 'r').options).toBeNull();
  });

  it('sets options=null when an MCQ has an empty options array', () => {
    const row = mapQuestion({ ...baseMcq, options: [] }, 'r');
    expect(row.options).toBeNull();
  });
});

describe('mapQuestion — correct_answer jsonb', () => {
  it('maps a MCQ correctIndex → { index: n }', () => {
    expect(mapQuestion(baseMcq, 'r').correctAnswer).toEqual({ index: 1 });
  });

  it('maps index 0 correctly (falsy but valid)', () => {
    expect(mapQuestion({ ...baseMcq, correctIndex: 0 }, 'r').correctAnswer).toEqual({ index: 0 });
  });

  it('maps an open answer text → { text }', () => {
    const open: ParsedQuestion = {
      sourceId: 'f#1',
      type: 'open',
      question: 'שאלה',
      correctAnswerText: '  תשובה מנוקה  ',
      scopeRefs: [],
    };
    expect(mapQuestion(open, 'r').correctAnswer).toEqual({ text: 'תשובה מנוקה' });
  });

  it('sets correct_answer=null when there is no answer key', () => {
    const noKey: ParsedQuestion = {
      sourceId: 'f#1',
      type: 'mcq_short',
      question: 'שאלה ללא תשובה',
      options: ['א', 'ב'],
      scopeRefs: [],
    };
    expect(mapQuestion(noKey, 'r').correctAnswer).toBeNull();
  });
});

describe('mapQuestion — default-deny status + in_scope', () => {
  it('keyed MCQ → in_scope=true, status מוסקנא (provisional, not מאומת)', () => {
    const row = mapQuestion(baseMcq, 'r');
    expect(row.inScope).toBe(true);
    expect(row.status).toBe('מוסקנא');
  });

  it('un-keyed question → DEFAULT-DENY: in_scope=false, status לא ידוע', () => {
    const noKey: ParsedQuestion = {
      sourceId: 'f#1',
      type: 'mcq_short',
      question: 'שאלה בלי מפתח-תשובה',
      options: ['א', 'ב'],
      scopeRefs: [],
    };
    const row = mapQuestion(noKey, 'r');
    expect(row.inScope).toBe(false);
    expect(row.status).toBe('לא ידוע');
  });

  it('never emits מאומת from a raw parser mapping', () => {
    const row = mapQuestion(baseMcq, 'r');
    expect(row.status).not.toBe('מאומת');
  });
});

describe('mapQuestion — invariants', () => {
  it('always defaults scope_refs to [] (no invented scope)', () => {
    expect(mapQuestion(baseMcq, 'r').scopeRefs).toEqual([]);
  });

  it('threads the source_ref through verbatim', () => {
    expect(mapQuestion(baseMcq, 't1:abc:3:deadbeef').sourceRef).toBe('t1:abc:3:deadbeef');
  });

  it('sets prompt from the parsed question text', () => {
    expect(mapQuestion(baseMcq, 'r').prompt).toBe('מהי כשירות ממונה בטיחות?');
  });

  it('leaves explanation null (parsers do not extract a rationale)', () => {
    expect(mapQuestion(baseMcq, 'r').explanation).toBeNull();
  });

  it('throws on an empty source_ref (parse, do not validate)', () => {
    expect(() => mapQuestion(baseMcq, '   ')).toThrow(/source_ref/i);
    // @ts-expect-error — intentionally passing a non-string at runtime
    expect(() => mapQuestion(baseMcq, undefined)).toThrow();
  });
});

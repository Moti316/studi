import { describe, it, expect } from 'vitest';
import {
  verifyQuestionsSemantically,
  toVerifyInput,
  type QuestionVerifyFn,
} from '@/lib/import/semantic-verify-questions';
import type { NewQuestion } from '../../../drizzle/schema';

function q(over: Partial<NewQuestion> = {}): NewQuestion {
  return {
    type: 'mcq_short',
    prompt: 'שאלה?',
    options: ['א', 'ב'],
    correctAnswer: { index: 0 },
    explanation: 'מקור: תקנה X · תקנה 3',
    scopeRefs: [{ id: '2.3', confidence: 1 }],
    inScope: true,
    status: 'מוסקנא',
    sourceRef: 'nbq:2.3:mcq:abc',
    ...over,
  } as NewQuestion;
}

describe('toVerifyInput', () => {
  it('מחלץ scopeId, type, prompt, ו-detail', () => {
    const inp = toVerifyInput(q());
    expect(inp.scopeId).toBe('2.3');
    expect(inp.type).toBe('mcq_short');
    expect(inp.prompt).toBe('שאלה?');
    expect(inp.detail).toContain('תקנה 3');
  });
});

describe('verifyQuestionsSemantically', () => {
  it('מפריד passed/held לפי ה-verdict', async () => {
    const fn: QuestionVerifyFn = async (inp) => ({
      pass: inp.scopeId === '2.3',
      reasons: inp.scopeId === '2.3' ? [] : ['citation-fit: scope שגוי'],
    });
    const rows = [
      q(),
      q({ scopeRefs: [{ id: '9.9', confidence: 1 }], sourceRef: 'nbq:9.9:mcq:x' }),
    ];
    const { passed, held } = await verifyQuestionsSemantically(rows, fn);
    expect(passed).toHaveLength(1);
    expect(held).toHaveLength(1);
    expect(held[0]!.reasons[0]).toContain('citation-fit');
  });

  it('כשל-verifyFn → held (שמרני · לא לפרסם לא-מאומת)', async () => {
    const fn: QuestionVerifyFn = async () => {
      throw new Error('rate-limit');
    };
    const { passed, held } = await verifyQuestionsSemantically([q()], fn);
    expect(passed).toHaveLength(0);
    expect(held).toHaveLength(1);
    expect(held[0]!.reasons[0]).toContain('verify-error');
  });

  it('reasons ריק בכשל → fallback', async () => {
    const fn: QuestionVerifyFn = async () => ({ pass: false, reasons: [] });
    const { held } = await verifyQuestionsSemantically([q()], fn);
    expect(held[0]!.reasons[0]).toBe('failed-semantic');
  });
});

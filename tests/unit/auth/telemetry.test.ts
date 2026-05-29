import { describe, it, expect } from 'vitest';
import { maskEmail, logError } from '@/lib/auth/telemetry';

describe('maskEmail', () => {
  it('ממסך את החלק המקומי ומשאיר אות ראשונה + דומיין', () => {
    expect(maskEmail('motilev8@gmail.com')).toBe('m***@gmail.com');
  });

  it('מחזיר *** לקלט לא-תקין', () => {
    expect(maskEmail('garbage')).toBe('***');
  });
});

describe('logError', () => {
  it('מחזיר Error גם מקלט שאינו Error', () => {
    const err = logError('משהו נשבר', { scope: 'test' });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('משהו נשבר');
  });

  it('מעביר Error קיים כמו-שהוא', () => {
    const original = new Error('boom');
    expect(logError(original, { scope: 'test' })).toBe(original);
  });
});

import { describe, expect, it } from 'vitest';

describe('sanity check', () => {
  it('vitest runs', () => {
    expect(1 + 1).toBe(2);
  });

  it('Hebrew strings work', () => {
    const greeting = 'שלום עולם';
    expect(greeting.length).toBe(9);
    expect(greeting).toContain('שלום');
  });
});

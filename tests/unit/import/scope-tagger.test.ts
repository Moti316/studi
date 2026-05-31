/**
 * tests/unit/import/scope-tagger.test.ts
 *
 * Unit tests for the committee-scope tagger.
 * - Stage-1 regex hit/miss and default-deny are tested directly (no network).
 * - The Gemini stage is fully mocked (`@/lib/ai/client`) — NO real Gemini calls.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the Gemini client BEFORE importing the module under test, so the
// scope-tagger picks up the mocked `geminiGenerateJSON`.
const generateJSONMock = vi.fn();
vi.mock('@/lib/ai/client', () => ({
  geminiGenerateJSON: (args: unknown) => generateJSONMock(args),
}));

import {
  matchScopeKeywords,
  SCOPE_KEYWORDS,
  tagScope,
  type ScopeTag,
} from '@/lib/import/scope-tagger';
import { isValidScopeId } from '@/lib/db/constants/scope-refs';

beforeEach(() => {
  generateJSONMock.mockReset();
});

describe('SCOPE_KEYWORDS — integrity', () => {
  it('every key is a valid canonical scope ID', () => {
    for (const id of Object.keys(SCOPE_KEYWORDS)) {
      expect(isValidScopeId(id)).toBe(true);
    }
  });

  it('quality-seeds categories 1-3 (≥ most of their IDs have keywords)', () => {
    const cat123 = Object.keys(SCOPE_KEYWORDS).filter((id) => /^[123]\./.test(id));
    // Categories 1-3 hold 36 of 57 items; we seeded all of them.
    expect(cat123.length).toBeGreaterThanOrEqual(30);
    for (const id of cat123) {
      expect(SCOPE_KEYWORDS[id]!.length).toBeGreaterThan(0);
    }
  });
});

describe('matchScopeKeywords — stage 1 (regex)', () => {
  it('matches a known phrase in the text', () => {
    const c = matchScopeKeywords('הדרכה על עבודה בגובה ושימוש ברתמת בטיחות');
    const ids = c.map((x) => x.id);
    expect(ids).toContain('2.1'); // עבודה בגובה / רתמת בטיחות
  });

  it('matches a phrase in the filename even if text is empty', () => {
    const c = matchScopeKeywords('', 'תקנות עבודה בגובה.pdf');
    expect(c.map((x) => x.id)).toContain('2.1');
  });

  it('returns more hits → higher confidence', () => {
    const c = matchScopeKeywords('רעש מזיק, מגני שמיעה ובדיקת שמיעה תקופתית');
    const noise = c.find((x) => x.id === '3.2');
    expect(noise).toBeDefined();
    expect(noise!.confidence).toBeGreaterThan(0.5);
  });

  it('returns [] when nothing matches (no signal)', () => {
    expect(matchScopeKeywords('מתכון לעוגת שוקולד עם קרם וניל')).toEqual([]);
  });

  it('matches latinised standard codes (ISO 45001)', () => {
    const c = matchScopeKeywords('The course covers ISO 45001 management systems');
    expect(c.map((x) => x.id)).toContain('5.1');
  });
});

describe('tagScope — default-deny (no regex signal → no Gemini call)', () => {
  it('returns the deny tag and never calls Gemini', async () => {
    const tag = await tagScope('טקסט לא רלוונטי על בישול וטיולים');
    expect(tag).toEqual<ScopeTag>({
      in_scope: false,
      scope_refs: [],
      status: 'לא ידוע',
    });
    expect(generateJSONMock).not.toHaveBeenCalled();
  });
});

describe('tagScope — stage 2 (regex hit → Gemini verify)', () => {
  it('returns the model-verified tag on a clean response', async () => {
    generateJSONMock.mockResolvedValueOnce({
      in_scope: true,
      scope_refs: [{ id: '2.1', confidence: 0.95 }],
      status: 'מאומת',
    });

    const tag = await tagScope('נוהל עבודה בגובה עם רתמת צניחה');
    expect(generateJSONMock).toHaveBeenCalledTimes(1);
    expect(tag.in_scope).toBe(true);
    expect(tag.status).toBe('מאומת');
    expect(tag.scope_refs).toEqual([{ id: '2.1', confidence: 0.95 }]);
  });

  it('truncates text to ~1500 chars before sending to Gemini', async () => {
    generateJSONMock.mockResolvedValueOnce({
      in_scope: true,
      scope_refs: [{ id: '3.2', confidence: 0.8 }],
      status: 'מאומת',
    });
    const long = 'רעש מזיק ' + 'א'.repeat(5000);
    await tagScope(long);
    const arg = generateJSONMock.mock.calls[0]![0] as { prompt: string };
    // Prompt embeds the truncated text; assert the giant tail did NOT survive.
    expect(arg.prompt.length).toBeLessThan(2200);
  });

  it('drops model refs with unknown IDs (no invented scope)', async () => {
    generateJSONMock.mockResolvedValueOnce({
      in_scope: true,
      scope_refs: [
        { id: '2.1', confidence: 0.9 },
        { id: '99.9', confidence: 0.9 }, // invented — must be dropped
      ],
      status: 'מאומת',
    });
    const tag = await tagScope('עבודה בגובה');
    expect(tag.scope_refs.map((r) => r.id)).toEqual(['2.1']);
  });

  it('clamps out-of-range confidences to [0,1]', async () => {
    generateJSONMock.mockResolvedValueOnce({
      in_scope: true,
      scope_refs: [{ id: '2.1', confidence: 5 }],
      status: 'מאומת',
    });
    const tag = await tagScope('עבודה בגובה');
    expect(tag.scope_refs[0]!.confidence).toBe(1);
  });

  it('falls back to deny when model keeps no valid refs', async () => {
    generateJSONMock.mockResolvedValueOnce({
      in_scope: true,
      scope_refs: [{ id: '99.9', confidence: 0.9 }],
      status: 'מאומת',
    });
    const tag = await tagScope('עבודה בגובה');
    expect(tag).toEqual<ScopeTag>({
      in_scope: false,
      scope_refs: [],
      status: 'לא ידוע',
    });
  });
});

describe('tagScope — Gemini failure fallback (regex inference)', () => {
  it('on Gemini throw → infers from regex with status מוסקנא', async () => {
    generateJSONMock.mockRejectedValueOnce(new Error('rate limit'));
    const tag = await tagScope('נוהל עבודה בגובה ופיגומים');
    expect(tag.in_scope).toBe(true);
    expect(tag.status).toBe('מוסקנא');
    expect(tag.scope_refs.map((r) => r.id)).toContain('2.1');
  });

  it('on unusable model shape → infers from regex with status מוסקנא', async () => {
    generateJSONMock.mockResolvedValueOnce({ garbage: true });
    const tag = await tagScope('רעש מזיק במפעל');
    expect(tag.status).toBe('מוסקנא');
    expect(tag.scope_refs.map((r) => r.id)).toContain('3.2');
  });
});

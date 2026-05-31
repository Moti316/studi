/**
 * tests/unit/ai/client.test.ts
 *
 * Unit tests for the Gemini wrapper. The `@google/genai` SDK is fully mocked —
 * NO real Gemini calls and NO real API key are used.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock the SDK before importing the client. `generateContentMock` is the spy we
// assert against; the mocked GoogleGenAI just exposes `models.generateContent`.
const generateContentMock = vi.fn();
const constructorSpy = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock };
    constructor(opts: unknown) {
      constructorSpy(opts);
    }
  },
}));

import {
  geminiGenerateText,
  geminiGenerateJSON,
  GeminiClientError,
  __resetGeminiClientForTests,
} from '@/lib/ai/client';

const ORIGINAL_KEY = process.env.GEMINI_API_KEY;

beforeEach(() => {
  generateContentMock.mockReset();
  constructorSpy.mockReset();
  __resetGeminiClientForTests();
  process.env.GEMINI_API_KEY = 'test-key';
});

afterEach(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = ORIGINAL_KEY;
});

describe('geminiGenerateText', () => {
  it('returns the response text', async () => {
    generateContentMock.mockResolvedValueOnce({ text: 'שלום עולם' });
    const out = await geminiGenerateText({ prompt: 'hi' });
    expect(out).toBe('שלום עולם');
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it('passes the system instruction into config', async () => {
    generateContentMock.mockResolvedValueOnce({ text: 'ok' });
    await geminiGenerateText({ prompt: 'hi', system: 'be terse' });
    const arg = generateContentMock.mock.calls[0]![0];
    expect(arg.config.systemInstruction).toBe('be terse');
  });

  it('defaults model to GEMINI_MODEL_CLASSIFICATION when set', async () => {
    process.env.GEMINI_MODEL_CLASSIFICATION = 'gemini-flash-test';
    generateContentMock.mockResolvedValueOnce({ text: 'ok' });
    await geminiGenerateText({ prompt: 'hi' });
    expect(generateContentMock.mock.calls[0]![0].model).toBe('gemini-flash-test');
    delete process.env.GEMINI_MODEL_CLASSIFICATION;
  });

  it('respects an explicit model override', async () => {
    generateContentMock.mockResolvedValueOnce({ text: 'ok' });
    await geminiGenerateText({ prompt: 'hi', model: 'gemini-pro-test' });
    expect(generateContentMock.mock.calls[0]![0].model).toBe('gemini-pro-test');
  });

  it('throws GeminiClientError (with context) when the SDK errors', async () => {
    generateContentMock.mockRejectedValueOnce(new Error('boom'));
    await expect(geminiGenerateText({ prompt: 'hi' })).rejects.toThrow(GeminiClientError);
    await expect(geminiGenerateText({ prompt: 'hi' })).rejects.toThrow(/generateText/);
  });

  it('throws when the response has no text', async () => {
    generateContentMock.mockResolvedValueOnce({ text: undefined });
    await expect(geminiGenerateText({ prompt: 'hi' })).rejects.toThrow(/no text/);
  });

  it('throws when the API key is missing (lazy, not at import time)', async () => {
    delete process.env.GEMINI_API_KEY;
    __resetGeminiClientForTests();
    await expect(geminiGenerateText({ prompt: 'hi' })).rejects.toThrow(/GEMINI_API_KEY/);
  });
});

describe('geminiGenerateJSON', () => {
  it('parses JSON text into the typed result', async () => {
    generateContentMock.mockResolvedValueOnce({ text: '{"a":1,"b":"x"}' });
    const out = await geminiGenerateJSON<{ a: number; b: string }>({ prompt: 'p' });
    expect(out).toEqual({ a: 1, b: 'x' });
  });

  it('sets responseMimeType=application/json', async () => {
    generateContentMock.mockResolvedValueOnce({ text: '{}' });
    await geminiGenerateJSON({ prompt: 'p' });
    expect(generateContentMock.mock.calls[0]![0].config.responseMimeType).toBe(
      'application/json',
    );
  });

  it('forwards a provided schema as responseSchema', async () => {
    generateContentMock.mockResolvedValueOnce({ text: '{}' });
    const schema = { type: 'object' };
    await geminiGenerateJSON({ prompt: 'p', schema });
    expect(generateContentMock.mock.calls[0]![0].config.responseSchema).toEqual(schema);
  });

  it('throws GeminiClientError on non-JSON text', async () => {
    generateContentMock.mockResolvedValueOnce({ text: 'not json' });
    await expect(geminiGenerateJSON({ prompt: 'p' })).rejects.toThrow(/non-JSON/);
  });

  it('throws on empty response', async () => {
    generateContentMock.mockResolvedValueOnce({ text: '' });
    await expect(geminiGenerateJSON({ prompt: 'p' })).rejects.toThrow(/no text/);
  });
});

describe('lazy init', () => {
  it('does not construct the client until the first call', async () => {
    expect(constructorSpy).not.toHaveBeenCalled();
    generateContentMock.mockResolvedValueOnce({ text: 'ok' });
    await geminiGenerateText({ prompt: 'hi' });
    expect(constructorSpy).toHaveBeenCalledTimes(1);
  });

  it('reuses the singleton across calls', async () => {
    generateContentMock.mockResolvedValue({ text: 'ok' });
    await geminiGenerateText({ prompt: 'a' });
    await geminiGenerateText({ prompt: 'b' });
    expect(constructorSpy).toHaveBeenCalledTimes(1);
  });
});

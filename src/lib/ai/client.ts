/**
 * src/lib/ai/client.ts — thin Gemini (@google/genai) wrapper.
 *
 * ⚠️ SERVER-ONLY. This module reads `process.env.GEMINI_API_KEY` and must never
 * be imported into a client bundle. We do NOT have the `server-only` package
 * installed, so this is enforced by convention + the `assertServerSide()` guard
 * below rather than by a build-time error. Import this only from server code
 * (route handlers, server actions, server components, scripts, the import
 * pipeline) — never from a 'use client' component.
 *
 * Design rules (per PROJECT-CONTEXT + ml-engineer identity):
 * - Gemini is the ONLY production LLM. No Claude/Voyage/foreign embeddings.
 * - Zero secrets in source. The key comes from `process.env` exclusively.
 * - Lazy init: do NOT construct the client at import time. If the key is
 *   missing we only fail when a call is actually attempted, so importing this
 *   module (e.g. for types or in tests that mock it) never throws.
 * - Errors are re-thrown WITH context (which model, which op) so callers and
 *   Sentry see an actionable message instead of an opaque SDK error.
 *
 * Default models come from env (never hard-coded), with a documented fallback:
 * - geminiGenerateText      → GEMINI_MODEL_CLASSIFICATION (Flash) by default.
 * - geminiGenerateJSON      → GEMINI_MODEL_CLASSIFICATION (Flash) by default.
 * Callers may override `model` per call (e.g. Pro for generation).
 */

import { GoogleGenAI, type GenerateContentParameters } from '@google/genai';

/** Error thrown when a Gemini call cannot run or fails — always carries context. */
export class GeminiClientError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = 'GeminiClientError';
  }
}

/**
 * Hard fail if this module is somehow evaluated in a browser bundle. This is a
 * defence-in-depth substitute for the `server-only` package (not installed).
 * In jsdom-based unit tests `window` exists, so we only treat a *real* browser
 * (no `process.env`) as a violation — tests that import this for type-checking
 * or that mock it are unaffected.
 */
function assertServerSide(): void {
  const hasProcessEnv =
    typeof process !== 'undefined' && typeof process.env !== 'undefined';
  if (!hasProcessEnv) {
    throw new GeminiClientError(
      'ai/client is server-only and was loaded without a Node process.env — ' +
        'do not import it into client-side code.',
    );
  }
}

/**
 * Lazily resolve the API key from env. Throws (with context) only when a call
 * is made without a configured key — never at import time.
 */
function requireApiKey(): string {
  assertServerSide();
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim().length === 0) {
    throw new GeminiClientError(
      'GEMINI_API_KEY is not set. Configure it in the server environment ' +
        '(process.env) before calling the Gemini client.',
    );
  }
  return key;
}

// Lazy singleton — constructed on first successful call, reused thereafter.
let clientSingleton: GoogleGenAI | null = null;

/**
 * Returns the lazily-initialised GoogleGenAI client. Constructs it on first use
 * with the env-provided key. Exported mainly so tests can reset state via the
 * mock; production code should use the `geminiGenerate*` helpers.
 */
export function getGeminiClient(): GoogleGenAI {
  if (clientSingleton) return clientSingleton;
  const apiKey = requireApiKey();
  clientSingleton = new GoogleGenAI({ apiKey });
  return clientSingleton;
}

/** Default model for lightweight tasks (classification/tagging) — Gemini Flash. */
function defaultFlashModel(): string {
  // Documented fallback keeps tests/dev usable if the env var is unset; prod
  // always sets GEMINI_MODEL_CLASSIFICATION explicitly.
  return process.env.GEMINI_MODEL_CLASSIFICATION ?? 'gemini-2.5-flash';
}

export interface GenerateTextArgs {
  /** User prompt / content. */
  prompt: string;
  /** Optional system instruction (steers the model). */
  system?: string;
  /** Optional model override. Defaults to GEMINI_MODEL_CLASSIFICATION (Flash). */
  model?: string;
}

/**
 * Generate plain text with Gemini.
 *
 * @throws {GeminiClientError} when the key is missing, the SDK errors, or the
 *   response contains no text.
 */
export async function geminiGenerateText({
  prompt,
  system,
  model,
}: GenerateTextArgs): Promise<string> {
  const resolvedModel = model ?? defaultFlashModel();
  const params: GenerateContentParameters = {
    model: resolvedModel,
    contents: prompt,
    ...(system ? { config: { systemInstruction: system } } : {}),
  };

  let text: string | undefined;
  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent(params);
    text = response.text;
  } catch (err) {
    throw new GeminiClientError(
      `Gemini generateText failed (model=${resolvedModel}): ${errMessage(err)}`,
      err,
    );
  }

  if (typeof text !== 'string' || text.length === 0) {
    throw new GeminiClientError(
      `Gemini generateText returned no text (model=${resolvedModel}).`,
    );
  }
  return text;
}

export interface GenerateJSONArgs {
  /** User prompt / content. */
  prompt: string;
  /** Optional system instruction (steers the model). */
  system?: string;
  /**
   * Optional response schema (Gemini `responseSchema`, an OpenAPI-3 subset).
   * Passed through verbatim to the SDK. When provided, JSON mode is enforced.
   */
  schema?: unknown;
  /** Optional model override. Defaults to GEMINI_MODEL_CLASSIFICATION (Flash). */
  model?: string;
}

/**
 * Generate structured JSON with Gemini (responseMimeType=application/json).
 * Parses the response text into `T`. The caller is responsible for validating
 * the parsed shape (e.g. with Zod) — this wrapper only guarantees valid JSON.
 *
 * @throws {GeminiClientError} when the key is missing, the SDK errors, the
 *   response is empty, or the text is not parseable JSON.
 */
export async function geminiGenerateJSON<T>({
  prompt,
  system,
  schema,
  model,
}: GenerateJSONArgs): Promise<T> {
  const resolvedModel = model ?? defaultFlashModel();
  const params: GenerateContentParameters = {
    model: resolvedModel,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      ...(schema !== undefined ? { responseSchema: schema as never } : {}),
      ...(system ? { systemInstruction: system } : {}),
    },
  };

  let text: string | undefined;
  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent(params);
    text = response.text;
  } catch (err) {
    throw new GeminiClientError(
      `Gemini generateJSON failed (model=${resolvedModel}): ${errMessage(err)}`,
      err,
    );
  }

  if (typeof text !== 'string' || text.length === 0) {
    throw new GeminiClientError(
      `Gemini generateJSON returned no text (model=${resolvedModel}).`,
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new GeminiClientError(
      `Gemini generateJSON returned non-JSON text (model=${resolvedModel}): ${errMessage(err)}`,
      err,
    );
  }
}

/** Internal: best-effort message extraction for context-rich errors. */
function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Test-only: reset the lazy singleton so a fresh key can be picked up. Exported
 * because the singleton would otherwise leak `GEMINI_API_KEY` state across
 * tests. Safe to call in production but generally unnecessary.
 */
export function __resetGeminiClientForTests(): void {
  clientSingleton = null;
}

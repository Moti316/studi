/**
 * src/lib/ai/claude.ts — עטיפת Claude (@anthropic-ai/sdk) להערכת-תשובות-חופשיות חיה.
 *
 * ⚠️ SERVER-ONLY. קורא `process.env.ANTHROPIC_API_KEY`; לעולם לא ל-client-bundle.
 *
 * תפקיד (ADR-017 · LiveEngine): הערכה-סמנטית של תשובת-מועמד-חופשית — שו"ת-פתוח
 * ודיאלוג-הסימולציה. מזהה קשר/רלוונטיות מעבר לחפיפת-מילים (נרדפים · "נעילה ותיוג"=LOTO).
 * מודל-ברירת-המחדל: Haiku (זול+מהיר להערכה). **מופעל רק כשמוגדר מפתח** — אחרת
 * הקוראים נופלים-חזרה למנגון-הדטרמיניסטי (keyword-match). Gemini נשאר ה-LLM-לתוכן;
 * Claude = שכבת-ההערכה-החיה בלבד.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Agent, fetch as undiciFetch } from 'undici';
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeClientError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = 'ClaudeClientError';
  }
}

/** האם Claude מוגדר (מפתח קיים) — קוראים בודקים לפני ניסיון, אחרת fallback. */
export function isClaudeConfigured(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.env !== 'undefined' &&
    !!process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY.trim().length > 0
  );
}

function requireApiKey(): string {
  if (!isClaudeConfigured()) {
    throw new ClaudeClientError(
      'ANTHROPIC_API_KEY is not set. Configure it in the server environment before calling Claude.',
    );
  }
  return process.env.ANTHROPIC_API_KEY as string;
}

let clientSingleton: Anthropic | null = null;

/**
 * undici-dispatcher עם CA-bundle ארגוני (אם קיים) — עוקף TLS-inspection-proxy
 * (אותו חסם שדרש CA-bundle ל-NotebookLM · ראה BUGS.md#notebooklm-runtime-ssl).
 * תכנותי → עובד ב-dev-server/route/script בלי תלות ב-NODE_EXTRA_CA_CERTS. no-op בלי-bundle.
 */
function corpDispatcher(): Agent | undefined {
  const ca =
    process.env.SSL_CERT_FILE ||
    process.env.NODE_EXTRA_CA_CERTS ||
    join(process.cwd(), 'tools', 'nblm-bridge', '.cache-cabundle.pem');
  if (!ca || !existsSync(ca)) return undefined;
  try {
    return new Agent({ connect: { ca: readFileSync(ca, 'utf-8') } });
  } catch {
    return undefined;
  }
}

function getClient(): Anthropic {
  if (clientSingleton) return clientSingleton;
  const dispatcher = corpDispatcher();
  // fetch מותאם דרך undici עם ה-dispatcher (CA ארגוני) — אמין יותר מ-fetchOptions.
  const customFetch = dispatcher
    ? (url: string | URL, init?: Record<string, unknown>) =>
        undiciFetch(url as never, { ...(init ?? {}), dispatcher } as never) as never
    : undefined;
  clientSingleton = new Anthropic({
    apiKey: requireApiKey(),
    ...(customFetch ? { fetch: customFetch as never } : {}),
  });
  return clientSingleton;
}

/** מודל-ברירת-מחדל להערכה — Haiku (זול+מהיר). override: ANTHROPIC_MODEL_EVAL. */
function defaultEvalModel(): string {
  return process.env.ANTHROPIC_MODEL_EVAL ?? 'claude-haiku-4-5-20251001';
}

export interface ClaudeGenerateArgs {
  prompt: string;
  system?: string;
  model?: string;
  maxTokens?: number;
}

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

/** הסרת code-fences (```json … ```) לפני JSON.parse. */
function stripFences(s: string): string {
  return s
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

/** טקסט חופשי מ-Claude. */
export async function claudeGenerateText({
  prompt,
  system,
  model,
  maxTokens = 1024,
}: ClaudeGenerateArgs): Promise<string> {
  const resolved = model ?? defaultEvalModel();
  try {
    const msg = await getClient().messages.create({
      model: resolved,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages: [{ role: 'user', content: prompt }],
    });
    const text = extractText(msg);
    if (!text) throw new ClaudeClientError(`Claude returned no text (model=${resolved}).`);
    return text;
  } catch (err) {
    if (err instanceof ClaudeClientError) throw err;
    throw new ClaudeClientError(
      `Claude generateText failed (model=${resolved}): ${errMessage(err)}`,
      err,
    );
  }
}

/** JSON מובנה מ-Claude (מורה JSON-בלבד · מסיר fences · parse). הוולידציה על הקורא. */
export async function claudeGenerateJSON<T>(args: ClaudeGenerateArgs): Promise<T> {
  const system = [args.system ?? '', 'החזר JSON תקין בלבד — ללא טקסט נוסף, ללא code-fences.']
    .filter(Boolean)
    .join('\n');
  const text = await claudeGenerateText({ ...args, system });
  try {
    return JSON.parse(stripFences(text)) as T;
  } catch (err) {
    throw new ClaudeClientError(`Claude generateJSON returned non-JSON: ${errMessage(err)}`, err);
  }
}

/**
 * system כ-string (legacy · ללא-cache) או כבלוק-ניתן-לקאשינג. כש-`cache:true` מוסיפים
 * `cache_control: ephemeral` → ה-prefix-הקבוע (פרומפט-מגן + עיגון) נטען מ-cache בכל תור-המשך
 * (~90% הנחה על input-החוזר · TTL 5 דק'). דורש prefix ≥ ~1-4K tokens כדי שייכנס ל-cache.
 */
export type CacheableSystem = string | { text: string; cache?: boolean };

/** ממיר ל-system param של ה-SDK: מחרוזת כמו-שהיא, או מערך-בלוק עם cache_control. */
function toSystemParam(
  sys: CacheableSystem | undefined,
): string | Anthropic.TextBlockParam[] | undefined {
  if (sys === undefined) return undefined;
  if (typeof sys === 'string') return sys;
  return [
    {
      type: 'text',
      text: sys.text,
      ...(sys.cache ? { cache_control: { type: 'ephemeral' } } : {}),
    },
  ];
}

export interface ClaudeConverseArgs {
  /** system קבוע (ניתן-לקאשינג) — הפרומפט-מגן + עיגון-החקיקה. */
  system: CacheableSystem;
  /** היסטוריית-השיח (תורי user/assistant) — ה-LiveEngine מעביר את ה-transcript. */
  messages: Anthropic.MessageParam[];
  model?: string;
  /** ברירת-מחדל 900 — מספיק לתגובת-מפקח עשירה + envelope, בלי JSON-חתוך. */
  maxTokens?: number;
}

/**
 * שיח רב-תורי מול Claude (ADR-018 · LiveEngine). מעביר message-history אמיתי + system
 * ניתן-לקאשינג. מחזיר טקסט-גולמי — ה-parse (JSON-envelope) על הקורא. SERVER-ONLY.
 */
export async function claudeConverse({
  system,
  messages,
  model,
  maxTokens = 900,
}: ClaudeConverseArgs): Promise<string> {
  const resolved = model ?? defaultEvalModel();
  const sys = toSystemParam(system);
  try {
    const msg = await getClient().messages.create({
      model: resolved,
      max_tokens: maxTokens,
      ...(sys ? { system: sys } : {}),
      messages,
    });
    const text = extractText(msg);
    if (!text) throw new ClaudeClientError(`Claude returned no text (model=${resolved}).`);
    return text;
  } catch (err) {
    if (err instanceof ClaudeClientError) throw err;
    throw new ClaudeClientError(
      `Claude converse failed (model=${resolved}): ${errMessage(err)}`,
      err,
    );
  }
}

/** Test-only: איפוס ה-singleton (למפתח-טרי בין-טסטים). */
export function __resetClaudeClientForTests(): void {
  clientSingleton = null;
}

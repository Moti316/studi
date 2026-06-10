'use server';

/**
 * Server Action — תור-מפקח בסימולציה-החיה (ADR-018 · LiveEngine). 3 שערי-fallback,
 * **לעולם לא זורק** ללקוח:
 *   1. תשובה ריקה/קצרה-מאוד → nudge דטרמיניסטי (אפס-קריאת-Claude).
 *   2. אין `ANTHROPIC_API_KEY` → תור דטרמיניסטי (PrebakedEngine-like).
 *   3. Claude חי → `claudeConverse` (system ניתן-לקאשינג) → `parseLiveTurn`. כשל → דטרמיניסטי.
 */
import { isClaudeConfigured, claudeConverse } from '@/lib/ai/claude';
import {
  buildLiveSystemPrompt,
  transcriptToMessages,
  parseLiveTurn,
  isTooShortToGrade,
  deterministicLiveTurn,
  deterministicNudge,
} from '@/lib/ai/prompts/committee-sim/live';
import type { RespondLiveInput, RespondLiveResult } from './live-types';

export async function respondLiveAction(input: RespondLiveInput): Promise<RespondLiveResult> {
  // שער 1 — תשובה ריקה/קצרה-מאוד: nudge בלי-קריאה.
  if (isTooShortToGrade(input.answer)) return deterministicNudge(input);

  // שער 2 — אין מפתח: fallback דטרמיניסטי (הכל עובד · ללא הבנת-נרדפים).
  if (!isClaudeConfigured()) return deterministicLiveTurn(input);

  // שער 3 — Claude חי.
  try {
    const system = buildLiveSystemPrompt(input.branch);
    const messages = transcriptToMessages(input);
    const raw = await claudeConverse({ system, messages, maxTokens: 900 });
    return { ...parseLiveTurn(raw), source: 'claude' };
  } catch {
    // כשל-Claude (רשת/JSON-שבור) → דטרמיניסטי. לא חושפים שגיאה ללקוח.
    return deterministicLiveTurn(input);
  }
}

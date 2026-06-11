'use server';

/**
 * Server Action — תור-מפקח בסימולציה-החיה (ADR-018 · LiveEngine). 3 שערי-fallback,
 * **לעולם לא זורק** ללקוח:
 *   1. תשובה ריקה/קצרה-מאוד → nudge דטרמיניסטי (אפס-קריאת-Claude).
 *   2. אין `ANTHROPIC_API_KEY` → תור דטרמיניסטי (PrebakedEngine-like).
 *   3. Claude חי → `claudeConverse` (system ניתן-לקאשינג) → `parseLiveTurn`. כשל → דטרמיניסטי.
 */
import { isClaudeConfigured, claudeConverse } from '@/lib/ai/claude';
import { getUser } from '@/lib/auth/server';
import {
  buildLiveSystemPrompt,
  transcriptToMessages,
  parseLiveTurn,
  clampLiveProgress,
  isTooShortToGrade,
  deterministicLiveTurn,
  deterministicNudge,
} from '@/lib/ai/prompts/committee-sim/live';
import type { RespondLiveInput, RespondLiveResult } from './live-types';

export async function respondLiveAction(input: RespondLiveInput): Promise<RespondLiveResult> {
  // שער 0 — auth: חוסם קריאות-Claude-בתשלום ממשתמש-לא-מחובר (קריאה-ישירה ל-action · cost-abuse).
  // לא-מחובר → דטרמיניסטי (אפס-קריאת-Claude · אפס-עלות).
  const user = await getUser();
  if (!user) return deterministicLiveTurn(input);

  // שער 1 — תשובה ריקה/קצרה-מאוד: nudge בלי-קריאה.
  if (isTooShortToGrade(input.answer)) return deterministicNudge(input);

  // שער 2 — אין מפתח: fallback דטרמיניסטי (הכל עובד · ללא הבנת-נרדפים).
  if (!isClaudeConfigured()) return deterministicLiveTurn(input);

  // שער 2.5 — cost-guard: transcript-עצום → סיום-בטוח דטרמיניסטי (מונע prompt ענק/עלות-מתפרצת).
  // הקאפ-לשלב (clampLiveProgress) מסיים בדרך-כלל אחרי ~12 תורים; >24 = חריגה → לא קוראים ל-Claude.
  if (input.transcript.length > 24) return deterministicLiveTurn(input);

  // שער 2.6 — תקרת-אורך-תוכן: ספירת-תורים לבדה לא תפסה answer/transcript ענק (input-tokens
  // לא-מקושארים · cost-abuse · BUGS#system-bug-hunt · #2). תקרה על התשובה-הבודדת + סך-התמלול.
  const transcriptChars = input.transcript.reduce(
    (n, t) => n + t.answer.length + (t.reply?.length ?? 0) + t.question.length,
    0,
  );
  if (input.answer.length > 4000 || transcriptChars > 40000) {
    return deterministicLiveTurn(input);
  }

  // שער 3 — Claude חי.
  try {
    const system = buildLiveSystemPrompt(input.branch);
    const messages = transcriptToMessages(input);
    // maxTokens גבוה: תגובת-מפקח עברית-עשירה (עברית צפופת-טוקנים · עשוי ASCII) **בתוך**
    // JSON-envelope — 900 קוצץ את ה-JSON → parse נכשל → fallback. 3000 נותן מרווח.
    const raw = await claudeConverse({ system, messages, maxTokens: 3000 });
    // clamp: כפיית-התקדמות-מונוטונית (קאפ-שלב) — מונע לולאה-אינסופית/עלות-מתפרצת.
    // input → parseLiveTurn מחשב ציון-סיום-אמיתי + שומר-ציטוט-סעיף (#11/#2).
    return { ...clampLiveProgress(parseLiveTurn(raw, input), input), source: 'claude' };
  } catch {
    // כשל-Claude (רשת/JSON-שבור) → דטרמיניסטי. לא חושפים שגיאה ללקוח.
    return deterministicLiveTurn(input);
  }
}

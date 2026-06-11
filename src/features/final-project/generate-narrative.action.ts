'use server';

/**
 * generate-narrative.action.ts — Server Action לפרקים-הנרטיביים של פרויקט-הגמר.
 *
 * זרימה (ארכיטקטורת **פר-פרק** · תיקון 2026-06-10):
 *   1. auth-gate: משתמש-לא-מחובר → fallback דטרמיניסטי (חסם-עלות · אפס-Claude).
 *   2. Claude-לא-מוגדר → fallback דטרמיניסטי.
 *   3. אחרת → **5 קריאות-Claude מקבילות** (claudeGenerateText · טקסט-נקי · מודל-author):
 *      פרק-אחד-לכל-קריאה. כל פרק שמצליח (ולא-ריק/חתוך) — נכנס; כל פרק שנכשל/קצר →
 *      ה-fallback-הדטרמיניסטי **של אותו-פרק** (לא מפיל את שאר-המסמך).
 *   4. source='claude' אם ≥1 פרק חובר ע"י Claude; 'deterministic' רק אם **כל** הפרקים נפלו-חזרה.
 *
 * ⚠️ **למה לא JSON-יחיד-ענק (הבאג שתוקן):** אומת-חי (2026-06-10) שחיבור 5 הפרקים כאובייקט-
 *    JSON-אחד נכשל בשני המודלים — Haiku פלט JSON-לא-תקין (escape בתוך מחרוזת עברית ארוכה),
 *    Sonnet **נחתך** ב-maxTokens (Unterminated string) → JSON.parse נכשל → fallback (ה-stubs
 *    `[להשלמה...]` שמוטי ראה, *תוך-כדי-חיוב על-ה-tokens*). פר-פרק + טקסט-נקי = אין class-באגי-
 *    JSON, ואין-חיתוך (כל פרק חסום ~2400 tokens). ראה BUGS#capstone-narrative-single-json.
 *
 * ⚠️ **לעולם לא זורק** — בטוח לקריאה ב-Server Action / Server Component.
 *
 * ⚠️ **PII:** מקבל SiteInfo + JsaRow[] בלבד (אין CoverInfo) — שמות/ת.ז./מנחה לעולם לא ל-Claude.
 *
 * @see src/features/final-project/narrative.ts — NARRATIVE_CHAPTERS · MIN_CHAPTER_CHARS ·
 *      buildDeterministicNarrative · ProjectNarrative
 * @see src/lib/ai/claude.ts                   — claudeGenerateText · defaultAuthorModel · isClaudeConfigured
 */

import type { SiteInfo, JsaRow } from './types';
import {
  NARRATIVE_CHAPTERS,
  MIN_CHAPTER_CHARS,
  buildDeterministicNarrative,
  type ProjectNarrative,
  type NarrativeChapterKey,
} from './narrative';
import { isClaudeConfigured, claudeGenerateText, defaultAuthorModel } from '@/lib/ai/claude';
import { getUser } from '@/lib/auth/server';
import { guardAiCall } from '@/lib/ai/usage-guard';

/** maxTokens פר-פרק — פרק-בודד עשיר (4-5 פסקאות עבריות) ≈ 1500-2200 tokens; 2400 = מרווח. */
const MAX_TOKENS_PER_CHAPTER = 2400;

/**
 * generateNarrativeAction — מחזיר את 5 הפרקים-הנרטיביים של מסמך-הגמר.
 *
 * - לא-מחובר / Claude-לא-מוגדר → fallback דטרמיניסטי מלא (source='deterministic').
 * - אחרת → חיבור פר-פרק מקבילי; כל פרק-שנכשל נופל-חזרה לדטרמיניסטי-שלו (source='claude'
 *   כל-עוד פרק-אחד-לפחות חובר ע"י Claude).
 * - לעולם לא זורק.
 *
 * @param site SiteInfo — פרופיל-האתר (שלב 1 · אין PII).
 * @param rows JsaRow[] — שורות-ה-JSA (לעיגון פרקי-הסיכונים).
 * @returns    ProjectNarrative (תמיד תקין).
 */
export async function generateNarrativeAction(
  site: SiteInfo,
  rows: JsaRow[],
): Promise<ProjectNarrative> {
  // auth: חוסם קריאת-Claude-בתשלום ממשתמש-לא-מחובר (cost-abuse).
  const user = await getUser();
  if (!user || !isClaudeConfigured()) return buildDeterministicNarrative(site, rows);

  // שער-מכסה (שחרור-לחברים): נרטיב = 5 קריאות-Sonnet → צורך 5 יחידות.
  const gate = await guardAiCall(user.id, 'narrative');
  if (!gate.allowed) return buildDeterministicNarrative(site, rows);

  const model = defaultAuthorModel();

  // 5 פרקים במקביל — כל פרק עם fallback-עצמאי (פרק-אחד-שנכשל לא מפיל את כל-המסמך).
  const results = await Promise.all(
    NARRATIVE_CHAPTERS.map(async (spec) => {
      try {
        const text = (
          await claudeGenerateText({
            system: spec.system,
            prompt: spec.buildPrompt(site, rows),
            model,
            maxTokens: MAX_TOKENS_PER_CHAPTER,
          })
        ).trim();

        if (text.length < MIN_CHAPTER_CHARS) {
          console.warn(
            `[generateNarrativeAction] chapter "${spec.key}" too short (${text.length} chars) — using deterministic.`,
          );
          return { key: spec.key, text: spec.deterministic(site, rows), fromClaude: false };
        }
        return { key: spec.key, text, fromClaude: true };
      } catch (err) {
        console.error(
          `[generateNarrativeAction] chapter "${spec.key}" Claude call failed — deterministic:`,
          err instanceof Error ? err.message : String(err),
        );
        return { key: spec.key, text: spec.deterministic(site, rows), fromClaude: false };
      }
    }),
  );

  const claudeCount = results.filter((r) => r.fromClaude).length;
  const byKey = (k: NarrativeChapterKey): string => results.find((r) => r.key === k)?.text ?? '';

  return {
    aboutCompany: byKey('aboutCompany'),
    aboutProject: byKey('aboutProject'),
    orgStructure: byKey('orgStructure'),
    workProcesses: byKey('workProcesses'),
    riskAnalysis: byKey('riskAnalysis'),
    // 'deterministic' רק אם כל-הפרקים נפלו-חזרה; פרק-אחד-אמיתי-לפחות → 'claude'.
    source: claudeCount > 0 ? 'claude' : 'deterministic',
  };
}

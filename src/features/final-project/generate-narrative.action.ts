'use server';

/**
 * generate-narrative.action.ts — Server Action לפרקים-הנרטיביים של פרויקט-הגמר.
 *
 * זרימה (מקבילה ל-generate-jsa.action.ts):
 *   1. auth-gate: משתמש-לא-מחובר → fallback דטרמיניסטי (חסם-עלות · אפס-Claude).
 *   2. Claude מוגדר → claudeGenerateJSON<Omit<ProjectNarrative,'source'>> עם
 *      SYSTEM_NARRATIVE + buildNarrativePrompt → ולידציה → fallback אם לא-תקין.
 *   3. אחרת / כשל / לא-תקין → buildDeterministicNarrative.
 *
 * ⚠️ **לעולם לא זורק** — בטוח לקריאה ב-Server Action / Server Component.
 *    כל שגיאה גורמת ל-fallback דטרמיניסטי (source='deterministic').
 *
 * ⚠️ **PII:** מקבל SiteInfo + JsaRow[] בלבד (אין CoverInfo) — שמות/ת.ז./מנחה לעולם לא ל-Claude.
 *
 * ⚠️ maxTokens=6000 — 5 פרקים-עשירים (2-4 פסקאות כל-אחד · עברית מלאה + עיגון-חקיקה).
 *    maxTokens < 6000 גרם לחיתוך בפרקים האחרונים (שיעור מ-BUGS#liveengine-maxtokens-truncation).
 *    6000 = מרווח-ביטחון מלא ל-5 פרקי-נרטיב עשירים.
 *
 * החתימה `generateNarrativeAction(site, rows): Promise<ProjectNarrative>` קנונית —
 * הצרכן הוא <CapstoneFlow> (שלב-ייצוא-מסמך).
 *
 * @see src/features/final-project/narrative.ts — ProjectNarrative · SYSTEM_NARRATIVE ·
 *      buildNarrativePrompt · isValidNarrative · buildDeterministicNarrative
 * @see src/lib/ai/claude.ts                   — claudeGenerateJSON · isClaudeConfigured
 */

import type { SiteInfo, JsaRow } from './types';
import type { ProjectNarrative } from './narrative';
import {
  SYSTEM_NARRATIVE,
  buildNarrativePrompt,
  isValidNarrative,
  buildDeterministicNarrative,
} from './narrative';
import { isClaudeConfigured, claudeGenerateJSON } from '@/lib/ai/claude';
import { getUser } from '@/lib/auth/server';

/**
 * generateNarrativeAction — מחזיר את 5 הפרקים-הנרטיביים של מסמך-הגמר.
 *
 * - Claude מוגדר + משתמש-מחובר → קריאת-LLM + ולידציה → {...result, source:'claude'}.
 * - לא-מחובר / Claude-לא-מוגדר / תגובה-לא-תקינה / כשל → fallback דטרמיניסטי
 *   (source='deterministic').
 * - לעולם לא זורק.
 *
 * @param site SiteInfo — פרופיל-האתר (שלב 1 · אין PII).
 * @param rows JsaRow[] — שורות-ה-JSA (לעיגון פרק-6 בניתוח-הסיכונים).
 * @returns    ProjectNarrative (source='claude'|'deterministic' · תמיד תקין).
 */
export async function generateNarrativeAction(
  site: SiteInfo,
  rows: JsaRow[],
): Promise<ProjectNarrative> {
  // auth: חוסם קריאת-Claude-בתשלום ממשתמש-לא-מחובר (cost-abuse).
  const user = await getUser();
  if (!user) return buildDeterministicNarrative(site, rows);

  // --- מסלול Claude ---
  if (isClaudeConfigured()) {
    try {
      const result = await claudeGenerateJSON<Omit<ProjectNarrative, 'source'>>({
        system: SYSTEM_NARRATIVE,
        prompt: buildNarrativePrompt(site, rows),
        // 5 פרקים-עשירים (2-4 פסקאות כל-אחד · עברית + עיגון-חקיקה).
        // maxTokens < 6000 גרם לחיתוך בפרקים האחרונים (שיעור מ-LiveEngine-maxtokens bug).
        maxTokens: 6000,
      });

      if (!isValidNarrative(result)) {
        console.warn(
          '[generateNarrativeAction] Claude returned invalid narrative — falling back to deterministic.',
        );
        return buildDeterministicNarrative(site, rows);
      }

      return { ...result, source: 'claude' };
    } catch (err) {
      console.error(
        '[generateNarrativeAction] Claude call failed — falling back to deterministic:',
        err instanceof Error ? err.message : String(err),
      );
      return buildDeterministicNarrative(site, rows);
    }
  }

  // --- fallback דטרמיניסטי ---
  return buildDeterministicNarrative(site, rows);
}

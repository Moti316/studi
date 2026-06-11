'use server';

/**
 * generate-jsa.action.ts — Server Action לטיוטת-JSA אוטומטית ("✨ הכן עבורי").
 *
 * זרימה (מקבילה ל-evaluate-capstone.action.ts):
 *   1. auth-gate: משתמש-לא-מחובר → fallback דטרמיניסטי (חסם-עלות · אפס-Claude).
 *   2. Claude מוגדר → claudeGenerateJSON<{rows: Omit<JsaRow,'id'>[]}> עם system
 *      מסייע-ניתוח-JSA → הזרקת-id לכל-שורה → ולידציה → fallback אם לא-תקין.
 *   3. אחרת / כשל / לא-תקין → buildDeterministicJsaDraft.
 *
 * ⚠️ **לעולם לא זורק** — בטוח לקריאה ב-Server Action / Server Component.
 *    כל שגיאה גורמת ל-fallback דטרמיניסטי (≥1 שורה תמיד).
 *
 * ⚠️ **PII:** מקבל SiteInfo בלבד (אין CoverInfo) — שמות/ת.ז./מנחה לעולם לא ל-Claude.
 *
 * ⚠️ model=author (Sonnet) + maxTokens=9000 — חיבור 12 שורות-JSON-מקוננות עשירות הוא משימת-
 *    יצירה-ארוכה: Haiku@4500 נטה לפלוט JSON-לא-תקין/חתוך → parse נכשל → fallback (אומת-חי
 *    2026-06-10). Sonnet@9000 אמין ל-JSON-ארוך עם מרווח מלא. ראה claude.ts#defaultAuthorModel.
 *
 * החתימה `generateJsaDraftAction(site): Promise<JsaRow[]>` קנונית — הצרכן הוא
 * <JsaBuilder> ("הכן עבורי טיוטה"). (החליף את ה-placeholder הדטרמיניסטי-המינימלי.)
 *
 * @see src/features/final-project/jsa-generation.ts — SYSTEM_JSA_DRAFTER · buildDraftPrompt ·
 *      isValidJsaRowArray · buildDeterministicJsaDraft
 * @see src/lib/ai/claude.ts                         — claudeGenerateJSON · isClaudeConfigured
 */

import type { JsaRow, SiteInfo } from './types';
import {
  SYSTEM_JSA_DRAFTER,
  buildDraftPrompt,
  isValidJsaRowArray,
  buildDeterministicJsaDraft,
} from './jsa-generation';
import { isClaudeConfigured, claudeGenerateJSON, defaultAuthorModel } from '@/lib/ai/claude';
import { getUser } from '@/lib/auth/server';
import { guardAiCall } from '@/lib/ai/usage-guard';

/** מבנה-התגובה הצפוי מ-Claude — שורות בלי id (הקליינט/השרת מזריק). */
interface DraftResponse {
  rows: Omit<JsaRow, 'id'>[];
}

/**
 * generateJsaDraftAction — מחזיר טיוטת-JSA (JsaRow[]) לפרופיל-אתר.
 *
 * - Claude מוגדר + משתמש-מחובר → קריאת-LLM, הזרקת-id, ולידציה.
 * - לא-מחובר / Claude-לא-מוגדר / תגובה-לא-תקינה / כשל → fallback דטרמיניסטי.
 * - לעולם לא זורק.
 *
 * @param site SiteInfo — פרופיל-האתר (שלב 1 · אין PII).
 * @returns    JsaRow[] (≥1 שורה תמיד · id מוזרק).
 */
export async function generateJsaDraftAction(site: SiteInfo): Promise<JsaRow[]> {
  // auth: חוסם קריאת-Claude-בתשלום ממשתמש-לא-מחובר (cost-abuse).
  const user = await getUser();
  if (!user) return buildDeterministicJsaDraft(site);

  // שער-מכסה (שחרור-לחברים): חריגה-יומית → שלד-דטרמיניסטי (אפס-עלות).
  const gate = await guardAiCall(user.id, 'jsa-draft');
  if (!gate.allowed) return buildDeterministicJsaDraft(site);

  // --- מסלול Claude ---
  if (isClaudeConfigured()) {
    try {
      const result = await claudeGenerateJSON<DraftResponse>({
        system: SYSTEM_JSA_DRAFTER,
        prompt: buildDraftPrompt(site),
        // מודל-author (Sonnet · לא Haiku): חיבור 12 שורות-JSON-מקוננות עשירות הוא משימת-יצירה
        // שבה Haiku נטה לפלוט JSON-לא-תקין/חתוך → fallback. Sonnet אמין-יותר ל-JSON-ארוך.
        model: defaultAuthorModel(),
        // 10–12 שורות עבריות-עשירות (existing/added × 3 בקרות + risk) ≈ 500–650 tokens/row.
        // 4500 גרם לחיתוך (Unterminated) → parse-failure → fallback. 9000 = מרווח-ביטחון מלא.
        maxTokens: 9000,
      });

      const rawRows = Array.isArray(result?.rows) ? result.rows : [];
      // הזרק id לכל-שורה (Claude מחזיר בלי id — לפי ה-system-prompt).
      const withIds: JsaRow[] = rawRows.map((r) => ({
        ...(r as Omit<JsaRow, 'id'>),
        id: crypto.randomUUID(),
      }));

      if (!isValidJsaRowArray(withIds)) {
        console.warn(
          '[generateJsaDraftAction] Claude returned invalid JSA rows — falling back to deterministic.',
        );
        return buildDeterministicJsaDraft(site);
      }

      return withIds;
    } catch (err) {
      console.error(
        '[generateJsaDraftAction] Claude call failed — falling back to deterministic:',
        err instanceof Error ? err.message : String(err),
      );
      return buildDeterministicJsaDraft(site);
    }
  }

  // --- fallback דטרמיניסטי ---
  return buildDeterministicJsaDraft(site);
}

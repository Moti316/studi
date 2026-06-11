'use server';

/**
 * evaluate-capstone.action.ts — Server Action להערכת פרויקט-גמר JSA (Capstone).
 *
 * זרימה:
 *   1. אם Claude מוגדר (ANTHROPIC_API_KEY) → claudeGenerateJSON<CapstoneFeedback> עם
 *      system-prompt של מבקן-בטיחות, prompt מובנה שכולל את כל שורות-ה-JSA.
 *   2. אחרת (fallback) → buildDeterministicFeedback מ-jsa-validation.ts.
 *   3. לעולם לא זורק — כל שגיאה גורמת ל-fallback דטרמיניסטי עם log שקט.
 *
 * name-clean: אין שמות-אנשים בפרמטרים — תיאורי-תפקיד בלבד.
 * RTL: טקסט-המשוב בעברית, מבוצע בשרת.
 *
 * @see src/features/final-project/types.ts        — SiteInfo · JsaRow · CapstoneFeedback
 * @see src/features/final-project/jsa-validation.ts — buildDeterministicFeedback
 * @see src/lib/ai/claude.ts                       — claudeGenerateJSON · isClaudeConfigured
 */

import type { CapstoneFeedback, SiteInfo, JsaRow } from './types';
import {
  assessmentScore,
  riskBand,
  riskBandLabel,
  isControlSetEmpty,
  JSA_STATUS_LABELS,
} from './types';
import { buildDeterministicFeedback } from './jsa-validation';
import { isClaudeConfigured, claudeGenerateJSON } from '@/lib/ai/claude';
import { getUser } from '@/lib/auth/server';
import { guardAiCall } from '@/lib/ai/usage-guard';

// ---------------------------------------------------------------------------
// System prompt — מבקן-הבטיחות
// ---------------------------------------------------------------------------

const SYSTEM_SAFETY_REVIEWER = `\
אתה מבקן-בטיחות מומחה הבוחן פרויקטי-גמר JSA (ניתוח-סיכוני-עבודה).
תפקידך: לספק משוב אובייקטיבי, ענייני ומפרגן על עבודת-הלומד.

עקרונות-הבדיקה:
1. כיסוי-סיכונים — האם זוהו המפגעים-המהותיים לענף?
2. מדרג-בקרות (Hierarchy of Controls, ISO 45001):
   חיסול → החלפה → הנדסי → מנהלי → צמ"א/PPE.
   צמ"א כבקרה-יחידה ללא שנשקלה בקרה-הנדסית = ליקוי-מהותי.
3. שלמות-שורות-JSA — 6 עמודות, שדות-אחראי+מועד.
4. מטריצת-סיכון — האם ציוני חומרה×סבירות הגיוניים לתיאור-המפגע?
5. יעילות-בקרות — האם הערכת-הסיכון לאחר-יישום נמוכה מלפני-יישום?

ציטוט: אם מציין תקנה — חייבת להיות ספציפית (שם-חוק + סעיף).
שפה: עברית בלבד · RTL · אל תשתמש בשמות-אנשים — תיאורי-תפקיד בלבד.

החזר JSON תקין בלבד בפורמט CapstoneFeedback (ר' הגדרה ב-prompt).`;

// ---------------------------------------------------------------------------
// helper — רינדור ControlSet לטקסט (3 שורות מפוצלות)
// ---------------------------------------------------------------------------

/**
 * renderControlSet — ממיר ControlSet לטקסט מובנה לפרומפט (3 תת-עמודות מפוצלות).
 * ריק = "(ריק)".
 */
function renderControlSet(
  label: string,
  c: { engineering: string; administrative: string; ppe: string },
): string {
  if (isControlSetEmpty(c)) return `${label}: (ריק)`;
  const parts: string[] = [];
  if (c.engineering.trim()) parts.push(`הנדסיות: ${c.engineering.trim()}`);
  if (c.administrative.trim()) parts.push(`מנהלתיות: ${c.administrative.trim()}`);
  if (c.ppe.trim()) parts.push(`צמ"א: ${c.ppe.trim()}`);
  return `${label}:\n  ${parts.join('\n  ')}`;
}

// ---------------------------------------------------------------------------
// helper — רינדור RiskAssessment לטקסט (סבירות · חומרה · ציון · רצועה · תווית)
// ---------------------------------------------------------------------------

/**
 * renderRiskAssessment — מרנדר הערכת-סיכון לשורת-טקסט קריאה.
 */
function renderRiskAssessment(label: string, a: { probability: number; severity: number }): string {
  const score = assessmentScore(a as Parameters<typeof assessmentScore>[0]);
  const band = riskBand(score);
  const bandLabel = riskBandLabel(band);
  return (
    `${label}: סבירות ${a.probability} · חומרה ${a.severity} · ` +
    `ציון ${score} · רצועה: ${bandLabel} (${band})`
  );
}

// ---------------------------------------------------------------------------
// בנה prompt מהנתונים
// ---------------------------------------------------------------------------

/**
 * buildClaudePrompt — מרכיב prompt מובנה ל-Claude מתוך נתוני-הפרויקט.
 * מגביל את גודל הפרומפט (≤ 20 שורות) כדי למנוע עלות-עודפת.
 * רינדור-עשיר: בקרות-מפוצלות (הנדסי/מנהלי/צמ"א) · riskBefore/riskAfter · status.
 */
function buildClaudePrompt(site: SiteInfo, rows: JsaRow[]): string {
  const siteDesc =
    `אתר: "${site.name}" | ענף: ${site.sector} | עובדים: ${site.workerCount}` +
    (site.mainHazards.length > 0 ? ` | מפגעים-שנצפו: ${site.mainHazards.join(', ')}` : '');

  const ROWS_LIMIT = 20;
  const displayRows = rows.slice(0, ROWS_LIMIT);

  const rowsText = displayRows
    .map((r, i) => {
      const statusLabel = JSA_STATUS_LABELS[r.status] ?? r.status;
      const existingEmpty = isControlSetEmpty(r.existingControls);
      const addedEmpty = isControlSetEmpty(r.addedControls);

      return (
        `\n--- שורה ${i + 1} ---\n` +
        `גורם-סיכון: ${r.hazard || '(ריק)'}\n` +
        `תרחיש: ${r.scenario || '(ריק)'}\n` +
        renderControlSet('בקרות-קיימות', r.existingControls) +
        '\n' +
        renderRiskAssessment('הערכת-סיכון-לפני', r.riskBefore) +
        '\n' +
        renderControlSet('בקרות-נוספות-נדרשות', r.addedControls) +
        '\n' +
        (addedEmpty
          ? 'הערכת-סיכון-לאחר: (לא-הוגדרו-בקרות)\n'
          : renderRiskAssessment('הערכת-סיכון-לאחר', r.riskAfter) + '\n') +
        `אחראי: ${r.owner.trim() || '(ריק)'} | מועד: ${r.due.trim() || '(ריק)'} | סטטוס: ${statusLabel}` +
        // הערת-מדרג נוספת בעת ריק-כפול
        (existingEmpty && addedEmpty ? '\n⚠ אין בקרות כלל — שורה חסרה-מהותית.' : '')
      );
    })
    .join('\n');

  const truncationNote =
    rows.length > ROWS_LIMIT
      ? `\n\n[הערה: הוצגו ${ROWS_LIMIT} מתוך ${rows.length} שורות בשל מגבלת-אורך.]`
      : '';

  const outputSchema = `
החזר אובייקט JSON בדיוק בפורמט הבא (ללא שדות-נוספים):
{
  "overall": "excellent" | "good" | "needs_work",
  "sections": [
    { "key": "jsa_completeness", "grade": "excellent"|"good"|"needs_work", "feedback": "<עברית, עד 200 תווים>" },
    { "key": "hierarchy",        "grade": "excellent"|"good"|"needs_work", "feedback": "<עברית, עד 200 תווים>" },
    { "key": "coverage",         "grade": "excellent"|"good"|"needs_work", "feedback": "<עברית, עד 200 תווים>" },
    { "key": "matrix",           "grade": "excellent"|"good"|"needs_work", "feedback": "<עברית, עד 200 תווים>" }
  ],
  "hierarchyIssues": ["<תיאור-ליקוי-1>", ...],
  "missingHazards":  ["<מפגע-חסר-1>", ...],
  "source": "claude"
}`;

  return (
    `## פרטי-הפרויקט\n${siteDesc}\n\n` +
    `## טבלת-JSA (${rows.length} שורות)\n${rowsText}${truncationNote}\n\n` +
    outputSchema
  );
}

// ---------------------------------------------------------------------------
// ולידציה בסיסית על תגובת-Claude
// ---------------------------------------------------------------------------

function isValidCapstoneFeedback(obj: unknown): obj is CapstoneFeedback {
  if (!obj || typeof obj !== 'object') return false;
  const f = obj as Record<string, unknown>;

  const GRADES = new Set(['excellent', 'good', 'needs_work']);
  if (!GRADES.has(f['overall'] as string)) return false;
  if (!Array.isArray(f['sections']) || f['sections'].length === 0) return false;
  if (!Array.isArray(f['hierarchyIssues'])) return false;
  if (!Array.isArray(f['missingHazards'])) return false;
  if (f['source'] !== 'claude' && f['source'] !== 'deterministic') return false;

  for (const s of f['sections'] as unknown[]) {
    if (!s || typeof s !== 'object') return false;
    const sec = s as Record<string, unknown>;
    if (typeof sec['key'] !== 'string' || typeof sec['feedback'] !== 'string') return false;
    if (!GRADES.has(sec['grade'] as string)) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Action הראשי (מיוצא)
// ---------------------------------------------------------------------------

/**
 * evaluateCapstoneAction — מעריך פרויקט-גמר JSA ומחזיר CapstoneFeedback.
 *
 * - Claude מוגדר → קריאת-LLM עם system מבקן-בטיחות.
 * - Claude לא מוגדר, או קריאה-נכשלה → fallback דטרמיניסטי.
 * - לעולם לא זורק — בטוח לקריאה ב-Server Component / Server Action.
 *
 * @param site    SiteInfo — פרופיל-האתר (שלב 1).
 * @param jsaRows JsaRow[] — שורות-JSA שנאספו (שלבים 2-3).
 * @returns       CapstoneFeedback (source: 'claude' | 'deterministic')
 */
export async function evaluateCapstoneAction(
  site: SiteInfo,
  jsaRows: JsaRow[],
): Promise<CapstoneFeedback> {
  // auth: חוסם קריאת-Claude-בתשלום ממשתמש-לא-מחובר (קריאה-ישירה ל-action · cost-abuse).
  const user = await getUser();
  if (!user) return buildDeterministicFeedback(site, jsaRows);

  // שער-מכסה (שחרור-לחברים): חריגה-יומית → משוב-דטרמיניסטי (אפס-עלות).
  const gate = await guardAiCall(user.id, 'capstone-eval');
  if (!gate.allowed) return buildDeterministicFeedback(site, jsaRows);

  // --- מסלול Claude ---
  if (isClaudeConfigured()) {
    try {
      const prompt = buildClaudePrompt(site, jsaRows);
      // maxTokens=2000: משוב-עברי עשיר — 4 sections × ~200 תווים + arrays של ליקויים/פערים.
      // 1200 היה גורם ל-truncation שקט → fallback דטרמיניסטי (ללא אזהרה ברורה).
      const result = await claudeGenerateJSON<CapstoneFeedback>({
        system: SYSTEM_SAFETY_REVIEWER,
        prompt,
        maxTokens: 2000,
      });

      if (!isValidCapstoneFeedback(result)) {
        console.warn(
          '[evaluateCapstoneAction] Claude returned invalid structure — falling back to deterministic.',
          result,
        );
        return buildDeterministicFeedback(site, jsaRows);
      }

      // אחֵד את הליקויים-הוודאיים של הוולידציה-הדטרמיניסטית לתוך תוצאת-Claude.
      // Claude עלול לפספס ליקויי-מדרג/פערי-כיסוי וודאיים → union+dedup מבטיח
      // שהם לעולם לא נשמטים. שאר תוצאת-Claude (overall · sections) נשמרת.
      const det = buildDeterministicFeedback(site, jsaRows);
      return {
        ...result,
        hierarchyIssues: [...new Set([...(result.hierarchyIssues ?? []), ...det.hierarchyIssues])],
        missingHazards: [...new Set([...(result.missingHazards ?? []), ...det.missingHazards])],
        source: 'claude',
      };
    } catch (err) {
      console.error(
        '[evaluateCapstoneAction] Claude call failed — falling back to deterministic:',
        err instanceof Error ? err.message : String(err),
      );
      return buildDeterministicFeedback(site, jsaRows);
    }
  }

  // --- fallback דטרמיניסטי ---
  return buildDeterministicFeedback(site, jsaRows);
}

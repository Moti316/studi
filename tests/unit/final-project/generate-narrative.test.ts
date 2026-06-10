/**
 * tests/unit/final-project/generate-narrative.test.ts — פרקים-נרטיביים (generateNarrativeAction).
 *
 * 4 שערי-fallback:
 *   1. Claude חי + משתמש-מחובר → מחזיר נרטיב תקין עם source='claude'.
 *   2. משתמש-לא-מחובר → fallback דטרמיניסטי (אפס-קריאת-Claude · חסם-עלות).
 *   3. Claude לא-מוגדר → fallback דטרמיניסטי.
 *   4. תגובת-Claude לא-תקינה (ולידציה נכשלת) → fallback דטרמיניסטי.
 *
 * + בדיקות-ה-action (system/prompt/maxTokens) + שיעור-LiveEngine (maxTokens=6000).
 *
 * מוק '@/lib/ai/claude' + '@/lib/auth/server' — אפס-SDK · אפס-רשת · אפס-Supabase.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

// --- מוקים (לפני ה-import של ה-action) ---
const isClaudeConfigured = vi.fn();
const claudeGenerateJSON = vi.fn();
vi.mock('@/lib/ai/claude', () => ({
  isClaudeConfigured: () => isClaudeConfigured(),
  claudeGenerateJSON: (args: unknown) => claudeGenerateJSON(args),
}));

const getUser = vi.fn();
vi.mock('@/lib/auth/server', () => ({ getUser: () => getUser() }));

import { generateNarrativeAction } from '@/features/final-project/generate-narrative.action';
import type { buildDeterministicNarrative } from '@/features/final-project/narrative';
import {
  isValidNarrative,
  buildNarrativePrompt,
  SYSTEM_NARRATIVE,
} from '@/features/final-project/narrative';
import type { SiteInfo, JsaRow } from '@/features/final-project/types';

// ---------------------------------------------------------------------------
// עזרי-בדיקה
// ---------------------------------------------------------------------------

function site(over: Partial<SiteInfo> = {}): SiteInfo {
  return {
    name: 'אתר-בדיקה',
    sector: 'construction',
    workerCount: 15,
    mainHazards: ['עבודה בגובה', 'חשמל'],
    ...over,
  };
}

/** שורת-JSA מינימלית תקינה (לא מוולידת ע"י isValidJsaRowArray — רק לבניית-prompt). */
function jsaRow(over: Partial<JsaRow> = {}): JsaRow {
  return {
    id: crypto.randomUUID(),
    hazard: 'עבודה בגובה',
    scenario: 'נפילה ממרפסת',
    existingControls: { engineering: 'מעקה-זמני', administrative: '', ppe: '' },
    riskBefore: { severity: 4, probability: 3 },
    addedControls: { engineering: 'מעקה קבוע', administrative: 'נוהל-גובה', ppe: '' },
    riskAfter: { severity: 4, probability: 1 },
    owner: 'מנהל-עבודה',
    due: '',
    status: 'open',
    ...over,
  };
}

/** תשובת-Claude תקינה (ללא שדה source — ה-action מוסיף אותו). */
function claudeNarrative(): Omit<ReturnType<typeof buildDeterministicNarrative>, 'source'> {
  return {
    aboutCompany:
      'החברה פועלת בענף הבנייה מזה שנים רבות ומעסיקה עשרות עובדים מקצועיים. ' +
      'היא כפופה לפקודת-הבטיחות בעבודה תש"ל-1970 ולתקנות ארגון-הפיקוח תשע"ג-2013.',
    aboutProject:
      'הפרויקט כולל עבודות-בנייה בסביבה עירונית עם חשיפה לסיכוני-גובה וחשמל. ' +
      'מטרת פרויקט-הגמר היא יישום עקרונות ניהול-הסיכונים על פי ISO 45001.',
    orgStructure:
      'מבנה-הבטיחות: הנהלה → מנהל-עבודה → ממונה-בטיחות → עובדים. ' +
      'קו-הדיווח: עובד → מנהל-עבודה → ממונה-בטיחות (תקנות הממונים תשנ"ו-1996).',
    workProcesses:
      'תהליכי-העבודה כוללים חפירה, יציקת-בטון, עבודות-גמר ועבודות-גובה. ' +
      'המעסיק חב להדרכה לפי תקנות מסירת-מידע תשנ"ט-1999.',
    riskAnalysis:
      'ניתוח-הסיכונים בוצע ב-JSA. הבקרות-המוצעות לפי מדרג חיסול→החלפה→הנדסי→מנהלי→צמ"א. ' +
      'מומלץ ליישם תחילה את הבקרות לשורות-האדומות ולעקוב אחר ביצוען.',
  };
}

// ---------------------------------------------------------------------------
// setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  isClaudeConfigured.mockReset();
  claudeGenerateJSON.mockReset();
  getUser.mockReset();
  getUser.mockResolvedValue({ id: 'u1' }); // ברירת-מחדל: משתמש-מחובר
});

// ---------------------------------------------------------------------------
// שכבה 1 — ה-action (4 שערי-fallback)
// ---------------------------------------------------------------------------

describe('generateNarrativeAction — שערי-fallback', () => {
  it('שער-1: Claude חי → מחזיר נרטיב תקין עם source="claude"', async () => {
    isClaudeConfigured.mockReturnValue(true);
    claudeGenerateJSON.mockResolvedValue(claudeNarrative());

    const narrative = await generateNarrativeAction(site(), [jsaRow()]);

    expect(claudeGenerateJSON).toHaveBeenCalledTimes(1);
    expect(narrative.source).toBe('claude');
    expect(isValidNarrative(narrative)).toBe(true);
    // וידוא שכל 5 הפרקים נוכחים ולא-ריקים
    expect(narrative.aboutCompany.trim().length).toBeGreaterThan(40);
    expect(narrative.aboutProject.trim().length).toBeGreaterThan(40);
    expect(narrative.orgStructure.trim().length).toBeGreaterThan(40);
    expect(narrative.workProcesses.trim().length).toBeGreaterThan(40);
    expect(narrative.riskAnalysis.trim().length).toBeGreaterThan(40);
  });

  it('שער-1b: Claude מועבר system/prompt/maxTokens=6000 הנכונים', async () => {
    isClaudeConfigured.mockReturnValue(true);
    claudeGenerateJSON.mockResolvedValue(claudeNarrative());

    const s = site({ name: 'מפעל-בדיקה', sector: 'manufacturing', mainHazards: ['רעש'] });
    const rows = [jsaRow()];
    await generateNarrativeAction(s, rows);

    const arg = claudeGenerateJSON.mock.calls[0]![0] as {
      system: string;
      prompt: string;
      maxTokens: number;
    };

    // maxTokens=6000 — שיעור מ-LiveEngine-maxtokens-truncation: 5 פרקים נחתכו מתחת ל-6000
    expect(arg.maxTokens).toBe(6000);
    // system = SYSTEM_NARRATIVE הקנוני
    expect(arg.system).toBe(SYSTEM_NARRATIVE);
    // prompt = buildNarrativePrompt הקנוני
    expect(arg.prompt).toBe(buildNarrativePrompt(s, rows));
  });

  it('שער-2: משתמש-לא-מחובר → fallback דטרמיניסטי (אפס-קריאת-Claude · חסם-עלות)', async () => {
    getUser.mockResolvedValue(null);
    isClaudeConfigured.mockReturnValue(true);

    const narrative = await generateNarrativeAction(site(), []);

    expect(claudeGenerateJSON).not.toHaveBeenCalled();
    expect(narrative.source).toBe('deterministic');
    expect(isValidNarrative(narrative)).toBe(true);
  });

  it('שער-3: Claude לא-מוגדר → fallback דטרמיניסטי (אפס-קריאת-Claude)', async () => {
    isClaudeConfigured.mockReturnValue(false);

    const narrative = await generateNarrativeAction(site(), [jsaRow()]);

    expect(claudeGenerateJSON).not.toHaveBeenCalled();
    expect(narrative.source).toBe('deterministic');
    expect(isValidNarrative(narrative)).toBe(true);
  });

  it('שער-4a: Claude מחזיר JSON עם שדה-חסר → fallback (ולידציה נכשלת)', async () => {
    isClaudeConfigured.mockReturnValue(true);
    // חסר workProcesses ו-riskAnalysis
    claudeGenerateJSON.mockResolvedValue({
      aboutCompany: 'תיאור קצר מדי',
      aboutProject: 'תיאור קצר מדי',
      orgStructure: 'תיאור קצר מדי',
    });

    const narrative = await generateNarrativeAction(site(), []);

    expect(narrative.source).toBe('deterministic');
    expect(isValidNarrative(narrative)).toBe(true);
  });

  it('שער-4b: Claude מחזיר שדה קצר מ-40 תווים → fallback (isValidNarrative נכשל)', async () => {
    isClaudeConfigured.mockReturnValue(true);
    // aboutCompany = 5 תווים בלבד (מתחת ל-40)
    claudeGenerateJSON.mockResolvedValue({
      ...claudeNarrative(),
      aboutCompany: 'קצר',
    });

    const narrative = await generateNarrativeAction(site(), []);

    expect(narrative.source).toBe('deterministic');
    expect(isValidNarrative(narrative)).toBe(true);
  });

  it('שער-4c: קריאת-Claude זורקת → fallback (ה-action לעולם לא זורק)', async () => {
    isClaudeConfigured.mockReturnValue(true);
    claudeGenerateJSON.mockRejectedValue(new Error('network-error · maxTokens-truncation'));

    const narrative = await generateNarrativeAction(site(), []);

    expect(narrative.source).toBe('deterministic');
    expect(isValidNarrative(narrative)).toBe(true);
  });

  it('ה-action לעולם לא זורק — גם כשה-mock זורק סינכרונית', async () => {
    isClaudeConfigured.mockReturnValue(true);
    claudeGenerateJSON.mockImplementation(() => {
      throw new TypeError('sync crash');
    });

    await expect(generateNarrativeAction(site(), [])).resolves.not.toThrow();
    const narrative = await generateNarrativeAction(site(), []);
    expect(narrative.source).toBe('deterministic');
  });
});

// ---------------------------------------------------------------------------
// שכבה 2 — בדיקות תוכן ה-fallback הדטרמיניסטי
// ---------------------------------------------------------------------------

describe('generateNarrativeAction — fallback דטרמיניסטי (source="deterministic")', () => {
  beforeEach(() => {
    // כל בדיקות-השכבה הזו: Claude לא מוגדר → fallback
    isClaudeConfigured.mockReturnValue(false);
  });

  it('source = "deterministic" תמיד בנתיב-fallback', async () => {
    const narrative = await generateNarrativeAction(site(), []);
    expect(narrative.source).toBe('deterministic');
  });

  it('isValidNarrative → true על הפלט הדטרמיניסטי', async () => {
    const narrative = await generateNarrativeAction(site(), [jsaRow()]);
    expect(isValidNarrative(narrative)).toBe(true);
  });

  it('נרטיב-fallback מציין מספר-עובדים מה-SiteInfo', async () => {
    const narrative = await generateNarrativeAction(site({ workerCount: 42 }), []);
    expect(narrative.aboutCompany).toContain('42');
  });

  it('riskAnalysis מציין מספר-שורות-JSA (row count מ-rows)', async () => {
    const rows = [jsaRow(), jsaRow({ hazard: 'גז-רעיל', scenario: 'דליפה' })];
    const narrative = await generateNarrativeAction(site(), rows);
    expect(narrative.riskAnalysis).toContain('2');
  });
});

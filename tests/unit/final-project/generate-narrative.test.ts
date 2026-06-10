/**
 * tests/unit/final-project/generate-narrative.test.ts — פרקים-נרטיביים (generateNarrativeAction).
 *
 * ארכיטקטורת **פר-פרק** (תיקון 2026-06-10): 5 קריאות claudeGenerateText מקבילות (טקסט-נקי),
 * fallback **פר-פרק**. שערים:
 *   1. Claude חי + משתמש-מחובר → 5 קריאות → 5 פרקים · source='claude'.
 *   1b. כל קריאה מקבלת system-פר-פרק · model=author · maxTokens=2400.
 *   2. משתמש-לא-מחובר → אפס-קריאות · fallback דטרמיניסטי.
 *   3. Claude לא-מוגדר → אפס-קריאות · fallback דטרמיניסטי.
 *   4. פרק-בודד נכשל/קצר → אותו-פרק דטרמיניסטי, השאר Claude · source='claude'.
 *   4b. כל-הפרקים נכשלו → source='deterministic'.
 *
 * מוק '@/lib/ai/claude' + '@/lib/auth/server' — אפס-SDK · אפס-רשת · אפס-Supabase.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

// --- מוקים (לפני ה-import של ה-action) ---
const isClaudeConfigured = vi.fn();
const claudeGenerateText = vi.fn();
const defaultAuthorModel = vi.fn(() => 'claude-sonnet-4-6');
vi.mock('@/lib/ai/claude', () => ({
  isClaudeConfigured: () => isClaudeConfigured(),
  claudeGenerateText: (args: unknown) => claudeGenerateText(args),
  defaultAuthorModel: () => defaultAuthorModel(),
}));

const getUser = vi.fn();
vi.mock('@/lib/auth/server', () => ({ getUser: () => getUser() }));

import { generateNarrativeAction } from '@/features/final-project/generate-narrative.action';
import { isValidNarrative, NARRATIVE_CHAPTERS } from '@/features/final-project/narrative';
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

/** פסקת-Claude עשירה דיה (>120 תווים — מעבר ל-MIN_CHAPTER_CHARS). */
const RICH =
  'פסקה מקצועית ארוכה דיה לעבור את סף-המינימום, עם עיגון בפקודת-הבטיחות בעבודה תש"ל-1970 ' +
  'ובתקנות ארגון-הפיקוח תשע"ג-2013, ובמדרג-הבקרות לפי ISO 45001 — חיסול, החלפה, הנדסי, מנהלי וצמ"א. ' +
  'הפסקה כוללת מספר משפטים כדי לדמות פרק-אמיתי עשיר ומלא.';

// ---------------------------------------------------------------------------
// setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  isClaudeConfigured.mockReset();
  claudeGenerateText.mockReset();
  defaultAuthorModel.mockReset();
  defaultAuthorModel.mockReturnValue('claude-sonnet-4-6');
  getUser.mockReset();
  getUser.mockResolvedValue({ id: 'u1' }); // ברירת-מחדל: משתמש-מחובר
});

// ---------------------------------------------------------------------------
// שכבה 1 — מסלול-Claude (פר-פרק)
// ---------------------------------------------------------------------------

describe('generateNarrativeAction — מסלול-Claude פר-פרק', () => {
  it('שער-1: Claude חי → 5 קריאות → 5 פרקים · source="claude"', async () => {
    isClaudeConfigured.mockReturnValue(true);
    claudeGenerateText.mockResolvedValue(RICH);

    const narrative = await generateNarrativeAction(site(), [jsaRow()]);

    // קריאה-אחת פר-פרק (5 פרקים-נרטיביים)
    expect(claudeGenerateText).toHaveBeenCalledTimes(NARRATIVE_CHAPTERS.length);
    expect(narrative.source).toBe('claude');
    expect(isValidNarrative(narrative)).toBe(true);
    expect(narrative.aboutCompany).toBe(RICH);
    expect(narrative.aboutProject).toBe(RICH);
    expect(narrative.orgStructure).toBe(RICH);
    expect(narrative.workProcesses).toBe(RICH);
    expect(narrative.riskAnalysis).toBe(RICH);
  });

  it('שער-1b: כל קריאה מקבלת system-פר-פרק · model=author · maxTokens=2400', async () => {
    isClaudeConfigured.mockReturnValue(true);
    claudeGenerateText.mockResolvedValue(RICH);

    await generateNarrativeAction(site(), [jsaRow()]);

    const calls = claudeGenerateText.mock.calls.map(
      (c) => c[0] as { system: string; prompt: string; model: string; maxTokens: number },
    );
    expect(calls).toHaveLength(5);
    // כל קריאה: מודל-author + maxTokens=2400
    for (const arg of calls) {
      expect(arg.model).toBe('claude-sonnet-4-6');
      expect(arg.maxTokens).toBe(2400);
      expect(typeof arg.system).toBe('string');
      expect(arg.system.length).toBeGreaterThan(40);
    }
    // 5 system-prompts ייחודיים (פר-פרק · לא JSON-יחיד)
    expect(new Set(calls.map((c) => c.system)).size).toBe(5);
  });

  it('שער-2: משתמש-לא-מחובר → fallback דטרמיניסטי (אפס-קריאת-Claude)', async () => {
    getUser.mockResolvedValue(null);
    isClaudeConfigured.mockReturnValue(true);

    const narrative = await generateNarrativeAction(site(), []);

    expect(claudeGenerateText).not.toHaveBeenCalled();
    expect(narrative.source).toBe('deterministic');
    expect(isValidNarrative(narrative)).toBe(true);
  });

  it('שער-3: Claude לא-מוגדר → fallback דטרמיניסטי (אפס-קריאת-Claude)', async () => {
    isClaudeConfigured.mockReturnValue(false);

    const narrative = await generateNarrativeAction(site(), [jsaRow()]);

    expect(claudeGenerateText).not.toHaveBeenCalled();
    expect(narrative.source).toBe('deterministic');
    expect(isValidNarrative(narrative)).toBe(true);
  });

  it('שער-4: פרק-בודד נכשל → אותו-פרק דטרמיניסטי, השאר Claude · source="claude"', async () => {
    isClaudeConfigured.mockReturnValue(true);
    // פרק "אודות החברה" נכשל; שאר-הפרקים מצליחים.
    claudeGenerateText.mockImplementation((args: { system: string }) =>
      args.system.includes('אודות החברה')
        ? Promise.reject(new Error('truncated'))
        : Promise.resolve(RICH),
    );

    const narrative = await generateNarrativeAction(site({ workerCount: 42 }), []);

    expect(narrative.source).toBe('claude'); // ≥1 פרק חובר ע"י Claude
    expect(narrative.aboutCompany).not.toBe(RICH); // נפל-חזרה לדטרמיניסטי
    expect(narrative.aboutCompany).toContain('42'); // דטרמיניסטי מציין workerCount
    expect(narrative.aboutProject).toBe(RICH);
    expect(isValidNarrative(narrative)).toBe(true);
  });

  it('שער-4b: כל-הפרקים נכשלו → source="deterministic"', async () => {
    isClaudeConfigured.mockReturnValue(true);
    claudeGenerateText.mockRejectedValue(new Error('network-error'));

    const narrative = await generateNarrativeAction(site(), []);

    expect(narrative.source).toBe('deterministic');
    expect(isValidNarrative(narrative)).toBe(true);
  });

  it('שער-4c: פרק קצר מ-MIN_CHAPTER_CHARS → דטרמיניסטי (כולם קצרים → deterministic)', async () => {
    isClaudeConfigured.mockReturnValue(true);
    claudeGenerateText.mockResolvedValue('קצר מדי');

    const narrative = await generateNarrativeAction(site(), []);

    expect(narrative.source).toBe('deterministic');
    expect(isValidNarrative(narrative)).toBe(true);
  });

  it('ה-action לעולם לא זורק — גם כשה-mock זורק סינכרונית', async () => {
    isClaudeConfigured.mockReturnValue(true);
    claudeGenerateText.mockImplementation(() => {
      throw new TypeError('sync crash');
    });

    await expect(generateNarrativeAction(site(), [])).resolves.not.toThrow();
    const narrative = await generateNarrativeAction(site(), []);
    expect(narrative.source).toBe('deterministic');
  });
});

// ---------------------------------------------------------------------------
// שכבה 2 — תוכן ה-fallback הדטרמיניסטי
// ---------------------------------------------------------------------------

describe('generateNarrativeAction — fallback דטרמיניסטי (source="deterministic")', () => {
  beforeEach(() => {
    isClaudeConfigured.mockReturnValue(false); // Claude לא-מוגדר → fallback
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

  it('אין סמני-stub "[להשלמה" בפלט-הדטרמיניסטי (תיקון 2026-06-10)', async () => {
    const narrative = await generateNarrativeAction(site(), [jsaRow()]);
    for (const k of [
      'aboutCompany',
      'aboutProject',
      'orgStructure',
      'workProcesses',
      'riskAnalysis',
    ] as const) {
      expect(narrative[k]).not.toContain('[להשלמה');
    }
  });
});

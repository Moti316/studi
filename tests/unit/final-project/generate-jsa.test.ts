/**
 * tests/unit/final-project/generate-jsa.test.ts — טיוטת-JSA אוטומטית (סוכן-B).
 *
 * שתי-שכבות:
 *   1. ה-action (generate-jsa.action.ts) — 4 שערי-fallback. מוק '@/lib/ai/claude'
 *      + '@/lib/auth/server' (אפס-SDK · אפס-רשת · אפס-Supabase).
 *   2. ה-fallback הטהור (buildDeterministicJsaDraft) — ≥1 שורה-תקינה לכל-ענף +
 *      כיבוד-מדרג (אף-שורה אינה צמ"א-בלבד · נאמת מול validateHierarchy).
 *
 * עדכון: מודל-עשיר — existingControls/addedControls הם ControlSet · riskBefore/riskAfter · status.
 * שינוי-שובר: row.severity/probability → row.riskBefore.severity/probability.
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

import { generateJsaDraftAction } from '@/features/final-project/generate-jsa.action';
import {
  buildDeterministicJsaDraft,
  isValidJsaRowArray,
  buildDraftPrompt,
} from '@/features/final-project/jsa-generation';
import { validateHierarchy } from '@/features/final-project/jsa-validation';
import type { SiteInfo, IndustrySector, JsaRow } from '@/features/final-project/types';
import { emptyControlSet } from '@/features/final-project/types';

const ALL_SECTORS: IndustrySector[] = [
  'construction',
  'manufacturing',
  'electrical',
  'chemicals',
  'agriculture',
  'logistics',
  'maintenance',
  'other',
];

function site(over: Partial<SiteInfo> = {}): SiteInfo {
  return {
    name: 'אתר-בדיקה',
    sector: 'construction',
    workerCount: 12,
    mainHazards: [],
    ...over,
  };
}

/**
 * תשובת-Claude תקינה (שורות בלי id — כפי שה-system-prompt מורה).
 * מודל-עשיר: existingControls/addedControls כ-ControlSet · riskBefore/riskAfter · status.
 */
function claudeRows(): { rows: Omit<JsaRow, 'id'>[] } {
  return {
    rows: [
      {
        hazard: 'עבודה בגובה',
        scenario: 'נפילה מקצה-קומה ללא מעקה',
        existingControls: { engineering: 'מעקה-זמני', administrative: '', ppe: '' },
        riskBefore: { severity: 4, probability: 3 },
        addedControls: {
          engineering: 'מעקה-תקני קבוע',
          administrative: 'נוהל-עבודה-בגובה',
          ppe: '',
        },
        riskAfter: { severity: 4, probability: 1 },
        owner: 'מנהל-עבודה',
        due: '',
        status: 'open',
      },
      {
        hazard: 'התחשמלות',
        scenario: 'מגע בכבל-חשוף',
        existingControls: { engineering: 'לוח סגור', administrative: '', ppe: '' },
        riskBefore: { severity: 4, probability: 2 },
        addedControls: {
          engineering: 'הארקה ומפסק-פחת',
          administrative: 'LOTO',
          ppe: '',
        },
        riskAfter: { severity: 4, probability: 1 },
        owner: 'חשמלאי-מוסמך',
        due: '',
        status: 'open',
      },
    ],
  };
}

beforeEach(() => {
  isClaudeConfigured.mockReset();
  claudeGenerateJSON.mockReset();
  getUser.mockReset();
  getUser.mockResolvedValue({ id: 'u1' }); // ברירת-מחדל: משתמש-מחובר
});

// ---------------------------------------------------------------------------
// שכבה 1 — ה-action (4 שערי-fallback)
// ---------------------------------------------------------------------------

describe('generateJsaDraftAction — שערי-fallback', () => {
  it('Claude חי → מחזיר שורות עם id מוזרק (source=claude)', async () => {
    isClaudeConfigured.mockReturnValue(true);
    claudeGenerateJSON.mockResolvedValue(claudeRows());

    const rows = await generateJsaDraftAction(site());

    expect(claudeGenerateJSON).toHaveBeenCalledTimes(1);
    expect(rows).toHaveLength(2);
    // id הוזרק (Claude החזיר בלי id)
    for (const r of rows) {
      expect(typeof r.id).toBe('string');
      expect(r.id.length).toBeGreaterThan(0);
    }
    expect(isValidJsaRowArray(rows)).toBe(true);
  });

  it('Claude מועבר ה-prompt+system הנכונים + maxTokens=4500', async () => {
    isClaudeConfigured.mockReturnValue(true);
    claudeGenerateJSON.mockResolvedValue(claudeRows());

    const s = site({ name: 'מפעל-X', sector: 'manufacturing', mainHazards: ['רעש'] });
    await generateJsaDraftAction(s);

    const arg = claudeGenerateJSON.mock.calls[0]![0] as {
      system: string;
      prompt: string;
      maxTokens: number;
    };
    expect(arg.maxTokens).toBe(4500);
    expect(arg.system).toContain('מסייע-לנתח אתר-אמיתי');
    expect(arg.prompt).toBe(buildDraftPrompt(s)); // ה-prompt הקנוני
  });

  it('משתמש-לא-מחובר → fallback דטרמיניסטי (אפס-קריאת-Claude · חסם-עלות)', async () => {
    getUser.mockResolvedValue(null);
    isClaudeConfigured.mockReturnValue(true);

    const rows = await generateJsaDraftAction(site());

    expect(claudeGenerateJSON).not.toHaveBeenCalled();
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(isValidJsaRowArray(rows)).toBe(true);
  });

  it('Claude לא-מוגדר → fallback (אפס-קריאת-Claude)', async () => {
    isClaudeConfigured.mockReturnValue(false);

    const rows = await generateJsaDraftAction(site());

    expect(claudeGenerateJSON).not.toHaveBeenCalled();
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(isValidJsaRowArray(rows)).toBe(true);
  });

  it('JSON לא-תקין מ-Claude (שורות חסרות-שדות) → fallback', async () => {
    isClaudeConfigured.mockReturnValue(true);
    // riskBefore חסר + scenario חסר → ולידציה נכשלת
    claudeGenerateJSON.mockResolvedValue({
      rows: [
        {
          hazard: 'X',
          existingControls: emptyControlSet(),
          addedControls: emptyControlSet(),
          owner: 'מנהל-עבודה',
        },
      ],
    });

    const rows = await generateJsaDraftAction(site());

    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(isValidJsaRowArray(rows)).toBe(true);
    // אלו השורות-הדטרמיניסטיות, לא שורת-ה-X הפגומה
    expect(rows.some((r) => r.hazard === 'X')).toBe(false);
  });

  it('Claude מחזיר rows-לא-מערך → fallback', async () => {
    isClaudeConfigured.mockReturnValue(true);
    claudeGenerateJSON.mockResolvedValue({ rows: 'oops' });

    const rows = await generateJsaDraftAction(site());

    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(isValidJsaRowArray(rows)).toBe(true);
  });

  it('קריאת-Claude זורקת → fallback (ה-action לעולם לא זורק)', async () => {
    isClaudeConfigured.mockReturnValue(true);
    claudeGenerateJSON.mockRejectedValue(new Error('boom · maxTokens-truncation'));

    const rows = await generateJsaDraftAction(site());

    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(isValidJsaRowArray(rows)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// שכבה 2 — buildDeterministicJsaDraft (טהור)
// ---------------------------------------------------------------------------

describe('buildDeterministicJsaDraft — ≥1 שורה-תקינה לכל-ענף', () => {
  for (const sector of ALL_SECTORS) {
    it(`ענף "${sector}" → שורות-תקינות (isValidJsaRowArray)`, () => {
      const rows = buildDeterministicJsaDraft(site({ sector }));
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(isValidJsaRowArray(rows)).toBe(true);
      // owner = תיאור-תפקיד (name-clean) · id ייחודי
      const ids = new Set(rows.map((r) => r.id));
      expect(ids.size).toBe(rows.length);
      for (const r of rows) {
        expect(r.owner.trim().length).toBeGreaterThan(0);
      }
    });
  }

  it('כל שורה מכילה ControlSet מבני (existingControls/addedControls)', () => {
    for (const sector of ALL_SECTORS) {
      const rows = buildDeterministicJsaDraft(site({ sector }));
      for (const r of rows) {
        // existingControls = ControlSet (לא string)
        expect(typeof r.existingControls).toBe('object');
        expect(r.existingControls).not.toBeNull();
        expect(typeof r.existingControls.engineering).toBe('string');
        expect(typeof r.existingControls.administrative).toBe('string');
        expect(typeof r.existingControls.ppe).toBe('string');

        // addedControls = ControlSet (לא string)
        expect(typeof r.addedControls).toBe('object');
        expect(r.addedControls).not.toBeNull();
        expect(typeof r.addedControls.engineering).toBe('string');
        expect(typeof r.addedControls.administrative).toBe('string');
        expect(typeof r.addedControls.ppe).toBe('string');
      }
    }
  });

  it('כל שורה מכילה riskBefore/riskAfter עם severity/probability 1-4', () => {
    for (const sector of ALL_SECTORS) {
      const rows = buildDeterministicJsaDraft(site({ sector }));
      for (const r of rows) {
        expect(r.riskBefore.severity).toBeGreaterThanOrEqual(1);
        expect(r.riskBefore.severity).toBeLessThanOrEqual(4);
        expect(r.riskBefore.probability).toBeGreaterThanOrEqual(1);
        expect(r.riskBefore.probability).toBeLessThanOrEqual(4);

        expect(r.riskAfter.severity).toBeGreaterThanOrEqual(1);
        expect(r.riskAfter.severity).toBeLessThanOrEqual(4);
        expect(r.riskAfter.probability).toBeGreaterThanOrEqual(1);
        expect(r.riskAfter.probability).toBeLessThanOrEqual(4);
      }
    }
  });

  it('riskAfter ≤ riskBefore (הפחתת-סיכון — הבקרות-הנוספות מביאות תועלת)', () => {
    for (const sector of ALL_SECTORS) {
      const rows = buildDeterministicJsaDraft(site({ sector }));
      for (const r of rows) {
        const scoreBefore = r.riskBefore.severity * r.riskBefore.probability;
        const scoreAfter = r.riskAfter.severity * r.riskAfter.probability;
        // רמת-הסיכון-אחרי לא גבוהה מלפני (הבקרות מועילות)
        expect(scoreAfter).toBeLessThanOrEqual(scoreBefore);
      }
    }
  });

  it('כל שורה מכילה status תקין (open|in_progress|done)', () => {
    const validStatuses = new Set(['open', 'in_progress', 'done']);
    for (const sector of ALL_SECTORS) {
      const rows = buildDeterministicJsaDraft(site({ sector }));
      for (const r of rows) {
        expect(validStatuses.has(r.status)).toBe(true);
      }
    }
  });

  it('מכבד-מדרג: אף שורה אינה צמ"א-בלבד (validateHierarchy ללא ליקוי-PPE-only)', () => {
    for (const sector of ALL_SECTORS) {
      const rows = buildDeterministicJsaDraft(site({ sector }));
      const issues = validateHierarchy(rows);
      const ppeOnly = issues.filter((i) => i.description.includes('ציוד-מגן-אישי בלבד'));
      expect(ppeOnly, `ענף ${sector} הניב שורת-צמ"א-בלבד`).toHaveLength(0);
    }
  });

  it('משלב מפגעים שהלומד ציין מפורשות', () => {
    const rows = buildDeterministicJsaDraft(
      site({ sector: 'other', mainHazards: ['מפגע-ייחודי-לאתר-זה'] }),
    );
    expect(rows.some((r) => r.hazard.includes('מפגע-ייחודי-לאתר-זה'))).toBe(true);
    // גם שורת-מפגע-חופשי מכבדת-מדרג (בקרה-הנדסית/מנהלית · לא צמ"א-בלבד)
    const ppeOnly = validateHierarchy(rows).filter((i) =>
      i.description.includes('ציוד-מגן-אישי בלבד'),
    );
    expect(ppeOnly).toHaveLength(0);
  });

  it('mainHazards ריקים/רווחים בלבד → עדיין מחזיר שורות-שלד-לענף', () => {
    const rows = buildDeterministicJsaDraft(
      site({ sector: 'construction', mainHazards: ['', '  '] }),
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(isValidJsaRowArray(rows)).toBe(true);
  });

  // שמור תאימות-אחורה: לא עולה r.severity / r.probability (שדות ישנים שהוסרו)
  it('שדות-ישנים (row.severity / row.probability) לא קיימים — הוחלפו ב-riskBefore', () => {
    const rows = buildDeterministicJsaDraft(site({ sector: 'manufacturing' }));
    for (const r of rows) {
      const raw = r as unknown as Record<string, unknown>;
      // השדות הישנים הוסרו מהמודל; noUncheckedIndexedAccess: הגישה תחזיר undefined
      expect(raw['severity']).toBeUndefined();
      expect(raw['probability']).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// isValidJsaRowArray — type-guard (מודל-עשיר)
// ---------------------------------------------------------------------------

describe('isValidJsaRowArray', () => {
  /** שורה תקינה במודל-העשיר. */
  function validRow(): JsaRow {
    return {
      id: 'r1',
      hazard: 'h',
      scenario: 's',
      existingControls: { engineering: 'c', administrative: '', ppe: '' },
      riskBefore: { severity: 3, probability: 2 },
      addedControls: { engineering: 'a', administrative: '', ppe: '' },
      riskAfter: { severity: 2, probability: 1 },
      owner: 'מנהל-עבודה',
      due: '',
      status: 'open',
    };
  }

  it('מערך-תקין → true', () => {
    expect(isValidJsaRowArray([validRow()])).toBe(true);
  });

  it('מערך-ריק → false', () => {
    expect(isValidJsaRowArray([])).toBe(false);
  });

  it('לא-מערך → false', () => {
    expect(isValidJsaRowArray({})).toBe(false);
    expect(isValidJsaRowArray(null)).toBe(false);
  });

  it('id חסר → false', () => {
    const r = validRow() as Partial<JsaRow>;
    delete r.id;
    expect(isValidJsaRowArray([r])).toBe(false);
  });

  it('riskBefore חסר → false', () => {
    const r = { ...validRow() } as Partial<JsaRow> & Record<string, unknown>;
    delete r.riskBefore;
    expect(isValidJsaRowArray([r])).toBe(false);
  });

  it('riskBefore.severity מחוץ-לטווח → false', () => {
    expect(
      isValidJsaRowArray([
        { ...validRow(), riskBefore: { severity: 5 as unknown as 4, probability: 2 } },
      ]),
    ).toBe(false);
    expect(
      isValidJsaRowArray([
        { ...validRow(), riskBefore: { severity: 0 as unknown as 1, probability: 2 } },
      ]),
    ).toBe(false);
  });

  it('riskBefore.probability מחוץ-לטווח → false', () => {
    expect(
      isValidJsaRowArray([
        { ...validRow(), riskBefore: { severity: 3, probability: 0 as unknown as 1 } },
      ]),
    ).toBe(false);
  });

  it('existingControls לא-ControlSet (string) → false', () => {
    expect(
      isValidJsaRowArray([
        { ...validRow(), existingControls: 'מחרוזת-ישנה' as unknown as JsaRow['existingControls'] },
      ]),
    ).toBe(false);
  });

  it('addedControls לא-ControlSet (string) → false', () => {
    expect(
      isValidJsaRowArray([
        { ...validRow(), addedControls: 'מחרוזת-ישנה' as unknown as JsaRow['addedControls'] },
      ]),
    ).toBe(false);
  });

  it('due רשות — undefined תקין · non-string פסול', () => {
    const r = validRow() as Partial<JsaRow>;
    delete r.due;
    expect(isValidJsaRowArray([r])).toBe(true);
    expect(isValidJsaRowArray([{ ...validRow(), due: 5 as unknown as string }])).toBe(false);
  });

  it('status לא-תקין → false', () => {
    expect(
      isValidJsaRowArray([{ ...validRow(), status: 'invalid' as unknown as JsaRow['status'] }]),
    ).toBe(false);
  });

  it('status חסר — רשות, ברירת-מחדל open', () => {
    const r = validRow() as Partial<JsaRow>;
    delete r.status;
    // status רשות — שורה ללא status תקינה (ה-action יזריק "open")
    expect(isValidJsaRowArray([r])).toBe(true);
  });

  // #4: hazard ו-scenario חייבים לא-ריקים
  it('hazard מחרוזת-ריקה → false (#4)', () => {
    expect(isValidJsaRowArray([{ ...validRow(), hazard: '' }])).toBe(false);
  });

  it('scenario מחרוזת-ריקה → false (#4)', () => {
    expect(isValidJsaRowArray([{ ...validRow(), scenario: '' }])).toBe(false);
  });

  // #8: שורה-אדומה (riskBefore ≥ 12) חייבת addedControls לא-ריקות
  it('שורה-אדומה (riskBefore=4×3=12) עם addedControls ריקות → false (#8)', () => {
    expect(
      isValidJsaRowArray([
        {
          ...validRow(),
          riskBefore: { severity: 4, probability: 3 },
          addedControls: { engineering: '', administrative: '', ppe: '' },
        },
      ]),
    ).toBe(false);
  });

  it('שורה-אדומה (riskBefore=4×4=16) עם addedControls ריקות → false (#8)', () => {
    expect(
      isValidJsaRowArray([
        {
          ...validRow(),
          riskBefore: { severity: 4, probability: 4 },
          addedControls: { engineering: '', administrative: '', ppe: '' },
        },
      ]),
    ).toBe(false);
  });

  it('שורה-אדומה (riskBefore=4×3=12) עם addedControls מלאות → true (#8)', () => {
    expect(
      isValidJsaRowArray([
        {
          ...validRow(),
          riskBefore: { severity: 4, probability: 3 },
          addedControls: { engineering: 'הארקה ומפסק', administrative: 'LOTO', ppe: '' },
        },
      ]),
    ).toBe(true);
  });

  it('שורה-צהובה (riskBefore=3×3=9) עם addedControls ריקות — עובר (#8 לא-חוסם)', () => {
    // ציון 9 = צהוב — הכלל-האדום לא חל (הכלל: ≥12 בלבד)
    expect(
      isValidJsaRowArray([
        {
          ...validRow(),
          riskBefore: { severity: 3, probability: 3 },
          addedControls: { engineering: '', administrative: '', ppe: '' },
        },
      ]),
    ).toBe(true);
  });
});

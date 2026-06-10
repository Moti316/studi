/**
 * tests/unit/final-project/generate-jsa.test.ts — טיוטת-JSA אוטומטית (סוכן-B).
 *
 * שתי-שכבות:
 *   1. ה-action (generate-jsa.action.ts) — 4 שערי-fallback. מוק '@/lib/ai/claude'
 *      + '@/lib/auth/server' (אפס-SDK · אפס-רשת · אפס-Supabase).
 *   2. ה-fallback הטהור (buildDeterministicJsaDraft) — ≥1 שורה-תקינה לכל-ענף +
 *      כיבוד-מדרג (אף-שורה אינה צמ"א-בלבד · נאמת מול validateHierarchy).
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

/** תשובת-Claude תקינה (שורות בלי id — כפי שה-system-prompt מורה). */
function claudeRows(): { rows: Omit<JsaRow, 'id'>[] } {
  return {
    rows: [
      {
        hazard: 'עבודה בגובה',
        scenario: 'נפילה מקצה-קומה ללא מעקה',
        existingControls: 'מעקה-זמני',
        severity: 4,
        probability: 3,
        addedControls: 'מעקה-תקני קבוע (הנדסי) + נוהל-עבודה-בגובה',
        owner: 'מנהל-עבודה',
        due: '',
      },
      {
        hazard: 'התחשמלות',
        scenario: 'מגע בכבל-חשוף',
        existingControls: 'לוח סגור',
        severity: 4,
        probability: 2,
        addedControls: 'הארקה ומפסק-פחת (הנדסי) + LOTO',
        owner: 'חשמלאי-מוסמך',
        due: '',
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

  it('Claude מועבר ה-prompt+system הנכונים + maxTokens=3000', async () => {
    isClaudeConfigured.mockReturnValue(true);
    claudeGenerateJSON.mockResolvedValue(claudeRows());

    const s = site({ name: 'מפעל-X', sector: 'manufacturing', mainHazards: ['רעש'] });
    await generateJsaDraftAction(s);

    const arg = claudeGenerateJSON.mock.calls[0]![0] as {
      system: string;
      prompt: string;
      maxTokens: number;
    };
    expect(arg.maxTokens).toBe(3000);
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
    // severity מחוץ-לטווח + scenario חסר → ולידציה נכשלת
    claudeGenerateJSON.mockResolvedValue({
      rows: [{ hazard: 'X', severity: 9, probability: 2, owner: 'מנהל-עבודה' }],
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

  it('severity/probability תמיד בטווח 1-4', () => {
    for (const sector of ALL_SECTORS) {
      for (const r of buildDeterministicJsaDraft(site({ sector }))) {
        expect(r.severity).toBeGreaterThanOrEqual(1);
        expect(r.severity).toBeLessThanOrEqual(4);
        expect(r.probability).toBeGreaterThanOrEqual(1);
        expect(r.probability).toBeLessThanOrEqual(4);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// isValidJsaRowArray — type-guard
// ---------------------------------------------------------------------------

describe('isValidJsaRowArray', () => {
  function validRow(): JsaRow {
    return {
      id: 'r1',
      hazard: 'h',
      scenario: 's',
      existingControls: 'c',
      severity: 3,
      probability: 2,
      addedControls: 'a',
      owner: 'מנהל-עבודה',
      due: '',
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

  it('severity מחוץ-לטווח → false', () => {
    expect(isValidJsaRowArray([{ ...validRow(), severity: 5 as unknown as 4 }])).toBe(false);
    expect(isValidJsaRowArray([{ ...validRow(), severity: 0 as unknown as 1 }])).toBe(false);
  });

  it('due רשות — undefined תקין · non-string פסול', () => {
    const r = validRow() as Partial<JsaRow>;
    delete r.due;
    expect(isValidJsaRowArray([r])).toBe(true);
    expect(isValidJsaRowArray([{ ...validRow(), due: 5 as unknown as string }])).toBe(false);
  });
});

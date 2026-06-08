import { describe, it, expect } from 'vitest';
import {
  parseLegislationIndex,
  stripFrontmatter,
  verifyCitation,
  verifyScenarioCitations,
  hasValidLegalBackup,
  type BodyResolver,
  type Citation,
} from '@/lib/import/verify-grounding';

// נוסח-נבו אמיתי-בזעיר (2.1 · עבודה בגובה) — הגוף שמולו G3 בודק מילולית.
const BODY_2_1 =
  'תקנות הבטיחות בעבודה (עבודה בגובה), התשס"ז-2007. ' +
  'לא יבצע אדם עבודה בגובה אלא אם כן הוא הוסמך לכך והודרך כנדרש, ' +
  'וננקטו כל האמצעים למניעת נפילה מגובה.';

// resolver-מדומה: 2.1 → גוף · 5.1 (תקן-ISO · ולידי אך ללא נוסח) → null.
const fakeResolver: BodyResolver = (scopeId) => (scopeId === '2.1' ? BODY_2_1 : null);

describe('parseLegislationIndex', () => {
  it('ממפה scopeId → נתיב-.md משורת-טבלה', () => {
    const idx = [
      '| scope | כותרת | עומק | 📄 PDF | 📝 .md | 🔗 נבו | שלמות |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| 2.1 | תקנות (עבודה בגובה) | 🔵 | [PDF](https://x) | [.md](courses/safety-officer/sources/legislation/2-pkudat-habetihut/2.1-avoda-begova-2007.md) | [נבו](https://n) | ✓ |',
      '| 5.1 | ת"י 45001 | 🔵 | — | — | — | — |', // ללא .md → לא-במפה
    ].join('\n');
    const map = parseLegislationIndex(idx);
    expect(map.get('2.1')).toBe(
      'courses/safety-officer/sources/legislation/2-pkudat-habetihut/2.1-avoda-begova-2007.md',
    );
    expect(map.has('5.1')).toBe(false);
  });
});

describe('stripFrontmatter', () => {
  it('מסיר בלוק-frontmatter ומחזיר את הגוף', () => {
    const md = '---\nscope_id: "2.1"\ntitle: x\n---\n# כותרת\nגוף הנוסח כאן.';
    expect(stripFrontmatter(md)).toBe('# כותרת\nגוף הנוסח כאן.');
  });
  it('מחזיר קלט כפי-שהוא כשאין frontmatter', () => {
    expect(stripFrontmatter('סתם טקסט')).toBe('סתם טקסט');
  });
});

describe('verifyCitation — שערי G1/G2/G3', () => {
  it('G1 ✗ — scopeId לא-מוכר → לא-מעוגן', () => {
    const g = verifyCitation(
      { scopeId: '9.9', quote: 'לא יבצע אדם עבודה בגובה אלא אם כן הוא הוסמך' },
      fakeResolver,
    );
    expect(g.g1).toBe(false);
    expect(g.grounded).toBe(false);
    expect(g.detail).toContain('G1');
  });

  it('G2 ✗ — scopeId ולידי אך ללא נוסח-.md (תקן-ISO) → לא-מעוגן', () => {
    const g = verifyCitation(
      { scopeId: '5.1', quote: 'משפט כלשהו ארוך מספיק לבדיקה' },
      fakeResolver,
    );
    expect(g.g1).toBe(true);
    expect(g.g2).toBe(false);
    expect(g.grounded).toBe(false);
    expect(g.detail).toContain('G2');
  });

  it('G3 ✗ — quote שאינו מופיע מילולית בנוסח → drop', () => {
    const g = verifyCitation(
      { scopeId: '2.1', quote: 'העובד רשאי לעבוד בגובה ללא כל הסמכה' },
      fakeResolver,
    );
    expect(g.g1).toBe(true);
    expect(g.g2).toBe(true);
    expect(g.g3).toBe(false);
    expect(g.grounded).toBe(false);
  });

  it('✓ מעוגן-מלא — quote מילולי בנוסח, scopeId ולידי, סעיף נמצא (G5)', () => {
    const g = verifyCitation(
      {
        scopeId: '2.1',
        quote: 'לא יבצע אדם עבודה בגובה אלא אם כן הוא הוסמך לכך',
        section: 'תקנה 2007',
      },
      fakeResolver,
    );
    expect(g.grounded).toBe(true);
    expect(g.g3).toBe(true);
    expect(g.g5).toBe(true); // "2007" מופיע בגוף
  });

  it('דוחה ציטוט קצר-מדי (פחות מ-12 תווים) דרך G3', () => {
    const g = verifyCitation({ scopeId: '2.1', quote: 'גובה' }, fakeResolver);
    expect(g.g3).toBe(false);
    expect(g.grounded).toBe(false);
  });
});

describe('verifyScenarioCitations — G4 (legalBackup ≥1 מעוגן)', () => {
  it('hasGroundedBackup=true כשיש לפחות ציטוט מעוגן-אחד (גם לצד מומצא)', () => {
    const res = verifyScenarioCitations(
      [
        { scopeId: '2.1', quote: 'לא יבצע אדם עבודה בגובה אלא אם כן הוא הוסמך לכך' }, // מעוגן
        { scopeId: '9.9', quote: 'ציטוט מומצא מ-scope לא-קיים בעליל' }, // נדחה G1
      ],
      fakeResolver,
    );
    expect(res.hasGroundedBackup).toBe(true);
    expect(res.groundedCitations).toHaveLength(1);
    expect(res.gates).toHaveLength(2);
  });

  it('hasGroundedBackup=false כשאף ציטוט אינו מעוגן (תרחיש "מוחזק")', () => {
    const res = verifyScenarioCitations(
      [{ scopeId: '2.1', quote: 'משפט שאינו קיים כלל בנוסח הזה' }],
      fakeResolver,
    );
    expect(res.hasGroundedBackup).toBe(false);
    expect(res.groundedCitations).toHaveLength(0);
  });

  // רגרסיה לבאג-C1 (ממצא-בקרה): ה-importer חייב להריץ את שער-G4 על
  // ציטוטי-legalBackup בלבד — ציטוט-מעוגן ב-immediateAction/engineeringMgmt
  // לא "מציל" legalBackup-ריק. כאן מדגימים את ההבחנה ברמת-הפונקציה.
  it('G4 ממוקד-legalBackup: ציטוט-מעוגן רק מחוץ-ל-legalBackup → gate על legalBackup-בלבד=false', () => {
    const groundedElsewhere: Citation[] = [
      { scopeId: '2.1', quote: 'לא יבצע אדם עבודה בגובה אלא אם כן הוא הוסמך לכך' },
    ];
    const legalBackupEmpty: Citation[] = [];
    // לו בדקנו את כל-הציטוטים-יחד — עובר (טעות C1):
    expect(verifyScenarioCitations(groundedElsewhere, fakeResolver).hasGroundedBackup).toBe(true);
    // שער-G4 הנכון על legalBackup-בלבד (ריק) → מוחזק:
    expect(verifyScenarioCitations(legalBackupEmpty, fakeResolver).hasGroundedBackup).toBe(false);
  });
});

describe('hasValidLegalBackup — ציון-סעיף חובה (דרישת-מוטי)', () => {
  const GROUNDED = 'לא יבצע אדם עבודה בגובה אלא אם כן הוא הוסמך לכך';

  it('ok=true — ציטוט מעוגן-מילולית + נושא section', () => {
    const res = hasValidLegalBackup(
      [{ scopeId: '2.1', quote: GROUNDED, section: 'תקנה 5' }],
      fakeResolver,
    );
    expect(res.ok).toBe(true);
  });

  it('ok=false — ציטוט מעוגן אך **ללא** section (היצמדות-לחוק ללא ציון-סעיף לא מספיקה)', () => {
    const res = hasValidLegalBackup([{ scopeId: '2.1', quote: GROUNDED }], fakeResolver);
    expect(res.ok).toBe(false);
  });

  it('ok=false — section ריק/רווחים נחשב חסר', () => {
    const res = hasValidLegalBackup(
      [{ scopeId: '2.1', quote: GROUNDED, section: '   ' }],
      fakeResolver,
    );
    expect(res.ok).toBe(false);
  });

  it('ok=false — section קיים אך הציטוט אינו מעוגן (G3 נכשל)', () => {
    const res = hasValidLegalBackup(
      [{ scopeId: '2.1', quote: 'משפט שאינו בנוסח כלל', section: 'תקנה 5' }],
      fakeResolver,
    );
    expect(res.ok).toBe(false);
  });
});

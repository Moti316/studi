/**
 * tests/unit/final-project/export.test.ts — ייצוא המסמך-המוגש (סוכן-D · בלוק חוזה-משותף).
 *
 * מתמקד במבנה-הביניים הטהור (buildProjectDocument) — coverLines · siteSummary · jsaTable
 * (כולל riskLevel/riskBand פר-שורה). + בדיקת-עשן ל-exportToDocx (לא-זורק על קלט-ריק/מלא).
 * exportToPdf תלוי-DOM/canvas → לא נבדק כאן (נכוסה ב-e2e).
 *
 * עדכון: מודל-עשיר — 18 עמודות (פורמט-רשמי מלא משרד-העבודה) ·
 * existingControls/addedControls הם ControlSet · riskBefore/riskAfter · status.
 *
 * מיפוי-עמודות (JSA_HEADERS · 18 עמודות):
 *   [0]  מס׳
 *   [1]  גורם-הסיכון
 *   [2]  תרחיש-להתממשות
 *   [3]  בקרות-קיימות: הנדסיות
 *   [4]  בקרות-קיימות: מנהלתיות
 *   [5]  בקרות-קיימות: צמ"א
 *   [6]  הערכת-סיכון בשלב-זה: סבירות
 *   [7]  הערכת-סיכון בשלב-זה: חומרה
 *   [8]  הערכת-סיכון בשלב-זה: רמת-סיכון
 *   [9]  בקרות-נוספות-נדרשות: הנדסיות
 *   [10] בקרות-נוספות-נדרשות: מנהלתיות
 *   [11] בקרות-נוספות-נדרשות: צמ"א
 *   [12] הערכת-סיכון לאחר-יישום: סבירות
 *   [13] הערכת-סיכון לאחר-יישום: חומרה
 *   [14] הערכת-סיכון לאחר-יישום: רמת-סיכון
 *   [15] אחראי-לביצוע
 *   [16] תאריך-ביצוע
 *   [17] סטטוס
 */
import { describe, expect, it, vi } from 'vitest';
import {
  buildProjectDocument,
  JSA_HEADERS,
} from '@/features/final-project/export/project-document';
import { riskLevel, riskBand, emptyJsaRow, emptyControlSet } from '@/features/final-project/types';
import type { CoverInfo, SiteInfo, JsaRow } from '@/features/final-project/types';

// ---------------------------------------------------------------------------
// fixtures
// ---------------------------------------------------------------------------

const cover: CoverInfo = {
  companyName: 'מפעל-מזון בע"מ',
  projectName: 'ניתוח-סיכונים קו-אריזה',
  location: 'באר-שבע',
  submitterName: 'משה לוי',
  idNumber: '123456789',
  date: '2026-06-10',
  mentorName: 'דנה כהן',
};

const site: SiteInfo = {
  name: 'מפעל-מזון קו-אריזה',
  sector: 'manufacturing',
  workerCount: 24,
  mainHazards: ['חלקים-נעים', 'רעש'],
};

function row(over: Partial<JsaRow> = {}): JsaRow {
  return {
    ...emptyJsaRow('r1'),
    hazard: 'מגע עם חלקים-נעים',
    scenario: 'יד נכנסת לאזור-העבודה של המכונה',
    existingControls: { engineering: 'מגן-מכונה הנדסי', administrative: '', ppe: '' },
    riskBefore: { severity: 4, probability: 3 },
    addedControls: { engineering: '', administrative: 'נוהל-נעילה (LOTO)', ppe: '' },
    riskAfter: { severity: 4, probability: 1 },
    owner: 'מנהל-עבודה',
    due: '2026-07-01',
    status: 'open',
    ...over,
  };
}

// ---------------------------------------------------------------------------
// buildProjectDocument — עמוד-פתיחה
// ---------------------------------------------------------------------------

describe('buildProjectDocument — עמוד-פתיחה (7 שדות)', () => {
  it('coverLines כולל את כל 7 שדות-ה-CoverInfo עם ערכיהם', () => {
    const doc = buildProjectDocument(cover, site, [row()]);
    expect(doc.coverLines).toHaveLength(7);

    const joined = doc.coverLines.join('\n');
    expect(joined).toContain('מפעל-מזון בע"מ'); // companyName
    expect(joined).toContain('ניתוח-סיכונים קו-אריזה'); // projectName
    expect(joined).toContain('באר-שבע'); // location
    expect(joined).toContain('משה לוי'); // submitterName
    expect(joined).toContain('123456789'); // idNumber
    expect(joined).toContain('2026-06-10'); // date
    expect(joined).toContain('דנה כהן'); // mentorName
  });

  it('cover=null → 7 שורות עם placeholder "—" (לא-זורק)', () => {
    const doc = buildProjectDocument(null, site, []);
    expect(doc.coverLines).toHaveLength(7);
    expect(doc.coverLines.every((l) => l.includes('—'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildProjectDocument — סיכום-אתר
// ---------------------------------------------------------------------------

describe('buildProjectDocument — סיכום-אתר', () => {
  it('כולל תווית-ענף בעברית · מספר-עובדים · מפגעים-עיקריים', () => {
    const doc = buildProjectDocument(cover, site, []);
    expect(doc.siteSummary).toContain('ייצור / מפעל'); // תווית-ענף manufacturing
    expect(doc.siteSummary).toContain('24'); // workerCount
    expect(doc.siteSummary).toContain('חלקים-נעים'); // mainHazard
    expect(doc.siteSummary).toContain('רעש');
  });

  it('site=null → הודעת "טרם הוזן" (לא-זורק)', () => {
    const doc = buildProjectDocument(cover, null, []);
    expect(doc.siteSummary).toContain('טרם הוזן');
  });
});

// ---------------------------------------------------------------------------
// buildProjectDocument — טבלת-JSA (פורמט-רשמי מלא · 18 עמודות · מודל-עשיר)
// ---------------------------------------------------------------------------

describe('buildProjectDocument — jsaTable', () => {
  it('headers = 18 עמודות עבריות בסדר-קבוע (פורמט-רשמי מלא משרד-העבודה)', () => {
    const doc = buildProjectDocument(cover, site, []);
    expect(doc.jsaTable.headers).toEqual([...JSA_HEADERS]);
    expect(doc.jsaTable.headers).toHaveLength(18);
    expect(doc.jsaTable.headers[0]).toBe('מס׳');
    // עמודת-רמת-סיכון לפני [8]
    expect(doc.jsaTable.headers[8]).toBe('הערכת-סיכון בשלב-זה: רמת-סיכון');
    // עמודת-רמת-סיכון אחרי [14]
    expect(doc.jsaTable.headers[14]).toBe('הערכת-סיכון לאחר-יישום: רמת-סיכון');
    // שדות-בקרות מפוצלות (3+3)
    expect(doc.jsaTable.headers[3]).toBe('בקרות-קיימות: הנדסיות');
    expect(doc.jsaTable.headers[9]).toBe('בקרות-נוספות-נדרשות: הנדסיות');
    // עמודה אחרונה: סטטוס [17]
    expect(doc.jsaTable.headers[17]).toBe('סטטוס');
  });

  it('riskScore פר-שורה = riskLevel(severity,probability) מ-riskBefore', () => {
    const doc = buildProjectDocument(cover, site, [
      row({ riskBefore: { severity: 4, probability: 3 } }),
    ]);
    expect(doc.jsaTable.rows).toHaveLength(1);
    // riskScore = deprecated alias ל-riskScoreBefore
    expect(doc.jsaTable.rows[0]!.riskScore).toBe(riskLevel(4, 3)); // 12
    expect(doc.jsaTable.rows[0]!.riskScore).toBe(12);
    expect(doc.jsaTable.rows[0]!.riskScoreBefore).toBe(12);
  });

  it('band פר-שורה תואם riskBand(score) מ-riskBefore', () => {
    const green = buildProjectDocument(cover, site, [
      row({ riskBefore: { severity: 1, probability: 2 } }),
    ]); // 2
    const yellow = buildProjectDocument(cover, site, [
      row({ riskBefore: { severity: 2, probability: 3 } }),
    ]); // 6
    const red = buildProjectDocument(cover, site, [
      row({ riskBefore: { severity: 4, probability: 4 } }),
    ]); // 16

    // band = deprecated alias ל-bandBefore
    expect(green.jsaTable.rows[0]!.band).toBe('green');
    expect(green.jsaTable.rows[0]!.band).toBe(riskBand(2));
    expect(yellow.jsaTable.rows[0]!.band).toBe('yellow');
    expect(yellow.jsaTable.rows[0]!.band).toBe(riskBand(6));
    expect(red.jsaTable.rows[0]!.band).toBe('red');
    expect(red.jsaTable.rows[0]!.band).toBe(riskBand(16));
  });

  it('bandAfter מחושב מ-riskAfter', () => {
    const doc = buildProjectDocument(cover, site, [
      row({
        riskBefore: { severity: 4, probability: 4 }, // 16 = אדום
        riskAfter: { severity: 2, probability: 2 }, //  4 = ירוק
      }),
    ]);
    expect(doc.jsaTable.rows[0]!.bandBefore).toBe('red');
    expect(doc.jsaTable.rows[0]!.bandAfter).toBe('green');
    expect(doc.jsaTable.rows[0]!.riskScoreAfter).toBe(4);
  });

  it('תא רמת-הסיכון-לפני (index 8) משלב ציון + תווית-רצועה בעברית רשמית', () => {
    const doc = buildProjectDocument(cover, site, [
      row({ riskBefore: { severity: 4, probability: 4 } }),
    ]); // 16 → לא-קביל (עצירה)
    const cells = doc.jsaTable.rows[0]!.cells;
    expect(cells).toHaveLength(18);
    expect(cells[0]).toBe('1'); // מספר-שורה
    expect(cells[8]).toContain('16');
    // riskBandLabel('red') = 'לא-קביל (עצירה)' (לפי לוח-ההחלטה הרשמי של משרד-העבודה)
    expect(cells[8]).toContain('לא-קביל (עצירה)');
  });

  it('תא רמת-הסיכון-אחרי (index 14) משלב ציון + תווית-רצועה בעברית רשמית', () => {
    const doc = buildProjectDocument(cover, site, [
      row({
        riskBefore: { severity: 4, probability: 4 }, // 16
        riskAfter: { severity: 1, probability: 2 }, // 2 → קביל
      }),
    ]);
    const cells = doc.jsaTable.rows[0]!.cells;
    expect(cells[14]).toContain('2');
    // riskBandLabel('green') = 'קביל' (לפי לוח-ההחלטה הרשמי של משרד-העבודה)
    expect(cells[14]).toContain('קביל');
  });

  it('תאי-חומרה/סבירות תואמים את riskBefore (עמודות [7] ו-[6])', () => {
    const doc = buildProjectDocument(cover, site, [
      row({ riskBefore: { severity: 3, probability: 2 } }),
    ]);
    const cells = doc.jsaTable.rows[0]!.cells;
    // [6] = סבירות, [7] = חומרה (סדר הטבלה הרשמית: סבירות לפני חומרה)
    expect(cells[6]).toBe('2'); // סבירות
    expect(cells[7]).toBe('3'); // חומרה
  });

  it('שדות-ריקים בשורה — ControlSet ריק + owner/due ריקים → placeholder "—"', () => {
    const doc = buildProjectDocument(cover, site, [
      row({
        existingControls: emptyControlSet(),
        addedControls: emptyControlSet(),
        owner: '',
        due: '',
      }),
    ]);
    const cells = doc.jsaTable.rows[0]!.cells;
    // בקרות-קיימות: הנדסיות [3], מנהלתיות [4], צמ"א [5] — כולן ריקות → "—"
    expect(cells[3]).toBe('—'); // הנדסיות-קיימות
    expect(cells[4]).toBe('—'); // מנהלתיות-קיימות
    expect(cells[5]).toBe('—'); // צמ"א-קיימות
    // בקרות-נוספות: הנדסיות [9], מנהלתיות [10], צמ"א [11] — כולן ריקות → "—"
    expect(cells[9]).toBe('—'); // הנדסיות-נוספות
    expect(cells[10]).toBe('—'); // מנהלתיות-נוספות
    expect(cells[11]).toBe('—'); // צמ"א-נוספות
    expect(cells[15]).toBe('—'); // אחראי
    expect(cells[16]).toBe('—'); // מועד
  });

  it('בקרות-קיימות — ControlSet עם תוכן מתורגם לתאים נפרדים', () => {
    const doc = buildProjectDocument(cover, site, [
      row({
        existingControls: {
          engineering: 'מגן-מכונה הנדסי',
          administrative: 'נוהל-בטיחות',
          ppe: 'כפפות',
        },
      }),
    ]);
    const cells = doc.jsaTable.rows[0]!.cells;
    expect(cells[3]).toBe('מגן-מכונה הנדסי'); // הנדסיות-קיימות
    expect(cells[4]).toBe('נוהל-בטיחות'); // מנהלתיות-קיימות
    expect(cells[5]).toBe('כפפות'); // צמ"א-קיימות
  });

  it('בקרות-נוספות — ControlSet עם תוכן מתורגם לתאים נפרדים', () => {
    const doc = buildProjectDocument(cover, site, [
      row({
        addedControls: {
          engineering: 'מיגון-מכונה חדש',
          administrative: 'נוהל עדכני',
          ppe: 'כובע-בטיחות',
        },
      }),
    ]);
    const cells = doc.jsaTable.rows[0]!.cells;
    expect(cells[9]).toBe('מיגון-מכונה חדש'); // הנדסיות-נוספות
    expect(cells[10]).toBe('נוהל עדכני'); // מנהלתיות-נוספות
    expect(cells[11]).toBe('כובע-בטיחות'); // צמ"א-נוספות
  });

  it('תא-סטטוס (index 17) מכיל תווית-סטטוס עברית', () => {
    const docOpen = buildProjectDocument(cover, site, [row({ status: 'open' })]);
    const docDone = buildProjectDocument(cover, site, [row({ status: 'done' })]);
    const docInProgress = buildProjectDocument(cover, site, [row({ status: 'in_progress' })]);

    expect(docOpen.jsaTable.rows[0]!.cells[17]).toBe('פתוח');
    expect(docDone.jsaTable.rows[0]!.cells[17]).toBe('מבוצע');
    expect(docInProgress.jsaTable.rows[0]!.cells[17]).toBe('בביצוע');
  });

  it('מספור-שורות עוקב (1..N)', () => {
    const doc = buildProjectDocument(cover, site, [
      row({ id: 'a' }),
      row({ id: 'b' }),
      row({ id: 'c' }),
    ]);
    expect(doc.jsaTable.rows.map((r) => r.index)).toEqual([1, 2, 3]);
    expect(doc.jsaTable.rows.map((r) => r.cells[0])).toEqual(['1', '2', '3']);
  });

  it('קלט-ריק לחלוטין (null,null,[]) → מבנה-תקין ללא-שורות (לא-זורק)', () => {
    const doc = buildProjectDocument(null, null, []);
    expect(doc.title).toBeTruthy();
    expect(doc.jsaTable.rows).toHaveLength(0);
    expect(doc.jsaTable.headers).toHaveLength(18);
  });
});

// ---------------------------------------------------------------------------
// exportToDocx — בדיקת-עשן (לא-זורק · מחזיר Blob) — מודל-עשיר
// ---------------------------------------------------------------------------

describe('exportToDocx — smoke', () => {
  it('מחזיר Blob על קלט-מלא', async () => {
    const { exportToDocx } = await import('@/features/final-project/export/export-docx');
    const blob = await exportToDocx(cover, site, [
      row(),
      row({
        id: 'b',
        riskBefore: { severity: 1, probability: 1 },
        riskAfter: { severity: 1, probability: 1 },
      }),
    ]);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('לא-זורק על קלט-ריק (null,null,[])', async () => {
    const { exportToDocx } = await import('@/features/final-project/export/export-docx');
    await expect(exportToDocx(null, null, [])).resolves.toBeInstanceOf(Blob);
  });
});

// ---------------------------------------------------------------------------
// exportToPdf — בדיקת-שגיאה (אלמנט-חסר)
// ---------------------------------------------------------------------------

describe('exportToPdf — אלמנט-חסר', () => {
  it('זורק כשאין אלמנט עם ה-id ב-DOM', async () => {
    vi.spyOn(document, 'getElementById').mockReturnValue(null);
    const { exportToPdf } = await import('@/features/final-project/export/export-pdf');
    await expect(exportToPdf('no-such-id')).rejects.toThrow(/לא נמצא/);
    vi.restoreAllMocks();
  });
});

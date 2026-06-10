/**
 * tests/unit/final-project/export.test.ts — ייצוא המסמך-המוגש (סוכן-D · בלוק חוזה-משותף).
 *
 * מתמקד במבנה-הביניים הטהור (buildProjectDocument) — coverLines · siteSummary · jsaTable
 * (כולל riskLevel/riskBand פר-שורה). + בדיקת-עשן ל-exportToDocx (לא-זורק על קלט-ריק/מלא).
 * exportToPdf תלוי-DOM/canvas → לא נבדק כאן (נכוסה ב-e2e).
 */
import { describe, expect, it, vi } from 'vitest';
import {
  buildProjectDocument,
  JSA_HEADERS,
} from '@/features/final-project/export/project-document';
import { riskLevel, riskBand } from '@/features/final-project/types';
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
    id: 'r1',
    hazard: 'מגע עם חלקים-נעים',
    scenario: 'יד נכנסת לאזור-העבודה של המכונה',
    existingControls: 'מגן-מכונה הנדסי',
    severity: 4,
    probability: 3,
    addedControls: 'נוהל-נעילה (LOTO)',
    owner: 'מנהל-עבודה',
    due: '2026-07-01',
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
// buildProjectDocument — טבלת-JSA (riskLevel + riskBand פר-שורה)
// ---------------------------------------------------------------------------

describe('buildProjectDocument — jsaTable', () => {
  it('headers = 10 עמודות עבריות בסדר-קבוע', () => {
    const doc = buildProjectDocument(cover, site, []);
    expect(doc.jsaTable.headers).toEqual([...JSA_HEADERS]);
    expect(doc.jsaTable.headers).toHaveLength(10);
    expect(doc.jsaTable.headers[0]).toBe('מס׳');
    expect(doc.jsaTable.headers[6]).toBe('רמת-סיכון');
  });

  it('riskScore פר-שורה = riskLevel(severity,probability)', () => {
    const doc = buildProjectDocument(cover, site, [row({ severity: 4, probability: 3 })]);
    expect(doc.jsaTable.rows).toHaveLength(1);
    expect(doc.jsaTable.rows[0]!.riskScore).toBe(riskLevel(4, 3)); // 12
    expect(doc.jsaTable.rows[0]!.riskScore).toBe(12);
  });

  it('band פר-שורה תואם riskBand(score)', () => {
    const green = buildProjectDocument(cover, site, [row({ severity: 1, probability: 2 })]); // 2
    const yellow = buildProjectDocument(cover, site, [row({ severity: 2, probability: 3 })]); // 6
    const red = buildProjectDocument(cover, site, [row({ severity: 4, probability: 4 })]); // 16

    expect(green.jsaTable.rows[0]!.band).toBe('green');
    expect(green.jsaTable.rows[0]!.band).toBe(riskBand(2));
    expect(yellow.jsaTable.rows[0]!.band).toBe('yellow');
    expect(yellow.jsaTable.rows[0]!.band).toBe(riskBand(6));
    expect(red.jsaTable.rows[0]!.band).toBe('red');
    expect(red.jsaTable.rows[0]!.band).toBe(riskBand(16));
  });

  it('תא רמת-הסיכון (index 6) משלב ציון + תווית-רצועה בעברית', () => {
    const doc = buildProjectDocument(cover, site, [row({ severity: 4, probability: 4 })]); // 16 → אדום
    const cells = doc.jsaTable.rows[0]!.cells;
    expect(cells).toHaveLength(10);
    expect(cells[0]).toBe('1'); // מספר-שורה
    expect(cells[6]).toContain('16');
    expect(cells[6]).toContain('אדום');
  });

  it('תאי-חומרה/סבירות תואמים את הקלט', () => {
    const doc = buildProjectDocument(cover, site, [row({ severity: 3, probability: 2 })]);
    const cells = doc.jsaTable.rows[0]!.cells;
    expect(cells[4]).toBe('3'); // חומרה
    expect(cells[5]).toBe('2'); // סבירות
  });

  it('שדות-ריקים בשורה → placeholder "—"', () => {
    const doc = buildProjectDocument(cover, site, [
      row({ existingControls: '', addedControls: '', owner: '', due: '' }),
    ]);
    const cells = doc.jsaTable.rows[0]!.cells;
    expect(cells[3]).toBe('—'); // בקרות-קיימות
    expect(cells[7]).toBe('—'); // בקרות-נוספות
    expect(cells[8]).toBe('—'); // אחראי
    expect(cells[9]).toBe('—'); // מועד
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
    expect(doc.jsaTable.headers).toHaveLength(10);
  });
});

// ---------------------------------------------------------------------------
// exportToDocx — בדיקת-עשן (לא-זורק · מחזיר Blob)
// ---------------------------------------------------------------------------

describe('exportToDocx — smoke', () => {
  it('מחזיר Blob על קלט-מלא', async () => {
    const { exportToDocx } = await import('@/features/final-project/export/export-docx');
    const blob = await exportToDocx(cover, site, [
      row(),
      row({ id: 'b', severity: 1, probability: 1 }),
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

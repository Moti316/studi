/**
 * src/features/final-project/export/export-docx.ts — ייצוא פרויקט-הגמר ל-Word (.docx).
 *
 * משתמש בספריית `docx` (v9) לבניית מסמך-Word נאמן-RTL:
 *   עמוד-פתיחה (כותרת + 7 שדות) → 6 פרקים רשמיים (PROJECT_CHAPTERS) → page-break בין-פרקים.
 *
 * 6 הפרקים הרשמיים (משרד-העבודה · פורמט 19.10.2025):
 *   1. אודות החברה        2. אודות הפרויקט    3. מבנה ארגוני
 *   4. תהליכי-עבודה       5. טבלת-JSA        6. ניתוח סיכונים
 *
 * אם doc.narrative קיים — מרנדר פרקים 1,2,3,4,6 כנרטיב (כותרת + פסקאות).
 * אם narrative חסר — מדלג על הפרקים-הנרטיביים (תאימות-לאחור).
 * פרק 5 = הטבלה תמיד.
 *
 * RTL: כל פסקה rightToLeft + bidirectional · המסמך bidi · יישור-start (ימין).
 * הצבע פר-שורה מבוסס riskBand מתוך מבנה-הביניים (project-document.ts) — מקור-אמת-יחיד.
 *
 * מחזיר Blob (Packer.toBlob) — ה-UI אחראי על triggerDownload.
 *
 * @see ./project-document.ts — buildProjectDocument · PROJECT_CHAPTERS (מבנה-הביניים)
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  VerticalAlign,
  PageBreak,
} from 'docx';
import type { CoverInfo, SiteInfo, JsaRow } from '../types';
import {
  buildProjectDocument,
  RISK_LEVEL_COLUMN_INDICES,
  PROJECT_CHAPTERS,
} from './project-document';
import type { JsaTableRow, JsaTableHeader } from './project-document';
import type { ProjectNarrative } from '../narrative';

// ---------------------------------------------------------------------------
// קבועי-עיצוב
// ---------------------------------------------------------------------------

/** צבעי-רקע-תא פר רצועת-סיכון (hex ללא #). תואם מקרא-המשרד. */
const BAND_FILL: Record<'green' | 'yellow' | 'red', string> = {
  green: 'D9F2E0', // ירוק-בהיר
  yellow: 'FCF3D0', // צהוב-בהיר
  red: 'F8D7DA', // אדום-בהיר
};

/** רקע-כותרת-טבלה (כחול-StudiBuilder בהיר). */
const HEADER_FILL = 'E8EEF7';

/** גבול-תא דק אחיד. */
const THIN_BORDER = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: 'BFC8D6',
} as const;

const CELL_BORDERS = {
  top: THIN_BORDER,
  bottom: THIN_BORDER,
  left: THIN_BORDER,
  right: THIN_BORDER,
} as const;

// ---------------------------------------------------------------------------
// עזרים — פסקאות RTL
// ---------------------------------------------------------------------------

/** פסקת-RTL בסיסית עם טקסט (bidi + יישור-ימין). */
function rtlParagraph(
  text: string,
  opts: {
    bold?: boolean;
    size?: number;
    heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
  } = {},
): Paragraph {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    heading: opts.heading,
    children: [
      new TextRun({
        text,
        rightToLeft: true,
        bold: opts.bold ?? false,
        size: opts.size, // half-points
      }),
    ],
  });
}

/** תא-טבלה RTL עם טקסט + רקע-אופציונלי. */
function rtlCell(text: string, opts: { fill?: string; bold?: boolean } = {}): TableCell {
  return new TableCell({
    borders: CELL_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.fill ? { fill: opts.fill, color: 'auto' } : undefined,
    children: [
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: text.length > 0 ? text : '—',
            rightToLeft: true,
            bold: opts.bold ?? false,
            size: 18, // 9pt — צפיפות-טבלה
          }),
        ],
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// כותרת-הטבלה הרשמית (JsaTableHeader — מעל שורת-הכותרות)
// ---------------------------------------------------------------------------

/**
 * buildTableHeaderBlock — מרנדר את JsaTableHeader כסדרת פסקאות RTL.
 *
 * פורמט: "תווית: ערך" פר-שדה · 5 שדות · name-clean (factory/workplace/workPosition/preparedBy/approvedBy).
 * מוצג מעל buildJsaTable (לפני שורת-כותרות-העמודות) — בהתאם לפורמט-המשרד.
 */
function buildTableHeaderBlock(header: JsaTableHeader): Paragraph[] {
  return [
    rtlParagraph(`מפעל / שם-הפרויקט: ${header.factory}`, { size: 20 }),
    rtlParagraph(`מקום-עבודה: ${header.workplace}`, { size: 20 }),
    rtlParagraph(`עמדה / שלב-עבודה: ${header.workPosition}`, { size: 20 }),
    rtlParagraph(`הוכן ע"י: ${header.preparedBy}`, { size: 20 }),
    rtlParagraph(`אושר ע"י: ${header.approvedBy}`, { size: 20 }),
  ];
}

// ---------------------------------------------------------------------------
// בניית-הטבלה
// ---------------------------------------------------------------------------

function buildJsaTable(headers: string[], rows: JsaTableRow[]): Table {
  // שורת-כותרת
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => rtlCell(h, { fill: HEADER_FILL, bold: true })),
  });

  // שורות-נתונים (רקע פר-רצועת-סיכון)
  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.cells.map((cell, ci) => {
          // עמודה [8] = רמת-סיכון בשלב-זה → bandBefore
          // עמודה [14] = רמת-סיכון לאחר-יישום → bandAfter
          if (ci === RISK_LEVEL_COLUMN_INDICES[0]) {
            return rtlCell(cell, { fill: BAND_FILL[row.bandBefore], bold: true });
          }
          if (ci === RISK_LEVEL_COLUMN_INDICES[1]) {
            return rtlCell(cell, { fill: BAND_FILL[row.bandAfter], bold: true });
          }
          return rtlCell(cell);
        }),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    // RTL: ה-visualRightToLeft הופך את סדר-העמודות לימין-לשמאל
    visuallyRightToLeft: true,
    rows: [headerRow, ...dataRows],
  });
}

// ---------------------------------------------------------------------------
// עזרים — page-break + בניית-פרק-נרטיבי
// ---------------------------------------------------------------------------

/** פסקת-page-break (מפריד בין-פרקים). */
function pageBreakParagraph(): Paragraph {
  return new Paragraph({
    children: [new PageBreak()],
  });
}

/**
 * buildNarrativeChapter — מרנדר פרק-נרטיבי (1,2,3,4,6) כרשימת-פסקאות RTL.
 *
 * כותרת (HEADING_1) + פסקאות (split על "\n" · שורות-ריקות → שורת-ריווח).
 * name-clean מובטח ע"י המחולל (SYSTEM_NARRATIVE / buildDeterministicNarrative).
 */
function buildNarrativeChapter(title: string, prose: string): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [
    rtlParagraph(title, { heading: HeadingLevel.HEADING_1, bold: true, size: 28 }),
  ];
  for (const line of prose.split('\n')) {
    if (line.trim().length === 0) {
      result.push(new Paragraph({ text: '' }));
    } else {
      result.push(rtlParagraph(line, { size: 22 }));
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// exportToDocx — נקודת-הכניסה
// ---------------------------------------------------------------------------

/**
 * exportToDocx — בונה מסמך-Word שלם ומחזיר Blob.
 *
 * מבנה: כותרת-ראשית + עמוד-פתיחה → page-break → 6 פרקים רשמיים (PROJECT_CHAPTERS).
 * פרקים 1,2,3,4,6 = נרטיב (אם doc.narrative קיים · כותרת + פסקאות).
 * פרק 5 = טבלת-JSA (תמיד).
 * page-break בין כל פרק לפרק (→ 12-18 עמ').
 * אם narrative חסר — מדלג על פרקים-נרטיביים (תאימות-לאחור).
 *
 * @param cover    עמוד-הפתיחה (PII · client-side · null = ריק → "—").
 * @param site     פרופיל-האתר (null = "טרם הוזן").
 * @param rows     שורות-ה-JSA (יתכן ריק → טבלה עם כותרת בלבד).
 * @param narrative פרקים-נרטיביים מ-generate-narrative.action.ts (אופציונלי).
 * @returns        Promise<Blob> — קובץ-Word מוכן-להורדה.
 */
export async function exportToDocx(
  cover: CoverInfo | null,
  site: SiteInfo | null,
  rows: JsaRow[],
  narrative?: ProjectNarrative,
): Promise<Blob> {
  const doc = buildProjectDocument(cover, site, rows, narrative);

  const children: (Paragraph | Table)[] = [
    // ── כותרת-ראשית + עמוד-פתיחה ──
    rtlParagraph(doc.title, { heading: HeadingLevel.TITLE, bold: true, size: 36 }),
    new Paragraph({ text: '' }),
    rtlParagraph('עמוד פתיחה', { heading: HeadingLevel.HEADING_1, bold: true, size: 28 }),
    ...doc.coverLines.map((line) => rtlParagraph(line, { size: 22 })),
  ];

  // ── 6 פרקים רשמיים (PROJECT_CHAPTERS) · page-break לפני כל-פרק ──
  for (const chapter of PROJECT_CHAPTERS) {
    children.push(pageBreakParagraph());

    if (chapter.key === 'jsaTable') {
      // פרק 5 — טבלת-JSA (תמיד)
      children.push(
        rtlParagraph(chapter.title, { heading: HeadingLevel.HEADING_1, bold: true, size: 28 }),
      );
      children.push(...buildTableHeaderBlock(doc.jsaTable.tableHeader));
      children.push(new Paragraph({ text: '' }));
      children.push(buildJsaTable(doc.jsaTable.headers, doc.jsaTable.rows));
    } else {
      // פרק נרטיבי (1,2,3,4,6) — רק אם narrative קיים
      if (doc.narrative) {
        // key מוגבל ל-keyof ProjectNarrative (לא 'jsaTable') כאן
        const narrativeKey = chapter.key as keyof ProjectNarrative;
        const prose = doc.narrative[narrativeKey];
        if (typeof prose === 'string') {
          children.push(...buildNarrativeChapter(chapter.title, prose));
        }
      }
      // אם narrative חסר — מדלג (תאימות-לאחור)
    }
  }

  const document = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(document);
}

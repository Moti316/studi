'use client';

/**
 * ExportButtons.tsx — כפתורי-הורדת המסמך-המוגש (PDF / Word) בשלב-המשוב.
 *
 * שני כפתורים:
 *   ⬇️ PDF  → exportToPdf(printableId) (צילום-DOM נאמן-RTL).
 *   ⬇️ Word → exportToDocx(cover, site, rows) (מסמך-נערך).
 *
 * שניהם → triggerDownload(blob, filename) (יצירת anchor זמני + revokeObjectURL).
 *
 * הקומפוננטה כוללת **אזור-הדפסה נסתר** (id=printableId) המרנדר את עמוד-הפתיחה + סיכום-האתר +
 * טבלת-ה-JSA — כך ה-PDF נאמן-מבנה ללא-תלות בפריסת-המשוב הגלויה. (absolute off-screen, לא display:none,
 * כי html2canvas צריך אלמנט-מרונדר.)
 *
 * נתונים מה-store: selectCover / selectSite / selectJsaRows.
 * RTL native · data-testid על interactive · design-tokens (quiz-*).
 *
 * @see ../export/export-pdf.ts · ../export/export-docx.ts · ../export/project-document.ts
 */

import { useId, useState, useCallback } from 'react';
import { useCapstoneStore, selectCover, selectSite, selectJsaRows } from '../store';
import { buildProjectDocument } from '../export/project-document';
import { exportToPdf } from '../export/export-pdf';
import { exportToDocx } from '../export/export-docx';

// ---------------------------------------------------------------------------
// triggerDownload — anchor זמני + ניקוי-URL
// ---------------------------------------------------------------------------

/** מוריד Blob כקובץ בשם-נתון (client-side · anchor זמני). */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // שחרור-זיכרון אחרי שהדפדפן התחיל את ההורדה.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// ---------------------------------------------------------------------------
// אזור-ההדפסה הנסתר (מקור-ה-PDF)
// ---------------------------------------------------------------------------

/** רנדר אזור-ההדפסה (off-screen) — נצרך ע"י html2canvas. */
function PrintableArea({ printableId }: { printableId: string }) {
  const cover = useCapstoneStore(selectCover);
  const site = useCapstoneStore(selectSite);
  const rows = useCapstoneStore(selectJsaRows);

  const doc = buildProjectDocument(cover, site, rows);

  // רקע-תא רמת-סיכון פר-רצועה (תואם export-docx).
  const bandCls: Record<'green' | 'yellow' | 'red', string> = {
    green: 'bg-quiz-success-bg',
    yellow: 'bg-accent-50',
    red: 'bg-quiz-error-bg',
  };

  return (
    <div
      // off-screen אך מרונדר (html2canvas דורש layout אמיתי · לא display:none).
      style={{ position: 'absolute', insetInlineStart: '-9999px', top: 0, width: '794px' }}
      aria-hidden="true"
    >
      <div
        id={printableId}
        dir="rtl"
        data-testid="capstone-printable"
        className="bg-white p-8 font-hebrew text-quiz-text-primary"
      >
        <h1 className="mb-6 text-2xl font-extrabold">{doc.title}</h1>

        {/* עמוד-פתיחה */}
        <h2 className="mb-2 text-lg font-bold">עמוד-פתיחה</h2>
        <ul className="mb-6 flex flex-col gap-1 text-sm">
          {doc.coverLines.map((line, i) => (
            <li key={`cover-${i}`}>{line}</li>
          ))}
        </ul>

        {/* סיכום-אתר */}
        <h2 className="mb-2 text-lg font-bold">פרופיל-האתר</h2>
        <p className="mb-6 text-sm leading-relaxed">{doc.siteSummary}</p>

        {/* טבלת-JSA */}
        <h2 className="mb-2 text-lg font-bold">טבלת ניתוח-סיכונים (JSA)</h2>

        {/* כותרת-הטבלה הרשמית (מפעל / מקום-עבודה / עמדה / הוכן-ע"י / אושר-ע"י) */}
        <dl
          dir="rtl"
          className="mb-3 grid grid-cols-2 gap-x-6 gap-y-1 rounded border border-quiz-border bg-accent-50 px-3 py-2 text-[11px]"
        >
          <div className="flex gap-1">
            <dt className="font-bold">שם-מפעל / פרויקט:</dt>
            <dd>{doc.jsaTable.tableHeader.factory}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-bold">מקום-עבודה:</dt>
            <dd>{doc.jsaTable.tableHeader.workplace}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-bold">עמדה / שלב-עבודה:</dt>
            <dd>{doc.jsaTable.tableHeader.workPosition}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-bold">הוכן-ע"י:</dt>
            <dd>{doc.jsaTable.tableHeader.preparedBy}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-bold">אושר-ע"י:</dt>
            <dd>{doc.jsaTable.tableHeader.approvedBy}</dd>
          </div>
        </dl>

        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-accent-50">
              {doc.jsaTable.headers.map((h, i) => (
                <th key={`h-${i}`} className="border border-quiz-border px-1.5 py-1 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {doc.jsaTable.rows.map((row) => (
              <tr key={`row-${row.index}`}>
                {row.cells.map((cell, ci) => (
                  <td
                    key={`c-${row.index}-${ci}`}
                    className={`border border-quiz-border px-1.5 py-1 align-top ${
                      ci === 8
                        ? `font-bold ${bandCls[row.bandBefore]}`
                        : ci === 14
                          ? `font-bold ${bandCls[row.bandAfter]}`
                          : ''
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            {doc.jsaTable.rows.length === 0 && (
              <tr>
                <td
                  colSpan={doc.jsaTable.headers.length}
                  className="border border-quiz-border px-1.5 py-3 text-center text-quiz-text-secondary"
                >
                  טרם נוספו שורות-JSA.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ExportButtons — הקומפוננטה הראשית
// ---------------------------------------------------------------------------

export interface ExportButtonsProps {
  /** שם-בסיס לקובץ-ההורדה (ללא-סיומת). ברירת-מחדל: "פרויקט-גמר". */
  baseFilename?: string;
}

type Busy = 'pdf' | 'word' | null;

/**
 * ExportButtons — אזור-הורדה (PDF + Word) לשלב-המשוב.
 * קורא נתונים מה-store ומרנדר אזור-הדפסה-נסתר כמקור ל-PDF.
 */
export function ExportButtons({ baseFilename = 'פרויקט-גמר' }: ExportButtonsProps) {
  const cover = useCapstoneStore(selectCover);
  const site = useCapstoneStore(selectSite);
  const rows = useCapstoneStore(selectJsaRows);

  const rawId = useId();
  // useId מחזיר מזהה עם ':' שאינו-חוקי ל-getElementById/CSS — מנקים.
  const printableId = `capstone-printable-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePdf = useCallback(async () => {
    setBusy('pdf');
    setError(null);
    try {
      const blob = await exportToPdf(printableId);
      triggerDownload(blob, `${baseFilename}.pdf`);
    } catch (err) {
      console.error('[ExportButtons] PDF export failed:', err);
      setError('יצירת ה-PDF נכשלה. נסה שוב.');
    } finally {
      setBusy(null);
    }
  }, [printableId, baseFilename]);

  const handleWord = useCallback(async () => {
    setBusy('word');
    setError(null);
    try {
      const blob = await exportToDocx(cover, site, rows);
      triggerDownload(blob, `${baseFilename}.docx`);
    } catch (err) {
      console.error('[ExportButtons] Word export failed:', err);
      setError('יצירת ה-Word נכשלה. נסה שוב.');
    } finally {
      setBusy(null);
    }
  }, [cover, site, rows, baseFilename]);

  return (
    <div
      dir="rtl"
      data-testid="export-buttons"
      className="flex flex-col gap-3 rounded-card border border-quiz-border bg-quiz-bg px-4 py-4 font-hebrew"
    >
      <div className="flex flex-col gap-0.5 text-start">
        <p className="text-sm font-bold text-quiz-text-primary">הורד את הפרויקט להגשה</p>
        <p className="text-xs text-quiz-text-secondary">
          PDF נאמן-תצוגה (להגשה) · Word נערך (לתיקונים אחרונים)
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {/* PDF */}
        <button
          type="button"
          data-testid="export-pdf-btn"
          onClick={() => void handlePdf()}
          disabled={busy !== null}
          className="flex flex-1 select-none items-center justify-center gap-2 rounded-pill bg-quiz-primary-active px-5 py-3 text-sm font-bold text-white shadow-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span aria-hidden="true">⬇️</span>
          {busy === 'pdf' ? 'מייצא PDF…' : 'הורד PDF'}
        </button>

        {/* Word */}
        <button
          type="button"
          data-testid="export-word-btn"
          onClick={() => void handleWord()}
          disabled={busy !== null}
          className="flex flex-1 select-none items-center justify-center gap-2 rounded-pill border border-quiz-primary-active bg-white px-5 py-3 text-sm font-bold text-quiz-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quiz-primary-active disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span aria-hidden="true">⬇️</span>
          {busy === 'word' ? 'מייצא Word…' : 'הורד Word'}
        </button>
      </div>

      {error && (
        <p role="alert" data-testid="export-error" className="text-xs font-semibold text-error">
          {error}
        </p>
      )}

      {/* אזור-הדפסה נסתר — מקור-ה-PDF */}
      <PrintableArea printableId={printableId} />
    </div>
  );
}

/**
 * src/features/final-project/export/export-pdf.ts — ייצוא פרויקט-הגמר ל-PDF (image-based).
 *
 * גישה: צילום-DOM נאמן-RTL.
 *   1. `html2canvas` מצלם את אלמנט-ה-DOM (id="capstone-printable") → canvas.
 *   2. `jspdf` מטמיע את התמונה ב-A4, מחלק לעמודים-מרובים אם התוכן ארוך.
 *   3. מחזיר Blob.
 *
 * למה image-based ולא טקסט? עברית-RTL + מטריצת-צבעים מורכבים נשמרים פיקסל-מדויק
 * (jspdf-text לא תומך טוב ב-bidi). ה-Word (export-docx.ts) הוא המסלול הטקסטואלי-הנערך.
 *
 * תלוי-DOM → רץ client-side בלבד (נקרא מ-ExportButtons · 'use client').
 *
 * @see ./export-docx.ts — מסלול-Word מקביל (נערך)
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// A4 במ"מ (portrait)
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
/** שוליים סביב-התמונה במ"מ (סימטרי). */
const PAGE_MARGIN_MM = 8;

/**
 * exportToPdf — מצלם אלמנט-DOM ומחזיר PDF כ-Blob.
 *
 * @param elementId מזהה-ה-DOM של אזור-ההדפסה (לדוגמה: "capstone-printable").
 * @returns         Promise<Blob> — קובץ-PDF מוכן-להורדה.
 * @throws          Error אם האלמנט לא-נמצא ב-DOM.
 */
export async function exportToPdf(elementId: string): Promise<Blob> {
  const element = typeof document !== 'undefined' ? document.getElementById(elementId) : null;
  if (!element) {
    throw new Error(`exportToPdf: אלמנט "#${elementId}" לא נמצא ב-DOM.`);
  }

  // צילום ב-scale גבוה לחדות-טקסט; רקע-לבן מפורש (אחרת שקוף → שחור ב-PDF).
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // רוחב-התמונה הזמין (אחרי שוליים), שמירה על יחס-הממדים.
  const usableWidth = A4_WIDTH_MM - PAGE_MARGIN_MM * 2;
  const imgHeightMm = (canvas.height * usableWidth) / canvas.width;

  const imgData = canvas.toDataURL('image/png');
  const usablePageHeight = A4_HEIGHT_MM - PAGE_MARGIN_MM * 2;

  if (imgHeightMm <= usablePageHeight) {
    // עמוד-יחיד
    pdf.addImage(imgData, 'PNG', PAGE_MARGIN_MM, PAGE_MARGIN_MM, usableWidth, imgHeightMm);
  } else {
    // multi-page: מזיזים את ה-Y של אותה תמונה כלפי-מעלה לכל עמוד.
    let heightLeft = imgHeightMm;
    let position = PAGE_MARGIN_MM;

    pdf.addImage(imgData, 'PNG', PAGE_MARGIN_MM, position, usableWidth, imgHeightMm);
    heightLeft -= usablePageHeight;

    while (heightLeft > 0) {
      pdf.addPage();
      position = PAGE_MARGIN_MM - (imgHeightMm - heightLeft);
      pdf.addImage(imgData, 'PNG', PAGE_MARGIN_MM, position, usableWidth, imgHeightMm);
      heightLeft -= usablePageHeight;
    }
  }

  return pdf.output('blob');
}

/**
 * render-bold.tsx — מרנדר Markdown-bold קל-משקל (**...**) כ-<strong>.
 *
 * מנוע-התרחישים (map-scenario.ts) מייצר את ה-`solution` כ-Markdown עם 4 כותרות
 * מודגשות: `**פעולה מיידית בשטח:**\n...\n\n**שימוש במדרג-הבקרות:**\n...` וכו'.
 * הרכיב הציג את המחרוזת כ-`whitespace-pre-line` בלבד → הכוכביות הוצגו כטקסט-גולמי
 * (פידבק-מוטי · צילום 2026-06-08). הפונקציה הזו הופכת כל קטע `**...**` ל-<strong>
 * ושומרת את שאר הטקסט כפי-שהוא (שורות-חדשות מטופלות ע"י whitespace-pre-line בקונטיינר).
 *
 * טהור · בר-בדיקה · ללא תלות חיצונית (לא נדרש react-markdown).
 */
import { Fragment, type ReactNode } from 'react';

/** רגקס לקטע-מודגש: `**טקסט**` (לא-חמדני · לא חוצה כוכביות). */
const BOLD_RE = /\*\*(.+?)\*\*/g;

/**
 * ממיר טקסט עם סימוני-`**bold**` למערך React-nodes: קטעים-רגילים כ-Fragment,
 * קטעים-מודגשים כ-<strong>. שאר התחביר (שורות-חדשות) נשמר כפי-שהוא.
 *
 * @param text מחרוזת-מקור (עשויה להכיל `**...**`).
 * @returns מערך nodes לרינדור בתוך קונטיינר עם `whitespace-pre-line`.
 */
export function renderBold(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  // reset lastIndex כי הרגקס גלובלי וחוצה-קריאות
  BOLD_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = BOLD_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>);
    }
    nodes.push(
      <strong key={key++} className="font-bold">
        {match[1]}
      </strong>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return nodes;
}

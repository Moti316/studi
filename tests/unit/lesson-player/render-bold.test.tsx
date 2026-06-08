/**
 * render-bold.test.tsx — מאמת את renderBold (Markdown-bold קל-משקל).
 * רגרסיה לפידבק-מוטי: הכותרות **...** הוצגו כטקסט-גולמי (כוכביות נראות).
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderBold } from '@/features/lesson-player/components/render-bold';

describe('renderBold', () => {
  it('עוטף קטע **bold** ב-<strong> ללא כוכביות', () => {
    render(<p data-testid="p">{renderBold('**כותרת:**')}</p>);
    const strong = screen.getByText('כותרת:');
    expect(strong.tagName).toBe('STRONG');
    // הכוכביות לא מופיעות בטקסט המוצג
    expect(screen.getByTestId('p').textContent).toBe('כותרת:');
  });

  it('משמר טקסט-רגיל סביב הקטע-המודגש', () => {
    render(<p data-testid="p">{renderBold('לפני **מודגש** אחרי')}</p>);
    expect(screen.getByTestId('p').textContent).toBe('לפני מודגש אחרי');
    expect(screen.getByText('מודגש').tagName).toBe('STRONG');
  });

  it('מטפל בכמה קטעים-מודגשים (מבנה 4-החלקים)', () => {
    const solution =
      '**פעולה מיידית בשטח:**\nעצור.\n\n**שימוש במדרג-הבקרות:**\nסילוק→הנדסי→מנהלי→צמ״א.';
    render(<p data-testid="p">{renderBold(solution)}</p>);
    const strongs = screen.getAllByText(/:$/);
    expect(strongs.filter((el) => el.tagName === 'STRONG').length).toBe(2);
    // אין כוכביות בטקסט הסופי
    expect(screen.getByTestId('p').textContent).not.toContain('**');
  });

  it('מחזיר את הטקסט כפי-שהוא כשאין סימוני-bold', () => {
    render(<p data-testid="p">{renderBold('טקסט פשוט ללא הדגשה')}</p>);
    expect(screen.getByTestId('p').textContent).toBe('טקסט פשוט ללא הדגשה');
    expect(document.querySelector('strong')).toBeNull();
  });

  it('מחרוזת-ריקה → ללא קריסה', () => {
    render(<p data-testid="p">{renderBold('')}</p>);
    expect(screen.getByTestId('p').textContent).toBe('');
  });
});

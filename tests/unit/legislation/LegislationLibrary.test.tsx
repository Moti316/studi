/**
 * LegislationLibrary.test.tsx — רינדור + חיפוש של ספריית-החקיקה.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { LegislationLibrary } from '@/components/legislation/LegislationLibrary';
import type { LegislationChapter } from '@/lib/legislation/catalog';

const CHAPTERS: LegislationChapter[] = [
  {
    dir: '1-irgun-hapikuach',
    num: 1,
    title: 'חוק ארגון הפיקוח על העבודה ותקנותיו',
    items: [
      {
        scopeId: '1.0',
        displayId: '1.0',
        title: 'חוק ארגון הפיקוח על העבודה, תשי"ד-1954',
        year: 1954,
        depth: 'core',
        nevoUrl: 'https://www.nevo.co.il/law_html/law00/74395.htm',
        pdfUrl: 'https://drive.google.com/file/d/abc/view',
        mdPath: 'courses/.../1.0.md',
      },
    ],
  },
  {
    dir: '2-pkudat-habetihut',
    num: 2,
    title: 'פקודת הבטיחות בעבודה ותקנותיה',
    items: [
      {
        scopeId: '2.1',
        displayId: '2.1',
        title: 'תקנות הבטיחות בעבודה (עבודה בגובה), תשס"ז-2007',
        year: 2007,
        depth: 'framework',
        nevoUrl: 'https://www.nevo.co.il/law_html/law00/74164.htm',
        pdfUrl: 'https://drive.google.com/file/d/xyz/view',
        mdPath: 'courses/.../2.1.md',
      },
    ],
  },
];

describe('LegislationLibrary', () => {
  it('מציג את כל המדפים (כותרות) + ספירה; פריטים מקופלים כברירת-מחדל', () => {
    render(<LegislationLibrary chapters={CHAPTERS} total={2} />);
    expect(screen.getByText('חוק ארגון הפיקוח על העבודה ותקנותיו')).toBeInTheDocument();
    expect(screen.getByText('פקודת הבטיחות בעבודה ותקנותיה')).toBeInTheDocument();
    expect(screen.getByText(/2 נוסחים · 2 מדפים/)).toBeInTheDocument();
    // מקופל → פריט-הנוסח אינו מרונדר עד פתיחת-המדף.
    expect(screen.queryByTestId('legislation-item-2.1')).not.toBeInTheDocument();
  });

  it('פתיחת-מדף חושפת פריט עם קישור-נבו וקישור-PDF חיצוניים', () => {
    render(<LegislationLibrary chapters={CHAPTERS} total={2} />);
    fireEvent.click(screen.getByTestId('chapter-2')); // פתיחת מדף-2
    const row = screen.getByTestId('legislation-item-2.1');
    const nevo = within(row).getByRole('link', { name: /נבו/ });
    expect(nevo).toHaveAttribute('href', 'https://www.nevo.co.il/law_html/law00/74164.htm');
    expect(nevo).toHaveAttribute('target', '_blank');
    expect(nevo).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(within(row).getByRole('link', { name: /PDF/ })).toBeInTheDocument();
  });

  it('חיפוש לפי כותרת מסנן פריטים', () => {
    render(<LegislationLibrary chapters={CHAPTERS} total={2} />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'חיפוש חוק או תקנה' }), {
      target: { value: 'גובה' },
    });
    expect(screen.getByTestId('legislation-item-2.1')).toBeInTheDocument();
    expect(screen.queryByTestId('legislation-item-1.0')).not.toBeInTheDocument();
    expect(screen.getByText(/1 תוצאות מתוך 2/)).toBeInTheDocument();
  });

  it('חיפוש לפי מספר-scope', () => {
    render(<LegislationLibrary chapters={CHAPTERS} total={2} />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'חיפוש חוק או תקנה' }), {
      target: { value: '1.0' },
    });
    expect(screen.getByTestId('legislation-item-1.0')).toBeInTheDocument();
    expect(screen.queryByTestId('legislation-item-2.1')).not.toBeInTheDocument();
  });

  it('חיפוש ללא-תוצאות מציג empty-state', () => {
    render(<LegislationLibrary chapters={CHAPTERS} total={2} />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'חיפוש חוק או תקנה' }), {
      target: { value: 'זזזזז' },
    });
    expect(screen.getByText(/לא נמצאו נוסחים/)).toBeInTheDocument();
  });
});

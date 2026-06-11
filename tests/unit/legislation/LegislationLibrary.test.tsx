/**
 * LegislationLibrary.test.tsx — רינדור + שתי-תצוגות (נושא|חוק) + חיפוש של ספריית-החקיקה.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { LegislationLibrary } from '@/components/legislation/LegislationLibrary';
import type { LegislationChapter, LegislationTopicShelf } from '@/lib/legislation/catalog';

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

/** מדפי-נושא תואמים (אותם 2 פריטים מקובצים-לפי-יחידה). */
const TOPIC_SHELVES: LegislationTopicShelf[] = [
  {
    id: 'argun',
    title: 'ארגון הפיקוח וניהול הבטיחות',
    blurb: 'ממונה בטיחות · תכנית-ניהול',
    icon: 'ClipboardCheck',
    practiceHref: '/lesson/argun',
    items: [CHAPTERS[0]!.items[0]!],
  },
  {
    id: 'gova',
    title: 'עבודה בגובה, בנייה ותכנון',
    blurb: 'עבודה-בגובה · עבודות-בנייה',
    icon: 'HardHat',
    practiceHref: '/lesson/gova',
    items: [CHAPTERS[1]!.items[0]!],
  },
];

function renderLib() {
  return render(<LegislationLibrary chapters={CHAPTERS} topicShelves={TOPIC_SHELVES} total={2} />);
}

describe('LegislationLibrary — מפת-נושאים (ברירת-מחדל)', () => {
  it('מציג מדפי-יחידות-לימוד כברירת-מחדל; פריטים מקופלים', () => {
    renderLib();
    expect(screen.getByText('ארגון הפיקוח וניהול הבטיחות')).toBeInTheDocument();
    expect(screen.getByText('עבודה בגובה, בנייה ותכנון')).toBeInTheDocument();
    expect(screen.getByText(/2 נוסחים מאורגנים לפי 2 יחידות-לימוד/)).toBeInTheDocument();
    expect(screen.queryByTestId('legislation-item-2.1')).not.toBeInTheDocument();
  });

  it('פתיחת-מדף-נושא חושפת כפתור "תרגל יחידה זו" + פריטים', () => {
    renderLib();
    fireEvent.click(screen.getByTestId('topic-shelf-gova'));
    expect(screen.getByTestId('legislation-item-2.1')).toBeInTheDocument();
    const practice = screen.getByTestId('practice-t-gova');
    expect(practice).toHaveAttribute('href', '/lesson/gova');
    expect(practice).toHaveTextContent('תרגל יחידה זו');
  });

  it('מעבר לתצוגת "לפי חוק" מציג את משפחות-החוק (התצוגה-הישנה נשמרת)', () => {
    renderLib();
    fireEvent.click(screen.getByTestId('view-legal'));
    expect(screen.getByText('פקודת הבטיחות בעבודה ותקנותיה')).toBeInTheDocument();
    expect(screen.getByText(/2 מדפים/)).toBeInTheDocument();
    // ולחזרה:
    fireEvent.click(screen.getByTestId('view-topic'));
    expect(screen.getByText(/יחידות-לימוד/)).toBeInTheDocument();
  });
});

describe('LegislationLibrary — תצוגת-חוק + קישורים + חיפוש', () => {
  it('פתיחת-מדף-חוק חושפת פריט עם קישור-נבו וקישור-PDF חיצוניים', () => {
    renderLib();
    fireEvent.click(screen.getByTestId('view-legal'));
    fireEvent.click(screen.getByTestId('chapter-2'));
    const row = screen.getByTestId('legislation-item-2.1');
    const nevo = within(row).getByRole('link', { name: /נבו/ });
    expect(nevo).toHaveAttribute('href', 'https://www.nevo.co.il/law_html/law00/74164.htm');
    expect(nevo).toHaveAttribute('target', '_blank');
    expect(nevo).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(within(row).getByRole('link', { name: /PDF/ })).toBeInTheDocument();
  });

  it('חיפוש לפי כותרת מסנן פריטים (בתצוגת-נושא)', () => {
    renderLib();
    fireEvent.change(screen.getByRole('searchbox', { name: 'חיפוש חוק או תקנה' }), {
      target: { value: 'גובה' },
    });
    expect(screen.getByTestId('legislation-item-2.1')).toBeInTheDocument();
    expect(screen.queryByTestId('legislation-item-1.0')).not.toBeInTheDocument();
    expect(screen.getByText(/1 תוצאות מתוך 2/)).toBeInTheDocument();
  });

  it('חיפוש לפי מספר-scope', () => {
    renderLib();
    fireEvent.change(screen.getByRole('searchbox', { name: 'חיפוש חוק או תקנה' }), {
      target: { value: '1.0' },
    });
    expect(screen.getByTestId('legislation-item-1.0')).toBeInTheDocument();
    expect(screen.queryByTestId('legislation-item-2.1')).not.toBeInTheDocument();
  });

  it('חיפוש ללא-תוצאות מציג empty-state', () => {
    renderLib();
    fireEvent.change(screen.getByRole('searchbox', { name: 'חיפוש חוק או תקנה' }), {
      target: { value: 'זזזזז' },
    });
    expect(screen.getByText(/לא נמצאו נוסחים/)).toBeInTheDocument();
  });
});

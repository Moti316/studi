/**
 * A11yWidget.test.tsx — כפתור-הנגישות-הצף (חיווט הטוגל-המת · 2026-06-11).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { A11yWidget } from '@/components/a11y/A11yWidget';

function clearHtmlClasses() {
  document.documentElement.className = '';
}

beforeEach(() => {
  window.localStorage.clear();
  clearHtmlClasses();
});

describe('A11yWidget', () => {
  it('מרונדר כברירת-מחדל (אין הגדרות) ופותח פאנל בלחיצה', () => {
    render(<A11yWidget />);
    const btn = screen.getByTestId('a11y-widget-btn');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn);
    expect(screen.getByTestId('a11y-panel')).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('בחירת גודל-טקסט מחילה class על <html> ושומרת ל-localStorage', () => {
    render(<A11yWidget />);
    fireEvent.click(screen.getByTestId('a11y-widget-btn'));
    fireEvent.click(screen.getByTestId('a11y-font-lg'));
    expect(document.documentElement.classList.contains('a11y-font-lg')).toBe(true);
    expect(JSON.parse(window.localStorage.getItem('studi-a11y')!)).toMatchObject({
      fontScale: 'lg',
    });
    // מעבר ל-xl מחליף את ה-class
    fireEvent.click(screen.getByTestId('a11y-font-xl'));
    expect(document.documentElement.classList.contains('a11y-font-lg')).toBe(false);
    expect(document.documentElement.classList.contains('a11y-font-xl')).toBe(true);
  });

  it('ניגודיות + הפחתת-אנימציות מחילות classes', () => {
    render(<A11yWidget />);
    fireEvent.click(screen.getByTestId('a11y-widget-btn'));
    fireEvent.click(screen.getByTestId('a11y-contrast'));
    fireEvent.click(screen.getByTestId('a11y-motion'));
    expect(document.documentElement.classList.contains('a11y-contrast')).toBe(true);
    expect(document.documentElement.classList.contains('a11y-reduce-motion')).toBe(true);
  });

  it('העדפות-שמורות מוחלות ב-mount (persistence)', () => {
    window.localStorage.setItem(
      'studi-a11y',
      JSON.stringify({ fontScale: 'xl', contrast: true, reduceMotion: false }),
    );
    render(<A11yWidget />);
    expect(document.documentElement.classList.contains('a11y-font-xl')).toBe(true);
    expect(document.documentElement.classList.contains('a11y-contrast')).toBe(true);
  });

  it('a11yButtonShow=false בהגדרות → הכפתור לא-מרונדר; event מחיל-מחדש', () => {
    window.localStorage.setItem('studi-settings', JSON.stringify({ a11yButtonShow: false }));
    render(<A11yWidget />);
    expect(screen.queryByTestId('a11y-widget-btn')).not.toBeInTheDocument();

    // הפעלה-מחדש מההגדרות (same-tab event) → מופיע בלי-reload
    window.localStorage.setItem('studi-settings', JSON.stringify({ a11yButtonShow: true }));
    act(() => {
      window.dispatchEvent(new Event('studi-settings-changed'));
    });
    expect(screen.getByTestId('a11y-widget-btn')).toBeInTheDocument();
  });

  it('Escape סוגר את הפאנל', () => {
    render(<A11yWidget />);
    fireEvent.click(screen.getByTestId('a11y-widget-btn'));
    expect(screen.getByTestId('a11y-panel')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('a11y-panel')).not.toBeInTheDocument();
  });
});

/**
 * tests/unit/final-project/cover-step.test.tsx
 *
 * <CoverStep> — עמוד-הפתיחה של פרויקט-הגמר (שלב 0).
 *
 * מכסה:
 *   - render בסיסי + כותרת + הודעת-PII רכה + 7 שדות.
 *   - מילוי-שדות + submit-תקין → setCover נקרא עם CoverInfo מנורמל + onSubmit נקרא.
 *   - ולידציית-חובה: submit-ריק חוסם (setCover/onSubmit לא נקראים) + error-summary מוצג.
 *   - ת.ז. שאינו 9-ספרות = אזהרה-רכה בלבד (לא-חוסם · setCover כן נקרא).
 *   - אתחול מערכי-הסטור הקיימים (selectCover).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CoverStep } from '@/features/final-project/components/CoverStep';
import { useCapstoneStore } from '@/features/final-project/store';
import type { CoverInfo } from '@/features/final-project/types';

const VALID: CoverInfo = {
  companyName: 'חברת-הבנייה בע"מ',
  projectName: 'תכנית ניהול-סיכונים — אתר-בנייה',
  location: 'רמת-גן',
  submitterName: 'ישראל ישראלי',
  idNumber: '123456789',
  date: '2026-06-10',
  mentorName: 'דנה כהן',
};

/** ממלא את כל 7 השדות בערכים-תקינים. */
function fillAll(overrides: Partial<CoverInfo> = {}) {
  const v = { ...VALID, ...overrides };
  (Object.keys(v) as (keyof CoverInfo)[]).forEach((key) => {
    const input = screen.getByTestId(`cover-${key}-input`) as HTMLInputElement;
    fireEvent.change(input, { target: { value: v[key] } });
  });
}

describe('<CoverStep>', () => {
  beforeEach(() => {
    useCapstoneStore.getState().reset();
  });

  it('render: כותרת + 7 שדות + הודעת-PII', () => {
    render(<CoverStep />);

    expect(screen.getByTestId('cover-step')).toBeInTheDocument();
    expect(screen.getByTestId('cover-step-form')).toBeInTheDocument();
    expect(screen.getByTestId('cover-pii-notice')).toBeInTheDocument();

    // הכותרת הספציפית של עמוד-הפתיחה
    expect(screen.getByText(/תכנית ניהול-סיכונים/)).toBeInTheDocument();

    // 7 שדות-קלט
    (Object.keys(VALID) as (keyof CoverInfo)[]).forEach((key) => {
      expect(screen.getByTestId(`cover-${key}-input`)).toBeInTheDocument();
    });
  });

  it('dir=rtl על השורש', () => {
    render(<CoverStep />);
    expect(screen.getByTestId('cover-step')).toHaveAttribute('dir', 'rtl');
  });

  it('הודעת-PII מבהירה שהמידע לא נשלח לבינה', () => {
    render(<CoverStep />);
    expect(screen.getByTestId('cover-pii-notice').textContent).toMatch(
      /לא נשלחים\s+לבינה|לא נשלחים לבינה/,
    );
  });

  it('submit-תקין → setCover נקרא עם CoverInfo מנורמל + onSubmit נקרא', () => {
    const onSubmit = vi.fn();
    const setCoverSpy = vi.spyOn(useCapstoneStore.getState(), 'setCover');

    render(<CoverStep onSubmit={onSubmit} />);
    fillAll();
    fireEvent.submit(screen.getByTestId('cover-step-form'));

    expect(setCoverSpy).toHaveBeenCalledTimes(1);
    expect(setCoverSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: VALID.companyName,
        projectName: VALID.projectName,
        location: VALID.location,
        submitterName: VALID.submitterName,
        idNumber: VALID.idNumber,
        date: VALID.date,
        mentorName: VALID.mentorName,
      }),
    );
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // ה-store עודכן בפועל
    expect(useCapstoneStore.getState().coverInfo).toMatchObject(VALID);
  });

  it('submit מבצע trim על ערכי-הטקסט', () => {
    const setCoverSpy = vi.spyOn(useCapstoneStore.getState(), 'setCover');
    render(<CoverStep />);
    fillAll({ companyName: '  חברה עם רווחים  ' });
    fireEvent.submit(screen.getByTestId('cover-step-form'));

    expect(setCoverSpy).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: 'חברה עם רווחים' }),
    );
  });

  it('ולידציה: submit-ריק חוסם — setCover/onSubmit לא נקראים + error-summary מוצג', () => {
    const onSubmit = vi.fn();
    const setCoverSpy = vi.spyOn(useCapstoneStore.getState(), 'setCover');

    render(<CoverStep onSubmit={onSubmit} />);
    fireEvent.submit(screen.getByTestId('cover-step-form'));

    expect(setCoverSpy).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();

    // error-summary הופך לגלוי (אין class "hidden")
    const summary = screen.getByTestId('cover-step-error-summary');
    expect(summary.className).not.toContain('hidden');

    // שגיאת-שדה ספציפית מופיעה
    expect(screen.getByTestId('cover-companyName-error')).toBeInTheDocument();
  });

  it('ת.ז. שאינו 9-ספרות = אזהרה-רכה בלבד (לא-חוסם)', () => {
    const onSubmit = vi.fn();
    const setCoverSpy = vi.spyOn(useCapstoneStore.getState(), 'setCover');

    render(<CoverStep onSubmit={onSubmit} />);
    fillAll({ idNumber: '12345' }); // 5 ספרות בלבד
    fireEvent.submit(screen.getByTestId('cover-step-form'));

    // נשמר בכל-זאת (אזהרה-רכה לא חוסמת)
    expect(setCoverSpy).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // אזהרה-רכה מוצגת על שדה-ת.ז.
    expect(screen.getByTestId('cover-idNumber-error')).toBeInTheDocument();
  });

  it('ת.ז.-ריק כן חוסם (שדה-חובה)', () => {
    const onSubmit = vi.fn();
    const setCoverSpy = vi.spyOn(useCapstoneStore.getState(), 'setCover');

    render(<CoverStep onSubmit={onSubmit} />);
    fillAll({ idNumber: '' });
    fireEvent.submit(screen.getByTestId('cover-step-form'));

    expect(setCoverSpy).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('cover-idNumber-error')).toBeInTheDocument();
  });

  it('מאתחל מערכי-הסטור הקיימים (coverInfo)', () => {
    useCapstoneStore.getState().setCover(VALID);
    render(<CoverStep />);

    expect((screen.getByTestId('cover-companyName-input') as HTMLInputElement).value).toBe(
      VALID.companyName,
    );
    expect((screen.getByTestId('cover-submitterName-input') as HTMLInputElement).value).toBe(
      VALID.submitterName,
    );
  });
});

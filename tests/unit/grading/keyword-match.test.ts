import { describe, it, expect } from 'vitest';
import { gradeOpenAnswer } from '@/lib/grading/keyword-match';

describe('gradeOpenAnswer (ציון-עצמי שו"ת · היוריסטי)', () => {
  const MODEL = 'מפקח עבודה, ממונה בטיחות וועדת בטיחות אחראים לבירור תאונות עבודה';

  it('נכונה — רוב מילות-המפתח קיימות בתשובת-הלומד', () => {
    const r = gradeOpenAnswer('מפקח עבודה, ממונה בטיחות, וועדת בטיחות', MODEL);
    expect(r.grade).toBe('correct');
    expect(r.matched).toBeGreaterThan(0);
  });

  it('חלקית — חלק ממילות-המפתח', () => {
    const r = gradeOpenAnswer('מפקח עבודה בלבד', MODEL);
    expect(r.grade).toBe('partial');
  });

  it('לא-נכונה — תשובה לא-קשורה', () => {
    expect(gradeOpenAnswer('צבע כחול ומספרים', MODEL).grade).toBe('incorrect');
  });

  it('לא-נכונה — תשובה ריקה', () => {
    expect(gradeOpenAnswer('', MODEL).grade).toBe('incorrect');
  });

  it('עמיד לקידומת-עברית (ה/ו/ב) בהשוואה רכה', () => {
    // "הממונה" מול "ממונה" (קידומת ה) · "ולמפקח" מול "מפקח".
    const r = gradeOpenAnswer('הממונה ולמפקח והוועדה', MODEL);
    expect(r.grade).not.toBe('incorrect');
  });

  it('תשובת-מודל קצרה-מאוד (מילת-מפתח אחת) — התאמה=חלקית-לפחות', () => {
    const r = gradeOpenAnswer('האחראי הוא הממונה', 'הממונה');
    expect(['correct', 'partial']).toContain(r.grade);
  });

  it('מודל ריק מתוכן → partial (אין מה למדוד)', () => {
    expect(gradeOpenAnswer('משהו', 'של על את').grade).toBe('partial');
  });
});

import { describe, it, expect } from 'vitest';
import { parsePdfQaFromText } from '../../../scripts/parsers/parse-pdf-qa';

/** בונה טקסט-שקופית בפורמט שמחלץ pdf-parse (מפריד-עמוד + מרקר-שאלה + מבדק סיכום). */
function slide(n: number, body: string): string {
  return `\n-- ${n} of 5 --\n\n${body}\n`;
}

describe('parsePdfQaFromText', () => {
  it('מחלץ שאלה+תשובה במבנה תקני (שאלה ? · מבדק סיכום · תשובה)', () => {
    const text = slide(1, 'שאלה\t1\t:\nעל מי חלה האחריות?\nמבדק סיכום\nממונה בטיחות\nמפקח עבודה');
    const res = parsePdfQaFromText(text, 'f.pdf');
    expect(res.totalQuestions).toBe(1);
    const q = res.questions[0]!;
    expect(q.type).toBe('open');
    expect(q.question).toBe('על מי חלה האחריות?');
    expect(q.correctAnswerText).toBe('ממונה בטיחות\nמפקח עבודה');
    expect(q.sourceId).toBe('f.pdf#q1');
  });

  it('עמיד לסדר-מעורבב: "מבדק סיכום" אחרי-התשובה (חצייה לפי "?", לא לפי הכותרת)', () => {
    const text = slide(2, 'שאלה\t2\t:\nכמה קבוצות סיכון?\n4 קבוצות\nמבדק סיכום');
    const res = parsePdfQaFromText(text, 'f.pdf');
    expect(res.totalQuestions).toBe(1);
    expect(res.questions[0]!.question).toBe('כמה קבוצות סיכון?');
    expect(res.questions[0]!.correctAnswerText).toBe('4 קבוצות');
  });

  it('מאחד שבירת-שורה אמצע-שאלה לרווח ומנקה רווח-לפני-פיסוק', () => {
    const text = slide(3, 'שאלה\t3\t:\nמדוע העבודה בביטמן חם\nמוגדרת מסוכנת\t?\nכי צריך לחמם');
    const q = parsePdfQaFromText(text, 'f.pdf').questions[0]!;
    expect(q.question).toBe('מדוע העבודה בביטמן חם מוגדרת מסוכנת?');
  });

  it('מדלג על שקופית ללא מרקר-"שאלה" (כותרת/פתיח)', () => {
    const text = slide(1, 'מצגת של PowerPoint\nשאלות חזרה לממוני בטיחות\nמאת: דן כהן');
    expect(parsePdfQaFromText(text, 'f.pdf').totalQuestions).toBe(0);
  });

  it('משחזר שאלת-ציווי ללא "?" לפי מפריד "מבדק סיכום"', () => {
    const text = slide(4, 'שאלה\t4\t:\nפרט את שלושת הגורמים\nמבדק סיכום\nמפקח, ממונה, ועדה');
    const res = parsePdfQaFromText(text, 'f.pdf');
    expect(res.totalQuestions).toBe(1);
    expect(res.questions[0]!.question).toBe('פרט את שלושת הגורמים');
    expect(res.questions[0]!.correctAnswerText).toBe('מפקח, ממונה, ועדה');
  });

  it('עמיד לערבוב-PPT: תשובה שמופיעה *לפני* מרקר-השאלה (מקרה הפיגום)', () => {
    // pdf-parse פולט את 3-הפרמטרים לפני "שאלה", ועיקרון-כללי אחרי "מבדק סיכום".
    const text = slide(
      526,
      'א. שיתאים למטרה.\nב. שלא יתמוטט.\nג. שתימנע נפילה.\nשאלה\t526\t:\nבאיזה אופן יש להתקין פיגום?\nמבדק סיכום\nכל פיגום יותקן כיאות. תקנה 21',
    );
    const q = parsePdfQaFromText(text, 'f.pdf').questions[0]!;
    expect(q.question).toBe('באיזה אופן יש להתקין פיגום?');
    // התשובה כוללת גם את 3-הפרמטרים (לפני-המרקר) וגם את העיקרון (אחרי-מבדק).
    expect(q.correctAnswerText).toContain('שיתאים למטרה');
    expect(q.correctAnswerText).toContain('שלא יתמוטט');
    expect(q.correctAnswerText).toContain('תקנה 21');
  });

  it('מפצל שקופיות מרובות ומשמיט שורות-רעש (זכויות-יוצרים)', () => {
    const text =
      slide(1, 'שאלה\t1\t:\nשאלה ראשונה?\nמבדק סיכום\nתשובה א\n© כל הזכויות שמורות') +
      slide(2, 'שאלה\t2\t:\nשאלה שנייה?\nמבדק סיכום\nתשובה ב');
    const res = parsePdfQaFromText(text, 'f.pdf');
    expect(res.totalQuestions).toBe(2);
    expect(res.questions[0]!.correctAnswerText).toBe('תשובה א'); // שורת-© הושמטה
    expect(res.questions[1]!.question).toBe('שאלה שנייה?');
  });
});

/**
 * tests/unit/lesson-player/tutor-prompt.test.ts — מורה-AI · לוגיקה-טהורה (בלוק-4).
 */
import { describe, it, expect } from 'vitest';
import {
  SYSTEM_TUTOR,
  buildTutorPrompt,
  tutorFallback,
} from '@/features/lesson-player/tutor-prompt';

describe('buildTutorPrompt', () => {
  it('כולל שאלה · תשובה · נושא · שאלת-הלומד', () => {
    const p = buildTutorPrompt({
      questionPrompt: 'מהו מדרג-הבקרות?',
      correctAnswer: 'חיסול → החלפה → הנדסי → מנהלי → צמ"א',
      topic: 'ניהול-סיכונים',
      userQuestion: 'למה צמ"א אחרון?',
    });
    expect(p).toContain('מהו מדרג-הבקרות?');
    expect(p).toContain('חיסול → החלפה');
    expect(p).toContain('ניהול-סיכונים');
    expect(p).toContain('למה צמ"א אחרון?');
  });

  it('מדלג על שדות-אופציונליים ריקים (תשובה/נושא)', () => {
    const p = buildTutorPrompt({ questionPrompt: 'שאלה', userQuestion: 'שאלת-לומד' });
    expect(p).not.toContain('## התשובה-הנכונה');
    expect(p).not.toContain('## נושא');
    expect(p).toContain('## מה הלומד שואל');
  });
});

describe('SYSTEM_TUTOR — עיגון', () => {
  it('מורה לצטט-תקנה רק-כשבטוח (מונע הזיות) + עברית + תמציתי', () => {
    expect(SYSTEM_TUTOR).toContain('רק אם אתה בטוח');
    expect(SYSTEM_TUTOR).toContain('עברית בלבד');
    expect(SYSTEM_TUTOR).toMatch(/מדרג-הבקרות/);
  });
});

describe('tutorFallback', () => {
  it('source=fallback + כולל את התשובה-הנכונה אם סופקה', () => {
    const r = tutorFallback({
      questionPrompt: 'q',
      correctAnswer: 'התשובה היא חיסול',
      userQuestion: 'u',
    });
    expect(r.source).toBe('fallback');
    expect(r.answer).toContain('התשובה היא חיסול');
  });

  it('ללא תשובה-נכונה → הודעת-ברירת-מחדל (לא קורס/ריק)', () => {
    const r = tutorFallback({ questionPrompt: 'q', userQuestion: 'u' });
    expect(r.source).toBe('fallback');
    expect(r.answer.length).toBeGreaterThan(10);
  });
});

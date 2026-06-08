/**
 * tests/unit/notebooklm/compact-prompt.test.ts
 *
 * בדיקות ל-buildCompactScenarioPrompt:
 * - אורך < 1000 תווים (מתחת למגבלת-NotebookLM)
 * - מכיל "JSON" (הוראה לפורמט)
 * - מכיל שמות-השדות הנדרשים
 * - title/background/task מוטמעים בפלט
 */

import { describe, it, expect } from 'vitest';
import { buildCompactScenarioPrompt } from '@/lib/notebooklm/compact-prompt';

const BASE_INPUT = {
  title: 'הגלגלים המעופפים (עבודה בגובה)',
  background: 'שני עובדים עמדו על פיגום נייד בגובה 4 מטרים. עובד שלישי דחף את הפיגום.',
  task: 'נתח את האירוע: פעולה מיידית, גיבוי חוקי, הנדסה וניהול.',
};

describe('buildCompactScenarioPrompt', () => {
  it('מחזיר מחרוזת', () => {
    const result = buildCompactScenarioPrompt(BASE_INPUT);
    expect(typeof result).toBe('string');
  });

  it('אורך < 1000 תווים', () => {
    const result = buildCompactScenarioPrompt(BASE_INPUT);
    expect(result.length).toBeLessThan(1000);
  });

  it('מכיל "JSON" (הוראת-פורמט)', () => {
    const result = buildCompactScenarioPrompt(BASE_INPUT);
    expect(result).toContain('JSON');
  });

  it('מכיל שם-שדה immediateAction', () => {
    const result = buildCompactScenarioPrompt(BASE_INPUT);
    expect(result).toContain('immediateAction');
  });

  it('מכיל שם-שדה legalBackup', () => {
    const result = buildCompactScenarioPrompt(BASE_INPUT);
    expect(result).toContain('legalBackup');
  });

  it('מכיל שם-שדה legalCitation', () => {
    const result = buildCompactScenarioPrompt(BASE_INPUT);
    expect(result).toContain('legalCitation');
  });

  it('מכיל שם-שדה engineeringMgmt', () => {
    const result = buildCompactScenarioPrompt(BASE_INPUT);
    expect(result).toContain('engineeringMgmt');
  });

  it('מטמיע את ה-title', () => {
    const result = buildCompactScenarioPrompt(BASE_INPUT);
    expect(result).toContain(BASE_INPUT.title);
  });

  it('מטמיע את ה-background', () => {
    const result = buildCompactScenarioPrompt(BASE_INPUT);
    expect(result).toContain(BASE_INPUT.background);
  });

  it('מטמיע את ה-task', () => {
    const result = buildCompactScenarioPrompt(BASE_INPUT);
    expect(result).toContain(BASE_INPUT.task);
  });

  it('תרחיש ריאלי (LOTO) — אורך < 1000', () => {
    const lotoInput = {
      title: 'האנרגיה הבלתי-נראית (LOTO מורחב)',
      background:
        'איש אחזקה נכנס לתקן מכונת אריזה. הוא ביצע נעילת LOTO על מפסק החשמל הראשי. זרוע פניאומטית השתחררה בפתאומיות.',
      task: 'נתח את האירוע: פעולה מיידית, גיבוי חוקי, הנדסה וניהול.',
    };
    const result = buildCompactScenarioPrompt(lotoInput);
    expect(result.length).toBeLessThan(1000);
  });
});

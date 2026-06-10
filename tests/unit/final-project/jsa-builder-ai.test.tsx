/**
 * tests/unit/final-project/jsa-builder-ai.test.tsx
 *
 * סוכן-C — כפתור "✨ הכן עבורי טיוטה (AI)" + הודעת-אתר-אמיתי ב-<JsaBuilder>.
 *
 * מכוסה:
 *   - real-site-notice מוצג תמיד (דרישת-משרד-העבודה).
 *   - generate-draft-btn מושבת כשאין-site (צריך פרופיל-אתר תחילה).
 *   - עם-site → לחיצה על generate-draft-btn קוראת ל-generateJsaDraftAction
 *     ו-loadRows טוען את השורות (השורות מופיעות בטבלה).
 *   - מצב-loading (generate-loading) בזמן ההפקה, ואז נעלם.
 *   - כשל-action → הודעה-עדינה (generate-error) ולא-זורק.
 *
 * ה-server-action ('../generate-jsa.action') ממוקסם — אין-רשת · אין-Claude.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import type { JsaRow, SiteInfo } from '@/features/final-project/types';
import { useCapstoneStore } from '@/features/final-project/store';

// ─── mock של ה-server-action (חייב לפני import של הרכיב) ─────────────────────
// ה-mock-fn מוחזק במשתנה כדי שכל test ישלוט בהתנהגות.
const generateJsaDraftActionMock = vi.fn();

vi.mock('@/features/final-project/generate-jsa.action', () => ({
  generateJsaDraftAction: (site: SiteInfo) => generateJsaDraftActionMock(site),
}));

// import אחרי ה-mock (ה-mock מורם ע"י vitest ממילא, אבל סדר זה ברור).
import { JsaBuilder } from '@/features/final-project/components/JsaBuilder';

// ─── עזרים ──────────────────────────────────────────────────────────────────

const SITE: SiteInfo = {
  name: 'מחסן-לוגיסטי',
  sector: 'logistics',
  workerCount: 25,
  mainHazards: ['מלגזות', 'מדפים-גבוהים'],
};

function draftRows(): JsaRow[] {
  return [
    {
      id: 'ai-1',
      hazard: 'תנועת-מלגזות באזור-הולכי-רגל',
      scenario: 'פגיעת-מלגזה בעובד במעבר',
      existingControls: 'שילוט',
      severity: 4,
      probability: 3,
      addedControls: 'הפרדת-מסלולים פיזית',
      owner: 'מנהל-מחסן',
      due: '',
    },
    {
      id: 'ai-2',
      hazard: 'נפילת-מטען ממדף-גבוה',
      scenario: 'מטען לא-מקובע נופל על עובד',
      existingControls: 'הדרכה',
      severity: 3,
      probability: 2,
      addedControls: 'מעצורי-מדף + עיגון',
      owner: 'ממונה-בטיחות',
      due: '',
    },
  ];
}

beforeEach(() => {
  useCapstoneStore.getState().reset();
  generateJsaDraftActionMock.mockReset();
});

// ─── הודעת-אתר-אמיתי ─────────────────────────────────────────────────────────

describe('<JsaBuilder> — הודעת-אתר-אמיתי', () => {
  it('מציגה את ה-banner תמיד (גם empty, גם עם-site)', () => {
    render(<JsaBuilder />);
    const notice = screen.getByTestId('real-site-notice');
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent('אמיתי');
    expect(notice).toHaveTextContent('בדוק ותקן כל שורה');
  });
});

// ─── כפתור-הפקה: disabled בלי-site ──────────────────────────────────────────

describe('<JsaBuilder> — generate-draft-btn (gating)', () => {
  it('מושבת כשאין-פרופיל-אתר', () => {
    render(<JsaBuilder />);
    expect(screen.getByTestId('generate-draft-btn')).toBeDisabled();
  });

  it('פעיל כשיש-פרופיל-אתר', () => {
    useCapstoneStore.getState().setSite(SITE);
    render(<JsaBuilder />);
    expect(screen.getByTestId('generate-draft-btn')).toBeEnabled();
  });

  it('לחיצה בלי-site אינה קוראת ל-action', () => {
    render(<JsaBuilder />);
    fireEvent.click(screen.getByTestId('generate-draft-btn'));
    expect(generateJsaDraftActionMock).not.toHaveBeenCalled();
  });
});

// ─── הפקה מוצלחת → loadRows ─────────────────────────────────────────────────

describe('<JsaBuilder> — הפקת-טיוטה מוצלחת', () => {
  it('לחיצה → action נקרא עם-site → השורות נטענות (loadRows)', async () => {
    generateJsaDraftActionMock.mockResolvedValue(draftRows());
    useCapstoneStore.getState().setSite(SITE);

    render(<JsaBuilder />);

    // לפני-הלחיצה: empty-state.
    expect(screen.getByTestId('jsa-empty-state')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('generate-draft-btn'));
    });

    expect(generateJsaDraftActionMock).toHaveBeenCalledTimes(1);
    expect(generateJsaDraftActionMock).toHaveBeenCalledWith(SITE);

    // השורות שהוחזרו נכנסו ל-store ומופיעות בטבלה.
    await waitFor(() => {
      expect(useCapstoneStore.getState().jsaRows).toHaveLength(2);
    });
    expect(screen.getByTestId('jsa-rows-list')).toBeInTheDocument();
    expect(screen.getByTestId('jsa-row-0')).toHaveTextContent('תנועת-מלגזות');
    expect(screen.getByTestId('jsa-row-1')).toHaveTextContent('נפילת-מטען');
    // empty-state נעלם.
    expect(screen.queryByTestId('jsa-empty-state')).not.toBeInTheDocument();
  });

  it('מצב-loading מוצג בזמן-ההפקה ונעלם בסיום', async () => {
    let resolveAction: (rows: JsaRow[]) => void = () => {};
    generateJsaDraftActionMock.mockReturnValue(
      new Promise<JsaRow[]>((resolve) => {
        resolveAction = resolve;
      }),
    );
    useCapstoneStore.getState().setSite(SITE);

    render(<JsaBuilder />);
    fireEvent.click(screen.getByTestId('generate-draft-btn'));

    // בזמן-הריצה: אינדיקטור-loading + הכפתור disabled.
    await waitFor(() => {
      expect(screen.getByTestId('generate-loading')).toBeInTheDocument();
    });
    expect(screen.getByTestId('generate-draft-btn')).toBeDisabled();

    // סיום ההפקה.
    await act(async () => {
      resolveAction(draftRows());
    });

    await waitFor(() => {
      expect(screen.queryByTestId('generate-loading')).not.toBeInTheDocument();
    });
    expect(useCapstoneStore.getState().jsaRows).toHaveLength(2);
  });
});

// ─── טיפול-שגיאה רך ──────────────────────────────────────────────────────────

describe('<JsaBuilder> — כשל-הפקה (לא-זורק)', () => {
  it('action נכשל → הודעה-עדינה (generate-error) · אין-קריסה · אין-שורות', async () => {
    generateJsaDraftActionMock.mockRejectedValue(new Error('boom'));
    useCapstoneStore.getState().setSite(SITE);

    render(<JsaBuilder />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('generate-draft-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('generate-error')).toBeInTheDocument();
    });
    expect(useCapstoneStore.getState().jsaRows).toHaveLength(0);
    // הכפתור חוזר להיות פעיל (אפשר לנסות-שוב).
    expect(screen.getByTestId('generate-draft-btn')).toBeEnabled();
  });
});

/**
 * src/features/final-project/store.ts — Zustand store לפרויקט-הגמר (Capstone).
 *
 * מנהל את מצב-ה-wizard בצד-הלקוח בלבד.
 * אין DB, אין fetch-persistence — state מקומי לכל session.
 *
 * דפוסים:
 *   - selector קטן לכל חתיכת-state (מונע re-render מיותר).
 *   - actions מוגדרים בתוך create() — לא outside.
 *   - zustand v5 (immer-free; mutations ישירות ב-set callback).
 *
 * ראה: src/features/final-project/types.ts לחוזה-הטיפוסים.
 */

import { create } from 'zustand';
import type { CapstoneStep, SiteInfo, JsaRow, CapstoneFeedback } from './types';

// ---------------------------------------------------------------------------
// ממשק ה-store
// ---------------------------------------------------------------------------

export interface CapstoneState {
  // ---- state ----

  /** השלב-הנוכחי ב-wizard. */
  step: CapstoneStep;

  /** פרופיל-האתר שהמשתמש מילא (null = טרם-מולא). */
  site: SiteInfo | null;

  /**
   * שורות-ה-JSA שנאספו עד-כה (סדר-כניסה = סדר-תצוגה).
   * מערך-ריק = אין שורות-עדיין (empty state).
   */
  jsaRows: JsaRow[];

  /** תוצאת-המשוב (null = טרם-הופק). */
  feedback: CapstoneFeedback | null;

  // ---- actions ----

  /**
   * מעבר-לשלב.
   * אין ולידציה כאן — ה-UI אחראי למנוע מעבר-קדימה בלי-תנאים.
   */
  setStep: (step: CapstoneStep) => void;

  /**
   * שמירת-פרופיל-האתר.
   * מאפס את jsaRows ואת feedback כי שינוי-אתר = התחלה-מחדש.
   */
  setSite: (site: SiteInfo) => void;

  /**
   * הוספת-שורת-JSA חדשה לסוף הרשימה.
   * @param row שורה-מלאה (ה-id כבר נוצר ע"י הקורא).
   */
  addRow: (row: JsaRow) => void;

  /**
   * עדכון-שורה קיימת על-פי id.
   * שורה-שלא-נמצאה — נשמטת בשקט (idempotent).
   * @param id  id השורה לעדכון.
   * @param patch שדות-חלקיים לאיחוד (Partial<JsaRow>).
   */
  updateRow: (id: string, patch: Partial<Omit<JsaRow, 'id'>>) => void;

  /**
   * הסרת-שורה לפי id.
   * שורה-שלא-קיימת — ללא שגיאה (idempotent).
   */
  removeRow: (id: string) => void;

  /**
   * שמירת-תוצאת-המשוב (אחרי קריאת-שרת).
   * @param feedback אובייקט-מלא או null (איפוס).
   */
  setFeedback: (feedback: CapstoneFeedback | null) => void;

  /**
   * איפוס-מלא של ה-store (פרויקט-חדש / "התחל-מחדש").
   * מחזיר לשלב-ראשוני ומנקה כל נתון.
   */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// ערכי-ברירת-מחדל
// ---------------------------------------------------------------------------

const INITIAL_STEP: CapstoneStep = 'site';

const initialState: Pick<CapstoneState, 'step' | 'site' | 'jsaRows' | 'feedback'> = {
  step: INITIAL_STEP,
  site: null,
  jsaRows: [],
  feedback: null,
};

// ---------------------------------------------------------------------------
// יצירת-ה-store
// ---------------------------------------------------------------------------

/**
 * useCapstoneStore — ה-hook הראשי לפרויקט-הגמר.
 *
 * שימוש מומלץ (מניעת re-renders):
 * ```tsx
 * const step     = useCapstoneStore(s => s.step);
 * const setStep  = useCapstoneStore(s => s.setStep);
 * const jsaRows  = useCapstoneStore(s => s.jsaRows);
 * ```
 *
 * שימוש להרמת-כל-state (כדאי רק ב-components קטנים):
 * ```tsx
 * const { step, jsaRows, addRow } = useCapstoneStore();
 * ```
 */
export const useCapstoneStore = create<CapstoneState>()((set) => ({
  // ---- state ----
  ...initialState,

  // ---- actions ----

  setStep: (step) => set({ step }),

  setSite: (site) =>
    set({
      site,
      // שינוי-אתר מאפס את כל הנתונים שהמשתמש אסף
      jsaRows: [],
      feedback: null,
    }),

  addRow: (row) =>
    set((state) => ({
      jsaRows: [...state.jsaRows, row],
      // עריכת-JSA מבטלת משוב-קודם — אחרת הלומד רואה הערכה ל-JSA-ישן.
      feedback: null,
    })),

  updateRow: (id, patch) =>
    set((state) => ({
      jsaRows: state.jsaRows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
      // עריכת-JSA מבטלת משוב-קודם — אחרת הלומד רואה הערכה ל-JSA-ישן.
      feedback: null,
    })),

  removeRow: (id) =>
    set((state) => ({
      jsaRows: state.jsaRows.filter((row) => row.id !== id),
      // עריכת-JSA מבטלת משוב-קודם — אחרת הלומד רואה הערכה ל-JSA-ישן.
      feedback: null,
    })),

  setFeedback: (feedback) => set({ feedback }),

  reset: () => set({ ...initialState }),
}));

// ---------------------------------------------------------------------------
// selector helpers (ייצוא נוח לשימוש-חיצוני)
// ---------------------------------------------------------------------------

/** מחזיר רק את הסלקטורים הנפוצים — שנצרך כ-hook ל-component ספציפי. */
export const selectStep = (s: CapstoneState) => s.step;
export const selectSite = (s: CapstoneState) => s.site;
export const selectJsaRows = (s: CapstoneState) => s.jsaRows;
export const selectFeedback = (s: CapstoneState) => s.feedback;

/** מספר-שורות (להצגת-progress ב-wizard header). */
export const selectRowCount = (s: CapstoneState) => s.jsaRows.length;

'use client';

/**
 * <A11yWidget> — כפתור-נגישות-צף + פאנל הגדרות-מהירות (חיווט הטוגל-המת · 2026-06-11).
 *
 * עד-כה הטוגל "הצג כפתור נגישות" בהגדרות נשמר-בלבד — הרכיב הזה לא היה קיים. כעת:
 *   - גודל-טקסט (רגיל/גדול/ענק) → class על <html> (a11y-font-lg/xl · rem-scale).
 *   - ניגודיות-מוגברת → a11y-contrast (CSS-vars חזקים · globals.css).
 *   - הפחתת-אנימציות → a11y-reduce-motion (כמו prefers-reduced-motion).
 * העדפות ב-localStorage (`studi-a11y`) · מוחלות ב-mount.
 *
 * **נראוּת לפי הגדרות-המשתמש** (`studi-settings`): a11yButtonShow (כיבוי-מלא) ·
 * a11yButtonMobile (תצוגה במובייל). מאזין ל-`studi-settings-changed` (SettingsForm)
 * ול-`storage` (cross-tab) → שינוי-טוגל מחיל מיד, בלי reload.
 *
 * מקדם תאימות תקן-5568/WCAG (ציות · docs/compliance). RTL · a11y-של-עצמו (dialog ·
 * Escape · aria-expanded · aria-pressed).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Accessibility, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// העדפות + החלה על <html>
// ---------------------------------------------------------------------------

type FontScale = 'normal' | 'lg' | 'xl';

interface A11yPrefs {
  fontScale: FontScale;
  contrast: boolean;
  reduceMotion: boolean;
}

const PREFS_KEY = 'studi-a11y';
const SETTINGS_KEY = 'studi-settings';
/** event ש-SettingsForm משגר אחרי-שמירה (same-tab sync). */
export const SETTINGS_CHANGED_EVENT = 'studi-settings-changed';

const DEFAULT_PREFS: A11yPrefs = { fontScale: 'normal', contrast: false, reduceMotion: false };

function loadPrefs(): A11yPrefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<A11yPrefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** מחיל את-ההעדפות כ-classes על <html> (מקור-האמת הוויזואלי). */
function applyPrefs(p: A11yPrefs): void {
  const el = document.documentElement;
  el.classList.toggle('a11y-font-lg', p.fontScale === 'lg');
  el.classList.toggle('a11y-font-xl', p.fontScale === 'xl');
  el.classList.toggle('a11y-contrast', p.contrast);
  el.classList.toggle('a11y-reduce-motion', p.reduceMotion);
}

/** קורא את נראוּת-הכפתור מהגדרות-המשתמש (ברירת-מחדל: מוצג · גם-במובייל). */
function loadVisibility(): { show: boolean; mobile: boolean } {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { show: true, mobile: true };
    const s = JSON.parse(raw) as { a11yButtonShow?: boolean; a11yButtonMobile?: boolean };
    return { show: s.a11yButtonShow !== false, mobile: s.a11yButtonMobile !== false };
  } catch {
    return { show: true, mobile: true };
  }
}

// ---------------------------------------------------------------------------
// הרכיב
// ---------------------------------------------------------------------------

const FONT_OPTIONS: { value: FontScale; label: string; aria: string }[] = [
  { value: 'normal', label: 'א', aria: 'גודל-טקסט רגיל' },
  { value: 'lg', label: 'א+', aria: 'טקסט גדול' },
  { value: 'xl', label: 'א++', aria: 'טקסט ענק' },
];

export function A11yWidget() {
  const [mounted, setMounted] = useState(false);
  const [visibility, setVisibility] = useState({ show: true, mobile: true });
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT_PREFS);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // mount: טען+החל העדפות · האזן לשינויי-הגדרות (same-tab event + cross-tab storage).
  useEffect(() => {
    const p = loadPrefs();
    setPrefs(p);
    applyPrefs(p);
    setVisibility(loadVisibility());
    setMounted(true);

    const sync = () => setVisibility(loadVisibility());
    window.addEventListener(SETTINGS_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SETTINGS_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const update = useCallback((patch: Partial<A11yPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      applyPrefs(next);
      try {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        // private-mode — מוחל אך לא-מתמיד.
      }
      return next;
    });
  }, []);

  // Escape סוגר ומחזיר-פוקוס לכפתור.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // SSR / טרם-mount / כבוי-בהגדרות → לא-מרונדר.
  if (!mounted || !visibility.show) return null;

  return (
    <div
      dir="rtl"
      data-testid="a11y-widget"
      // RTL: הכפתור בפינה-השמאלית (end) · מעל ה-BottomNav (bottom-20).
      className={cn(
        'fixed bottom-20 left-4 z-40 flex flex-col items-start gap-2 font-hebrew',
        !visibility.mobile && 'hidden sm:flex',
      )}
    >
      {/* ── פאנל ── */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="הגדרות-נגישות מהירות"
          data-testid="a11y-panel"
          className="flex w-60 flex-col gap-3 rounded-card border border-quiz-border bg-card p-4 shadow-card-hover"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-quiz-text-primary">נגישות</h2>
            <button
              type="button"
              aria-label="סגור הגדרות-נגישות"
              data-testid="a11y-close"
              onClick={() => {
                setOpen(false);
                btnRef.current?.focus();
              }}
              className="rounded-pill p-1 text-quiz-text-secondary hover:text-quiz-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {/* גודל-טקסט */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-quiz-text-secondary">גודל-טקסט</span>
            <div role="group" aria-label="גודל-טקסט" className="flex gap-1.5">
              {FONT_OPTIONS.map((o) => {
                const active = prefs.fontScale === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={active}
                    aria-label={o.aria}
                    data-testid={`a11y-font-${o.value}`}
                    onClick={() => update({ fontScale: o.value })}
                    className={cn(
                      'flex-1 rounded-card border px-2 py-2 text-sm font-extrabold transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
                      active
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-quiz-border bg-quiz-bg text-quiz-text-primary hover:border-primary-500/50',
                    )}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ניגודיות + אנימציות */}
          {(
            [
              {
                key: 'contrast' as const,
                label: 'ניגודיות מוגברת',
                testId: 'a11y-contrast',
                checked: prefs.contrast,
              },
              {
                key: 'reduceMotion' as const,
                label: 'הפחתת אנימציות',
                testId: 'a11y-motion',
                checked: prefs.reduceMotion,
              },
            ] as const
          ).map((row) => (
            <label key={row.key} className="flex cursor-pointer items-center justify-between gap-2">
              <span className="text-sm font-medium text-quiz-text-primary">{row.label}</span>
              <input
                type="checkbox"
                checked={row.checked}
                data-testid={row.testId}
                onChange={(e) => update({ [row.key]: e.target.checked })}
                className="h-4 w-4 accent-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
              />
            </label>
          ))}

          <p className="text-[11px] leading-snug text-quiz-text-secondary">
            ההעדפות נשמרות במכשיר זה. ניתן לכבות את הכפתור במסך-ההגדרות.
          </p>
        </div>
      )}

      {/* ── הכפתור-הצף ── */}
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-label={open ? 'סגור הגדרות-נגישות' : 'פתח הגדרות-נגישות'}
        data-testid="a11y-widget-btn"
        onClick={() => setOpen((o) => !o)}
        className="grid size-12 place-items-center rounded-full bg-gradient-to-bl from-primary-500 to-primary-600 text-white shadow-button transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        <Accessibility className="size-6" aria-hidden="true" />
      </button>
    </div>
  );
}

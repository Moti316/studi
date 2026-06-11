/**
 * src/lib/theme.ts — מנגנון ערכת-נושא (light/dark/system) אמיתי · client-side.
 *
 * עד-כה ה-ThemeSelector היה דקורטיבי ("Phase 9"). כאן מחווטים אותו בפועל:
 *   - applyTheme — מחיל את ה-class `dark` על <html> + שומר ב-localStorage.
 *   - resolveTheme — 'system' → light/dark לפי `prefers-color-scheme`.
 *   - THEME_INIT_SCRIPT — סקריפט-inline ל-<head> המונע flash (מחיל לפני-paint).
 *
 * ה-surfaces (card/quiz-bg/border/text) הם CSS-vars dark-aware ב-globals.css → ה-toggle
 * אמיתי וחל מיידית. persistence client-only (cross-device = user_settings ב-DB · Phase 6/7).
 */

export type ThemePref = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'studi-theme';

/** קורא העדפת-נושא מ-localStorage (ברירת-מחדל 'system'). client-only. */
export function getStoredTheme(): ThemePref {
  if (typeof window === 'undefined') return 'system';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

/** ממיר 'system' ל-light/dark בפועל לפי העדפת-מערכת. */
export function resolveTheme(pref: ThemePref): 'light' | 'dark' {
  if (pref === 'light' || pref === 'dark') return pref;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * מחיל ערכת-נושא: class `dark` על <html> + שמירה ב-localStorage.
 * נקרא מה-ThemeSelector בכל שינוי (ומה-init בטעינה).
 */
export function applyTheme(pref: ThemePref): void {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(pref);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  try {
    window.localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // localStorage חסום (private-mode) — ה-class הוחל; פשוט לא-מתמיד.
  }
}

/**
 * THEME_INIT_SCRIPT — סקריפט-inline ל-<head> (no-flash). מחיל את ה-class לפני-paint
 * לפי localStorage / העדפת-מערכת, כדי שלא יהבהב-לבן בטעינת-עמוד-כהה.
 * מוזרק ב-layout דרך dangerouslySetInnerHTML (קבוע · בלי-קלט-משתמש).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var d=t==='dark'||((t===null||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

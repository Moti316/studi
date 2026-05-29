import { expect, test } from '@playwright/test';

/**
 * Phase 2 — Dashboard skeleton smoke tests ב-mock mode (ללא Supabase env).
 *
 * בסביבת mock: requireAuth מחזיר null → redirect ל-/beta-access?next=<path>.
 * BottomNav מופיע בלוח-הבקרה (ואחיו המוגנים) — ולא על /beta-access.
 */

const PROTECTED_ROUTES = [
  { path: '/dashboard', next: '/dashboard' },
  { path: '/courses', next: '/courses' },
  { path: '/stats', next: '/stats' },
  { path: '/settings', next: '/settings' },
] as const;

// ---------------------------------------------------------------------------
// 1. ניתוב של כל route מוגן → /beta-access ב-mock mode
// ---------------------------------------------------------------------------

test.describe('Phase 2 — protected routes redirect to /beta-access (mock mode)', () => {
  for (const { path, next } of PROTECTED_ROUTES) {
    test(`${path} ללא session → redirect ל-/beta-access?next=${next}`, async ({ page }) => {
      await page.goto(path);

      // requireAuth מבצע redirect; ממתינים ל-URL הסופי.
      await expect(page).toHaveURL(new RegExp(`/beta-access\\?next=${encodeURIComponent(next)}`), {
        timeout: 15_000,
      });
    });
  }
});

// ---------------------------------------------------------------------------
// 2. /beta-access נטען תקין אחרי הרחבות Phase 2
// ---------------------------------------------------------------------------

test.describe('Phase 2 — /beta-access page integrity', () => {
  test('מסך הכניסה נטען עם RTL ושתי דרכי-התחברות', async ({ page }) => {
    await page.goto('/beta-access');

    // dir=rtl — RTL כאזרח-ראשון
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // AuthCard (עטוף Suspense) מורנדר: כפתור Google + שדה אימייל
    await expect(page.getByRole('button', { name: /המשך עם Google/ })).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByLabel('אימייל')).toBeVisible();
    await expect(page.getByRole('button', { name: 'שלח קישור התחברות' })).toBeVisible();
  });

  test('/beta-access עם פרמטר ?next= מקבל את הכותרת הרגילה (flow שלם)', async ({ page }) => {
    // מדמה redirect מ-/dashboard — AuthCard קורא ?next= כדי לנתב אחרי login
    await page.goto('/beta-access?next=%2Fdashboard');

    await expect(page.getByRole('button', { name: /המשך עם Google/ })).toBeVisible({
      timeout: 15_000,
    });

    // AuthCard עדיין מורנדר תקין — ה-next param לא שובר את הדף
    await expect(page.getByLabel('אימייל')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. BottomNav לא מוצג ב-/beta-access
//    BottomNav שייך לזרימת-Dashboard בלבד — /beta-access היא זרימת-Auth
// ---------------------------------------------------------------------------

test.describe('Phase 2 — BottomNav absent from /beta-access', () => {
  test('אין nav[aria-label="ניווט ראשי"] ב-/beta-access', async ({ page }) => {
    await page.goto('/beta-access');

    // המתנה ל-AuthCard כדי לוודא שהדף התייצב לחלוטין (Suspense נפתר)
    await expect(page.getByRole('button', { name: /המשך עם Google/ })).toBeVisible({
      timeout: 15_000,
    });

    // BottomNav לא אמור להיות ב-DOM בכלל
    await expect(page.getByRole('navigation', { name: 'ניווט ראשי' })).not.toBeVisible();
  });

  test('BottomNav גם לא מוצג אחרי redirect מ-route מוגן ל-/beta-access', async ({ page }) => {
    await page.goto('/dashboard'); // → redirect → /beta-access?next=/dashboard

    await expect(page).toHaveURL(/\/beta-access/, { timeout: 15_000 });

    await expect(page.getByRole('button', { name: /המשך עם Google/ })).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByRole('navigation', { name: 'ניווט ראשי' })).not.toBeVisible();
  });
});

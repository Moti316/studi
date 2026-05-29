import { expect, test } from '@playwright/test';

/**
 * Phase 1 — auth flow smoke ב-mock mode (ללא Supabase env).
 * AuthCard עטוף ב-Suspense (useSearchParams) — לכן נחכה לרכיב לפני בדיקות.
 */
test.describe('Phase 1 — Auth flow (/beta-access)', () => {
  test('מסך ההתחברות נטען עם RTL ושתי דרכי-התחברות', async ({ page }) => {
    await page.goto('/beta-access');

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // המתנה לכפתור Google מוודאת ש-Suspense נפתר ו-AuthCard מורנדר
    await expect(page.getByRole('button', { name: /המשך עם Google/ })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByLabel('אימייל')).toBeVisible();
    await expect(page.getByRole('button', { name: 'שלח קישור התחברות' })).toBeVisible();
  });

  test('ולידציית-אימייל בעברית על קלט לא-תקין', async ({ page }) => {
    await page.goto('/beta-access');

    const emailField = page.getByLabel('אימייל');
    await expect(emailField).toBeVisible({ timeout: 15_000 });
    await emailField.fill('not-an-email');
    await page.getByRole('button', { name: 'שלח קישור התחברות' }).click();

    await expect(page.getByRole('alert')).toContainText('כתובת האימייל אינה תקינה');
  });

  test('route מוגן מנתב להתחברות כשאין session', async ({ page }) => {
    // mock mode: middleware no-op, אבל requireAuth ב-RSC מנתב ל-/beta-access
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/beta-access/, { timeout: 15_000 });
  });
});

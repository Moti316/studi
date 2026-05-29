import { expect, test } from '@playwright/test';

test.describe('Phase 1 — Auth flow (/beta-access)', () => {
  test('מסך ההתחברות נטען עם RTL ושתי דרכי-התחברות', async ({ page }) => {
    await page.goto('/beta-access');

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('button', { name: /המשך עם Google/ })).toBeVisible();
    await expect(page.getByLabel('אימייל')).toBeVisible();
    await expect(page.getByRole('button', { name: 'שלח קישור התחברות' })).toBeVisible();
  });

  test('ולידציית-אימייל בעברית על קלט לא-תקין', async ({ page }) => {
    await page.goto('/beta-access');

    await page.getByLabel('אימייל').fill('not-an-email');
    await page.getByRole('button', { name: 'שלח קישור התחברות' }).click();

    await expect(page.getByRole('alert')).toContainText('כתובת האימייל אינה תקינה');
  });

  test('שדה האימייל ממוקם dir=ltr (קריאוּת)', async ({ page }) => {
    await page.goto('/beta-access');
    await expect(page.getByLabel('אימייל')).toHaveAttribute('dir', 'ltr');
  });

  test('route מוגן מנתב להתחברות כשאין session', async ({ page }) => {
    await page.goto('/settings');
    // middleware (mock mode) או requireAuth מנתב ל-/beta-access
    await expect(page).toHaveURL(/\/beta-access/);
  });
});

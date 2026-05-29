import { expect, test } from '@playwright/test';

test.describe('Phase 0 - Foundation sanity', () => {
  test('home page loads with Hebrew RTL', async ({ page }) => {
    await page.goto('/');

    // Page renders
    await expect(page.locator('h1')).toContainText('StudiBuilder');

    // RTL direction is set
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'he');

    // Hebrew copy renders
    await expect(page.getByText('הפלטפורמה שהופכת מסמכים')).toBeVisible();
  });

  test('basic accessibility - landmark + heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
  });
});

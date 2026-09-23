const { test, expect } = require('@playwright/test');

const authFile = 'playwright/.auth/user.json';

test('authenticate', async ({ page }) => {
  await page.goto('/login/');
  await page.fill('input[name="username"]', 'murahariprasannakumar0709@gmail.com');
  await page.fill('input[name="password"]', 'Tony@143');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page).not.toHaveURL(/login/);
  await page.context().storageState({ path: authFile });
});

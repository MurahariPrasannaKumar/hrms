const { test, expect } = require('@playwright/test');

test('login page shows new logo and title, no console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('/login/');
  await expect(page).toHaveTitle(/The Website Makers/);

  const img = page.locator('img[alt="The Website Makers"]');
  await expect(img).toBeVisible();
  const box = await img.boundingBox();
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);

  await page.screenshot({ path: 'screenshots/rebrand-login.png', fullPage: true });
  console.log('Console/page errors:', errors);
  expect(errors.length).toBe(0);
});

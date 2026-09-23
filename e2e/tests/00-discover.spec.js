const { test, expect } = require('@playwright/test');

test('discover nav structure', async ({ page }) => {
  await page.goto('/login/');
  await page.fill('input[name="username"]', 'murahariprasannakumar0709@gmail.com');
  await page.fill('input[name="password"]', 'Tony@143');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle').catch(() => {});
  console.log('POST-LOGIN URL:', page.url());

  const links = await page.$$eval('a[href]', as =>
    as.map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim().replace(/\s+/g, ' ') }))
      .filter(l => l.text || l.href)
  );
  console.log('LINKS_JSON_START');
  console.log(JSON.stringify(links, null, 0));
  console.log('LINKS_JSON_END');

  await page.goto('/settings/general-settings/');
  await page.waitForLoadState('networkidle').catch(() => {});
  const settingsLinks = await page.$$eval('a[href]', as =>
    as.map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim().replace(/\s+/g, ' ') }))
      .filter(l => l.text || l.href)
  );
  console.log('SETTINGS_LINKS_JSON_START');
  console.log(JSON.stringify(settingsLinks, null, 0));
  console.log('SETTINGS_LINKS_JSON_END');
});

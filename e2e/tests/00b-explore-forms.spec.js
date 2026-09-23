const { test } = require('@playwright/test');
test.use({ storageState: 'playwright/.auth/user.json' });

const pagesToInspect = [
  '/leave/type-view/',
];

for (const url of pagesToInspect) {
  test(`inspect ${url}`, async ({ page }) => {
    await page.goto(url);
    await page.waitForTimeout(1000);
    const buttons = await page.$$eval('button', els => els.map(e => e.textContent.trim().replace(/\s+/g,' ')));
    console.log('ALL BUTTONS on', url, JSON.stringify(buttons));
    await page.getByRole('button', { name: 'Create' }).first().click();
    await page.waitForTimeout(1200);
    console.log('URL after click:', page.url());
    await page.screenshot({ path: 'screenshots/_debug_leave_type.png', fullPage: true });
    const modalHtml = await page.evaluate(() => {
      const modals = Array.from(document.querySelectorAll('[id*="odal" i], [class*="odal" i]'));
      return modals.map(m => ({ id: m.id, cls: m.className, visible: m.offsetParent !== null, snippet: m.outerHTML.slice(0,200) }));
    });
    console.log(`MODAL for ${url}:\n`, JSON.stringify(modalHtml, null, 1));
  });
}

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.use({ storageState: 'playwright/.auth/user.json' });

const OUT_DIR = path.join(__dirname, '..', 'screenshots', 'doc');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  { name: 'dashboard-home', url: '/' },
  { name: 'recruitment', url: '/recruitment/dashboard' },
  { name: 'onboarding', url: '/onboarding/onboarding-view/' },
  { name: 'employee', url: '/employee/employee-view/' },
  { name: 'attendance', url: '/attendance/dashboard' },
  { name: 'leave', url: '/leave/leave-dashboard' },
  { name: 'payroll', url: '/payroll/view-payroll-dashboard/' },
  { name: 'pms', url: '/pms/dashboard-view' },
  { name: 'offboarding', url: '/offboarding/dashboard' },
  { name: 'asset', url: '/asset/dashboard/' },
  { name: 'helpdesk', url: '/helpdesk/ticket-view/' },
  { name: 'project', url: '/project/project-view/' },
  { name: 'configuration', url: '/configuration/multiple-approval-condition' },
  { name: 'settings-general', url: '/settings/general-settings/' },
  { name: 'biometric', url: '/settings/enable-biometric-attendance/' },
  { name: 'accessibility', url: '/user-accessibility/' },
  { name: 'geofencing', url: '/attendance/settings/geo-face-config/' },
];

test.describe('Documentation screenshots', () => {
  for (const p of PAGES) {
    test(`doc screenshot :: ${p.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 1600, height: 1000 });
      await page.goto(p.url, { waitUntil: 'domcontentloaded' });
      try {
        await page.waitForLoadState('networkidle', { timeout: 8000 });
      } catch (e) { /* ignore, still take screenshot */ }
      await page.waitForTimeout(1500);
      const shotPath = path.join(OUT_DIR, `${p.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      console.log(`SAVED: ${p.name} -> ${shotPath}`);
    });
  }

  test('doc screenshot :: notifications', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForLoadState('networkidle', { timeout: 8000 });
    } catch (e) { /* ignore */ }
    await page.waitForTimeout(1000);

    // Try common selectors for the notification bell icon
    const candidates = [
      '.oh-navbar__notification-link',
      '#notification-icon',
      '.notification-icon',
      '[data-toggle="notification"]',
      '.oh-notification',
      'a[href*="notification"]',
      '.bi-bell',
      '.fa-bell',
      'i.oh-icon--bell',
      '#bell-icon',
    ];
    let clicked = false;
    for (const sel of candidates) {
      const el = page.locator(sel).first();
      try {
        if (await el.count() > 0 && await el.isVisible({ timeout: 1000 })) {
          await el.click({ timeout: 3000 });
          clicked = true;
          break;
        }
      } catch (e) { /* try next */ }
    }

    if (clicked) {
      await page.waitForTimeout(1200);
      const shotPath = path.join(OUT_DIR, 'notifications.png');
      await page.screenshot({ path: shotPath, fullPage: true });
      console.log(`SAVED: notifications -> ${shotPath}`);
    } else {
      console.log('SKIPPED: notifications - could not locate bell icon with known selectors');
    }
  });
});

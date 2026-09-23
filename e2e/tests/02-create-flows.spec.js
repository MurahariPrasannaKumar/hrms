const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.use({ storageState: 'playwright/.auth/user.json' });

const OUT_DIR = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function collectErrors(page, bucket) {
  page.on('console', (msg) => { if (msg.type() === 'error') bucket.push('console: ' + msg.text()); });
  page.on('pageerror', (err) => bucket.push('pageerror: ' + err.message));
}

test('Create Department (Settings)', async ({ page }) => {
  const errs = [];
  collectErrors(page, errs);
  const name = `E2E Test Department ${Date.now()}`;
  await page.goto('/settings/department-view/');
  await page.getByRole('button', { name: 'Create' }).first().click();
  await page.waitForTimeout(600);
  const modal = page.locator('#objectCreateModal');
  await modal.locator('input[name="department"]').fill(name);
  await modal.locator('button[type="submit"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT_DIR, 'create_department_result.png'), fullPage: true });
  const bodyText = await page.content();
  const found = bodyText.includes(name);
  console.log('Department created & visible on page:', found, 'errors:', JSON.stringify(errs));
  expect(found, `Newly created department "${name}" should appear in the list`).toBeTruthy();
});

test('Create Job Position (Settings)', async ({ page }) => {
  const errs = [];
  collectErrors(page, errs);
  const name = `E2E Test JobPosition ${Date.now()}`;
  await page.goto('/settings/job-position-view/');
  await page.getByRole('button', { name: 'Create' }).first().click();
  await page.waitForTimeout(600);
  const modal = page.locator('#jobPositionModal');
  const deptSelect = modal.locator('select[name="department_id"]');
  if (await deptSelect.count()) {
    const options = await deptSelect.locator('option').allTextContents();
    const validOption = options.find(o => o.trim() && !/---------/.test(o));
    if (validOption) await deptSelect.selectOption({ label: validOption });
  }
  await modal.locator('input[name="job_position"]').fill(name);
  await modal.locator('button[type="submit"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT_DIR, 'create_job_position_result.png'), fullPage: true });
  const bodyText = await page.content();
  const found = bodyText.includes(name);
  console.log('Job position created & visible on page:', found, 'errors:', JSON.stringify(errs));
  expect(found, `Newly created job position "${name}" should appear in the list`).toBeTruthy();
});

test('Create Leave Type (Leave module)', async ({ page }) => {
  const errs = [];
  collectErrors(page, errs);
  const name = `E2E Test LeaveType ${Date.now()}`;
  await page.goto('/leave/type-view/');
  await page.getByRole('button', { name: 'Create' }).first().click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page.locator('input[name="name"]').first()).toBeVisible({ timeout: 8000 });
  await page.locator('input[name="name"]').first().fill(name);
  await page.getByRole('button', { name: 'Create' }).last().click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(OUT_DIR, 'create_leave_type_result.png'), fullPage: true });
  const bodyText = await page.content();
  const found = bodyText.includes(name);
  console.log('Leave type created & visible on page:', found, 'errors:', JSON.stringify(errs));
  expect(found, `Newly created leave type "${name}" should appear in the list`).toBeTruthy();
});

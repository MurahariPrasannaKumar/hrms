const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.use({ storageState: 'playwright/.auth/user.json' });

// module -> list of {name, url}
const MODULES = {
  'Dashboard': [
    { name: 'Home Dashboard', url: '/' },
  ],
  'Recruitment': [
    { name: 'Dashboard', url: '/recruitment/dashboard' },
    { name: 'Pipeline', url: '/recruitment/pipeline/?closed=false' },
    { name: 'Survey Templates', url: '/recruitment/recruitment-survey-question-template-view/?closed=false' },
    { name: 'Candidates', url: '/recruitment/candidate-view/' },
    { name: 'Interview', url: '/recruitment/interview-view/' },
    { name: 'Recruitment', url: '/recruitment/recruitment-view' },
    { name: 'Open Jobs', url: '/recruitment/open-recruitments' },
    { name: 'Stages', url: '/recruitment/stage-view' },
    { name: 'Skill Zone', url: '/recruitment/skill-zone-view/' },
    { name: 'Self Tracking Setting', url: '/recruitment/self-tracking-feature/' },
    { name: 'Reject Reasons', url: '/recruitment/candidate-reject-reasons/' },
    { name: 'Skills', url: '/recruitment/skills-view/' },
    { name: 'LinkedIn Integration', url: '/recruitment/linkedin-integration-setting' },
  ],
  'Onboarding': [
    { name: 'Onboarding view', url: '/onboarding/onboarding-view/' },
    { name: 'Candidates view', url: '/onboarding/candidates-view/' },
  ],
  'Employee': [
    { name: 'Profile', url: '/employee/employee-profile/' },
    { name: 'Employees', url: '/employee/employee-view/' },
    { name: 'Document Requests', url: '/employee/document-request-view/' },
    { name: 'Shift Requests', url: '/employee/shift-request-view/' },
    { name: 'Work Type Requests', url: '/employee/work-type-request-view/' },
    { name: 'Rotating Shift Assign', url: '/employee/rotating-shift-assign/' },
    { name: 'Rotating Work Type Assign', url: '/employee/rotating-work-type-assign/' },
    { name: 'Disciplinary Actions', url: '/employee/disciplinary-actions/' },
    { name: 'Policies', url: '/employee/view-policies/' },
    { name: 'Organization Chart', url: '/employee/organisation-chart/' },
    { name: 'Employee Tags', url: '/employee/employee-tag-view/' },
  ],
  'Attendance': [
    { name: 'Dashboard', url: '/attendance/dashboard' },
    { name: 'Attendances', url: '/attendance/attendance-view/' },
    { name: 'Attendance Requests', url: '/attendance/request-attendance-view/' },
    { name: 'Hour Account', url: '/attendance/attendance-overtime-view/?year=2026' },
    { name: 'Work Records', url: '/attendance/work-records/' },
    { name: 'Attendance Activities', url: '/attendance/attendance-activity-view/' },
    { name: 'Late Come Early Out', url: '/attendance/late-come-early-out-view/' },
    { name: 'My Attendances', url: '/attendance/view-my-attendance/' },
    { name: 'Track Late Come Setting', url: '/attendance/track-late-come-early-out/' },
    { name: 'Attendance Break Point', url: '/attendance/attendance-settings-view/' },
    { name: 'Check In/Check Out', url: '/attendance/check-in-check-out-setting/' },
    { name: 'Grace Time', url: '/attendance/grace-settings-view/' },
    { name: 'IP Restriction', url: '/attendance/allowed-ips/' },
    { name: 'Geo & Face Config', url: '/attendance/settings/geo-face-config/' },
  ],
  'Leave': [
    { name: 'Dashboard', url: '/leave/leave-dashboard' },
    { name: 'My Leave Requests', url: '/leave/user-request-view/' },
    { name: 'Leave Requests', url: '/leave/request-view/' },
    { name: 'Leave Types', url: '/leave/type-view/' },
    { name: 'Assigned Leave', url: '/leave/assign-view/?field=leave_type_id' },
    { name: 'Leave Allocation Request', url: '/leave/leave-allocation-request-view/' },
    { name: 'Restrict Leaves', url: '/leave/restrict-view' },
    { name: 'Past Leave Restrictions', url: '/leave/employee-past-leave-restriction/' },
    { name: 'Compensatory Leave', url: '/leave/compensatory-leave-settings-view/' },
  ],
  'Payroll': [
    { name: 'Dashboard', url: '/payroll/view-payroll-dashboard/' },
    { name: 'Contract', url: '/payroll/view-contract/' },
    { name: 'Allowances', url: '/payroll/view-allowance/' },
    { name: 'Deductions', url: '/payroll/view-deduction/' },
    { name: 'Payslips', url: '/payroll/view-payslip/' },
    { name: 'Loan / Advanced Salary', url: '/payroll/view-loan/' },
    { name: 'Encashments & Reimbursements', url: '/payroll/view-reimbursement/' },
    { name: 'Federal Tax', url: '/payroll/filing-status-view/' },
    { name: 'Payslip Auto Generation', url: '/payroll/auto-payslip-settings-view/' },
  ],
  'PMS (Performance)': [
    { name: 'Dashboard', url: '/pms/dashboard-view' },
    { name: 'Objectives', url: '/pms/objective-list-view/' },
    { name: '360 Feedback', url: '/pms/feedback-view/' },
    { name: 'Meetings', url: '/pms/view-meetings/' },
    { name: 'Key Results', url: '/pms/view-key-result/' },
    { name: 'Employee Bonus Point', url: '/pms/employee-bonus-point' },
    { name: 'Period', url: '/pms/period-view' },
    { name: 'Question Template', url: '/pms/question-template-view/' },
    { name: 'Bonus Point Setting', url: '/pms/bonus-point-setting/' },
  ],
  'Offboarding': [
    { name: 'Dashboard', url: '/offboarding/dashboard' },
    { name: 'Exit Process', url: '/offboarding/offboarding-pipeline' },
  ],
  'Asset': [
    { name: 'Dashboard', url: '/asset/dashboard/' },
    { name: 'Asset View', url: '/asset/asset-category-view/' },
    { name: 'Asset Batches', url: '/asset/asset-batch-view' },
    { name: 'Request and Allocation', url: '/asset/asset-request-allocation-view/' },
    { name: 'Asset History', url: '/asset/asset-history' },
  ],
  'Helpdesk': [
    { name: 'FAQs', url: '/helpdesk/faq-category-view/' },
    { name: 'Tickets', url: '/helpdesk/ticket-view/' },
    { name: 'Department Managers', url: '/helpdesk/department-manager-view/' },
    { name: 'Ticket Type', url: '/helpdesk/ticket-type-view/' },
    { name: 'Helpdesk Tags', url: '/settings/helpdesk-tag-view/' },
  ],
  'Project': [
    { name: 'Dashboard', url: '/project/project-dashboard-view' },
    { name: 'Projects', url: '/project/project-view/' },
    { name: 'Tasks', url: '/project/task-all/' },
    { name: 'Timesheet', url: '/project/view-time-sheet/' },
  ],
  'Configuration': [
    { name: 'Multiple Approvals', url: '/configuration/multiple-approval-condition' },
    { name: 'Mail Templates', url: '/configuration/view-mail-templates/' },
    { name: 'Mail Automations', url: '/configuration/mail-automations' },
    { name: 'Holidays', url: '/configuration/holiday-view' },
    { name: 'Company Leaves', url: '/configuration/company-leave-view' },
  ],
  'Settings / Base': [
    { name: 'General Settings', url: '/settings/general-settings/' },
    { name: 'Employee Permission', url: '/settings/employee-permission-assign/' },
    { name: 'Accessibility Restriction', url: '/user-accessibility/' },
    { name: 'User Group', url: '/settings/user-group-view/' },
    { name: 'Date & Time Format', url: '/settings/date-settings/' },
    { name: 'History Tags', url: '/settings/tag-view/' },
    { name: 'Mail Server', url: '/settings/mail-server-conf/' },
    { name: 'Gdrive Backup', url: '/backup/gdrive/' },
    { name: 'Department', url: '/settings/department-view/' },
    { name: 'Job Positions', url: '/settings/job-position-view/' },
    { name: 'Job Role', url: '/settings/job-role-view/' },
    { name: 'Company', url: '/settings/company-view/' },
    { name: 'Work Type', url: '/settings/work-type-view/' },
    { name: 'Rotating Work Type', url: '/settings/rotating-work-type-view/' },
    { name: 'Employee Shift', url: '/settings/employee-shift-view/' },
    { name: 'Rotating Shift', url: '/settings/rotating-shift-view/' },
    { name: 'Employee Shift Schedule', url: '/settings/employee-shift-schedule-view/' },
    { name: 'Employee Type', url: '/settings/employee-type-view/' },
    { name: 'Disciplinary Action Type', url: '/settings/action-type/' },
  ],
  'Biometric': [
    { name: 'Biometric Attendance', url: '/settings/enable-biometric-attendance/' },
  ],
  'Notifications': [
    { name: 'Notifications page', url: '/notifications/' },
  ],
};

const issues = [];
const OUT_DIR = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function safeName(s) {
  return s.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
}

for (const [moduleName, pages] of Object.entries(MODULES)) {
  test.describe(moduleName, () => {
    for (const p of pages) {
      test(`${moduleName} :: ${p.name} (${p.url})`, async ({ page }) => {
        const consoleErrors = [];
        const pageErrors = [];
        const netErrors = [];

        page.on('console', (msg) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });
        page.on('pageerror', (err) => {
          pageErrors.push(err.message);
        });
        page.on('response', (resp) => {
          const status = resp.status();
          if (status >= 400) {
            netErrors.push(`${status} ${resp.request().method()} ${resp.url()}`);
          }
        });

        let mainStatus = null;
        let bodyText = '';
        let navError = null;
        try {
          const resp = await page.goto(p.url, { waitUntil: 'domcontentloaded' });
          mainStatus = resp ? resp.status() : null;
          await page.waitForTimeout(1200);
          bodyText = await page.content();
        } catch (e) {
          navError = e.message;
        }

        const hasTraceback = /Traceback \(most recent call last\)|<h1>ServerError|OperationalError|django\.core\.exceptions|Internal Server Error|<h1>Not Found<\/h1>/i.test(bodyText);
        const hasDjangoDebug500 = /You're seeing this error because you have DEBUG = True/i.test(bodyText);

        const problems = [];
        if (navError) problems.push(`Navigation error: ${navError}`);
        if (mainStatus && mainStatus >= 400) problems.push(`HTTP ${mainStatus} on main page load`);
        if (hasTraceback || hasDjangoDebug500) problems.push('Django traceback/error page detected in response body');
        if (pageErrors.length) problems.push(`Uncaught JS pageerror(s): ${pageErrors.join(' | ')}`);
        if (consoleErrors.length) problems.push(`Console error(s): ${consoleErrors.slice(0, 5).join(' | ')}`);
        if (netErrors.length) problems.push(`Network 4xx/5xx: ${netErrors.slice(0, 10).join(' | ')}`);

        if (problems.length) {
          const shotPath = path.join(OUT_DIR, `${safeName(moduleName)}__${safeName(p.name)}.png`);
          try {
            await page.screenshot({ path: shotPath, fullPage: true });
          } catch (e) { /* ignore */ }
          issues.push({
            module: moduleName,
            page: p.name,
            url: p.url,
            status: mainStatus,
            problems,
            screenshot: shotPath,
          });
        }

        // Write cumulative issues file after every test so partial runs are captured
        fs.writeFileSync(
          path.join(__dirname, '..', 'issues.json'),
          JSON.stringify(issues, null, 2)
        );

        // Soft assertion style: don't fail the whole suite, just record.
        // But do fail the individual test if there's a hard error (nav error / 5xx / traceback)
        expect(navError, `Navigation error: ${navError}`).toBeNull();
        if (mainStatus) {
          expect(mainStatus, `Unexpected status ${mainStatus} for ${p.url}`).toBeLessThan(500);
        }
        expect(hasTraceback || hasDjangoDebug500, 'Django traceback detected').toBeFalsy();
      });
    }
  });
}

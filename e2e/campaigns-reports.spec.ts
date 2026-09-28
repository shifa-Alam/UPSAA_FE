import { Page, expect, test } from '@playwright/test';
import { collectErrors, mockApi } from './mock-api';

function fakeToken(role: string, memberId?: number): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ role, email: 'e2e@example.invalid', MemberId: memberId, exp: Math.floor(Date.now() / 1000) + 3600 })}.x`;
}
async function signInAs(page: Page, role: string, memberId?: number): Promise<void> {
  await page.addInitScript(t => localStorage.setItem('authToken', t), fakeToken(role, memberId));
}
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const inDays = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10) + 'T00:00:00';

const OPEN = {
  id: 3, title: 'বৃত্তি তহবিল ২০২৬', description: 'মেধাবী শিক্ষার্থীদের জন্য বৃত্তি।', goalAmount: 50000,
  startDate: inDays(-5), endDate: inDays(20), isPublished: true, isOpen: true,
  raised: 35000, onlineAmount: 30000, offlineAmount: 5000, donorCount: 12, pendingCount: null,
};
const ENDED = { ...OPEN, id: 1, title: 'বন্যা ত্রাণ', startDate: inDays(-60), endDate: inDays(-30), isOpen: false, raised: 80000, goalAmount: 60000, donorCount: 40 };

test.describe('campaigns and reports', () => {
  let errors: string[];

  test.beforeEach(async ({ page }) => {
    errors = collectErrors(page);
    await mockApi(page);
    await page.route(/\/api\/Campaign$/, r => r.fulfill(json([OPEN, ENDED])));
    await page.route(/\/api\/Campaign\/3$/, r => r.fulfill(json({
      campaign: OPEN, anonymousDonorCount: 4,
      donors: [{ name: 'Helen Nipa', batch: 2009, at: new Date().toISOString() }, { name: 'Rahim Uddin', batch: 2011, at: new Date().toISOString() }],
    })));
  });

  test.afterEach(() => {
    expect(errors, 'errors logged by the app').toEqual([]);
  });

  test('visitors see running and past campaigns with progress, and a campaign\'s supporters', async ({ page }) => {
    await page.goto('/campaigns');
    await expect(page.locator('.card')).toHaveCount(2);
    const first = page.locator('.card').first();
    await expect(first).toContainText('বৃত্তি তহবিল ২০২৬');
    await expect(first.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '70');
    await expect(first).toContainText('৳৩৫,০০০');
    await expect(page.locator('.card--closed')).toContainText('শেষ হয়েছে');
    // Over the goal: the bar stops at full.
    await expect(page.locator('.card--closed [role="progressbar"]')).toHaveAttribute('aria-valuenow', '100');

    await first.click();
    await expect(page).toHaveURL(/\/campaigns\/3$/);
    await expect(page.locator('h1')).toContainText('বৃত্তি তহবিল ২০২৬');
    await expect(page.locator('.donor')).toHaveCount(2);
    await expect(page.locator('.donors__anon')).toContainText('৪');
    // Visitors are asked to sign in; amounts of individual donors are never shown.
    await expect(page.locator('.give a', { hasText: 'লগইন করে অনুদান দিন' })).toBeVisible();
    await expect(page.locator('.donors')).not.toContainText('৳');
  });

  test('member donates to a campaign from its page, opting in to the donor list', async ({ page }) => {
    await signInAs(page, 'Member', 101);
    let posted: any = null;
    await page.route(/\/api\/Payment\/Settings$/, r => r.fulfill(json({
      bkashNumber: '01811123456', nagadNumber: null, rocketNumber: null, instructions: null, membershipFee: 100, annualFee: 0, membershipDue: false,
    })));
    await page.route(/\/api\/Payment\/Mine$/, r => r.fulfill(json([])));
    await page.route(/\/api\/Payment$/, r => {
      posted = r.request().postDataJSON();
      return r.fulfill(json({
        id: 30, receiptNo: 'UPSAA-000030', memberId: 101, memberName: 'Helen Nipa', memberCode: 'UPSAA0901', batch: 2009, memberPhone: null,
        purpose: 'Donation', amount: 1000, method: 'Bkash', senderNumber: '01712345678', transactionId: 'CAMP12345X', note: null,
        status: 'Pending', submittedAt: new Date().toISOString(), reviewedAt: null, reviewNote: null, reviewedByName: null,
        campaignId: 3, campaignTitle: OPEN.title, showDonorName: true,
      }));
    });

    await page.goto('/portal/campaigns/3');
    await page.locator('.give a', { hasText: 'অনুদান দিন' }).click();
    await expect(page).toHaveURL(/\/portal\/payments\?campaign=3$/);
    // The campaign is picked and it's a donation.
    await expect(page.locator('select[name="campaign"]')).toHaveValue(/3/);
    await expect(page.locator('.purpose.is-selected')).toContainText('অনুদান');
    // Opt-in: unticked until the member ticks it.
    const consent = page.locator('input[name="showDonorName"]');
    await expect(consent).not.toBeChecked();
    await consent.check();

    await page.locator('input[name="amount"]').fill('1000');
    await page.locator('input[name="sender"]').fill('01712345678');
    await page.locator('input[name="trx"]').fill('camp12345x');
    await page.locator('.pay-form__submit').click();
    await expect(page.locator('.h-item')).toContainText(OPEN.title);
    expect(posted).toMatchObject({ purpose: 'Donation', amount: 1000, campaignId: 3, showDonorName: true });
  });

  test('admin creates a campaign', async ({ page }) => {
    await signInAs(page, 'Admin');
    let created: any = null;
    const list: any[] = [];
    await page.route(/\/api\/Campaign\/All$/, r => r.fulfill(json(list)));
    await page.route(/\/api\/Campaign$/, r => {
      if (r.request().method() !== 'POST') return r.fulfill(json([]));
      created = r.request().postDataJSON();
      list.push({ ...OPEN, id: 9, title: created.title, goalAmount: created.goalAmount, raised: 0, donorCount: 0, pendingCount: 0 });
      return r.fulfill(json(list[0]));
    });

    await page.goto('/dashboard/campaigns');
    await expect(page.locator('app-empty-state')).toContainText('এখনো কোনো ক্যাম্পেইন নেই');
    await page.locator('input[name="title"]').fill('স্কুল লাইব্রেরি');
    await page.locator('input[name="goal"]').fill('20000');
    await page.locator('.camp-form button[type="submit"]').click();
    await expect(page.locator('.camp')).toHaveCount(1);
    await expect(page.locator('.camp')).toContainText('স্কুল লাইব্রেরি');
    expect(created).toMatchObject({ title: 'স্কুল লাইব্রেরি', goalAmount: 20000, isPublished: true, endDate: null });
  });

  test('reports show KPIs, turnout with a table, and export a CSV', async ({ page }) => {
    await signInAs(page, 'Admin');
    await page.route(/\/api\/Report\/Overview/, r => r.fulfill(json({
      activeMembers: 435, newThisMonth: 6, membershipPaid: 425, membershipDue: 10, pendingPayments: 2,
      collectedThisMonth: 4600, collectedInPeriod: 12100, openCampaigns: 1,
      collections: [{ month: '2026-08', membership: 300, annual: 0, donation: 7200 }, { month: '2026-09', membership: 100, annual: 0, donation: 4500 }],
      events: [{ id: 5, title: 'বার্ষিক পুনর্মিলনী', eventDate: new Date().toISOString(), going: 48, arrived: 31, walkIns: 6 }],
    })));
    await page.route(/\/api\/Report\/Members\.csv$/, r => r.fulfill({
      status: 200, contentType: 'text/csv; charset=utf-8', body: '﻿Member code,Name\r\nUPSAA0901,Helen Nipa\r\n',
      headers: { 'Content-Disposition': 'attachment; filename=UPSAA-members-2026-09-28.csv', 'Access-Control-Expose-Headers': 'Content-Disposition' },
    }));

    await page.goto('/dashboard/reports');
    await expect(page.locator('.kpi').first()).toContainText('৪৩৫');
    await expect(page.locator('.kpi--attention')).toContainText('২');
    await expect(page.locator('.fee__big')).toHaveText('৯৮%');
    await expect(page.locator('app-simple-chart')).toHaveCount(2);
    await expect(page.locator('.table').filter({ hasText: 'বার্ষিক পুনর্মিলনী' })).toContainText('৪৮');

    const download = page.waitForEvent('download');
    await page.locator('.export button', { hasText: 'ডাউনলোড' }).first().click();
    expect((await download).suggestedFilename()).toBe('UPSAA-members-2026-09-28.csv');
  });
});

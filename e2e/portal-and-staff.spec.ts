import { Page, expect, test } from '@playwright/test';
import { collectErrors, mockApi } from './mock-api';

/** A local, unsigned token — the app only decodes it; the API is mocked. */
function fakeToken(role: string): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ role, email: 'e2e@example.invalid', FullName: 'E2E', exp: Math.floor(Date.now() / 1000) + 3600 })}.x`;
}

async function signInAs(page: Page, role: string): Promise<void> {
  const token = fakeToken(role);
  await page.addInitScript(t => localStorage.setItem('authToken', t), token);
}

const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

const PAYMENT = {
  id: 12, receiptNo: 'UPSAA-000012', memberId: 101, memberName: 'Helen Nipa', memberCode: 'UPSAA0901', batch: 2009,
  memberPhone: '01700000000', purpose: 'Membership', amount: 100, method: 'Bkash', senderNumber: '01712345678', transactionId: '9AB3CD45EF',
  note: null, status: 'Pending', submittedAt: new Date().toISOString(), reviewedAt: null, reviewNote: null, reviewedByName: null,
};

test.describe('portal and back office', () => {
  let errors: string[];

  test.beforeEach(async ({ page }) => {
    errors = collectErrors(page);
    await mockApi(page);
  });

  test.afterEach(() => {
    expect(errors, 'errors logged by the app').toEqual([]);
  });

  test('member pays the membership fee by bKash and sees it waiting', async ({ page }) => {
    await signInAs(page, 'Member');
    let posted: any = null;
    await page.route(/\/api\/Payment\/Settings$/, r => r.fulfill(json({
      bkashNumber: '01811123456', nagadNumber: null, rocketNumber: null, instructions: 'Personal — Send Money',
      membershipFee: 100, annualFee: 0, membershipDue: true,
    })));
    await page.route(/\/api\/Payment\/Mine$/, r => r.fulfill(json([])));
    await page.route(/\/api\/Payment$/, r => {
      posted = r.request().postDataJSON();
      return r.fulfill(json({ ...PAYMENT, transactionId: posted.transactionId.toUpperCase() }));
    });

    await page.goto('/portal/payments');
    await expect(page.locator('.wallet')).toHaveCount(1);
    await expect(page.locator('.wallet__number')).toHaveText('01811123456');
    await expect(page.locator('.due')).toContainText('১০০');
    // Membership is pre-selected with its fixed amount.
    await expect(page.locator('input[name="amount"]')).toHaveValue('100');
    await expect(page.locator('input[name="amount"]')).toHaveAttribute('readonly', '');

    await page.locator('input[name="sender"]').fill('01712345678');
    await page.locator('input[name="trx"]').fill('9ab3cd45ef');
    await page.locator('.pay-form__submit').click();

    await expect(page.locator('.h-item')).toHaveCount(1);
    await expect(page.locator('.h-item')).toContainText('9AB3CD45EF');
    await expect(page.locator('.h-item .pill')).toContainText('যাচাই চলছে');
    expect(posted).toMatchObject({ purpose: 'Membership', amount: 100, method: 'Bkash', senderNumber: '01712345678', transactionId: '9ab3cd45ef' });
    // Already submitted, so the membership option is gone.
    await expect(page.locator('.due')).toHaveCount(0);
  });

  test('treasurer approves a pending payment', async ({ page }) => {
    await signInAs(page, 'Admin');
    let approved = false;
    await page.route(/\/api\/Payment\/Settings$/, r => r.fulfill(json({
      bkashNumber: '01811123456', nagadNumber: null, rocketNumber: null, instructions: null, membershipFee: 100, annualFee: 0,
    })));
    await page.route(/\/api\/Payment\?status=Pending$/, r => r.fulfill(json({ items: approved ? [] : [PAYMENT], pending: approved ? 0 : 1, approved: approved ? 1 : 0, rejected: 0 })));
    await page.route(/\/api\/Payment\/12\/Approve$/, r => { approved = true; return r.fulfill(json({ ...PAYMENT, status: 'Approved' })); });

    await page.goto('/dashboard/payments');
    await expect(page.locator('.pay')).toHaveCount(1);
    await expect(page.locator('.pay')).toContainText('Helen Nipa');
    await expect(page.locator('.pay .trx')).toContainText('9AB3CD45EF');
    await expect(page.locator('.tabs__count--hot')).toHaveText('১');

    await page.locator('.pay .btn--success').click();
    await page.locator('mat-dialog-container button', { hasText: 'অনুমোদন' }).click();
    await expect(page.locator('.pay')).toHaveCount(0);
    expect(approved).toBe(true);
  });

  test('treasurer undoes a mistaken approval', async ({ page }) => {
    await signInAs(page, 'Admin');
    let undone = false;
    await page.route(/\/api\/Payment\/Settings$/, r => r.fulfill(json({
      bkashNumber: '01811123456', nagadNumber: null, rocketNumber: null, instructions: null, membershipFee: 100, annualFee: 0,
    })));
    await page.route(/\/api\/Payment\?status=Pending$/, r => r.fulfill(json({ items: undone ? [PAYMENT] : [], pending: undone ? 1 : 0, approved: undone ? 0 : 1, rejected: 0 })));
    await page.route(/\/api\/Payment\?status=Approved$/, r => r.fulfill(json({
      items: undone ? [] : [
        { ...PAYMENT, status: 'Approved', reviewedAt: new Date().toISOString(), reviewedByName: 'Treasurer', canUndo: true },
        { ...PAYMENT, id: 13, transactionId: 'OTHERADMIN1', status: 'Approved', reviewedAt: new Date().toISOString(), reviewedByName: 'Someone else', canUndo: false },
      ],
      pending: undone ? 1 : 0, approved: undone ? 0 : 1, rejected: 0,
    })));
    await page.route(/\/api\/Payment\/12\/Undo$/, r => { undone = true; return r.fulfill(json(PAYMENT)); });

    await page.goto('/dashboard/payments');
    await page.locator('.tabs__tab', { hasText: 'গৃহীত' }).click();
    await expect(page.locator('.pay')).toHaveCount(2);
    await expect(page.locator('.pay .btn--success')).toHaveCount(0);
    // Only the decision this admin made can be undone.
    await expect(page.locator('.pay button', { hasText: 'আগের অবস্থায় ফেরান' })).toHaveCount(1);
    await page.locator('.pay button', { hasText: 'আগের অবস্থায় ফেরান' }).click();
    await page.locator('mat-dialog-container button', { hasText: 'আগের অবস্থায় ফেরান' }).click();
    await expect(page.locator('.pay')).toHaveCount(0);
    expect(undone).toBe(true);
    await expect(page.locator('.tabs__count--hot')).toHaveText('১');
  });

  test('gate volunteer checks a member in by member code', async ({ page }) => {
    await signInAs(page, 'Admin');
    const summary = (arrived: boolean) => ({
      event: { id: 5, title: 'পুনর্মিলনী ২০২৬', eventDate: new Date().toISOString(), endDate: null, venue: 'স্কুল মাঠ' },
      isOpen: true, goingCount: 1, checkedInCount: arrived ? 1 : 0, walkInCount: 0,
      attendees: arrived ? [{ memberId: 101, fullName: 'Helen Nipa', batch: 2009, memberCode: 'UPSAA0901', photo: null, checkedInAt: new Date().toISOString(), rsvp: true }] : [],
      notYet: arrived ? [] : [{ memberId: 101, fullName: 'Helen Nipa', batch: 2009, memberCode: 'UPSAA0901', photo: null }],
    });
    let arrived = false;
    let code = '';
    await page.route(/\/api\/Event\/5\/CheckIns$/, r => {
      if (r.request().method() === 'POST') {
        code = r.request().postDataJSON().code;
        arrived = true;
        return r.fulfill(json({ already: false, checkedInAt: new Date().toISOString(), rsvp: true, checkedInCount: 1,
          member: { memberId: 101, fullName: 'Helen Nipa', batch: 2009, memberCode: 'UPSAA0901', photo: null, bloodGroup: 'A+' } }));
      }
      return r.fulfill(json(summary(arrived)));
    });

    await page.goto('/dashboard/events/5/check-in');
    await expect(page.locator('.tally__item--main dd')).toHaveText('০');
    await page.locator('input[name="code"]').fill('UPSAA0901');
    await page.locator('.manual button[type="submit"]').click();

    await expect(page.locator('.result--ok')).toContainText('Helen Nipa');
    await expect(page.locator('.result--ok')).toContainText('স্বাগতম');
    expect(code).toBe('UPSAA0901');
    await expect(page.locator('.tally__item--main dd')).toHaveText('১');
    await expect(page.locator('.people .person')).toContainText('Helen Nipa');
  });

  test('SuperAdmin sees health and grouped server errors', async ({ page }) => {
    await signInAs(page, 'SuperAdmin');
    const at = (min: number) => new Date(Date.now() - min * 60000).toISOString();
    await page.route(/\/api\/health$/, r => r.fulfill(json({ status: 'ok', database: 'ok', time: new Date().toISOString() })));
    await page.route(/\/api\/ClientError\/server/, r => r.fulfill(json([
      { at: at(1), request: 'GET /api/Member/7', type: 'System.NullReferenceException', message: 'Object reference not set', stack: 'at X' },
      { at: at(5), request: 'GET /api/Member/9', type: 'System.NullReferenceException', message: 'Object reference not set', stack: 'at X' },
      { at: at(9), request: 'POST /api/Event/Create', type: 'System.IO.IOException', message: 'Disk full', stack: 'at Y' },
    ])));

    // The SuperAdmin has no member record: the header must not ask for a member profile (it would 401).
    let profileCalls = 0;
    page.on('request', req => { if (/\/api\/member\/GetProfile/i.test(req.url())) profileCalls++; });
    await page.goto('/dashboard/error-log');
    await expect(page.locator('.health')).toContainText('সব ঠিক আছে');
    await expect(page.locator('.group')).toHaveCount(2);
    await expect(page.locator('.group').first()).toContainText('২×');
    await expect(page.locator('.group').first()).toContainText('NullReferenceException');

    await page.locator('input[name="filter"]').fill('disk');
    await expect(page.locator('.group')).toHaveCount(1);
    await expect(page.locator('.group')).toContainText('Disk full');
    expect(profileCalls).toBe(0);
  });
});

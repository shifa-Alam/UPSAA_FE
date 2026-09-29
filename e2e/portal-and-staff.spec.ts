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

  test('treasurer records cash for a member found by phone', async ({ page }) => {
    await signInAs(page, 'Admin');
    let recorded: any = null;
    await page.route(/\/api\/Payment\/Settings$/, r => r.fulfill(json({
      bkashNumber: '01811123456', nagadNumber: null, rocketNumber: null, instructions: null, membershipFee: 100, annualFee: 0,
    })));
    await page.route(/\/api\/Payment\?status=Pending$/, r => r.fulfill(json({ items: [], pending: 0, approved: recorded ? 1 : 0, rejected: 0 })));
    await page.route(/\/api\/Payment\/MemberLookup\?q=/, r => r.fulfill(json([
      { id: 205, fullName: 'আব্দুল করিম', memberCode: 'UPSAA9801', batch: 1998, phone: '01955123456', membershipDue: true },
    ])));
    await page.route(/\/api\/Payment\/Record$/, r => {
      recorded = r.request().postDataJSON();
      return r.fulfill(json({ ...PAYMENT, id: 40, receiptNo: 'UPSAA-000040', memberId: 205, memberName: 'আব্দুল করিম', method: 'Cash',
        transactionId: 'CASH260928123456', senderNumber: '', status: 'Approved', reviewedAt: new Date().toISOString(), canUndo: true }));
    });

    await page.goto('/dashboard/payments');
    await page.locator('app-payment-record input[name="q"]').fill('01955');
    await page.locator('.found__item', { hasText: 'আব্দুল করিম' }).click();
    // Fee is due, so membership is picked with its amount; cash is the default.
    await expect(page.locator('app-payment-record input[name="amount"]')).toHaveValue('100');
    await expect(page.locator('app-payment-record .choice.is-on', { hasText: 'নগদ' })).toBeVisible();
    await expect(page.locator('app-payment-record input[name="trx"]')).toHaveCount(0);

    await page.locator('app-payment-record .rec__save').click();
    await expect(page.locator('.rec__done')).toContainText('UPSAA-000040');
    await expect(page.locator('.rec__done button', { hasText: 'রসিদ প্রিন্ট' })).toBeVisible();
    expect(recorded).toMatchObject({ memberId: 205, purpose: 'Membership', amount: 100, method: 'Cash' });
    expect(recorded.transactionId).toBeUndefined();
  });

  test('SMS screen shows usage and saves the switches; a notice can also go by SMS', async ({ page }) => {
    await signInAs(page, 'Admin');
    let saved: any = null;
    let notice: any = null;
    const status = { gatewayEnabled: true, smsPaymentReceipts: true, smsEventReminders: true, smsMonthlyLimit: 500, usedThisMonth: 20, audience: 435 };
    await page.route(/\/api\/Sms\/Status$/, r => r.fulfill(json(status)));
    await page.route(/\/api\/Sms\/Log/, r => r.fulfill(json([
      { id: 2, createdDate: new Date().toISOString(), kind: 'payment', phone: '01955123456', message: 'UPSAA: আপনার ৳100 পাওয়া গেছে।', status: 'sent', error: null, memberName: 'আব্দুল করিম' },
      { id: 1, createdDate: new Date().toISOString(), kind: 'test', phone: '0123', message: 'test', status: 'failed', error: 'Not a Bangladesh mobile number', memberName: null },
    ])));
    await page.route(/\/api\/Sms\/Settings$/, r => { saved = r.request().postDataJSON(); return r.fulfill(json({ ...status, ...saved })); });

    await page.goto('/dashboard/sms');
    await expect(page.locator('.usage__big')).toContainText('২০');
    await expect(page.locator('.log__row')).toHaveCount(2);
    await expect(page.locator('.log__row').first()).toContainText('আব্দুল করিম');
    // The switches and the monthly cap live in Settings › SMS now; this page links there.
    await expect(page.locator('a.to-settings')).toHaveAttribute('href', '/dashboard/settings/sms');
    expect(saved).toBeNull();

    await page.route(/\/api\/Notice\/Create$/, r => {
      notice = r.request().postDataJSON();
      return r.fulfill(json({ id: 9, title: notice.title, content: notice.content, publishedDate: new Date().toISOString(), createdDate: new Date().toISOString(), createdById: null, createdByName: 'Admin', alumniOnly: false }));
    });
    await page.goto('/dashboard/notices');
    const smsBox = page.locator('input[name="sendSms"]');
    await expect(page.locator('label', { has: smsBox })).toContainText('435');
    await page.locator('#noticeTitle').fill('সাধারণ সভা');
    await page.locator('#noticeContent').fill('শুক্রবার বিকেল ৪টায়');
    await smsBox.check();
    await page.locator('.notice-form button[type="submit"]').click();
    await expect.poll(() => notice).toMatchObject({ title: 'সাধারণ সভা', sendSms: true });

    // Not enough SMS left this month: the tick can't be ticked, and says why.
    status.usedThisMonth = 400;
    await page.goto('/dashboard/notices');
    await expect(page.locator('input[name="sendSms"]')).toBeDisabled();
    await expect(page.locator('.notice-form__sms-hint--warn')).toBeVisible();
  });

  test('admin writes an SMS to one batch, and re-sends a notice by SMS only after confirming', async ({ page }) => {
    await signInAs(page, 'Admin');
    let sent: any = null;
    let item: string | null = null;
    const status = { gatewayEnabled: true, smsPaymentReceipts: true, smsEventReminders: true, smsBirthdayWishes: true,
      smsBirthdayMessage: '', defaultBirthdayMessage: '', smsMonthlyLimit: 500, usedThisMonth: 20, audience: 435 };
    await page.route(/\/api\/Sms\/Status$/, r => r.fulfill(json(status)));
    await page.route(/\/api\/Sms\/Log/, r => r.fulfill(json([])));
    await page.route(/\/api\/Sms\/Audience$/, r => {
      const b = r.request().postDataJSON();
      return r.fulfill(json({ count: b.target === 'batch' ? 12 : 435, left: 480 }));
    });
    await page.route(/\/api\/Sms\/Send$/, r => { sent = r.request().postDataJSON(); return r.fulfill(json({ queued: 12, ref: 'manual:1' })); });

    await page.goto('/dashboard/sms');
    await page.locator('app-sms-compose textarea[name="message"]').fill('UPSAA: ২০০৯ ব্যাচের আড্ডা শুক্রবার বিকেলে।');
    await expect(page.locator('.compose__count')).toContainText('১ টি SMS');
    await page.locator('app-sms-compose .choice', { hasText: 'একটা ব্যাচ' }).click();
    await page.locator('app-sms-compose select[name="batch"]').selectOption({ index: 1 });
    await expect(page.locator('.reach')).toContainText('১২');
    await page.locator('app-sms-compose button[type="submit"]').click();
    await page.locator('mat-dialog-container button', { hasText: 'পাঠান' }).click();
    await expect.poll(() => sent).toMatchObject({ target: 'batch', message: 'UPSAA: ২০০৯ ব্যাচের আড্ডা শুক্রবার বিকেলে।' });
    expect(typeof sent.batch).toBe('number');

    // Notice row: already went by SMS → "SMS again" asks first, then sends with again=true.
    await page.route(/\/api\/Notice\/GetAll/, r => r.fulfill(json([
      { id: 7, title: 'বার্ষিক সাধারণ সভা', content: 'শুক্রবার', publishedDate: new Date().toISOString(), createdDate: new Date().toISOString(), createdById: null, createdByName: 'Admin', alumniOnly: false },
    ])));
    await page.route(/\/api\/Sms\/ItemStatus/, r => r.fulfill(json({ 7: { sent: 430, failed: 5, last: new Date().toISOString() } })));
    await page.route(/\/api\/Sms\/Item\/notice\/7/, r => { item = r.request().url(); return r.fulfill(json({ queued: 435, ref: 'notice:7' })); });
    await page.goto('/dashboard/notices');
    const row = page.locator('app-sms-send-button');
    await expect(row).toContainText('৪৩০');
    await row.locator('button').click();
    await expect(page.locator('mat-dialog-container')).toContainText('আবার');
    await page.locator('mat-dialog-container button', { hasText: 'পাঠান' }).click();
    await expect.poll(() => item).toContain('again=true');
  });

  test('birthday: send the wish by SMS now with edited text; a notice SMS can be set for later', async ({ page }) => {
    await signInAs(page, 'SuperAdmin');
    let birthdayBody: any = null;
    let itemBody: any = null;
    const status = { gatewayEnabled: true, smsPaymentReceipts: true, smsEventReminders: true, smsBirthdayWishes: true,
      smsBirthdayMessage: 'শুভ জন্মদিন, {name}! — UPSAA', defaultBirthdayMessage: 'শুভ জন্মদিন, {name}! — UPSAA',
      smsMonthlyLimit: 500, usedThisMonth: 20, birthdaySmsMinute: 480, eventReminderMinute: 540, audience: 435 };
    await page.route(/\/api\/Sms\/Status$/, r => r.fulfill(json(status)));
    await page.route(/\/api\/Sms\/BirthdayStatus/, r => r.fulfill(json({})));
    await page.route(/\/api\/BirthdayPost\/settings$/, r => r.fulfill(json({
      enabled: true, pageId: null, pageAccessTokenMasked: null, hasAccessToken: false, postTime: '00:05', emailEnabled: false,
      autoPostNotices: false, autoPostEvents: false, autoPostAchievements: false, autoPostMemories: false, autoPostBusinesses: false,
      autoPostJobs: false, autoPostCampaigns: false, autoPostBloodRequests: false, emailConfigured: false, emailFromAddress: null,
      emailServer: null, emailFromName: 'UPSAA', defaultEmailFromName: 'UPSAA', emailSubject: '', defaultEmailSubject: '',
      emailBody: '', defaultEmailBody: '', postMessage: '', defaultPostMessage: '',
    })));
    await page.route(/\/api\/BirthdayPost\/logs/, r => r.fulfill(json([])));
    await page.route(/\/api\/BirthdayPost\/today/, r => r.fulfill(json([
      { memberId: 301, fullName: 'সালমা খাতুন', batch: 2006, photo: null, status: null, hasEmail: false, wishText: '', emailStatus: null, emailError: null },
    ])));
    await page.route(/\/api\/Sms\/Birthday\/301/, r => { birthdayBody = r.request().postDataJSON(); return r.fulfill(json({ queued: 1, text: birthdayBody.message })); });

    await page.goto('/dashboard/birthday-automation');
    const btn = page.locator('button', { hasText: 'এখনই SMS দিন' });
    await btn.click();
    const box = page.locator('app-sms-send-dialog textarea');
    await expect(box).toHaveValue('শুভ জন্মদিন, সালমা খাতুন! — UPSAA');
    await box.fill('শুভ জন্মদিন আপা! — UPSAA');
    await page.locator('app-sms-send-dialog .dlg__ok').click();
    await expect.poll(() => birthdayBody).toMatchObject({ message: 'শুভ জন্মদিন আপা! — UPSAA' });
    await expect(page.locator('button', { hasText: 'আবার SMS দিন' })).toBeVisible();

    // Notice row: "later" with a time → scheduled, and the row says when.
    await page.route(/\/api\/Notice\/GetAll/, r => r.fulfill(json([
      { id: 8, title: 'সাধারণ সভা', content: 'x', publishedDate: new Date().toISOString(), createdDate: new Date().toISOString(), createdById: null, createdByName: 'Admin', alumniOnly: false },
    ])));
    await page.route(/\/api\/Sms\/ItemStatus/, r => r.fulfill(json({})));
    await page.route(/\/api\/Sms\/Audience$/, r => r.fulfill(json({ count: 435, left: 480 })));
    await page.route(/\/api\/Sms\/Item\/notice\/8/, r => { itemBody = r.request().postDataJSON(); return r.fulfill(json({ scheduled: 3, sendAt: itemBody.sendAt + ':00', reach: 435 })); });
    await page.goto('/dashboard/notices');
    await page.locator('app-sms-send-button button', { hasText: 'এখনই SMS দিন' }).click();
    await page.locator('app-sms-send-dialog .dlg__opt', { hasText: 'পরে' }).click();
    const at = page.locator('app-sms-send-dialog input[type="datetime-local"]');
    await expect(at).toBeVisible();
    await page.locator('app-sms-send-dialog .dlg__ok').click();
    await expect.poll(() => itemBody?.sendAt).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d$/);
    await expect(page.locator('.sms-btn__wait')).toBeVisible();
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

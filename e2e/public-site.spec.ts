import { expect, test } from '@playwright/test';
import { collectErrors, mockApi } from './mock-api';

test.describe('public site', () => {
  let errors: string[];

  test.beforeEach(async ({ page }) => {
    errors = collectErrors(page);
    await mockApi(page);
  });

  test.afterEach(() => {
    expect(errors, 'errors logged by the app').toEqual([]);
  });

  test('home page shows the association name as its heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1.hero__title')).toContainText('উত্তরণ পাবলিক স্কুল');
    await expect(page).toHaveTitle(/UPSAA/);
  });

  test('directory lists alumni, filters by name, and opens a profile', async ({ page }) => {
    await page.goto('/members');
    await expect(page.locator('a.member')).toHaveCount(2);

    await page.locator('input[name="name"]').fill('helen');
    await expect(page.locator('a.member')).toHaveCount(1);
    await expect(page.locator('a.member').first()).toContainText('Helen Nipa');

    await page.locator('a.member').first().click();
    await expect(page).toHaveURL(/\/members\/101$/);
    await expect(page.locator('.hero__name')).toContainText('HELEN NIPA', { ignoreCase: true });
    // Visitors don't see contact details — they're asked to sign in.
    await expect(page.locator('.contact-locked')).toBeVisible();
  });

  test('batch list opens a batch page with its representative and alumni', async ({ page }) => {
    await page.goto('/batches');
    await page.locator('button.year', { hasText: '২০০৯' }).click();
    await expect(page).toHaveURL(/\/batches\/2009$/);
    await expect(page.locator('h1')).toContainText('ব্যাচ ২০০৯');
    await expect(page.locator('.pp-person')).toContainText('Helen Nipa');
    // The directory is locked to 2009: only that batch's alumni, no batch field.
    await expect(page.locator('a.member')).toHaveCount(1);
    await expect(page.locator('input[name="batch"]')).toHaveCount(0);
    await expect(page.locator('a.member').first()).toHaveAttribute('href', '/members/101');
  });

  test('site search finds alumni, notices and a batch year', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.locator(isMobile ? '.mobile-actions__search' : '.search-button').click();
    const box = page.locator('app-site-search input');
    await expect(box).toBeFocused();

    await box.fill('সভা');
    await expect(page.locator('app-site-search .hit')).toHaveCount(1);
    await expect(page.locator('app-site-search .hit')).toContainText('বার্ষিক সাধারণ সভা');

    await box.fill('২০০৯');
    await expect(page.locator('app-site-search .hit--batch')).toContainText('ব্যাচ ২০০৯');

    await box.fill('helen');
    await expect(page.locator('app-site-search .hit')).toContainText('Helen Nipa');
    await box.press('Enter');
    await expect(page).toHaveURL(/\/members\/101$/);
    await expect(page.locator('app-site-search')).toHaveCount(0);
  });

  test('events page shows the upcoming event with RSVP and publishes Event structured data', async ({ page }) => {
    await page.goto('/events');
    await expect(page.locator('app-rsvp-button').first()).toContainText('লগইন করে সাড়া দিন');
    const ld = page.locator('script#events-structured-data');
    await expect(ld).toHaveCount(1);
    const data = JSON.parse((await ld.textContent()) ?? '[]');
    expect(data[0]).toMatchObject({ '@type': 'Event', name: 'পুনর্মিলনী ২০২৬', location: { name: 'স্কুল মাঠ' } });
    expect(data[0].startDate).toMatch(/\+06:00$/);

    // Leaving the page takes the structured data with it.
    await page.goto('/notices');
    await expect(page.locator('script#events-structured-data')).toHaveCount(0);
  });

  test('registration: empty step 1 is blocked; step 2 arrives without errors', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('.reg-steps__item.is-current')).toContainText('১');

    await page.locator('.reg-nav__next').click();
    await expect(page.locator('.reg-section .mat-form-field-invalid').first()).toBeVisible();
    await expect(page.locator('.reg-steps__item.is-current')).toContainText('১'); // still on step 1

    await page.locator('input[formcontrolname="fullName"]').fill('Test Alumnus');
    for (const [name, option] of [['gender', 1], ['batch', 3], ['bloodGroup', 2]] as const) {
      await page.locator(`mat-select[formcontrolname="${name}"]`).click();
      await page.locator('mat-option').nth(option).click();
      await expect(page.locator('mat-option')).toHaveCount(0); // panel closed
    }
    await page.locator('.reg-nav__next').click();

    await expect(page.locator('input[formcontrolname="email"]')).toBeVisible(); // step 2
    // The bug that was reported: step 2 fields came up red before anyone touched them.
    await expect(page.locator('.reg-section .mat-form-field-invalid')).toHaveCount(0);
  });

  test('notices list and a shared single-notice link', async ({ page }) => {
    await page.goto('/notices');
    await expect(page.locator('.notice-list li')).toHaveCount(2);
    await expect(page.locator('.notice-list .badge--gold')).toHaveCount(1); // the alumni-only one

    await page.goto('/notices?id=7');
    await expect(page.locator('.notice-detail__title')).toHaveText('বার্ষিক সাধারণ সভা');
  });

  test('unknown URL shows the 404 page, and its search opens the directory', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect(page.locator('app-not-found h1')).toBeVisible();
    await page.locator('app-not-found input[type="search"]').fill('Helen');
    await page.locator('app-not-found button[type="submit"]').click();
    await expect(page).toHaveURL(/\/members\?name=Helen/);
  });
});

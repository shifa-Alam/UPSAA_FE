import { Page, Route } from '@playwright/test';

/** Sample alumni used across the tests. */
export const MEMBERS = [
  { id: 101, fullName: 'Helen Nipa', photo: null, batch: 2009, currentDesignation: 'Software Engineer', employer: 'Lucid Tech', currentCity: 'Dhaka', bloodGroup: 'A+', memberCode: 'UPSAA0901' },
  { id: 102, fullName: 'Md Abdul Mazid', photo: null, batch: 2000, currentDesignation: 'Sergeant', employer: 'Bangladesh Army', currentCity: 'Dhaka', bloodGroup: 'O+', memberCode: 'UPSAA0002' },
];

const inTenDays = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 19);
export const EVENTS = [
  { id: 31, title: 'পুনর্মিলনী ২০২৬', description: 'সব ব্যাচের মিলনমেলা।', eventDate: inTenDays, endDate: null, venue: 'স্কুল মাঠ', organizerName: null, photoUrl: null, registrationUrl: null, createdDate: inTenDays, createdById: null, createdByName: null, galleryPhotoCount: 0, goingCount: 3, iAmGoing: false },
];

export const NOTICES = [
  { id: 7, title: 'বার্ষিক সাধারণ সভা', content: 'আগামী শুক্রবার বিকেল ৪টায় স্কুল মাঠে।', publishedDate: new Date().toISOString(), createdDate: new Date().toISOString(), createdById: null, createdByName: 'Admin', alumniOnly: false },
  { id: 8, title: 'সদস্যদের জন্য বিশেষ নোটিশ', content: 'শুধু সদস্যরা দেখতে পাবেন।', publishedDate: new Date(Date.now() - 864e5).toISOString(), createdDate: new Date().toISOString(), createdById: null, createdByName: 'Admin', alumniOnly: true },
];

const json = (route: Route, body: unknown, headers: Record<string, string> = {}) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'X-Total-Count', ...headers },
    body: JSON.stringify(body),
  });

const list = (route: Route, items: unknown[]) => json(route, items, { 'X-Total-Count': String(items.length) });

/** Replace every call to the backend with sample data. Returns the requests seen, for assertions. */
export async function mockApi(page: Page): Promise<{ url: string; body: any }[]> {
  const seen: { url: string; body: any }[] = [];
  await page.route(/\/api\//, async route => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' } });
    }
    const url = new URL(req.url());
    const path = url.pathname.replace(/^.*\/api\//, '');
    let body: any = null;
    try { body = req.postDataJSON(); } catch { /* not JSON */ }
    seen.push({ url: path + url.search, body });

    if (/^member\/PublicDirectory$/i.test(path)) {
      const name = (body?.fullName ?? '').toLowerCase();
      const members = MEMBERS.filter(m => (!name || m.fullName.toLowerCase().includes(name)) && (!body?.batch || m.batch === body.batch));
      return json(route, { members, totalItems: members.length, totalPages: 1, pageNumber: 1, pageSize: 24 });
    }
    if (/^member\/PublicBatchSummary$/i.test(path)) return json(route, [{ batch: 2009, alumniCount: 12 }, { batch: 2000, alumniCount: 8 }]);
    const batch = path.match(/^member\/PublicBatch\/(\d+)$/i);
    if (batch) {
      const inBatch = MEMBERS.filter(m => m.batch === Number(batch[1]));
      return json(route, { batch: Number(batch[1]), alumniCount: inBatch.length, representatives: inBatch.slice(0, 1) });
    }
    const profile = path.match(/^member\/PublicProfile\/(\d+)$/i);
    if (profile) {
      const m = MEMBERS.find(x => x.id === Number(profile[1]));
      return m
        ? json(route, { ...m, phone: null, email: null, dob: null, contactHiddenReason: 'signIn', education: [] })
        : route.fulfill({ status: 404 });
    }
    if (/^Notice\/GetAll$/i.test(path)) {
      const q = url.searchParams.get('search');
      return list(route, NOTICES.filter(n => !q || n.title.includes(q) || n.content.includes(q)));
    }
    const notice = path.match(/^Notice\/(\d+)$/i);
    if (notice) {
      const n = NOTICES.find(x => x.id === Number(notice[1]));
      return n ? json(route, n) : route.fulfill({ status: 404 });
    }
    if (/^Event\/GetAll$/i.test(path)) {
      const q = url.searchParams.get('search');
      const when = url.searchParams.get('when');
      return list(route, when === 'past' ? [] : EVENTS.filter(e => !q || e.title.includes(q)));
    }
    if (/^Captcha\/generate$/i.test(path)) return json(route, { captchaId: 'test', image: '' });
    if (/^Committee\/Current$/i.test(path)) return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    if (/GetImageFile|GetProfileImageFile/i.test(path)) return route.fulfill({ status: 404 });
    // Everything else (events, gallery, achievements, testimonials, …): an empty list.
    return list(route, []);
  });
  return seen;
}

/** Errors the app logs (template mistakes, bad bindings…). Network 404s from the mock are ignored. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource|status of 404|ERR_|HttpErrorResponse/i.test(m.text())) errors.push(m.text());
  });
  return errors;
}

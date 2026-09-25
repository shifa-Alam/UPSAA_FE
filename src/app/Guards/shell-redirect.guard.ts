import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';

/** Public pages that also exist inside the member portal, at /portal/<page>. */
const MEMBER_PORTAL_PAGES = new Set([
  'about', 'contact', 'committee', 'events', 'notices', 'gallery', 'members', 'batches',
  'achievements', 'teachers', 'jobs', 'blood-donors', 'constitution', 'profile',
]);

/** Community pages staff open inside the back office, at /dashboard/<page>. */
const STAFF_SHELL_PAGES = new Set(['jobs', 'blood-donors', 'constitution']);

/**
 * Keeps signed-in users inside their sidebar shell.
 *
 * Members / Representatives never see the public site: a public URL forwards to
 * its /portal copy when there is one, otherwise (home, login, register…) to the
 * portal home. Staff are forwarded only for the community pages they use from the
 * back office. Visitors pass through untouched — members-only pages keep their own
 * AuthGuard, which sends them to login.
 */
export const shellRedirectGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  if (!auth.isLoggedIn()) return true;

  const router = inject(Router);
  // 'members/:id' → ['members', '42']: path params travel along with the query params.
  const segments = (route.routeConfig?.path ?? '').split('/')
    .map(s => s.startsWith(':') ? route.paramMap.get(s.slice(1)) ?? '' : s);
  const page = segments[0];
  const extras = { queryParams: route.queryParams, fragment: route.fragment ?? undefined };

  if (auth.isStaff()) {
    return STAFF_SHELL_PAGES.has(page) && segments.length === 1 ? router.createUrlTree(['/dashboard', page], extras) : true;
  }

  return MEMBER_PORTAL_PAGES.has(page)
    ? router.createUrlTree(['/portal', ...segments], extras)
    : router.createUrlTree(['/portal/home']);
};

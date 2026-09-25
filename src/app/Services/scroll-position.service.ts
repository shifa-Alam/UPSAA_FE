import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

/** Elements that scroll instead of the window: the app shell's content area, and the
 *  dashboard/portal shell's main column on desktop. */
const SCROLLERS = 'mat-sidenav-content, .main-content';

/**
 * Every new page opens at the top; Back/Forward returns to where you were.
 *
 * The router's own scrollPositionRestoration only knows about the window, but here the
 * page scrolls inside mat-sidenav-content (and .main-content in the sidebar shell), so
 * positions are saved and restored for those elements instead.
 */
@Injectable({ providedIn: 'root' })
export class ScrollPositionService {
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** navigationId → scrollTop of each scroller when that page was left. */
  private readonly saved = new Map<number, number[]>();
  private currentId = 0;
  private restoreTo: number | null = null;

  init(): void {
    if (!this.isBrowser) return;

    this.router.events.subscribe(e => {
      if (e instanceof NavigationStart) {
        this.saved.set(this.currentId, this.scrollers().map(el => el.scrollTop));
        this.restoreTo = e.navigationTrigger === 'popstate' && e.restoredState ? e.restoredState.navigationId : null;
      } else if (e instanceof NavigationEnd) {
        this.currentId = e.id;
        const target = this.restoreTo !== null ? this.saved.get(this.restoreTo) ?? null : null;
        this.zone.runOutsideAngular(() => (target ? this.restore(target) : this.toTop()));
      }
    });
  }

  private scrollers(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>(SCROLLERS));
  }

  private toTop(): void {
    // Right after the new page renders (the shell element may be swapped on navigation).
    // setTimeout rather than requestAnimationFrame: rAF doesn't run in a background tab.
    setTimeout(() => this.scrollers().forEach(el => el.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })));
  }

  /** The previous page's data may still be loading, so keep trying for a moment
   *  until the content is tall enough to reach the old position. */
  private restore(tops: number[], attempt = 0): void {
    setTimeout(() => {
      const els = this.scrollers();
      let done = true;
      els.forEach((el, i) => {
        const top = tops[i] ?? 0;
        if (el.scrollHeight - el.clientHeight >= top) el.scrollTop = top;
        else { el.scrollTop = el.scrollHeight; done = false; }
      });
      if (!done && attempt < 30) setTimeout(() => this.restore(tops, attempt + 1), 50);
    });
  }
}

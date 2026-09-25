import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Pull this far (px, after resistance) to trigger a refresh. */
const TRIGGER = 72;
const MAX_PULL = 120;

/**
 * Pull-to-refresh for the installed app. In a browser tab the browser already does
 * this; the home-screen app has no browser UI (and overscroll is switched off there,
 * see styles.scss), so this puts the gesture back: pull down at the top of a page, a
 * spinner follows the finger, and letting go past the mark reloads the page — quick,
 * because the service worker serves the app itself from the phone.
 */
@Injectable({ providedIn: 'root' })
export class PullToRefreshService {
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  init(): void {
    if (!this.isBrowser) return;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    if (!standalone) return;
    this.zone.runOutsideAngular(() => setTimeout(() => this.attach(), 0));
  }

  private attach(): void {
    const scroller = document.querySelector<HTMLElement>('mat-sidenav-content');
    if (!scroller) return;

    const spinner = document.createElement('div');
    spinner.className = 'ptr';
    spinner.setAttribute('aria-hidden', 'true');
    spinner.innerHTML = '<span class="ptr__icon material-symbols-rounded">refresh</span>';
    document.body.appendChild(spinner);

    let startY = 0, pull = 0, active = false;

    const set = (px: number) => {
      spinner.style.transform = `translate(-50%, ${px - 56}px) rotate(${px * 3}deg)`;
      spinner.style.opacity = String(Math.min(1, px / TRIGGER));
      spinner.classList.toggle('ptr--ready', px >= TRIGGER);
    };

    scroller.addEventListener('touchstart', e => {
      active = scroller.scrollTop <= 0 && e.touches.length === 1 && !document.querySelector('.cdk-overlay-pane, .lightbox');
      startY = e.touches[0].clientY;
      pull = 0;
    }, { passive: true });

    scroller.addEventListener('touchmove', e => {
      if (!active) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0 || scroller.scrollTop > 0) { pull = 0; set(0); return; }
      pull = Math.min(MAX_PULL, dy * 0.5); // resistance, like native
      spinner.classList.add('ptr--pulling');
      set(pull);
    }, { passive: true });

    scroller.addEventListener('touchend', () => {
      if (!active) return;
      active = false;
      spinner.classList.remove('ptr--pulling');
      if (pull >= TRIGGER) {
        spinner.classList.add('ptr--spinning');
        set(TRIGGER);
        setTimeout(() => location.reload(), 250);
      } else {
        set(0);
      }
    }, { passive: true });
  }
}

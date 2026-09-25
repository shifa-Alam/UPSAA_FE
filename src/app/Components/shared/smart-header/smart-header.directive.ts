import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

/** Past this many pixels the header turns to frosted glass and gets a little shorter. */
const SCROLLED_AT = 12;
/** Phones only: start hiding once the user is this far down the page… */
const HIDE_AFTER = 140;
/** …and ignore tiny scroll jitters. */
const DELTA = 6;

/**
 * The sticky site header reacts to scrolling, like a native app bar:
 *  - `is-scrolled` once the page moves (glass look + compact height);
 *  - `is-hidden` on phones while scrolling down, back on the slightest scroll up.
 * Listens on the element that actually scrolls (mat-sidenav-content), outside Angular's
 * change detection, and only touches CSS classes.
 */
@Directive({
  selector: '[appSmartHeader]',
  standalone: true,
})
export class SmartHeaderDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private scroller: HTMLElement | null = null;
  private lastY = 0;
  private ticking = false;
  private nav?: Subscription;
  private readonly phone = this.isBrowser ? window.matchMedia('(max-width: 768px)') : null;

  private readonly onScroll = () => {
    if (this.ticking) return;
    this.ticking = true;
    setTimeout(() => { this.ticking = false; this.update(); }, 16);
  };

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.scroller = this.el.nativeElement.closest('mat-sidenav-content');
    if (!this.scroller) return;
    this.zone.runOutsideAngular(() => this.scroller!.addEventListener('scroll', this.onScroll, { passive: true }));
    // A new page starts at the top — show the header again straight away.
    this.nav = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.lastY = 0;
      this.el.nativeElement.classList.remove('is-hidden');
      setTimeout(() => this.update(), 30);
    });
  }

  ngOnDestroy(): void {
    this.scroller?.removeEventListener('scroll', this.onScroll);
    this.nav?.unsubscribe();
  }

  private update(): void {
    if (!this.scroller) return;
    const y = this.scroller.scrollTop;
    const host = this.el.nativeElement.classList;
    host.toggle('is-scrolled', y > SCROLLED_AT);

    const dy = y - this.lastY;
    if (Math.abs(dy) < DELTA) return;
    const hide = !!this.phone?.matches && dy > 0 && y > HIDE_AFTER;
    host.toggle('is-hidden', hide);
    this.lastY = y;
  }
}

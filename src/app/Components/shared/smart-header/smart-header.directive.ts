import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

/** Past this many pixels the header turns to frosted glass. */
const SCROLLED_AT = 12;

/**
 * The site header stays fixed at the top on every screen size; once the page moves it
 * gets `is-scrolled` (frosted-glass look). Listens on the element that actually scrolls
 * (mat-sidenav-content), outside Angular's change detection, and only touches a CSS class.
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
  private ticking = false;
  private nav?: Subscription;

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
    // A new page starts at the top — drop the glass look straight away.
    this.nav = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      setTimeout(() => this.update(), 30);
    });
  }

  ngOnDestroy(): void {
    this.scroller?.removeEventListener('scroll', this.onScroll);
    this.nav?.unsubscribe();
  }

  private update(): void {
    if (!this.scroller) return;
    this.el.nativeElement.classList.toggle('is-scrolled', this.scroller.scrollTop > SCROLLED_AT);
  }
}

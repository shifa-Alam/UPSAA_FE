import { Directive, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Subtle fade-up as an element scrolls into view. Adds `.reveal` on init and
 * `.reveal--visible` once it intersects; the styles live in styles.scss so any
 * page can use it. No-ops on the server and for reduced-motion users (the CSS
 * there shows everything immediately).
 */
@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective implements OnInit, OnDestroy {
  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>, @Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') return;

    const host = this.el.nativeElement;
    host.classList.add('reveal');
    this.observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        host.classList.add('reveal--visible');
        this.observer?.disconnect();
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    this.observer.observe(host);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

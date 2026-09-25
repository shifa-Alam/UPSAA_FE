import { Directive, ElementRef, Inject, Input, OnChanges, OnDestroy, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LanguageService } from '../../../Services/language.service';

const DURATION_MS = 1400;

/**
 * Renders a number that counts up the first time it scrolls into view:
 * `<span [appCountUp]="total"></span>`, or `[appCountUp]="2003" [countPlain]="true"`
 * for years (no thousands separator, and it starts near the year rather than 0).
 *
 * Formats in the current language (Bangla digits in bn) and re-formats when the
 * language changes. Server render, no IntersectionObserver, or reduced motion → the
 * final value straight away.
 */
@Directive({
  selector: '[appCountUp]',
  standalone: true,
})
export class CountUpDirective implements OnChanges, OnDestroy {
  @Input('appCountUp') value: number | null = null;
  /** Years and codes: no grouping ("2003", not "2,003"). */
  @Input() countPlain = false;
  @Input() countSuffix = '';

  private shown = 0;
  private visible = false;
  private animatedTo: number | null = null;
  private hasAnimated = false;
  private frame = 0;
  private observer?: IntersectionObserver;
  private readonly isBrowser: boolean;
  private readonly reducedMotion: boolean;

  constructor(
    private el: ElementRef<HTMLElement>,
    private lang: LanguageService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.reducedMotion = this.isBrowser && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Re-render in the new locale when the language toggles.
    effect(() => {
      this.lang.lang();
      this.render();
    });

    if (this.isBrowser && typeof IntersectionObserver !== 'undefined' && !this.reducedMotion) {
      this.observer = new IntersectionObserver(entries => {
        if (!entries.some(e => e.isIntersecting)) return;
        this.visible = true;
        this.observer?.disconnect();
        this.start();
      }, { threshold: 0.4 });
      this.observer.observe(this.el.nativeElement);
    } else {
      this.visible = true;
    }
  }

  ngOnChanges(): void {
    if (this.value == null) {
      this.el.nativeElement.textContent = '';
      return;
    }
    if (!this.visible || this.reducedMotion || !this.isBrowser) {
      this.shown = this.visible ? this.value : this.startValue();
      this.render();
      return;
    }
    this.start();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    cancelAnimationFrame(this.frame);
  }

  /** Where the count begins: 0, or ~30 below a year so "2003" doesn't race up from 0. */
  private startValue(): number {
    if (this.value == null) return 0;
    return this.countPlain ? Math.max(0, this.value - 30) : 0;
  }

  private start(): void {
    const target = this.value;
    if (target == null || this.animatedTo === target) return;
    this.animatedTo = target;
    cancelAnimationFrame(this.frame);

    if (this.reducedMotion || !this.isBrowser) {
      this.shown = target;
      this.render();
      return;
    }

    // First time: count up from 0 (or near the year). Later changes — a new filter,
    // a new total — roll from the number already on screen to the new one, faster.
    const first = !this.hasAnimated;
    const from = first ? this.startValue() : this.shown;
    const duration = first ? DURATION_MS : DURATION_MS * 0.55;
    this.hasAnimated = true;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      this.shown = Math.round(from + (target - from) * eased);
      this.render();
      if (p < 1) this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private render(): void {
    if (this.value == null) return;
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    this.el.nativeElement.textContent =
      new Intl.NumberFormat(locale, { useGrouping: !this.countPlain }).format(this.shown) + this.countSuffix;
  }
}

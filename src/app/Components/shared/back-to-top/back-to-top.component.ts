import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

/** Past this many pixels of scrolling the button appears. */
const SHOW_AFTER = 600;

/**
 * Floating "back to top" button for the public pages. Watches the element that
 * actually scrolls (mat-sidenav-content) outside Angular's zone and only re-renders
 * when it crosses the threshold.
 */
@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  template: `
    <button type="button" class="to-top" [class.to-top--shown]="shown" (click)="toTop()"
      [attr.aria-label]="'footer.backToTop' | translate" [attr.title]="'footer.backToTop' | translate"
      [attr.tabindex]="shown ? null : -1" [attr.aria-hidden]="shown ? null : 'true'">
      <mat-icon>arrow_upward</mat-icon>
    </button>
  `,
  styles: [`
    .to-top {
      position: fixed;
      right: 20px;
      bottom: 24px;
      z-index: 900;
      display: grid;
      place-items: center;
      width: 46px;
      height: 46px;
      border: 2px solid #f2c94c;
      border-radius: 50%;
      background: #0b3a82;
      color: #fff;
      box-shadow: 0 10px 26px rgba(7, 29, 64, 0.35);
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transform: translateY(12px) scale(0.9);
      transition: opacity 220ms ease, transform 220ms ease, background 150ms ease;
    }
    .to-top--shown {
      opacity: 1;
      pointer-events: auto;
      transform: none;
    }
    .to-top:hover { background: #0a2f6b; }
    .to-top:focus-visible { outline: 3px solid #f2c94c; outline-offset: 3px; }
    /* Phones: sit above the bottom tab bar. */
    @media (max-width: 768px) {
      .to-top {
        right: 14px;
        bottom: calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom) + 14px);
        width: 42px;
        height: 42px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .to-top { transition: none; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackToTopComponent implements AfterViewInit, OnDestroy {
  shown = false;

  private scroller: HTMLElement | null = null;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly onScroll = () => {
    const show = (this.scroller?.scrollTop ?? 0) > SHOW_AFTER;
    if (show !== this.shown) {
      this.shown = show;
      this.cdr.detectChanges();
    }
  };

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.scroller = this.host.nativeElement.closest('mat-sidenav-content');
    if (!this.scroller) return;
    this.zone.runOutsideAngular(() => this.scroller!.addEventListener('scroll', this.onScroll, { passive: true }));
  }

  ngOnDestroy(): void {
    this.scroller?.removeEventListener('scroll', this.onScroll);
  }

  toTop(): void {
    this.scroller?.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

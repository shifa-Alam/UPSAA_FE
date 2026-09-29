import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, ElementRef, NgZone, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { HelpSheetComponent } from './help-sheet.component';

/**
 * Round "সাহায্য" button in the bottom corner of every member and public page. Opens a
 * card with a big call button, WhatsApp, and the step-by-step payment guide — for people
 * who'd rather phone someone than work out a website.
 * When the page's closing band (.pp-join) or the site footer scrolls into view the button
 * rides up with it, so it never sits on their buttons and links (the page scrolls inside the app shell, so scroll events are
 * caught on the document in the capture phase).
 */
@Component({
  selector: 'app-help-button',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  template: `
    <button type="button" class="help-fab" (click)="open()" [attr.aria-label]="'help.buttonLabel' | translate">
      <mat-icon>support_agent</mat-icon>
      <span class="help-fab__text">{{ 'help.button' | translate }}</span>
    </button>
  `,
  styles: [`
    .help-fab {
      position: fixed;
      z-index: 990; /* under the install card (995) and dialogs */
      right: 16px;
      bottom: 20px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 46px;
      padding: 0 16px 0 12px;
      border: 0;
      border-radius: 999px;
      background: var(--color-heritage-500);
      color: #1a1405;
      font: 700 var(--font-size-base) / 1 var(--font-base);
      translate: 0 calc(var(--help-lift, 0px) * -1);
      box-shadow: 0 6px 20px rgba(2, 12, 32, 0.28);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: transform var(--dur-quick, 120ms) var(--ease-spring, ease);
    }
    .help-fab:hover { transform: translateY(-2px); }
    .help-fab:active { transform: scale(0.96); }
    .help-fab:focus-visible { outline: 3px solid var(--color-primary-600); outline-offset: 3px; }
    .help-fab mat-icon { font-size: 24px; width: 24px; height: 24px; }
    /* Phones: sit above the tab bar. */
    @media (max-width: 768px) {
      .help-fab { right: 12px; bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 12px); }
    }
    @media print { .help-fab { display: none; } }
    @media (prefers-reduced-motion: reduce) { .help-fab { transition: none; } }
  `]
})
export class HelpButtonComponent implements OnInit {
  private dialog = inject(MatDialog);
  private host = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Gap kept between the button and the top of the band / footer. */
  private static readonly FooterGap = 12;

  ngOnInit(): void {
    if (!this.isBrowser) return; // prerender: no page to scroll
    this.zone.runOutsideAngular(() => {
      let frame = 0;
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(() => { frame = 0; this.liftAboveFooter(); });
      };
      document.addEventListener('scroll', schedule, { capture: true, passive: true });
      window.addEventListener('resize', schedule, { passive: true });
      // Route changes swap the page (and its height) without a scroll event.
      const observer = new ResizeObserver(schedule);
      observer.observe(document.body);
      schedule();
      this.destroyRef.onDestroy(() => {
        cancelAnimationFrame(frame);
        document.removeEventListener('scroll', schedule, { capture: true });
        window.removeEventListener('resize', schedule);
        observer.disconnect();
      });
    });
  }

  /** Move the button up by however much the closing band / footer has come up under it. */
  private liftAboveFooter(): void {
    const host = this.host.nativeElement as HTMLElement;
    const button = host.querySelector('.help-fab') as HTMLElement | null;
    // The first of them on the page; a band hidden in the member shell measures 0 × 0.
    const floor = Array.from(document.querySelectorAll<HTMLElement>('.pp-join, app-footer .site-footer'))
      .find(el => el.offsetHeight > 0);
    let lift = 0;
    if (button && floor) {
      const restingBottom = window.innerHeight - (parseFloat(getComputedStyle(button).bottom) || 0);
      const floorTop = floor.getBoundingClientRect().top;
      lift = Math.max(0, restingBottom + HelpButtonComponent.FooterGap - floorTop);
    }
    host.style.setProperty('--help-lift', `${Math.round(lift)}px`);
  }

  open(): void {
    if (this.dialog.openDialogs.some(d => d.componentInstance instanceof HelpSheetComponent)) return;
    this.dialog.open(HelpSheetComponent, { width: '420px', maxWidth: '94vw', autoFocus: 'first-tabbable' });
  }
}

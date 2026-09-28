import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { HelpSheetComponent } from './help-sheet.component';

/**
 * Round "সাহায্য" button in the bottom corner of every member and public page. Opens a
 * card with a big call button, WhatsApp, and the step-by-step payment guide — for people
 * who'd rather phone someone than work out a website.
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
      min-height: 52px;
      padding: 0 18px 0 14px;
      border: 0;
      border-radius: 999px;
      background: var(--color-heritage-500);
      color: #1a1405;
      font: 700 var(--font-size-md) / 1 var(--font-base);
      box-shadow: 0 6px 20px rgba(2, 12, 32, 0.28);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: transform var(--dur-quick, 120ms) var(--ease-spring, ease);
    }
    .help-fab:hover { transform: translateY(-2px); }
    .help-fab:active { transform: scale(0.96); }
    .help-fab:focus-visible { outline: 3px solid var(--color-primary-600); outline-offset: 3px; }
    .help-fab mat-icon { font-size: 26px; width: 26px; height: 26px; }
    /* Phones: sit above the tab bar. */
    @media (max-width: 768px) {
      .help-fab { right: 12px; bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 12px); }
    }
    @media print { .help-fab { display: none; } }
    @media (prefers-reduced-motion: reduce) { .help-fab { transition: none; } }
  `]
})
export class HelpButtonComponent {
  private dialog = inject(MatDialog);

  open(): void {
    if (this.dialog.openDialogs.some(d => d.componentInstance instanceof HelpSheetComponent)) return;
    this.dialog.open(HelpSheetComponent, { width: '420px', maxWidth: '94vw', autoFocus: 'first-tabbable' });
  }
}

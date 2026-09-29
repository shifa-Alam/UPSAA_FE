import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService } from '../../../Services/language.service';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { HELP_PHONE_TEL, HELP_WHATSAPP, helpPhoneDisplay } from '../../../Utils/help-contact';

/** What the help button opens: call, WhatsApp, the payment guide or the member manual (PDF). Big targets, few words. */
@Component({
  selector: 'app-help-sheet',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, TranslatePipe],
  template: `
    <div class="help">
      <h2 class="help__title">{{ 'help.title' | translate }}</h2>
      <p class="help__lead">{{ 'help.lead' | translate }}</p>

      <a class="help__call" [href]="tel">
        <mat-icon>call</mat-icon>
        <span class="help__call-text">
          <span>{{ 'help.call' | translate }}</span>
          <b>{{ phone }}</b>
        </span>
      </a>

      <a class="help__row" [href]="whatsapp" target="_blank" rel="noopener">
        <mat-icon>chat</mat-icon><span>{{ 'help.whatsapp' | translate }}</span><mat-icon class="help__go">chevron_right</mat-icon>
      </a>
      <a class="help__row" [routerLink]="guideLink" (click)="close()">
        <mat-icon>account_balance_wallet</mat-icon><span>{{ 'help.payGuide' | translate }}</span><mat-icon class="help__go">chevron_right</mat-icon>
      </a>
      <a class="help__row" routerLink="/install" (click)="close()">
        <mat-icon>install_mobile</mat-icon><span>{{ 'pwa.install.menu' | translate }}</span><mat-icon class="help__go">chevron_right</mat-icon>
      </a>
      <a class="help__row" [href]="manual" target="_blank" rel="noopener">
        <mat-icon>menu_book</mat-icon><span>{{ 'help.manual' | translate }}</span><mat-icon class="help__go">open_in_new</mat-icon>
      </a>

      <button type="button" class="help__close" (click)="close()">{{ 'help.close' | translate }}</button>
    </div>
  `,
  styles: [`
    .help { display: flex; flex-direction: column; gap: 12px; padding: 20px; }
    .help__title { margin: 0; font-family: var(--font-display); font-size: 24px; color: var(--color-ink-900); }
    .help__lead { margin: 0 0 4px; font-size: var(--font-size-md); color: var(--color-ink-600); }
    .help__call {
      display: flex; align-items: center; gap: 14px; min-height: 72px; padding: 12px 18px;
      border-radius: 18px; background: var(--color-success, #2e7d32); color: #fff; text-decoration: none;
    }
    .help__call mat-icon { font-size: 34px; width: 34px; height: 34px; }
    .help__call-text { display: flex; flex-direction: column; gap: 2px; font-size: var(--font-size-md); }
    .help__call-text b { font-size: 24px; letter-spacing: 0.02em; }
    .help__call:focus-visible, .help__row:focus-visible { outline: 3px solid var(--color-primary-600); outline-offset: 2px; }
    .help__row {
      display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 0 14px;
      border: 1px solid var(--color-ink-200); border-radius: 14px; color: var(--color-ink-900);
      font-size: var(--font-size-md); font-weight: 600; text-decoration: none;
    }
    .help__row mat-icon:first-child { color: var(--color-link); }
    .help__row span { flex: 1; }
    .help__go { color: var(--color-ink-400); }
    .help__close {
      margin-top: 4px; min-height: 48px; border: 0; border-radius: 999px; background: transparent;
      color: var(--color-ink-600); font: 600 var(--font-size-md) / 1 var(--font-base); cursor: pointer;
    }
  `]
})
export class HelpSheetComponent {
  private dialogRef = inject(MatDialogRef<HelpSheetComponent>);
  private router = inject(Router);
  private lang = inject(LanguageService);

  readonly tel = HELP_PHONE_TEL;
  readonly whatsapp = HELP_WHATSAPP;
  /** The member manual — Bangla and English with screenshots (public/guides). */
  readonly manual = '/guides/UPSAA-Member-Manual.pdf';
  readonly guideLink = this.router.url.startsWith('/portal') ? '/portal/help/pay' : '/help/pay';

  get phone(): string {
    return helpPhoneDisplay(this.lang.lang());
  }

  close(): void {
    this.dialogRef.close();
  }
}

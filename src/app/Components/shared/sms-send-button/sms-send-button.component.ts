import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SmsItemKind, SmsItemStatus, SmsService } from '../../../Services/sms.service';
import { LanguageService } from '../../../Services/language.service';
import { SnackbarService } from '../../../Services/snackbar.service';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { SmsSendDialogComponent, SmsSendDialogData, SmsSendDialogResult } from './sms-send-dialog.component';

/**
 * A notice/event row's "এখনই SMS দিন" for admins — like "post on Facebook now": shows that it
 * went ("SMS: 435 · 29 Sep") or is waiting ("SMS at 30 Sep 10:00 AM"), and sends to every
 * active member now or at a chosen time after a dialog that says how many. A second send
 * says it already went, so nobody is texted twice by accident.
 */
@Component({
  selector: 'app-sms-send-button',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  template: `
    <span class="sms-btn">
      <span class="sms-btn__done" *ngIf="status?.sent">
        <mat-icon>sms</mat-icon>{{ 'smsSend.sentTo' | translate }} {{ num(status!.sent) }}<ng-container *ngIf="status!.last"> · {{ day(status!.last!) }}</ng-container>
      </span>
      <span class="sms-btn__wait" *ngIf="status?.scheduledAt">
        <mat-icon>schedule</mat-icon>{{ 'smsSend.waitingAt' | translate }} {{ dayTime(status!.scheduledAt!) }}
      </span>
      <button type="button" class="sms-btn__go" [disabled]="busy" (click)="send()">
        <mat-icon>{{ busy ? 'hourglass_top' : 'send_to_mobile' }}</mat-icon>
        {{ (status?.sent ? 'smsSend.sendAgain' : 'smsSend.send') | translate }}
      </button>
    </span>
  `,
  styles: [`
    .sms-btn { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; font-size: var(--font-size-xs); }
    .sms-btn__done { display: inline-flex; align-items: center; gap: 4px; color: var(--color-success, #2e7d32); font-weight: 600; }
    .sms-btn__wait { display: inline-flex; align-items: center; gap: 4px; color: var(--color-link); font-weight: 600; }
    .sms-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .sms-btn__go {
      appearance: none; display: inline-flex; align-items: center; gap: 4px; min-height: 32px; padding: 0 10px;
      border: 1px solid var(--color-ink-200); border-radius: 999px; background: transparent;
      color: var(--color-link); font: 600 var(--font-size-xs) / 1 var(--font-base); cursor: pointer;
    }
    .sms-btn__go:hover:not(:disabled) { border-color: var(--color-primary-600); background: var(--color-primary-50); }
    .sms-btn__go:disabled { opacity: 0.6; cursor: default; }
  `]
})
export class SmsSendButtonComponent {
  @Input({ required: true }) kind!: SmsItemKind;
  @Input({ required: true }) itemId!: number;
  @Input() status: SmsItemStatus | null = null;
  @Output() sent = new EventEmitter<number>();

  busy = false;

  private api = inject(SmsService);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private lang = inject(LanguageService);

  send(): void {
    if (this.busy) return;
    this.busy = true;
    this.api.audience({ target: 'all' }).subscribe({
      next: a => {
        this.busy = false;
        const again = !!this.status?.sent;
        const data: SmsSendDialogData = {
          title: this.lang.translate(this.kind === 'notice' ? 'smsSend.titleNotice' : 'smsSend.titleEvent'),
          reach: a.count, left: a.left, allowLater: true, again,
        };
        this.dialog.open<SmsSendDialogComponent, SmsSendDialogData, SmsSendDialogResult>(SmsSendDialogComponent,
          { data, width: '460px', maxWidth: '94vw' }).afterClosed().subscribe(r => { if (r) this.go(again, r.when); });
      },
      error: err => { this.busy = false; this.snackbar.showError(err?.error?.message ?? this.lang.translate('smsSend.failed')); }
    });
  }

  private go(again: boolean, when: string | null): void {
    this.busy = true;
    this.api.sendItem(this.kind, this.itemId, again, when).subscribe({
      next: r => {
        this.busy = false;
        if (r.scheduled) {
          this.status = { ...(this.status ?? { sent: 0, failed: 0, last: null }), scheduledAt: r.sendAt ?? when };
          this.snackbar.showSuccess(`${this.lang.translate('smsSend.scheduled')} ${this.dayTime(r.sendAt ?? when!)}`);
        } else {
          this.status = { sent: r.queued ?? 0, failed: 0, last: new Date().toISOString(), scheduledAt: this.status?.scheduledAt ?? null };
          this.snackbar.showSuccess(`${this.num(r.queued ?? 0)} ${this.lang.translate('smsSend.queued')}`);
        }
        this.sent.emit(r.queued ?? 0);
      },
      error: err => { this.busy = false; this.snackbar.showError(err?.error?.message ?? this.lang.translate('smsSend.failed')); }
    });
  }

  num(n: number): string {
    return new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB').format(n);
  }

  day(d: string): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  }

  /** A Bangladesh wall-clock time from the API ("2026-09-30T10:00:00"). */
  dayTime(d: string): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Date(d.slice(0, 16) + ':00+06:00').toLocaleString(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }
}

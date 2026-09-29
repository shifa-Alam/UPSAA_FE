import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ScheduledSms, SmsService } from '../../Services/sms.service';
import { ConfirmService } from '../../Services/confirm.service';
import { LanguageService } from '../../Services/language.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { TranslatePipe } from '../../Pipes/translate.pipe';

/** SMS set for later that haven't gone yet — when, what, to whom — with Cancel. */
@Component({
  selector: 'app-sms-scheduled-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  template: `
    <p class="empty" *ngIf="loaded && rows.length === 0">{{ 'smsScheduled.empty' | translate }}</p>
    <ul class="rows" *ngIf="rows.length">
      <li class="row" *ngFor="let r of rows">
        <span class="row__when"><mat-icon>schedule</mat-icon>{{ when(r.sendAt) }}</span>
        <span class="row__main">
          <b>{{ ('smsScheduled.kind_' + r.kind) | translate }}</b> · {{ to(r) }}
          <small class="row__text" *ngIf="r.text">{{ r.text }}</small>
        </span>
        <button type="button" class="row__cancel" [disabled]="busyId === r.id" (click)="cancel(r)">
          <mat-icon>{{ busyId === r.id ? 'hourglass_top' : 'close' }}</mat-icon> {{ 'smsScheduled.cancel' | translate }}
        </button>
      </li>
    </ul>
  `,
  styles: [`
    .empty { margin: 0; padding: 16px 20px; color: var(--color-ink-600); }
    .rows { list-style: none; margin: 0; padding: 0; }
    .row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px 14px; padding: 12px 20px; }
    .row + .row { border-top: 1px solid var(--color-ink-100); }
    .row__when { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; color: var(--color-link); white-space: nowrap; }
    .row__main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .row__text { color: var(--color-ink-600); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .row mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .row__cancel { display: inline-flex; align-items: center; gap: 4px; min-height: 36px; padding: 0 12px;
      border: 1px solid var(--color-ink-200); border-radius: 999px; background: transparent; color: var(--color-ink-700);
      font: 600 var(--font-size-xs) / 1 var(--font-base); cursor: pointer; }
    .row__cancel:hover:not(:disabled) { border-color: #c62828; color: #c62828; }
    @media (max-width: 560px) { .row { grid-template-columns: 1fr auto; } .row__main { grid-column: 1 / -1; grid-row: 2; } }
  `]
})
export class SmsScheduledListComponent implements OnInit {
  private api = inject(SmsService);
  private confirm = inject(ConfirmService);
  private lang = inject(LanguageService);
  private snackbar = inject(SnackbarService);

  rows: ScheduledSms[] = [];
  loaded = false;
  busyId: number | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.scheduled().subscribe({
      next: r => { this.rows = r; this.loaded = true; },
      error: () => { this.rows = []; this.loaded = true; }
    });
  }

  cancel(r: ScheduledSms): void {
    this.confirm.ask({ message: this.lang.translate('smsScheduled.cancelQuestion'), confirmText: this.lang.translate('smsScheduled.cancel'), danger: true })
      .subscribe(ok => {
        if (!ok) return;
        this.busyId = r.id;
        this.api.cancelScheduled(r.id).subscribe({
          next: () => { this.busyId = null; this.snackbar.showSuccess(this.lang.translate('smsScheduled.cancelled')); this.load(); },
          error: err => { this.busyId = null; this.snackbar.showError(err?.error?.message ?? this.lang.translate('smsSend.failed')); this.load(); }
        });
      });
  }

  to(r: ScheduledSms): string {
    const a = r.audience;
    if (!a || a.target === 'all') return this.lang.translate('smsScheduled.toAll');
    if (a.target === 'batch') return `${this.lang.translate('smsScheduled.toBatch')} ${a.batch}`;
    if (a.target === 'members') return `${a.memberIds?.length ?? 0} ${this.lang.translate('smsScheduled.toMembers')}`;
    return a.phone ?? '';
  }

  /** A Bangladesh wall-clock time from the API. */
  when(d: string): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Date(d.slice(0, 16) + ':00+06:00').toLocaleString(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SmsLogRow, SmsService, SmsStatus } from '../../Services/sms.service';
import { LanguageService } from '../../Services/language.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';

/**
 * SMS: which automatic texts go out (payment receipts, event reminders), a monthly cap so
 * the bill can't run away, this month's usage, a test SMS, and the log. Notice SMS are
 * chosen per notice on the Notices screen.
 */
@Component({
  selector: 'app-sms-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, AdminHeaderComponent, SectionCardComponent, EmptyStateComponent,
    SkeletonComponent, TranslatePipe],
  templateUrl: './sms-admin.component.html',
  styleUrl: './sms-admin.component.scss'
})
export class SmsAdminComponent implements OnInit {
  private api = inject(SmsService);
  private lang = inject(LanguageService);
  private snackbar = inject(SnackbarService);

  status: SmsStatus | null = null;
  log: SmsLogRow[] = [];
  loading = true;
  loadError = false;
  saving = false;
  testPhone = '';
  testing = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.status().subscribe({
      next: s => { this.status = { ...s }; this.loading = false; this.loadError = false; },
      error: () => { this.loading = false; this.loadError = true; }
    });
    this.api.log().subscribe({ next: rows => this.log = rows, error: () => this.log = [] });
  }

  save(): void {
    if (!this.status) return;
    this.saving = true;
    this.api.save({
      smsPaymentReceipts: this.status.smsPaymentReceipts,
      smsEventReminders: this.status.smsEventReminders,
      smsMonthlyLimit: Number(this.status.smsMonthlyLimit) || 0,
    }).subscribe({
      next: s => { this.saving = false; this.status = { ...s }; this.snackbar.showSuccess(this.lang.translate('smsAdmin.saved')); },
      error: err => { this.saving = false; this.snackbar.showError(err?.error?.message ?? this.lang.translate('smsAdmin.failed')); }
    });
  }

  sendTest(): void {
    if (!this.testPhone.trim() || this.testing) return;
    this.testing = true;
    this.api.test(this.testPhone.trim()).subscribe({
      next: r => {
        this.testing = false;
        const msg = this.lang.translate('smsAdmin.testResult_' + r.status);
        r.status === 'sent' ? this.snackbar.showSuccess(msg) : this.snackbar.showError(r.error ? `${msg} (${r.error})` : msg);
        this.load();
      },
      error: err => { this.testing = false; this.snackbar.showError(err?.error?.message ?? this.lang.translate('smsAdmin.failed')); }
    });
  }

  get usedPercent(): number {
    const s = this.status;
    return s && s.smsMonthlyLimit > 0 ? Math.min(100, Math.round((s.usedThisMonth / s.smsMonthlyLimit) * 100)) : 100;
  }

  statusPill(s: SmsLogRow['status']): string {
    return { sent: 'pill--success', failed: 'pill--danger', limit: 'pill--warning', disabled: 'pill--neutral' }[s];
  }

  num(n: number): string {
    return new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB').format(n);
  }

  when(d: string): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Date(d).toLocaleString(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }
}

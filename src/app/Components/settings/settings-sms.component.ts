import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SmsLogRow, SmsService, SmsStatus } from '../../Services/sms.service';
import { LanguageService } from '../../Services/language.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
import { ConfigFieldsComponent } from './config-fields.component';
import { AuthService } from '../../Services/auth.service';

/**
 * Settings › SMS: which texts go out by themselves (payment receipts, event reminders), the
 * monthly cap, this month's usage against it, and a test SMS. The log stays on the SMS page.
 */
@Component({
  selector: 'app-settings-sms',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink, TranslatePipe, SectionCardComponent, SkeletonComponent, ConfigFieldsComponent],
  templateUrl: './settings-sms.component.html',
  styleUrl: './settings-tabs.scss'
})
export class SettingsSmsComponent implements OnInit {
  private api = inject(SmsService);
  private lang = inject(LanguageService);
  private snackbar = inject(SnackbarService);
  private auth = inject(AuthService);

  /** The gateway itself (API key, sender id, on/off) is SuperAdmin-only. */
  get isSuperAdmin(): boolean {
    return this.auth.hasRole('SuperAdmin');
  }

  /** After the gateway changes: is SMS on now? */
  reloadStatus(): void {
    this.api.status().subscribe({ next: s => this.status = { ...s } });
  }

  status: SmsStatus | null = null;
  loading = true;
  saving = false;
  testPhone = '';
  testing = false;

  ngOnInit(): void {
    this.api.status().subscribe({
      next: s => { this.status = { ...s }; this.loading = false; },
      error: () => { this.loading = false; this.snackbar.showError(this.lang.translate('smsAdmin.errorMessage')); }
    });
  }

  save(): void {
    if (!this.status || this.saving) return;
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
        this.api.status().subscribe({ next: s => this.status = { ...s } });
      },
      error: err => { this.testing = false; this.snackbar.showError(err?.error?.message ?? this.lang.translate('smsAdmin.failed')); }
    });
  }

  get usedPercent(): number {
    const s = this.status;
    return s && s.smsMonthlyLimit > 0 ? Math.min(100, Math.round((s.usedThisMonth / s.smsMonthlyLimit) * 100)) : 100;
  }

  num(n: number): string {
    return new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB').format(n);
  }

  // Keeps SmsLogRow referenced for the status type used by the test result keys.
  protected readonly _statusType?: SmsLogRow['status'];
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  METHOD_NAMES, Payment, PaymentPurpose, PaymentService, PaymentSettings, PaymentStatus
} from '../../Services/payment.service';
import { LanguageService } from '../../Services/language.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { ConfirmService } from '../../Services/confirm.service';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { PaymentRecordComponent } from './payment-record.component';
import { printReceipt } from '../member-payments/payment-receipt';

/**
 * Treasurer's queue: members' bKash / Nagad / Rocket payments waiting to be matched with
 * the wallet app. Approve books the income in the ledger (and settles the member's
 * unpaid fee); reject needs a reason, which the member sees. Also where the receiving
 * numbers and fee amounts are set.
 */
@Component({
  selector: 'app-payment-admin',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, MatIconModule, PaymentRecordComponent, AdminHeaderComponent, SectionCardComponent, EmptyStateComponent,
    SkeletonComponent, TranslatePipe],
  templateUrl: './payment-admin.component.html',
  styleUrl: './payment-admin.component.scss'
})
export class PaymentAdminComponent implements OnInit {
  private api = inject(PaymentService);
  private lang = inject(LanguageService);
  private snackbar = inject(SnackbarService);
  private confirm = inject(ConfirmService);

  readonly Status = PaymentStatus;
  readonly methodNames = METHOD_NAMES;
  readonly tabs: PaymentStatus[] = [PaymentStatus.Pending, PaymentStatus.Approved, PaymentStatus.Rejected];

  tab: PaymentStatus = PaymentStatus.Pending;
  items: Payment[] = [];
  counts: Record<PaymentStatus, number> = { [PaymentStatus.Pending]: 0, [PaymentStatus.Approved]: 0, [PaymentStatus.Rejected]: 0 };
  loading = true;
  loadError = false;

  busyId: number | null = null;
  rejectingId: number | null = null;
  rejectReason = '';
  copiedId: number | null = null;

  settings: PaymentSettings = { bkashNumber: '', nagadNumber: '', rocketNumber: '', instructions: '', membershipFee: 100, annualFee: 0 };

  ngOnInit(): void {
    this.load();
    this.api.settings().subscribe({
      next: s => {
        this.settings = { ...s };
      }
    });
  }

  load(): void {
    this.loading = true;
    this.api.list(this.tab).subscribe({
      next: res => {
        this.items = res.items;
        this.counts = { [PaymentStatus.Pending]: res.pending, [PaymentStatus.Approved]: res.approved, [PaymentStatus.Rejected]: res.rejected };
        this.loading = false;
        this.loadError = false;
      },
      error: () => { this.loading = false; this.loadError = true; }
    });
  }

  switchTab(s: PaymentStatus): void {
    if (s === this.tab) return;
    this.tab = s;
    this.rejectingId = null;
    this.load();
  }

  approve(p: Payment): void {
    const message = `${this.money(p.amount)} · ${METHOD_NAMES[p.method]} ${p.transactionId} — ${this.lang.translate('paymentAdmin.approveQuestion')}`;
    this.confirm.ask({ title: p.memberName, message, confirmText: this.lang.translate('paymentAdmin.approve') }).subscribe(ok => {
      if (!ok) return;
      this.busyId = p.id;
      this.api.approve(p.id).subscribe({
        next: () => { this.busyId = null; this.snackbar.showSuccess(this.lang.translate('paymentAdmin.approved')); this.load(); },
        error: err => { this.busyId = null; this.snackbar.showError(err?.error?.message ?? this.lang.translate('paymentAdmin.failed')); this.load(); }
      });
    });
  }

  startReject(p: Payment): void {
    this.rejectingId = p.id;
    this.rejectReason = '';
  }

  confirmReject(p: Payment): void {
    const reason = this.rejectReason.trim();
    if (!reason) {
      this.snackbar.showError(this.lang.translate('paymentAdmin.reasonRequired'));
      return;
    }
    this.busyId = p.id;
    this.api.reject(p.id, reason).subscribe({
      next: () => { this.busyId = null; this.rejectingId = null; this.snackbar.showSuccess(this.lang.translate('paymentAdmin.rejected')); this.load(); },
      error: err => { this.busyId = null; this.snackbar.showError(err?.error?.message ?? this.lang.translate('paymentAdmin.failed')); this.load(); }
    });
  }

  /** A mistaken approval or rejection goes back to "pending" (the member is told). */
  undo(p: Payment): void {
    const key = p.status === PaymentStatus.Approved ? 'paymentAdmin.undoApprovedQuestion' : 'paymentAdmin.undoRejectedQuestion';
    this.confirm.ask({
      title: `${p.memberName} · ${this.money(p.amount)}`,
      message: this.lang.translate(key),
      confirmText: this.lang.translate('paymentAdmin.undo'),
      danger: p.status === PaymentStatus.Approved,
    }).subscribe(ok => {
      if (!ok) return;
      this.busyId = p.id;
      this.api.undo(p.id).subscribe({
        next: () => { this.busyId = null; this.snackbar.showSuccess(this.lang.translate('paymentAdmin.undone')); this.load(); },
        error: err => { this.busyId = null; this.snackbar.showError(err?.error?.message ?? this.lang.translate('paymentAdmin.failed')); this.load(); }
      });
    });
  }

  /** A payment the treasurer just entered is already approved: refresh the counts and lists. */
  onRecorded(): void {
    this.load();
  }

  receipt(p: Payment): void {
    printReceipt(p, this.lang);
  }

  async copyTrx(p: Payment): Promise<void> {
    try {
      await navigator.clipboard.writeText(p.transactionId);
      this.copiedId = p.id;
      setTimeout(() => this.copiedId = null, 2000);
    } catch { /* clipboard blocked — the ID is on screen anyway */ }
  }

  tabKey(s: PaymentStatus): string {
    return s === PaymentStatus.Approved ? 'payments.statusApproved'
      : s === PaymentStatus.Rejected ? 'payments.statusRejected' : 'payments.statusPending';
  }

  purposeKey(p: PaymentPurpose): string {
    return p === PaymentPurpose.Membership ? 'payments.purposeMembership'
      : p === PaymentPurpose.Annual ? 'payments.purposeAnnual' : 'payments.purposeDonation';
  }

  money(n: number): string {
    return '৳' + new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB', { maximumFractionDigits: 2 }).format(n);
  }

  num(n: number, plain = false): string {
    return new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB', { useGrouping: !plain }).format(n);
  }

  date(value: string): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Date(value).toLocaleString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
}

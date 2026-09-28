import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  METHOD_NAMES, Payment, PaymentMethod, PaymentPurpose, PaymentService, PaymentSettings, PaymentStatus
} from '../../Services/payment.service';
import { LanguageService } from '../../Services/language.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { printReceipt } from './payment-receipt';
import { Campaign, CampaignService } from '../../Services/campaign.service';

interface Wallet {
  method: PaymentMethod;
  name: string;
  number: string;
}

/**
 * Members pay dues and donations: send money by bKash / Nagad / Rocket "Send Money" to the
 * association's number, then submit the transaction ID here. The treasurer verifies it;
 * approved payments get a printable receipt.
 */
@Component({
  selector: 'app-member-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, AdminHeaderComponent, SectionCardComponent, EmptyStateComponent,
    SkeletonComponent, TranslatePipe],
  templateUrl: './member-payments.component.html',
  styleUrl: './member-payments.component.scss'
})
export class MemberPaymentsComponent implements OnInit {
  private api = inject(PaymentService);
  private lang = inject(LanguageService);
  private snackbar = inject(SnackbarService);
  private campaignsApi = inject(CampaignService);
  private route = inject(ActivatedRoute);

  /** Campaigns open for donations (for the optional "towards" picker). */
  campaigns: Campaign[] = [];

  readonly Purpose = PaymentPurpose;
  readonly Status = PaymentStatus;
  readonly methodNames = METHOD_NAMES;

  settings: PaymentSettings | null = null;
  wallets: Wallet[] = [];
  history: Payment[] = [];
  loading = true;
  loadError = false;
  submitting = false;
  copied: PaymentMethod | null = null;

  form = this.blankForm();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    forkJoin({
      settings: this.api.settings(),
      history: this.api.mine().pipe(catchError(() => of([] as Payment[]))),
      campaigns: this.campaignsApi.list().pipe(catchError(() => of([] as Campaign[]))),
    }).subscribe({
      next: ({ settings, history, campaigns }) => {
        this.settings = settings;
        this.history = history;
        this.campaigns = campaigns.filter(c => c.isOpen);
        this.wallets = ([
          [PaymentMethod.Bkash, settings.bkashNumber],
          [PaymentMethod.Nagad, settings.nagadNumber],
          [PaymentMethod.Rocket, settings.rocketNumber],
        ] as [PaymentMethod, string | null][])
          .filter(([, n]) => !!n)
          .map(([method, number]) => ({ method, name: METHOD_NAMES[method], number: number! }));
        if (!this.wallets.some(w => w.method === this.form.method)) this.form.method = this.wallets[0]?.method ?? PaymentMethod.Bkash;
        // Arriving from a campaign's "Donate" button: that campaign, as a donation.
        const fromCampaign = Number(this.route.snapshot.queryParamMap.get('campaign'));
        if (this.campaigns.some(c => c.id === fromCampaign)) {
          this.pickPurpose(PaymentPurpose.Donation);
          this.form.campaignId = fromCampaign;
        } else {
          this.pickPurpose(settings.membershipDue ? PaymentPurpose.Membership : PaymentPurpose.Donation);
        }
        this.loading = false;
      },
      error: () => { this.loading = false; this.loadError = true; }
    });
  }

  get purposes(): PaymentPurpose[] {
    const s = this.settings;
    if (!s) return [];
    return [
      ...(s.membershipDue ? [PaymentPurpose.Membership] : []),
      ...(s.annualFee > 0 ? [PaymentPurpose.Annual] : []),
      PaymentPurpose.Donation,
    ];
  }

  /** Fees have a fixed amount; donations are whatever the member chooses. */
  get amountFixed(): boolean {
    return this.form.purpose !== PaymentPurpose.Donation;
  }

  get selectedWallet(): Wallet | undefined {
    return this.wallets.find(w => w.method === this.form.method);
  }

  get pendingCount(): number {
    return this.history.filter(p => p.status === PaymentStatus.Pending).length;
  }

  pickPurpose(p: PaymentPurpose): void {
    this.form.purpose = p;
    const s = this.settings;
    if (p === PaymentPurpose.Membership) this.form.amount = s?.membershipFee ?? null;
    else if (p === PaymentPurpose.Annual) this.form.amount = s?.annualFee ?? null;
    else this.form.amount = null;
  }

  async copy(w: Wallet): Promise<void> {
    try {
      await navigator.clipboard.writeText(w.number);
      this.copied = w.method;
      setTimeout(() => this.copied = null, 2000);
    } catch {
      this.snackbar.showError(w.number);
    }
  }

  submit(): void {
    const f = this.form;
    if (!f.amount || !f.senderNumber.trim() || !f.transactionId.trim()) {
      this.snackbar.showError(this.lang.translate('payments.fillAll'));
      return;
    }
    this.submitting = true;
    this.api.submit({
      purpose: f.purpose,
      amount: Number(f.amount),
      method: f.method,
      senderNumber: f.senderNumber,
      transactionId: f.transactionId,
      note: f.note.trim() || undefined,
      campaignId: f.purpose === PaymentPurpose.Donation ? f.campaignId : null,
      showDonorName: f.purpose === PaymentPurpose.Donation && !!f.campaignId && f.showDonorName,
    }).subscribe({
      next: p => {
        this.submitting = false;
        this.history = [p, ...this.history];
        this.snackbar.showSuccess(this.lang.translate('payments.submitted'));
        const method = f.method;
        this.form = this.blankForm();
        this.form.method = method;
        this.pickPurpose(PaymentPurpose.Donation);
        // A membership payment waiting for review shouldn't be offered again.
        if (p.purpose === PaymentPurpose.Membership && this.settings) this.settings = { ...this.settings, membershipDue: false };
      },
      error: err => {
        this.submitting = false;
        this.snackbar.showError(err?.error?.message ?? this.lang.translate('payments.submitFailed'));
      }
    });
  }

  receipt(p: Payment): void {
    printReceipt(p, this.lang);
  }

  purposeKey(p: PaymentPurpose): string {
    return p === PaymentPurpose.Membership ? 'payments.purposeMembership'
      : p === PaymentPurpose.Annual ? 'payments.purposeAnnual' : 'payments.purposeDonation';
  }

  statusKey(s: PaymentStatus): string {
    return s === PaymentStatus.Approved ? 'payments.statusApproved'
      : s === PaymentStatus.Rejected ? 'payments.statusRejected' : 'payments.statusPending';
  }

  statusPill(s: PaymentStatus): string {
    return s === PaymentStatus.Approved ? 'pill--success' : s === PaymentStatus.Rejected ? 'pill--danger' : 'pill--warning';
  }

  num(n: number): string {
    return new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB').format(n);
  }

  money(n: number): string {
    return '৳' + new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB', { maximumFractionDigits: 2 }).format(n);
  }

  date(value: string): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Date(value).toLocaleString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  private blankForm() {
    return {
      purpose: PaymentPurpose.Donation,
      amount: null as number | null,
      method: PaymentMethod.Bkash,
      senderNumber: '',
      transactionId: '',
      note: '',
      campaignId: null as number | null,
      showDonorName: false,
    };
  }
}

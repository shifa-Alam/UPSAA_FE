import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  MemberLookup, Payment, PaymentMethod, PaymentPurpose, PaymentService, PaymentSettings
} from '../../Services/payment.service';
import { Campaign, CampaignService } from '../../Services/campaign.service';
import { LanguageService } from '../../Services/language.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { printReceipt } from '../member-payments/payment-receipt';

/**
 * Treasurer's "record a payment" form — for members who don't use the site: cash handed
 * over, or a bKash/Nagad/Rocket TrxID read out on the phone. Find the member, pick what
 * it's for, save; then print a paper receipt to hand over.
 */
@Component({
  selector: 'app-payment-record',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslatePipe],
  templateUrl: './payment-record.component.html',
  styleUrl: './payment-record.component.scss'
})
export class PaymentRecordComponent implements OnInit {
  @Input() settings: PaymentSettings | null = null;
  @Output() recorded = new EventEmitter<Payment>();

  private api = inject(PaymentService);
  private campaignsApi = inject(CampaignService);
  private lang = inject(LanguageService);
  private snackbar = inject(SnackbarService);

  readonly Purpose = PaymentPurpose;
  readonly Method = PaymentMethod;
  readonly methods: { value: PaymentMethod; key: string }[] = [
    { value: PaymentMethod.Cash, key: 'paymentRecord.methodCash' },
    { value: PaymentMethod.Bkash, key: 'bKash' },
    { value: PaymentMethod.Nagad, key: 'Nagad' },
    { value: PaymentMethod.Rocket, key: 'Rocket' },
  ];

  query = '';
  results: MemberLookup[] = [];
  searching = false;
  member: MemberLookup | null = null;
  private query$ = new Subject<string>();

  campaigns: Campaign[] = [];
  saving = false;
  last: Payment | null = null;

  form = this.blank();

  ngOnInit(): void {
    this.query$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.trim().length < 2) return of([] as MemberLookup[]);
        this.searching = true;
        return this.api.lookup(q.trim()).pipe(catchError(() => of([] as MemberLookup[])));
      })
    ).subscribe(list => { this.results = list; this.searching = false; });
    this.campaignsApi.all().pipe(catchError(() => of([] as Campaign[]))).subscribe(list => this.campaigns = list.filter(c => c.isPublished));
  }

  onQuery(): void {
    this.query$.next(this.query);
  }

  pick(m: MemberLookup): void {
    this.member = m;
    this.results = [];
    this.query = '';
    this.last = null;
    this.setPurpose(m.membershipDue ? PaymentPurpose.Membership : PaymentPurpose.Donation);
  }

  clearMember(): void {
    this.member = null;
    this.form = this.blank();
  }

  get purposes(): PaymentPurpose[] {
    return [
      ...(this.member?.membershipDue ? [PaymentPurpose.Membership] : []),
      ...((this.settings?.annualFee ?? 0) > 0 ? [PaymentPurpose.Annual] : []),
      PaymentPurpose.Donation,
    ];
  }

  setPurpose(p: PaymentPurpose): void {
    this.form.purpose = p;
    if (p === PaymentPurpose.Membership) this.form.amount = this.settings?.membershipFee ?? 100;
    else if (p === PaymentPurpose.Annual) this.form.amount = this.settings?.annualFee ?? null;
    else this.form.amount = null;
    if (p !== PaymentPurpose.Donation) this.form.campaignId = null;
  }

  get isCash(): boolean {
    return this.form.method === PaymentMethod.Cash;
  }

  save(): void {
    if (!this.member) return;
    if (!this.form.amount || this.form.amount <= 0) {
      this.snackbar.showError(this.lang.translate('paymentRecord.amountRequired'));
      return;
    }
    if (!this.isCash && !this.form.transactionId.trim()) {
      this.snackbar.showError(this.lang.translate('paymentRecord.trxRequired'));
      return;
    }
    this.saving = true;
    this.api.record({
      memberId: this.member.id,
      purpose: this.form.purpose,
      amount: Number(this.form.amount),
      method: this.form.method,
      transactionId: this.isCash ? undefined : this.form.transactionId,
      senderNumber: this.isCash ? undefined : this.form.senderNumber,
      campaignId: this.form.purpose === PaymentPurpose.Donation ? this.form.campaignId : null,
      showDonorName: !!this.form.campaignId && this.form.showDonorName,
      note: this.form.note.trim() || undefined,
    }).subscribe({
      next: p => {
        this.saving = false;
        this.last = p;
        this.snackbar.showSuccess(`${this.lang.translate('paymentRecord.saved')} ${p.receiptNo}`);
        this.recorded.emit(p);
        // Ready for the next person in the queue.
        this.member = null;
        this.form = this.blank();
      },
      error: err => {
        this.saving = false;
        this.snackbar.showError(err?.error?.message ?? this.lang.translate('paymentAdmin.failed'));
      }
    });
  }

  printLast(): void {
    if (this.last) printReceipt(this.last, this.lang);
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

  private blank() {
    return {
      purpose: PaymentPurpose.Donation,
      amount: null as number | null,
      method: PaymentMethod.Cash,
      transactionId: '',
      senderNumber: '',
      campaignId: null as number | null,
      showDonorName: false,
      note: '',
    };
  }
}

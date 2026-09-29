import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { SmsAudience, SmsService, smsParts } from '../../Services/sms.service';
import { MemberLookup, PaymentService } from '../../Services/payment.service';
import { MemberService, PublicBatch } from '../../Services/member.service';
import { ConfirmService } from '../../Services/confirm.service';
import { LanguageService } from '../../Services/language.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { SmsSendDialogComponent } from '../shared/sms-send-button/sms-send-dialog.component';

/**
 * "Write an SMS": the message (with a live count of SMS parts), then who it goes to —
 * every active member, one batch, chosen members, or one number. Shows how many people it
 * reaches and whether this month's SMS allowance covers it before anything is sent.
 */
@Component({
  selector: 'app-sms-compose',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslatePipe],
  templateUrl: './sms-compose.component.html',
  styleUrl: './sms-compose.component.scss'
})
export class SmsComposeComponent implements OnInit {
  @Output() sent = new EventEmitter<number>();

  private api = inject(SmsService);
  private payments = inject(PaymentService);
  private members = inject(MemberService);
  private confirm = inject(ConfirmService);
  private lang = inject(LanguageService);
  private snackbar = inject(SnackbarService);

  readonly maxLength = 600;
  readonly targets: SmsAudience['target'][] = ['all', 'batch', 'members', 'phone'];

  message = '';
  target: SmsAudience['target'] = 'all';
  batch: number | null = null;
  phone = '';
  picked: MemberLookup[] = [];
  batches: PublicBatch[] = [];

  query = '';
  results: MemberLookup[] = [];
  private query$ = new Subject<string>();

  /** false = now; true = at `at` (Bangladesh time). */
  later = false;
  at = SmsSendDialogComponent.bdLocal(new Date(new Date().setHours(0, 0, 0, 0) + 34 * 3600e3));
  readonly minAt = SmsSendDialogComponent.bdLocal(new Date(Date.now() + 2 * 60e3));

  reach: { count: number; left: number } | null = null;
  reachError: string | null = null;
  private reach$ = new Subject<void>();
  sending = false;

  ngOnInit(): void {
    this.members.getPublicBatchSummary().pipe(catchError(() => of([] as PublicBatch[])))
      .subscribe(b => this.batches = [...b].sort((x, y) => y.batch - x.batch));
    this.query$.pipe(
      debounceTime(250), distinctUntilChanged(),
      switchMap(q => q.trim().length < 2 ? of([] as MemberLookup[]) : this.payments.lookup(q.trim()).pipe(catchError(() => of([] as MemberLookup[]))))
    ).subscribe(r => this.results = r.filter(m => !this.picked.some(p => p.id === m.id)));
    this.reach$.pipe(
      debounceTime(300),
      switchMap(() => {
        const a = this.audience();
        if (!a) return of(null);
        return this.api.audience(a).pipe(catchError(err => { this.reachError = err?.error?.message ?? null; return of(null); }));
      })
    ).subscribe(r => { this.reach = r; if (r) this.reachError = null; });
    this.recount();
  }

  get parts(): number {
    return smsParts(this.message.trim());
  }

  /** SMS parts × people — what the send will cost in SMS. */
  get total(): number {
    return (this.reach?.count ?? 0) * Math.max(1, this.parts);
  }

  get enough(): boolean {
    return !!this.reach && this.reach.count <= this.reach.left;
  }

  get canSend(): boolean {
    return !this.sending && !!this.message.trim() && this.message.length <= this.maxLength && !!this.reach && this.reach.count > 0 && this.enough
      && (!this.later || (!!this.at && this.at >= this.minAt));
  }

  setTarget(t: SmsAudience['target']): void {
    this.target = t;
    this.recount();
  }

  onQuery(): void {
    this.query$.next(this.query);
  }

  pick(m: MemberLookup): void {
    if (!this.picked.some(p => p.id === m.id)) this.picked = [...this.picked, m];
    this.results = [];
    this.query = '';
    this.recount();
  }

  unpick(m: MemberLookup): void {
    this.picked = this.picked.filter(p => p.id !== m.id);
    this.recount();
  }

  recount(): void {
    this.reach = null;
    this.reachError = null;
    this.reach$.next();
  }

  send(): void {
    const a = this.audience();
    if (!a || !this.canSend) return;
    const text = this.message.trim();
    this.confirm.ask({
      title: this.lang.translate('smsCompose.confirmTitle'),
      message: `${this.num(this.reach!.count)} ${this.lang.translate('smsCompose.confirmPeople')} · ${this.num(this.parts)} ${this.lang.translate('smsCompose.partsEach')}`,
      confirmText: this.lang.translate(this.later ? 'smsSend.schedule' : 'smsCompose.send'),
    }).subscribe(ok => {
      if (!ok) return;
      this.sending = true;
      this.api.send(a, text, this.later ? this.at : null).subscribe({
        next: r => {
          this.sending = false;
          this.snackbar.showSuccess(r.scheduled
            ? this.lang.translate('smsCompose.scheduledOk')
            : `${this.num(r.queued ?? 0)} ${this.lang.translate('smsSend.queued')}`);
          this.later = false;
          this.message = '';
          this.sent.emit(r.queued ?? 0);
          this.recount();
        },
        error: err => { this.sending = false; this.snackbar.showError(err?.error?.message ?? this.lang.translate('smsSend.failed')); }
      });
    });
  }

  num(n: number): string {
    return new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB').format(n);
  }

  private audience(): SmsAudience | null {
    switch (this.target) {
      case 'all': return { target: 'all' };
      case 'batch': return this.batch ? { target: 'batch', batch: this.batch } : null;
      case 'members': return this.picked.length ? { target: 'members', memberIds: this.picked.map(p => p.id) } : null;
      case 'phone': return this.phone.trim().length >= 11 ? { target: 'phone', phone: this.phone.trim() } : null;
    }
  }
}

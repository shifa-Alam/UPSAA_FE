import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { PaymentService, PaymentSettings } from '../../../Services/payment.service';
import { AuthService } from '../../../Services/auth.service';
import { LanguageService } from '../../../Services/language.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { HELP_PHONE_TEL, helpPhoneDisplay } from '../../../Utils/help-contact';

interface Step {
  /** Screenshot in public/images/pay-guide/ (see the README there). */
  image: string;
  titleKey: string;
  textKey: string;
}

const STEPS: Step[] = [
  { image: 'bkash-1-send-money.jpg', titleKey: 'payGuide.app1', textKey: 'payGuide.app1Text' },
  { image: 'bkash-2-number.jpg', titleKey: 'payGuide.number', textKey: 'payGuide.numberText' },
  { image: 'bkash-3-amount.jpg', titleKey: 'payGuide.amount', textKey: 'payGuide.amountText' },
  { image: 'bkash-4-reference.jpg', titleKey: 'payGuide.reference', textKey: 'payGuide.referenceText' },
  { image: 'bkash-5-pin.jpg', titleKey: 'payGuide.pinApp', textKey: 'payGuide.pinText' },
  { image: 'bkash-6-sms.jpg', titleKey: 'payGuide.sms', textKey: 'payGuide.smsText' },
  { image: 'bkash-7-submit.jpg', titleKey: 'payGuide.submit', textKey: 'payGuide.submitText' },
];

/**
 * "How to send money" — the bKash app's Send Money, one screenshot per step, the
 * association's own number, and a call button. Public and in the portal.
 */
@Component({
  selector: 'app-pay-guide',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, PageHeaderComponent, TranslatePipe],
  templateUrl: './pay-guide.component.html',
  styleUrl: './pay-guide.component.scss'
})
export class PayGuideComponent implements OnInit {
  private payments = inject(PaymentService);
  readonly auth = inject(AuthService);
  private lang = inject(LanguageService);

  readonly steps = STEPS;
  readonly tel = HELP_PHONE_TEL;

  settings: PaymentSettings | null = null;
  copied = false;
  /** Screenshots not added yet are left out rather than shown broken. */
  missing = new Set<string>();

  ngOnInit(): void {
    this.payments.settings().pipe(catchError(() => of(null))).subscribe(s => this.settings = s);
  }

  get number(): string | null {
    return this.settings?.bkashNumber || null;
  }

  get helpPhone(): string {
    return helpPhoneDisplay(this.lang.lang());
  }

  /** Signed-in members go straight to the form; others sign in first. */
  get submitLink(): string {
    return this.auth.isLoggedIn() && this.auth.hasMemberRecord() ? '/portal/payments' : '/login';
  }

  num(n: number): string {
    return new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB').format(n);
  }

  async copyNumber(): Promise<void> {
    if (!this.number) return;
    try {
      await navigator.clipboard.writeText(this.number);
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    } catch { /* the number is on screen */ }
  }
}

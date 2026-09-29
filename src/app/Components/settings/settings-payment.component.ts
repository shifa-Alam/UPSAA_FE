import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PaymentService, PaymentSettings } from '../../Services/payment.service';
import { LanguageService } from '../../Services/language.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';

/**
 * Settings › Payment: the bKash / Nagad / Rocket numbers members pay to, the membership and
 * annual fees, and the instructions they see. Verifying payments stays on the Payments page.
 */
@Component({
  selector: 'app-settings-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink, TranslatePipe, SectionCardComponent, SkeletonComponent],
  templateUrl: './settings-payment.component.html',
  styleUrl: './settings-tabs.scss'
})
export class SettingsPaymentComponent implements OnInit {
  private api = inject(PaymentService);
  private lang = inject(LanguageService);
  private snackbar = inject(SnackbarService);

  settings: PaymentSettings | null = null;
  loading = true;
  saving = false;

  ngOnInit(): void {
    this.api.settings().subscribe({
      next: s => { this.settings = { ...s }; this.loading = false; },
      error: () => { this.loading = false; this.snackbar.showError(this.lang.translate('paymentAdmin.failed')); }
    });
  }

  save(): void {
    if (!this.settings || this.saving) return;
    this.saving = true;
    this.api.saveSettings({
      ...this.settings,
      membershipFee: Number(this.settings.membershipFee) || 0,
      annualFee: Number(this.settings.annualFee) || 0,
    }).subscribe({
      next: s => { this.saving = false; this.settings = { ...s }; this.snackbar.showSuccess(this.lang.translate('paymentAdmin.settingsSaved')); },
      error: err => { this.saving = false; this.snackbar.showError(err?.error?.message ?? this.lang.translate('paymentAdmin.failed')); }
    });
  }
}

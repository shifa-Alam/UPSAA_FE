import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SmsLogRow, SmsService, SmsStatus } from '../../Services/sms.service';
import { LanguageService } from '../../Services/language.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { SmsComposeComponent } from './sms-compose.component';
import { SmsScheduledListComponent } from './sms-scheduled-list.component';

/**
 * SMS: this month's usage and the log. Which texts go out by themselves, the monthly cap and
 * a test SMS are under Settings › SMS; notice SMS are chosen per notice on the Notices screen.
 */
@Component({
  selector: 'app-sms-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink, AdminHeaderComponent, SectionCardComponent, EmptyStateComponent,
    SkeletonComponent, TranslatePipe, SmsComposeComponent, SmsScheduledListComponent],
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

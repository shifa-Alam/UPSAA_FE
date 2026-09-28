import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ExportKind, ReportOverview, ReportService } from '../../Services/report.service';
import { LanguageService } from '../../Services/language.service';
import { SnackbarService } from '../../Services/snackbar.service';
import { AdminHeaderComponent } from '../shared/admin-header/admin-header.component';
import { SectionCardComponent } from '../shared/section-card/section-card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';
import { SimpleChartComponent, SimpleChartConfig } from '../shared/simple-chart/simple-chart.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';

interface Kpi {
  labelKey: string;
  value: string;
  hintKey?: string;
  route?: string;
  attention?: boolean;
}

/**
 * Staff reports — what the admin home doesn't chart already: online collections by month,
 * membership fee status, event turnout (said "going" vs arrived), and Excel (CSV) exports.
 * Every chart has its numbers in a table too.
 */
@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, AdminHeaderComponent, SectionCardComponent,
    EmptyStateComponent, SkeletonComponent, SimpleChartComponent, TranslatePipe],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  private api = inject(ReportService);
  private lang = inject(LanguageService);
  private snackbar = inject(SnackbarService);

  data: ReportOverview | null = null;
  loading = true;
  loadError = false;
  months = 12;
  readonly monthOptions = [3, 6, 12, 24];

  kpis: Kpi[] = [];
  collectionsChart: SimpleChartConfig | null = null;
  turnoutChart: SimpleChartConfig | null = null;

  range = { from: '', to: '' };
  downloading: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.overview(this.months).subscribe({
      next: d => { this.data = d; this.build(d); this.loading = false; this.loadError = false; },
      error: () => { this.loading = false; this.loadError = true; }
    });
  }

  get periodTotals() {
    const c = this.data?.collections ?? [];
    return {
      membership: c.reduce((s, m) => s + m.membership, 0),
      annual: c.reduce((s, m) => s + m.annual, 0),
      donation: c.reduce((s, m) => s + m.donation, 0),
    };
  }

  get feePaidPercent(): number {
    const d = this.data;
    const all = d ? d.membershipPaid + d.membershipDue : 0;
    return all ? Math.round((d!.membershipPaid / all) * 100) : 0;
  }

  export(kind: ExportKind, withRange = false): void {
    if (this.downloading) return;
    this.downloading = kind;
    this.api.download(kind, withRange ? { from: this.range.from, to: this.range.to } : undefined).subscribe({
      next: () => this.downloading = null,
      error: () => { this.downloading = null; this.snackbar.showError(this.lang.translate('reports.downloadFailed')); }
    });
  }

  exportAttendance(eventId: number): void {
    if (this.downloading) return;
    this.downloading = 'event-' + eventId;
    this.api.downloadAttendance(eventId).subscribe({
      next: () => this.downloading = null,
      error: () => { this.downloading = null; this.snackbar.showError(this.lang.translate('reports.downloadFailed')); }
    });
  }

  monthLabel(ym: string): string {
    const [y, m] = ym.split('-').map(Number);
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Date(y, m - 1, 15).toLocaleDateString(locale, { month: 'short', year: '2-digit' });
  }

  eventDate(d: string): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  num(n: number): string {
    return new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB').format(n);
  }

  money(n: number): string {
    return '৳' + new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB', { maximumFractionDigits: 0 }).format(n);
  }

  private build(d: ReportOverview): void {
    this.kpis = [
      { labelKey: 'reports.kpiActive', value: this.num(d.activeMembers), hintKey: 'reports.kpiActiveHint', route: '/dashboard/members' },
      { labelKey: 'reports.kpiNew', value: this.num(d.newThisMonth) },
      { labelKey: 'reports.kpiCollectedMonth', value: this.money(d.collectedThisMonth), hintKey: 'reports.kpiOnlineOnly' },
      { labelKey: 'reports.kpiPending', value: this.num(d.pendingPayments), route: '/dashboard/payments', attention: d.pendingPayments > 0 },
      { labelKey: 'reports.kpiCampaigns', value: this.num(d.openCampaigns), route: '/dashboard/campaigns' },
    ];

    // One series: total collected per month (the split by purpose is in the table below).
    this.collectionsChart = {
      type: 'bar',
      labels: d.collections.map(c => this.monthLabel(c.month)),
      datasets: [{
        label: this.lang.translate('reports.collected'),
        data: d.collections.map(c => c.membership + c.annual + c.donation),
        colorVar: '--color-chart-1',
      }],
      formatValue: v => this.money(v),
    };

    // Two series, validated pair (styles/_tokens.scss --color-chart-1/2); legend + table carry identity.
    this.turnoutChart = d.events.length ? {
      type: 'bar',
      labels: d.events.map(e => e.title.length > 18 ? e.title.slice(0, 17) + '…' : e.title),
      datasets: [
        { label: this.lang.translate('reports.saidGoing'), data: d.events.map(e => e.going), colorVar: '--color-chart-2' },
        { label: this.lang.translate('reports.arrived'), data: d.events.map(e => e.arrived), colorVar: '--color-chart-1' },
      ],
      formatValue: v => this.num(v),
    } : null;
  }
}

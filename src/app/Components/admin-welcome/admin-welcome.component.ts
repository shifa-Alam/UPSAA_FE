import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../Services/auth.service';
import { LanguageService } from '../../Services/language.service';
import { MemberService, BatchSummary } from '../../Services/member.service';
import { DashboardService, MonthlyCount } from '../../Services/dashboard.service';
import { FinanceService, MonthlyTotal } from '../../Services/finance.service';
import { SimpleChartComponent, SimpleChartConfig } from '../shared/simple-chart/simple-chart.component';
import { toDateOnly } from '../../Utils/date-utils';
import { EventService, EventItem } from '../../Services/event.service';
import { NoticeService } from '../../Services/notice.service';
import { GalleryService } from '../../Services/gallery.service';
import { AchievementService } from '../../Services/achievement.service';
import { NavIconComponent, NavIconName } from '../shared/nav-icon/nav-icon.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';
import { CountUpDirective } from '../shared/count-up/count-up.directive';

interface WelcomeStat {
  labelKey: string;
  icon: NavIconName;
  value: number | null; // null = still loading or unavailable
  route: string;
  /** Highlights a number that needs the admin's attention (e.g. pending approvals). */
  attention?: boolean;
}

interface QuickAction {
  labelKey: string;
  hintKey: string;
  icon: NavIconName;
  route: string;
}

const UPCOMING_COUNT = 3;
const TREND_MONTHS = 12;

@Component({
  selector: 'app-admin-welcome',
  standalone: true,
  imports: [CommonModule, RouterLink, NavIconComponent, TranslatePipe, SimpleChartComponent, CountUpDirective],
  templateUrl: './admin-welcome.component.html',
  styleUrl: './admin-welcome.component.scss'
})
export class AdminWelcomeComponent implements OnInit {
  stats: WelcomeStat[] = [
    { labelKey: 'adminWelcome.stats.members', icon: 'users', value: null, route: '/dashboard/members' },
    { labelKey: 'adminWelcome.stats.pending', icon: 'user-check', value: null, route: '/dashboard/members', attention: true },
    { labelKey: 'adminWelcome.stats.upcomingEvents', icon: 'calendar', value: null, route: '/dashboard/events' },
    { labelKey: 'adminWelcome.stats.notices', icon: 'megaphone', value: null, route: '/dashboard/notices' },
    { labelKey: 'adminWelcome.stats.photos', icon: 'image', value: null, route: '/dashboard/gallery' },
    { labelKey: 'adminWelcome.stats.achievements', icon: 'award', value: null, route: '/dashboard/achievements' },
  ];

  actions: QuickAction[] = [
    { labelKey: 'dashboard.itemMembers', hintKey: 'adminWelcome.actions.membersHint', icon: 'users', route: '/dashboard/members' },
    { labelKey: 'dashboard.itemNotices', hintKey: 'adminWelcome.actions.noticesHint', icon: 'megaphone', route: '/dashboard/notices' },
    { labelKey: 'dashboard.itemEvents', hintKey: 'adminWelcome.actions.eventsHint', icon: 'calendar', route: '/dashboard/events' },
    { labelKey: 'dashboard.itemGallery', hintKey: 'adminWelcome.actions.galleryHint', icon: 'image', route: '/dashboard/gallery' },
    { labelKey: 'dashboard.itemElections', hintKey: 'adminWelcome.actions.electionsHint', icon: 'layers', route: '/dashboard/elections' },
    { labelKey: 'dashboard.itemFinance', hintKey: 'adminWelcome.actions.financeHint', icon: 'dollar', route: '/dashboard/finance' },
  ];

  upcoming: EventItem[] = [];
  eventsLoaded = false;

  private dashboardService = inject(DashboardService);
  private financeService = inject(FinanceService);

  // Chart inputs — undefined while loading, null when the request failed.
  private batches = signal<BatchSummary[] | null | undefined>(undefined);
  private registrations = signal<MonthlyCount[] | null | undefined>(undefined);
  private financeMonths = signal<MonthlyTotal[] | null | undefined>(undefined);

  readonly registrationChart = computed<SimpleChartConfig | null>(() => {
    const data = this.registrations();
    if (!data) return null;
    return {
      type: 'line',
      labels: data.map(d => this.monthLabel(d.year, d.month)),
      datasets: [{ label: this.lang.translate('adminWelcome.charts.newMembers'), data: data.map(d => d.count), colorVar: '--color-primary-600' }],
      formatValue: v => this.formatNumberFor(v)
    };
  });

  readonly financeChart = computed<SimpleChartConfig | null>(() => {
    const data = this.financeMonths();
    if (!data) return null;
    // The ledger only returns months that have entries; show every month of the window.
    const months = this.lastMonths(TREND_MONTHS);
    const find = (y: number, m: number) => data.find(d => d.year === y && d.month === m);
    return {
      type: 'bar',
      labels: months.map(([y, m]) => this.monthLabel(y, m)),
      datasets: [
        { label: this.lang.translate('financeLedger.typeIncome'), data: months.map(([y, m]) => find(y, m)?.income ?? 0), colorVar: '--color-success' },
        { label: this.lang.translate('financeLedger.typeExpense'), data: months.map(([y, m]) => find(y, m)?.expense ?? 0), colorVar: '--color-danger' }
      ],
      formatValue: v => '৳' + this.formatNumberFor(v)
    };
  });

  readonly batchChart = computed<SimpleChartConfig | null>(() => {
    const data = this.batches();
    if (!data) return null;
    const sorted = [...data].filter(b => b.batch).sort((a, b) => a.batch - b.batch);
    const plain = new Intl.NumberFormat(this.chartLocale(), { useGrouping: false });
    return {
      type: 'bar',
      labels: sorted.map(b => plain.format(b.batch)),
      datasets: [{ label: this.lang.translate('adminWelcome.charts.members'), data: sorted.map(b => Number(b.registeredMembers) || 0), colorVar: '--color-primary-600' }],
      formatValue: v => this.formatNumberFor(v)
    };
  });

  chartState(value: unknown): 'loading' | 'error' | 'ready' {
    return value === undefined ? 'loading' : value === null ? 'error' : 'ready';
  }

  get registrationsState() { return this.chartState(this.registrations()); }
  get financeState() { return this.chartState(this.financeMonths()); }
  get batchesState() { return this.chartState(this.batches()); }

  constructor(
    private auth: AuthService,
    private lang: LanguageService,
    private memberService: MemberService,
    private eventService: EventService,
    private noticeService: NoticeService,
    private galleryService: GalleryService,
    private achievementService: AchievementService
  ) { }

  ngOnInit(): void {
    this.dashboardService.getRegistrationTrend(TREND_MONTHS).pipe(catchError(() => of(null))).subscribe(data => this.registrations.set(data));

    const [[fromY, fromM]] = this.lastMonths(TREND_MONTHS);
    this.financeService.filter({
      from: toDateOnly(new Date(fromY, fromM - 1, 1)),
      to: toDateOnly(new Date()),
      pageNumber: 1,
      pageSize: 1
    }).pipe(catchError(() => of(null))).subscribe(res => this.financeMonths.set(res ? res.monthlyTotals : null));

    this.memberService.getBatchSummary().pipe(catchError(() => of(null))).subscribe(batches => {
      this.batches.set(batches);
      if (!batches) return;
      this.setStat('adminWelcome.stats.members', batches.reduce((sum, b) => sum + (Number(b.registeredMembers) || 0), 0));
      this.setStat('adminWelcome.stats.pending', batches.reduce((sum, b) => sum + (Number(b.pendingMembersCount) || 0), 0));
    });

    this.eventService.getPage({ when: 'upcoming', take: UPCOMING_COUNT }).pipe(catchError(() => of(null))).subscribe(page => {
      this.eventsLoaded = true;
      if (!page) return;
      this.upcoming = page.items;
      this.setStat('adminWelcome.stats.upcomingEvents', page.total);
    });

    // Counts only — take: 0 returns no rows, just the X-Total-Count header.
    this.noticeService.getPage({ take: 0 }).pipe(catchError(() => of(null))).subscribe(page => {
      if (page) this.setStat('adminWelcome.stats.notices', page.total);
    });

    this.galleryService.getPage({ take: 0 }).pipe(catchError(() => of(null))).subscribe(page => {
      if (page) this.setStat('adminWelcome.stats.photos', page.total);
    });

    this.achievementService.getPage({ take: 0 }).pipe(catchError(() => of(null))).subscribe(page => {
      if (page) this.setStat('adminWelcome.stats.achievements', page.total);
    });
  }

  private setStat(labelKey: string, value: number): void {
    const stat = this.stats.find(s => s.labelKey === labelKey);
    if (stat) stat.value = value;
  }

  get isSuperAdmin(): boolean {
    return this.auth.getCurrentUser()?.role === 'SuperAdmin';
  }

  /** The part of the email before "@" — the only name the auth token carries. */
  get displayName(): string {
    const email: string = this.auth.getCurrentUser()?.email ?? '';
    return email.split('@')[0] || '';
  }

  get greetingKey(): string {
    const h = new Date().getHours();
    if (h < 12) return 'adminWelcome.greeting.morning';
    if (h < 17) return 'adminWelcome.greeting.afternoon';
    return 'adminWelcome.greeting.evening';
  }

  private get locale(): string {
    return this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
  }

  get today(): string {
    return new Intl.DateTimeFormat(this.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat(this.locale).format(value);
  }

  // Reads the language signal so the chart computeds re-run when it changes.
  private chartLocale(): string {
    return this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
  }

  private formatNumberFor(value: number): string {
    return new Intl.NumberFormat(this.chartLocale(), { maximumFractionDigits: 0 }).format(value);
  }

  private monthLabel(year: number, month: number): string {
    return new Intl.DateTimeFormat(this.chartLocale(), { month: 'short', year: '2-digit' }).format(new Date(year, month - 1, 1));
  }

  /** [year, month(1-12)] for the last n months, oldest first, ending with the current month. */
  private lastMonths(n: number): [number, number][] {
    const now = new Date();
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
      return [d.getFullYear(), d.getMonth() + 1] as [number, number];
    });
  }

  eventDay(ev: EventItem): string {
    return new Intl.DateTimeFormat(this.locale, { day: '2-digit' }).format(new Date(ev.eventDate));
  }

  eventMonth(ev: EventItem): string {
    return new Intl.DateTimeFormat(this.locale, { month: 'short' }).format(new Date(ev.eventDate));
  }

  eventTime(ev: EventItem): string {
    return new Intl.DateTimeFormat(this.locale, { weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(ev.eventDate));
  }
}

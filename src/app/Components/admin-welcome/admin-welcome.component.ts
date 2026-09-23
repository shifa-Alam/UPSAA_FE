import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../Services/auth.service';
import { LanguageService } from '../../Services/language.service';
import { MemberService } from '../../Services/member.service';
import { EventService, EventItem } from '../../Services/event.service';
import { NoticeService } from '../../Services/notice.service';
import { GalleryService } from '../../Services/gallery.service';
import { AchievementService } from '../../Services/achievement.service';
import { NavIconComponent, NavIconName } from '../shared/nav-icon/nav-icon.component';
import { TranslatePipe } from '../../Pipes/translate.pipe';

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

@Component({
  selector: 'app-admin-welcome',
  standalone: true,
  imports: [CommonModule, RouterLink, NavIconComponent, TranslatePipe],
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
    this.memberService.getBatchSummary().pipe(catchError(() => of(null))).subscribe(batches => {
      if (!batches) return;
      this.setStat('adminWelcome.stats.members', batches.reduce((sum, b) => sum + (Number(b.registeredMembers) || 0), 0));
      this.setStat('adminWelcome.stats.pending', batches.reduce((sum, b) => sum + (Number(b.pendingMembersCount) || 0), 0));
    });

    this.eventService.getAll().pipe(catchError(() => of(null))).subscribe(events => {
      this.eventsLoaded = true;
      if (!events) return;
      const now = new Date();
      const upcoming = events
        .filter(e => new Date(e.endDate || e.eventDate) >= now)
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
      this.upcoming = upcoming.slice(0, UPCOMING_COUNT);
      this.setStat('adminWelcome.stats.upcomingEvents', upcoming.length);
    });

    this.noticeService.getAll().pipe(catchError(() => of(null))).subscribe(list => {
      if (list) this.setStat('adminWelcome.stats.notices', list.length);
    });

    this.galleryService.getAll().pipe(catchError(() => of(null))).subscribe(list => {
      if (list) this.setStat('adminWelcome.stats.photos', list.length);
    });

    this.achievementService.getAll().pipe(catchError(() => of(null))).subscribe(list => {
      if (list) this.setStat('adminWelcome.stats.achievements', list.length);
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

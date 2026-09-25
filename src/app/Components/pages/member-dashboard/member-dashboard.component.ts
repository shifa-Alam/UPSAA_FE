import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { MemberService, Member } from '../../../Services/member.service';
import { NoticeService, Notice } from '../../../Services/notice.service';
import { EventService, EventItem } from '../../../Services/event.service';
import { LanguageService } from '../../../Services/language.service';
import { NavIconComponent, NavIconName } from '../../shared/nav-icon/nav-icon.component';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { SizedImagePipe, SizedSrcsetPipe } from '../../../Pipes/sized-image.pipe';

interface QuickLink {
  icon: NavIconName;
  labelKey: string;
  hintKey: string;
  route: string;
}

import { missingProfileFields, profileCompletion } from '../../../Utils/profile-completeness';

/** Alumni portal welcome — the member's first screen after login (/portal/home). */
import { PushToggleComponent } from '../../shared/push-toggle/push-toggle.component';

@Component({
  selector: 'app-member-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavIconComponent, TranslatePipe, SizedImagePipe, SizedSrcsetPipe, PushToggleComponent],
  templateUrl: './member-dashboard.component.html',
  styleUrl: './member-dashboard.component.scss'
})
export class MemberDashboardComponent implements OnInit {
  member: Member | undefined;
  loading = true;

  notices: Notice[] = [];
  noticesLoading = true;

  upcomingEvents: EventItem[] = [];
  upcomingTotal = 0;
  eventsLoading = true;

  quickLinks: QuickLink[] = [
    { icon: 'user-check', labelKey: 'memberDashboard.linkProfile', hintKey: 'memberDashboard.hintProfile', route: '/portal/profile' },
    { icon: 'users', labelKey: 'memberDashboard.linkDirectory', hintKey: 'memberDashboard.hintDirectory', route: '/portal/members' },
    { icon: 'calendar', labelKey: 'memberDashboard.linkEvents', hintKey: 'memberDashboard.hintEvents', route: '/portal/events' },
    { icon: 'briefcase', labelKey: 'memberDashboard.linkJobs', hintKey: 'memberDashboard.hintJobs', route: '/portal/jobs' },
    { icon: 'droplet', labelKey: 'memberDashboard.linkBloodDonors', hintKey: 'memberDashboard.hintBloodDonors', route: '/portal/blood-donors' },
    { icon: 'book', labelKey: 'memberDashboard.linkConstitution', hintKey: 'memberDashboard.hintConstitution', route: '/portal/constitution' },
  ];

  constructor(
    private memberService: MemberService,
    private noticeService: NoticeService,
    private eventService: EventService,
    private lang: LanguageService
  ) { }

  ngOnInit(): void {
    this.memberService.getProfile().pipe(catchError(() => of(undefined))).subscribe(member => {
      this.loading = false;
      this.member = member;
    });

    this.noticeService.getPage({ take: 4 }).pipe(catchError(() => of({ items: [], total: 0 }))).subscribe(page => {
      this.noticesLoading = false;
      this.notices = page.items;
    });

    this.eventService.getPage({ when: 'upcoming', take: 3 }).pipe(catchError(() => of({ items: [], total: 0 }))).subscribe(page => {
      this.eventsLoading = false;
      this.upcomingTotal = page.total;
      this.upcomingEvents = page.items;
    });
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }

  /** First word of the full name, for a warmer greeting. */
  get firstName(): string {
    return this.member?.fullName?.trim().split(/\s+/)[0] ?? '';
  }

  /** i18n keys (memberDashboard.profileField.*) of the profile fields still empty. */
  get missingProfileFields(): string[] {
    return this.member ? missingProfileFields(this.member).map(k => `memberDashboard.profileField.${k}`) : [];
  }

  get profileCompletion(): number {
    return this.member ? profileCompletion(this.member) : 0;
  }

  get paidFeeCount(): number {
    return this.member?.fees?.filter((f: any) => f.isPaid).length ?? 0;
  }

  get totalFeeCount(): number {
    return this.member?.fees?.length ?? 0;
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

  formatNumber(value: number, plain = false): string {
    return new Intl.NumberFormat(this.locale, { useGrouping: !plain }).format(value);
  }

  shortDate(date: string): string {
    return new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
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

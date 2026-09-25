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

import confetti from 'canvas-confetti';

/** Today's month-day in Bangladesh ("09-25"), whatever the phone's time zone. */
function todayInDhaka(): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return `${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
}

function isBirthdayToday(dob: string | null | undefined): boolean {
  // DOB is a date-only value ("1995-09-25T00:00:00") — compare the text, not a Date,
  // so no time-zone shift can move it a day.
  return !!dob && dob.slice(5, 10) === todayInDhaka();
}

/** Confetti the first time the dashboard opens on the birthday (not on every visit). */
function celebrateOncePerDay(memberId: number): void {
  if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const key = `upsaa-bday-${memberId}-${new Date().getFullYear()}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
  } catch { /* storage off — celebrate anyway */ }
  const colors = ['#c9a24a', '#0a2a5e', '#6fa5f6', '#ffffff'];
  setTimeout(() => {
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.3 }, colors });
    setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.5 }, colors }), 250);
    setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.5 }, colors }), 400);
  }, 400);
}

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
      this.isBirthday = isBirthdayToday(member?.dob);
      if (this.isBirthday) celebrateOncePerDay(member!.id);
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

  /** It's the member's birthday (Bangladesh date) — greeting + a burst of confetti. */
  isBirthday = false;

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

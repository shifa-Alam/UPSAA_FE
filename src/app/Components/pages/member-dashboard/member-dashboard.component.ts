import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { MemberService, Member } from '../../../Services/member.service';
import { NoticeService, Notice } from '../../../Services/notice.service';
import { EventService, EventItem } from '../../../Services/event.service';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

interface QuickLink {
  icon: string;
  labelKey: string;
  route: string;
}

@Component({
  selector: 'app-member-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslatePipe],
  templateUrl: './member-dashboard.component.html',
  styleUrl: './member-dashboard.component.scss'
})
export class MemberDashboardComponent implements OnInit {
  member: Member | undefined;
  loading = true;

  notices: Notice[] = [];
  noticesLoading = true;

  upcomingEvents: EventItem[] = [];
  eventsLoading = true;

  quickLinks: QuickLink[] = [
    { icon: 'person', labelKey: 'memberDashboard.linkProfile', route: '/profile' },
    { icon: 'bloodtype', labelKey: 'memberDashboard.linkBloodDonors', route: '/blood-donors' },
    { icon: 'work', labelKey: 'memberDashboard.linkJobs', route: '/jobs' },
    { icon: 'school', labelKey: 'memberDashboard.linkBatches', route: '/batches' },
    { icon: 'event', labelKey: 'memberDashboard.linkEvents', route: '/events' },
    { icon: 'gavel', labelKey: 'memberDashboard.linkConstitution', route: '/constitution' },
  ];

  constructor(
    private memberService: MemberService,
    private noticeService: NoticeService,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    this.memberService.getProfile().pipe(catchError(() => of(undefined))).subscribe(member => {
      this.loading = false;
      this.member = member;
    });

    this.noticeService.getAll().pipe(catchError(() => of([]))).subscribe(notices => {
      this.noticesLoading = false;
      this.notices = notices.slice(0, 4);
    });

    this.eventService.getAll().pipe(catchError(() => of([]))).subscribe(events => {
      this.eventsLoading = false;
      const now = new Date();
      this.upcomingEvents = events
        .filter(e => new Date(e.endDate || e.eventDate) >= now)
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
        .slice(0, 3);
    });
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }

  get paidFeeCount(): number {
    return this.member?.fees?.filter((f: any) => f.isPaid).length ?? 0;
  }

  get totalFeeCount(): number {
    return this.member?.fees?.length ?? 0;
  }
}

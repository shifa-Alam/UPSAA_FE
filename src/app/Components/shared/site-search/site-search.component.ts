import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, ElementRef, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { MemberService, PublicMember } from '../../../Services/member.service';
import { EventItem, EventService } from '../../../Services/event.service';
import { Notice, NoticeService } from '../../../Services/notice.service';
import { LanguageService } from '../../../Services/language.service';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { SizedImagePipe } from '../../../Pipes/sized-image.pipe';

const TAKE = 5;

interface Results {
  batch: number | null;
  members: PublicMember[];
  memberTotal: number;
  events: EventItem[];
  notices: Notice[];
}

/**
 * Site-wide search (header button, or Ctrl+K / "/"): alumni by name, events and notices,
 * plus a batch shortcut when the query is a year. Links stay inside the portal when
 * it's opened there.
 */
@Component({
  selector: 'app-site-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, TranslatePipe, SizedImagePipe],
  templateUrl: './site-search.component.html',
  styleUrl: './site-search.component.scss'
})
export class SiteSearchComponent implements AfterViewInit {
  @ViewChild('box') box!: ElementRef<HTMLInputElement>;

  private dialogRef = inject(MatDialogRef<SiteSearchComponent>);
  private router = inject(Router);
  private membersApi = inject(MemberService);
  private eventsApi = inject(EventService);
  private noticesApi = inject(NoticeService);
  private lang = inject(LanguageService);
  private destroyRef = inject(DestroyRef);

  /** '/portal' inside the member portal, '' on the public site. */
  readonly base = this.router.url.startsWith('/portal') ? '/portal' : '';

  query = '';
  loading = false;
  results: Results | null = null;
  private query$ = new Subject<string>();

  readonly quickLinks = [
    { icon: 'groups', key: 'nav.members', path: '/members' },
    { icon: 'school', key: 'nav.batches', path: '/batches' },
    { icon: 'event', key: 'nav.events', path: '/events' },
    { icon: 'campaign', key: 'nav.notices', path: '/notices' },
  ];

  constructor() {
    this.query$.pipe(
      map(q => q.trim()),
      debounceTime(250),
      distinctUntilChanged(),
      tap(q => this.loading = q.length >= 2),
      switchMap(q => q.length < 2 ? of(null) : this.search(q)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      this.loading = false;
      this.results = res;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.box?.nativeElement.focus());
  }

  onInput(): void {
    this.query$.next(this.query);
  }

  get hasAny(): boolean {
    const r = this.results;
    return !!r && (r.batch !== null || r.members.length > 0 || r.events.length > 0 || r.notices.length > 0);
  }

  /** Enter: go to the first result. */
  openFirst(): void {
    const r = this.results;
    if (!r) return;
    if (r.batch !== null) this.go([this.base + '/batches', r.batch]);
    else if (r.members.length) this.go([this.base + '/members', r.members[0].id]);
    else if (r.events.length) this.go([this.base + '/events'], { id: r.events[0].id });
    else if (r.notices.length) this.go([this.base + '/notices'], { id: r.notices[0].id });
  }

  go(commands: unknown[], queryParams?: Record<string, unknown>): void {
    this.dialogRef.close();
    this.router.navigate(commands, { queryParams });
  }

  close(): void {
    this.dialogRef.close();
  }

  num(value: number, plain = false): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.NumberFormat(locale, { useGrouping: !plain }).format(value);
  }

  date(value: string): string {
    const locale = this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    return new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }

  private search(q: string) {
    return forkJoin({
      members: this.membersApi.getPublicDirectory({ pageNumber: 1, pageSize: TAKE, fullName: q })
        .pipe(catchError(() => of(null))),
      events: this.eventsApi.getPage({ search: q, take: TAKE }).pipe(catchError(() => of(null))),
      notices: this.noticesApi.getPage({ search: q, take: TAKE }).pipe(catchError(() => of(null))),
    }).pipe(map(r => ({
      batch: this.asBatchYear(q),
      members: r.members?.members ?? [],
      memberTotal: r.members?.totalItems ?? 0,
      events: r.events?.items ?? [],
      notices: r.notices?.items ?? [],
    })));
  }

  /** "2009" or "২০০৯" → 2009, when it could be a batch year. */
  private asBatchYear(q: string): number | null {
    const ascii = q.replace(/[০-৯]/g, d => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
    if (!/^\d{4}$/.test(ascii)) return null;
    const year = Number(ascii);
    return year >= 1950 && year <= new Date().getFullYear() + 1 ? year : null;
  }
}

import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { EventService, EventItem } from '../../../Services/event.service';
import { LanguageService } from '../../../Services/language.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { SizedImagePipe, SizedSrcsetPipe } from '../../../Pipes/sized-image.pipe';
import { ShareMenuComponent } from '../../shared/share-menu/share-menu.component';
import { CountdownComponent } from '../../shared/countdown/countdown.component';

/** Past events per request — the archive grows, so older ones come with "show more". */
const PAST_PAGE_SIZE = 12;
/** Upcoming events are few; this is just the server's page cap. */
const UPCOMING_MAX = 100;

interface PastYear {
  year: number;
  events: EventItem[];
}

import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
@Component({
  selector: 'app-events',
  standalone: true,
  imports: [SkeletonComponent, ShareMenuComponent, CountdownComponent, CommonModule, MatIconModule, RouterLink, PageHeaderComponent, EmptyStateComponent, RevealDirective, TranslatePipe, SizedImagePipe, SizedSrcsetPipe],
  templateUrl: './events.component.html',
  styleUrl: './events.component.scss'
})
export class EventsComponent implements OnInit {
  /** The soonest upcoming (or currently running) event — shown as the featured card. */
  next: EventItem | null = null;
  upcoming: EventItem[] = [];
  /** Past events, newest year first, for the archive timeline. */
  pastByYear: PastYear[] = [];
  /** Loaded past events (newest first) and how many exist in total. */
  private past: EventItem[] = [];
  pastTotal = 0;
  loadingMore = false;
  loading = true;
  loadError = false;

  /** ?id= from a shared link — that event's card is scrolled to and highlighted. */
  targetId: number | null = null;

  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  constructor(private eventService: EventService, private languageService: LanguageService) { }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = Number(params.get('id'));
      this.targetId = Number.isInteger(id) && id > 0 ? id : null;
      if (!this.loading) this.scrollToTarget();
    });

    // The server splits upcoming/past (Bangladesh time) and sorts them.
    forkJoin({
      upcoming: this.eventService.getPage({ when: 'upcoming', take: UPCOMING_MAX }),
      past: this.eventService.getPage({ when: 'past', take: PAST_PAGE_SIZE })
    }).pipe(
      catchError(() => of(null))
    ).subscribe(res => {
      this.loading = false;

      if (!res) {
        this.loadError = true;
        return;
      }

      this.next = res.upcoming.items[0] ?? null;
      this.upcoming = res.upcoming.items.slice(1);
      this.setPast(res.past.items, res.past.total);
      this.scrollToTarget();
    });
  }

  /** Bring the shared event into view once its card is rendered. */
  private scrollToTarget(): void {
    if (this.targetId === null || typeof document === 'undefined') return;
    const id = this.targetId;
    setTimeout(() => {
      const el = document.getElementById(`event-${id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }

  showMorePast(): void {
    if (this.loadingMore) return;
    this.loadingMore = true;
    this.eventService.getPage({ when: 'past', skip: this.past.length, take: PAST_PAGE_SIZE }).pipe(
      catchError(() => of(null))
    ).subscribe(page => {
      this.loadingMore = false;
      if (!page) return;
      const seen = new Set(this.past.map(e => e.id));
      this.setPast([...this.past, ...page.items.filter(e => !seen.has(e.id))], page.total);
    });
  }

  get hasMorePast(): boolean {
    return this.past.length < this.pastTotal;
  }

  private setPast(past: EventItem[], total: number): void {
    this.past = past;
    this.pastTotal = total;
    const years = new Map<number, EventItem[]>();
    for (const ev of past) {
      const y = new Date(ev.eventDate).getFullYear();
      years.set(y, [...(years.get(y) ?? []), ev]);
    }
    this.pastByYear = [...years].map(([year, evs]) => ({ year, events: evs }));
  }

  get hasAny(): boolean {
    return !!this.next || this.pastByYear.length > 0;
  }

  isOngoing(ev: EventItem): boolean {
    const now = new Date();
    return new Date(ev.eventDate) <= now && now <= new Date(ev.endDate || ev.eventDate);
  }

  private get locale(): string {
    return this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
  }

  private fmt(date: string, opts: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.locale, opts).format(new Date(date));
  }

  day(ev: EventItem): string {
    return this.fmt(ev.eventDate, { day: '2-digit' });
  }

  month(ev: EventItem): string {
    return this.fmt(ev.eventDate, { month: 'short' });
  }

  /** "Saturday, 12 December 2026 · 4:00 pm" — plus the end if it's on another day/time. */
  when(ev: EventItem): string {
    const start = this.fmt(ev.eventDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const time = this.fmt(ev.eventDate, { hour: 'numeric', minute: '2-digit' });
    if (!ev.endDate) return `${start} · ${time}`;
    const sameDay = new Date(ev.endDate).toDateString() === new Date(ev.eventDate).toDateString();
    const end = sameDay
      ? this.fmt(ev.endDate, { hour: 'numeric', minute: '2-digit' })
      : this.fmt(ev.endDate, { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
    return `${start} · ${time} – ${end}`;
  }

  shortDate(ev: EventItem): string {
    return this.fmt(ev.eventDate, { day: 'numeric', month: 'long' });
  }

  formatYear(year: number): string {
    return new Intl.NumberFormat(this.locale, { useGrouping: false }).format(year);
  }

  /** "Photos (12)" / "ছবি দেখুন (১২)". */
  photosLabel(ev: EventItem): string {
    const count = new Intl.NumberFormat(this.locale).format(ev.galleryPhotoCount);
    return `${this.languageService.translate('events.viewPhotos')} (${count})`;
  }
}

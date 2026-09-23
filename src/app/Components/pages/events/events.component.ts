import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { EventService, EventItem } from '../../../Services/event.service';
import { LanguageService } from '../../../Services/language.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

interface PastYear {
  year: number;
  events: EventItem[];
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, PageHeaderComponent, EmptyStateComponent, RevealDirective, TranslatePipe],
  templateUrl: './events.component.html',
  styleUrl: './events.component.scss'
})
export class EventsComponent implements OnInit {
  /** The soonest upcoming (or currently running) event — shown as the featured card. */
  next: EventItem | null = null;
  upcoming: EventItem[] = [];
  /** Past events, newest year first, for the archive timeline. */
  pastByYear: PastYear[] = [];
  loading = true;
  loadError = false;

  constructor(private eventService: EventService, private languageService: LanguageService) { }

  ngOnInit(): void {
    this.eventService.getAll().pipe(
      catchError(() => of(null))
    ).subscribe(events => {
      this.loading = false;

      if (!events) {
        this.loadError = true;
        return;
      }

      const now = new Date();
      const upcoming = events
        .filter(e => new Date(e.endDate || e.eventDate) >= now)
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
      this.next = upcoming[0] ?? null;
      this.upcoming = upcoming.slice(1);

      const past = events
        .filter(e => new Date(e.endDate || e.eventDate) < now)
        .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
      const years = new Map<number, EventItem[]>();
      for (const ev of past) {
        const y = new Date(ev.eventDate).getFullYear();
        years.set(y, [...(years.get(y) ?? []), ev]);
      }
      this.pastByYear = [...years].map(([year, evs]) => ({ year, events: evs }));
    });
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
}

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ApplicationRef, Component, DestroyRef, Inject, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from "@angular/material/icon";
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { Subject, catchError, debounceTime, distinctUntilChanged, first, forkJoin, map, of, switchMap } from 'rxjs';
import { NoticeService, Notice } from '../../../Services/notice.service';
import { GalleryService, GalleryImage } from '../../../Services/gallery.service';
import { EventService, EventItem } from '../../../Services/event.service';
import { AchievementService, Achievement } from '../../../Services/achievement.service';
import { MemberService, PublicBatch, PublicMember } from '../../../Services/member.service';
import { HomeData, HomeService } from '../../../Services/home.service';
import { CommitteeService, Committee } from '../../../Services/committee.service';
import { LanguageService } from '../../../Services/language.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { CountUpDirective } from '../../shared/count-up/count-up.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { backgroundWidth, imageAt, imageSrcset } from '../../../Utils/image-url';
import { SizedImagePipe, SizedSrcsetPipe } from '../../../Pipes/sized-image.pipe';
import { AlumniVoicesComponent } from './alumni-voices/alumni-voices.component';
import { CountdownComponent } from '../../shared/countdown/countdown.component';

/** Set to a campus photo (e.g. 'images/campus.jpg' in /public) to pin the hero
 *  image; while null the hero crossfades through gallery photos — the ones an admin
 *  filed under a hero category first, otherwise the newest — then falls back to a
 *  plain gradient. */
const HERO_IMAGE: string | null = null;
/** Gallery categories that pick the hero photos (Gallery admin → category). */
const HERO_CATEGORIES = ['Hero', 'প্রচ্ছদ'];
const HERO_SLIDES = 5;
const HERO_SLIDE_MS = 7000;

const EVENTS_COUNT = 3;
const NOTICES_COUNT = 4;
const ALUMNI_COUNT = 4;
/** Committee leaders shown on the homepage (the two highest-ranked seats). */
const LEADERS_COUNT = 2;
const ACHIEVEMENTS_COUNT = 3;
const JOIN_FACES = 5;
/** The notices ticker shows only notices published within this many days. */
const RECENT_NOTICE_DAYS = 14;
/** Homepage gallery: at most this many photos, each from a different category. */
const MEMORIES_COUNT = 6;
/** Categories checked for a newest photo (keeps the request count bounded). */
const MEMORY_CATEGORIES_MAX = 20;
/** Remembered hero photo URLs, so a returning visitor's hero starts loading at once. */
const HERO_CACHE_KEY = 'upsaa-hero-v1';
/** Hero search suggestions. */
const SUGGESTIONS_MAX = 6;

/** One row in the hero search's suggestion list. */
export interface Suggestion {
  kind: 'member' | 'batch' | 'all';
  label: string;
  meta?: string;
  photo?: string | null;
  /** Router commands + query for navigation. */
  commands: (string | number)[];
  queryParams?: Record<string, string>;
}

/** A top committee seat for the homepage "Our People" section. */
interface Leader {
  name: string;
  photo: string | null;
  batch: number | null;
  position: string;
}

interface HomeStat {
  icon: string;
  labelKey: string;
  value: number;
  /** Years render without thousands separators (2005, not 2,005). */
  plain?: boolean;
  suffix?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, OverlayModule, MatIconModule, RouterLink, AlumniVoicesComponent, CountdownComponent, EmptyStateComponent, RevealDirective, CountUpDirective, TranslatePipe, SizedImagePipe, SizedSrcsetPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly imageAt = imageAt;
  readonly imageSrcset = imageSrcset;

  /** Hero photos in order; only the current and next one ever get a background URL. */
  heroImages: string[] = HERO_IMAGE ? [HERO_IMAGE] : [];
  heroIndex = 0;
  private heroTimer?: ReturnType<typeof setInterval>;
  private readonly isBrowser: boolean;

  /** Alumni across all batches — for the closing "join us" band. */
  alumniTotal = 0;
  /** A few alumni photos for the closing "join us" band. */
  joinFaces: PublicMember[] = [];

  /** Hero "find a classmate" box, with type-ahead suggestions. */
  heroQuery = '';
  suggestions: Suggestion[] = [];
  suggestOpen = false;
  activeSuggestion = -1;
  /** Below the search box; above it if there's no room. */
  readonly suggestPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8 }
  ];
  private query$ = new Subject<string>();

  stats: HomeStat[] = [];
  /** Until the counts arrive, placeholder cards hold the stats' space (no layout jump). */
  statsLoading = true;
  private batches: PublicBatch[] = [];
  private achievementsTotal = 0;

  events: EventItem[] = [];
  eventsLoading = true;

  notices: Notice[] = [];
  noticesLoading = true;

  /** President, General Secretary… — the current committee's top seats. */
  leaders: Leader[] = [];
  committeeTerm: string | null = null;
  achievements: Achievement[] = [];
  memories: GalleryImage[] = [];
  /** Chosen "About" photo (gallery category "Homepage"/"হোমপেজ"); a recent memory otherwise. */
  private chosenAboutPhoto: string | null = null;

  private readonly destroyRef = inject(DestroyRef);
  private readonly appRef = inject(ApplicationRef);
  /** True when this page was served as the prerendered homepage (build-time HTML + data). */
  private readonly prerendered: boolean;

  constructor(
    private noticeService: NoticeService,
    private galleryService: GalleryService,
    private eventService: EventService,
    private achievementService: AchievementService,
    private memberService: MemberService,
    private committeeService: CommitteeService,
    private homeService: HomeService,
    private languageService: LanguageService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.prerendered = this.isBrowser && !!document.querySelector('app-root[ng-server-context]');
  }

  ngOnInit(): void {
    this.restoreHero();
    this.setUpSuggestions();

    // "Our People": the current committee's leaders (cached by CommitteeService).
    this.committeeService.current().pipe(catchError(() => of(null))).subscribe(committee => {
      this.leaders = committee ? this.topSeats(committee) : [];
      this.committeeTerm = committee?.termLabel ?? null;
    });

    // Everything else in one request; an API without /Home falls back to the per-section calls.
    // On the prerendered homepage this first answer is the build-time data (transfer
    // cache), shown instantly — then refreshed from the API once the app has settled.
    this.homeService.get().subscribe({
      next: data => {
        this.apply(data);
        if (this.prerendered) this.refreshWhenStable();
      },
      error: () => this.loadSeparately()
    });
  }

  private refreshWhenStable(): void {
    this.appRef.isStable.pipe(first(stable => stable), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.homeService.get().pipe(catchError(() => of(null))).subscribe(fresh => {
        if (fresh) this.apply(fresh);
      });
    });
  }

  private apply(d: HomeData): void {
    this.batches = d.batches ?? [];
    this.alumniTotal = d.alumniTotal ?? 0;
    this.achievements = d.achievements ?? [];
    this.achievementsTotal = d.achievementsTotal ?? 0;
    this.rebuildStats();

    this.events = d.events ?? [];
    this.eventsLoading = false;
    this.notices = d.notices ?? [];
    this.noticesLoading = false;

    this.memories = d.memories ?? [];
    this.chosenAboutPhoto = d.aboutPhoto?.imageUrl ?? null;
    this.joinFaces = d.faces ?? [];
    this.setHero(d.heroPhotos ?? []);
  }

  /** Older API (no /Home endpoint): the original per-section requests. */
  private loadSeparately(): void {
    const noRows = { items: [], total: 0 };

    forkJoin({
      batches: this.memberService.getPublicBatchSummary().pipe(catchError(() => of([] as PublicBatch[]))),
      achievements: this.achievementService.getPage({ take: ACHIEVEMENTS_COUNT }).pipe(catchError(() => of(noRows)))
    }).subscribe(({ batches, achievements }) => {
      this.batches = batches;
      this.alumniTotal = batches.filter(b => b.alumniCount > 0).reduce((sum, b) => sum + b.alumniCount, 0);
      this.achievements = achievements.items;
      this.achievementsTotal = achievements.total;
      this.rebuildStats();
    });

    this.eventService.getPage({ when: 'upcoming', take: EVENTS_COUNT }).pipe(catchError(() => of(noRows))).subscribe(page => {
      this.eventsLoading = false;
      this.events = page.items;
    });

    this.noticeService.getPage({ take: NOTICES_COUNT }).pipe(catchError(() => of(noRows))).subscribe(page => {
      this.noticesLoading = false;
      this.notices = page.items;
    });

    this.memberService.getPublicDirectory({ pageNumber: 1, pageSize: 60 }).pipe(catchError(() => of(null))).subscribe(res => {
      this.joinFaces = (res?.members ?? []).filter(m => !!m.photo).slice(0, JOIN_FACES);
    });

    this.galleryService.getCategories().pipe(
      map(cats => cats.filter(c => !!c?.trim() && !HERO_CATEGORIES.includes(c)).slice(0, MEMORY_CATEGORIES_MAX)),
      switchMap(cats => cats.length
        ? forkJoin(cats.map(category => this.galleryService.getPage({ category, take: 1 }).pipe(catchError(() => of(noRows)))))
        : of([])),
      catchError(() => of([]))
    ).subscribe(pages => {
      this.memories = pages
        .map(p => p.items[0])
        .filter((p): p is GalleryImage => !!p)
        .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
        .slice(0, MEMORIES_COUNT);
    });

    forkJoin({
      newest: this.galleryService.getPage({ take: HERO_SLIDES }).pipe(catchError(() => of(noRows))),
      picked: forkJoin(HERO_CATEGORIES.map(category =>
        this.galleryService.getPage({ category, take: HERO_SLIDES }).pipe(catchError(() => of(noRows))))),
    }).subscribe(({ newest, picked }) => {
      const chosen = picked.flatMap(p => p.items);
      this.setHero((chosen.length ? chosen : newest.items).slice(0, HERO_SLIDES));
    });
  }

  /** Fallback for "Our People" when no committee is published: a few alumni with photos. */
  get alumni(): PublicMember[] {
    return this.leaders.length ? [] : this.joinFaces.slice(0, ALUMNI_COUNT);
  }

  // ---------------------------------------------------------------- hero

  private setHero(photos: GalleryImage[]): void {
    if (HERO_IMAGE || !photos.length) return;
    // Screen-sized copies — a phone gets ~800px wide, not the full-resolution original.
    const width = backgroundWidth();
    const urls = photos.slice(0, HERO_SLIDES).map(p => imageAt(p.imageUrl, width));
    if (urls.join() !== this.heroImages.join()) {
      this.heroImages = urls;
      this.heroIndex = 0;
    }
    this.startHeroSlides();
    if (this.isBrowser) {
      try { localStorage.setItem(HERO_CACHE_KEY, JSON.stringify(urls)); } catch { /* storage off */ }
    }
  }

  /** Last visit's hero photos, so the first slide is requested before any API call returns. */
  private restoreHero(): void {
    // The prerendered page already carries its hero photos.
    if (HERO_IMAGE || !this.isBrowser || this.prerendered) return;
    try {
      const saved = JSON.parse(localStorage.getItem(HERO_CACHE_KEY) ?? 'null');
      if (Array.isArray(saved) && saved.length && saved.every(u => typeof u === 'string')) this.heroImages = saved;
    } catch { /* storage off or bad data */ }
  }

  // ---------------------------------------------------------------- search suggestions

  private setUpSuggestions(): void {
    this.query$.pipe(
      map(q => q.trim()),
      debounceTime(220),
      distinctUntilChanged(),
      switchMap(q => {
        const year = this.asYear(q);
        if (year) return of<Suggestion[]>([{ kind: 'batch', label: `${this.languageService.translate('home.hero.batchSuggestion')} ${this.formatNumber(year, true)}`, commands: ['/batches', year] }]);
        if (q.length < 2) return of<Suggestion[]>([]);
        return this.memberService.getPublicDirectory({ pageNumber: 1, pageSize: SUGGESTIONS_MAX, fullName: q }).pipe(
          map(res => [
            ...(res?.members ?? []).map<Suggestion>(m => ({
              kind: 'member',
              label: m.fullName,
              meta: `${this.languageService.translate('home.alumni.batch')} ${this.formatNumber(m.batch, true)}${m.currentDesignation ? ' · ' + m.currentDesignation : ''}`,
              photo: m.photo,
              commands: ['/members', m.id]
            })),
            { kind: 'all' as const, label: this.languageService.translate('home.hero.searchAll').replace('{q}', q), commands: ['/members'], queryParams: { name: q } }
          ]),
          catchError(() => of<Suggestion[]>([]))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(list => {
      this.suggestions = list;
      this.activeSuggestion = -1;
      this.suggestOpen = list.length > 0 && !!this.heroQuery.trim();
    });
  }

  onQueryInput(): void {
    this.query$.next(this.heroQuery);
    if (!this.heroQuery.trim()) this.suggestOpen = false;
  }

  onQueryKeydown(event: KeyboardEvent): void {
    if (!this.suggestOpen || !this.suggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeSuggestion = (this.activeSuggestion + 1) % this.suggestions.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeSuggestion = (this.activeSuggestion - 1 + this.suggestions.length) % this.suggestions.length;
    } else if (event.key === 'Escape') {
      this.suggestOpen = false;
    } else if (event.key === 'Enter' && this.activeSuggestion >= 0) {
      event.preventDefault();
      this.pick(this.suggestions[this.activeSuggestion]);
    }
  }

  closeSuggestionsSoon(): void {
    // Let a click on a suggestion land before the list closes.
    setTimeout(() => this.suggestOpen = false, 150);
  }

  pick(s: Suggestion): void {
    this.suggestOpen = false;
    this.router.navigate(s.commands, s.queryParams ? { queryParams: s.queryParams } : {});
  }

  private asYear(q: string): number | null {
    const latin = q.replace(/[০-৯]/g, d => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
    return /^(19|20)\d{2}$/.test(latin) ? Number(latin) : null;
  }

  ngOnDestroy(): void {
    clearInterval(this.heroTimer);
  }

  /** Image for slide i. Only the visible slide, the one fading out and the next one
   *  get a src, so phones never download the whole set up front. */
  heroSrc(i: number): string | null {
    const n = this.heroImages.length;
    const near = [this.heroIndex, (this.heroIndex + 1) % n, (this.heroIndex - 1 + n) % n];
    return near.includes(i) ? this.heroImages[i] : null;
  }

  private startHeroSlides(): void {
    clearInterval(this.heroTimer);
    const reduced = this.isBrowser && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!this.isBrowser || reduced || this.heroImages.length < 2) return;
    this.heroTimer = setInterval(() => {
      if (document.hidden) return; // don't burn data or battery in a background tab
      this.heroIndex = (this.heroIndex + 1) % this.heroImages.length;
    }, HERO_SLIDE_MS);
  }

  /** About-section photo: the one chosen in the gallery, else a recent memory. */
  get aboutPhoto(): string | null {
    return this.chosenAboutPhoto ?? (this.memories[1] ?? this.memories[0])?.imageUrl ?? null;
  }

  /** Notices from the last two weeks — the ticker only runs when there's something new. */
  get recentNotices(): Notice[] {
    const cutoff = Date.now() - RECENT_NOTICE_DAYS * 24 * 60 * 60 * 1000;
    return this.notices.filter(n => new Date(n.publishedDate).getTime() >= cutoff);
  }

  /** A 4-digit year (Bangla digits too) opens that batch's page; anything else searches names. */
  searchAlumni(): void {
    this.suggestOpen = false;
    const q = this.heroQuery.trim();
    const year = this.asYear(q);
    if (year) {
      this.router.navigate(['/batches', year]);
    } else {
      this.router.navigate(['/members'], { queryParams: q ? { name: q } : {} });
    }
  }

  private get locale(): string {
    return this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
  }

  formatNumber(value: number, plain = false): string {
    return new Intl.NumberFormat(this.locale, { useGrouping: !plain }).format(value);
  }

  eventDay(ev: EventItem): string {
    return new Intl.DateTimeFormat(this.locale, { day: '2-digit' }).format(new Date(ev.eventDate));
  }

  eventMonth(ev: EventItem): string {
    return new Intl.DateTimeFormat(this.locale, { month: 'short' }).format(new Date(ev.eventDate));
  }

  eventTime(ev: EventItem): string {
    return new Intl.DateTimeFormat(this.locale, { weekday: 'long', hour: 'numeric', minute: '2-digit' }).format(new Date(ev.eventDate));
  }

  noticeDate(n: Notice): string {
    return new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(n.publishedDate));
  }

  initials(name: string): string {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  }

  /** The highest-ranked seats (lowest priority number first), one person each. */
  private topSeats(committee: Committee): Leader[] {
    const seats = [...committee.positions]
      .sort((a, b) => a.priority - b.priority)
      .flatMap(p => p.members.map(m => ({ name: m.memberName, photo: m.photo, batch: m.batch ?? null, position: p.positionName })));
    // President and General Secretary lead the association; anyone missing is filled by rank.
    const find = (re: RegExp) => seats.find(s => re.test(s.position.trim()));
    const picked = [
      find(/^(সভাপতি|president)$/i),
      find(/^(সাধারণ সম্পাদক|general secretary)$/i)
    ].filter((s): s is Leader => !!s);
    for (const s of seats) {
      if (picked.length >= LEADERS_COUNT) break;
      if (!picked.includes(s)) picked.push(s);
    }
    return picked;
  }

  /** Stat cards from the batch summary + achievements. Zero counts are left out —
   *  "0 achievements" undersells the association more than no card at all. */
  private rebuildStats(): void {
    const active = this.batches.filter(b => b.alumniCount > 0);
    const alumni = active.reduce((sum, b) => sum + b.alumniCount, 0);
    const stats: HomeStat[] = [
      { icon: 'groups', labelKey: 'home.stats.alumni', value: alumni, suffix: '+' },
      { icon: 'school', labelKey: 'home.stats.batches', value: active.length },
      { icon: 'history_edu', labelKey: 'home.stats.since', value: active.length ? Math.min(...active.map(b => b.batch)) : 0, plain: true },
      { icon: 'military_tech', labelKey: 'home.stats.achievements', value: this.achievementsTotal }
    ];
    this.stats = stats.filter(s => s.value > 0);
    this.statsLoading = false;
  }

}

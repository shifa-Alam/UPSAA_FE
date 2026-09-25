import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { NoticeService, Notice } from '../../../Services/notice.service';
import { GalleryService, GalleryImage } from '../../../Services/gallery.service';
import { EventService, EventItem } from '../../../Services/event.service';
import { AchievementService, Achievement } from '../../../Services/achievement.service';
import { MemberService, PublicMember } from '../../../Services/member.service';
import { LanguageService } from '../../../Services/language.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { CountUpDirective } from '../../shared/count-up/count-up.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { backgroundWidth, imageAt, imageSrcset } from '../../../Utils/image-url';
import { SizedImagePipe, SizedSrcsetPipe } from '../../../Pipes/sized-image.pipe';

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
const ACHIEVEMENTS_COUNT = 3;
const MEMORIES_COUNT = 6;

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
  imports: [CommonModule, MatIconModule, RouterLink, EmptyStateComponent, RevealDirective, CountUpDirective, TranslatePipe, SizedImagePipe, SizedSrcsetPipe],
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

  stats: HomeStat[] = [];
  private batchStats: HomeStat[] = [];
  private achievementStat: HomeStat | null = null;

  events: EventItem[] = [];
  eventsLoading = true;

  notices: Notice[] = [];
  noticesLoading = true;

  alumni: PublicMember[] = [];
  achievements: Achievement[] = [];
  memories: GalleryImage[] = [];

  constructor(
    private noticeService: NoticeService,
    private galleryService: GalleryService,
    private eventService: EventService,
    private achievementService: AchievementService,
    private memberService: MemberService,
    private languageService: LanguageService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.memberService.getPublicBatchSummary().pipe(catchError(() => of([]))).subscribe(batches => {
      const active = batches.filter(b => b.alumniCount > 0);
      if (!active.length) return;
      this.batchStats = [
        { icon: 'groups', labelKey: 'home.stats.alumni', value: active.reduce((sum, b) => sum + b.alumniCount, 0), suffix: '+' },
        { icon: 'school', labelKey: 'home.stats.batches', value: active.length },
        { icon: 'history_edu', labelKey: 'home.stats.since', value: Math.min(...active.map(b => b.batch)), plain: true },
      ];
      this.rebuildStats();
    });

    // Each section asks only for the rows it shows; the total comes back alongside.
    const noRows = { items: [], total: 0 };

    this.achievementService.getPage({ take: ACHIEVEMENTS_COUNT }).pipe(catchError(() => of(noRows))).subscribe(page => {
      this.achievements = page.items;
      if (page.total) {
        this.achievementStat = { icon: 'military_tech', labelKey: 'home.stats.achievements', value: page.total };
        this.rebuildStats();
      }
    });

    this.eventService.getPage({ when: 'upcoming', take: EVENTS_COUNT }).pipe(catchError(() => of(noRows))).subscribe(page => {
      this.eventsLoading = false;
      this.events = page.items;
    });

    this.noticeService.getPage({ take: NOTICES_COUNT }).pipe(catchError(() => of(noRows))).subscribe(page => {
      this.noticesLoading = false;
      this.notices = page.items;
    });

    // Only alumni who've added a photo — this section is a visual showcase.
    this.memberService.getPublicDirectory({ pageNumber: 1, pageSize: 24 }).pipe(catchError(() => of(null))).subscribe(res => {
      this.alumni = (res?.members ?? []).filter(m => !!m.photo).slice(0, ALUMNI_COUNT);
    });

    forkJoin({
      newest: this.galleryService.getPage({ take: Math.max(MEMORIES_COUNT, HERO_SLIDES) }).pipe(catchError(() => of(noRows))),
      picked: forkJoin(HERO_CATEGORIES.map(category =>
        this.galleryService.getPage({ category, take: HERO_SLIDES }).pipe(catchError(() => of(noRows))))),
    }).subscribe(({ newest, picked }) => {
      this.memories = newest.items.filter(p => !HERO_CATEGORIES.includes(p.category ?? '')).slice(0, MEMORIES_COUNT);
      const chosen = picked.flatMap(p => p.items);
      const heroPhotos = (chosen.length ? chosen : newest.items).slice(0, HERO_SLIDES);
      if (!HERO_IMAGE && heroPhotos.length) {
        // Screen-sized copies — a phone gets ~800px wide, not the full-resolution original.
        const width = backgroundWidth();
        this.heroImages = heroPhotos.map(p => imageAt(p.imageUrl, width));
        this.startHeroSlides();
      }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.heroTimer);
  }

  /** Background for slide i. Only the visible slide, the one fading out and the next
   *  one get an image, so phones never download the whole set up front. */
  heroBackground(i: number): string | null {
    const n = this.heroImages.length;
    const near = [this.heroIndex, (this.heroIndex + 1) % n, (this.heroIndex - 1 + n) % n];
    return near.includes(i) ? `url(${this.heroImages[i]})` : null;
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

  scrollTo(el: HTMLElement): void {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  private rebuildStats(): void {
    this.stats = [...this.batchStats, ...(this.achievementStat ? [this.achievementStat] : [])];
  }

}

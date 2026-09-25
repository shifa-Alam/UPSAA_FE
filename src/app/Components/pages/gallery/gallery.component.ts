import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { GalleryService, GalleryImage } from '../../../Services/gallery.service';
import { LanguageService } from '../../../Services/language.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { imageAt, imageSrcset } from '../../../Utils/image-url';

/** Photos per request — more arrive with "show more". */
const PAGE_SIZE = 24;

import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [SkeletonComponent, CommonModule, MatIconModule, RouterLink, PageHeaderComponent, EmptyStateComponent, RevealDirective, TranslatePipe],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss'
})
export class GalleryComponent implements OnInit {
  readonly imageAt = imageAt;
  readonly imageSrcset = imageSrcset;

  photos: GalleryImage[] = [];
  /** Photos matching the current filter on the server (more than `photos` until all are loaded). */
  total = 0;
  loadingMore = false;
  /** Ignores a slow response that arrives after the filter changed. */
  private requestId = 0;
  categories: string[] = [];
  activeCategory = '';
  loading = true;
  loadError = false;
  selected: GalleryImage | null = null;
  /** Set from ?event= — shows only the photos linked to that event. */
  eventId: number | null = null;

  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  constructor(private galleryService: GalleryService, private languageService: LanguageService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.galleryService.getCategories().pipe(catchError(() => of([]))).subscribe(cats => {
      this.categories = cats;
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = Number(params.get('event'));
      this.eventId = Number.isInteger(id) && id > 0 ? id : null;
      this.activeCategory = '';
      this.fetch();
    });
  }

  get eventTitle(): string | null {
    return this.photos.find(p => p.eventTitle)?.eventTitle ?? null;
  }

  filterByCategory(category: string): void {
    this.activeCategory = category;
    this.fetch();
  }

  private get filter() {
    return { category: this.activeCategory || undefined, eventId: this.eventId ?? undefined };
  }

  private fetch(): void {
    const id = ++this.requestId;
    this.loading = true;
    this.loadError = false;
    this.galleryService.getPage({ ...this.filter, take: PAGE_SIZE }).pipe(
      catchError(() => of(null))
    ).subscribe(page => {
      if (id !== this.requestId) return;
      this.loading = false;
      if (!page) {
        this.loadError = true;
        return;
      }
      this.photos = page.items;
      this.total = page.total;
    });
  }

  showMore(): void {
    if (this.loadingMore) return;
    const id = this.requestId;
    this.loadingMore = true;
    this.galleryService.getPage({ ...this.filter, skip: this.photos.length, take: PAGE_SIZE }).pipe(
      catchError(() => of(null))
    ).subscribe(page => {
      this.loadingMore = false;
      if (!page || id !== this.requestId) return;
      const seen = new Set(this.photos.map(p => p.id));
      this.photos = [...this.photos, ...page.items.filter(p => !seen.has(p.id))];
      this.total = page.total;
    });
  }

  /** Tapped thumbnail zooms into the lightbox (and back) with a view transition,
   *  where supported; otherwise it simply opens. */
  open(photo: GalleryImage, event?: Event): void {
    const thumb = (event?.currentTarget as HTMLElement | undefined)?.querySelector('img');
    this.morph(thumb ?? null, () => { this.selected = photo; }, 'to-lightbox');
  }

  close(): void {
    const i = this.selectedIndex;
    const thumb = i >= 0 ? document.querySelectorAll<HTMLImageElement>('.mosaic__tile img')[i] ?? null : null;
    this.morph(thumb, () => { this.selected = null; }, 'to-thumb');
  }

  private morph(thumb: HTMLImageElement | null, update: () => void, dir: 'to-lightbox' | 'to-thumb'): void {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || !thumb || reduced) {
      update();
      return;
    }
    // Exactly one element may carry the name in each snapshot: the thumbnail on one side,
    // the lightbox photo (named in CSS) on the other.
    if (dir === 'to-lightbox') thumb.style.setProperty('view-transition-name', 'gallery-photo');
    doc.startViewTransition(() => {
      if (dir === 'to-lightbox') thumb.style.removeProperty('view-transition-name');
      update();
      this.cdr.detectChanges();
      if (dir === 'to-thumb') thumb.style.setProperty('view-transition-name', 'gallery-photo');
    });
    if (dir === 'to-thumb') setTimeout(() => (thumb.style.removeProperty('view-transition-name')), 600);
  }

  // ---- Touch: swipe between photos, pull down to close ----
  private touchStart: { x: number; y: number; t: number } | null = null;
  dragging = false;
  private dx = 0;
  private dy = 0;

  get dragTransform(): string | null {
    if (!this.dragging) return null;
    if (Math.abs(this.dx) >= Math.abs(this.dy)) return `translateX(${this.dx}px)`;
    const dy = Math.max(0, this.dy);
    return `translateY(${dy}px) scale(${1 - Math.min(dy / 1200, 0.15)})`;
  }

  onTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1) { this.touchStart = null; return; } // two fingers = pinch zoom
    const t = e.touches[0];
    this.touchStart = { x: t.clientX, y: t.clientY, t: e.timeStamp };
    this.dx = this.dy = 0;
  }

  onTouchMove(e: TouchEvent): void {
    if (!this.touchStart || e.touches.length !== 1) return;
    const t = e.touches[0];
    this.dx = t.clientX - this.touchStart.x;
    this.dy = t.clientY - this.touchStart.y;
    this.dragging = Math.abs(this.dx) > 8 || this.dy > 8;
  }

  onTouchEnd(): void {
    if (!this.touchStart) return;
    const { dx, dy } = this;
    this.touchStart = null;
    this.dragging = false;
    this.dx = this.dy = 0;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) this.step(dx < 0 ? 1 : -1);
    else if (dy > 100 && dy > Math.abs(dx)) this.close();
  }

  get selectedIndex(): number {
    return this.selected ? this.photos.indexOf(this.selected) : -1;
  }

  /** Step through the current (filtered) photos from inside the lightbox, wrapping at the ends. */
  step(delta: number, event?: Event): void {
    event?.stopPropagation();
    const i = this.selectedIndex;
    if (i < 0 || this.photos.length < 2) return;
    this.selected = this.photos[(i + delta + this.photos.length) % this.photos.length];
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.selected) return;
    if (event.key === 'Escape') this.close();
    else if (event.key === 'ArrowRight') this.step(1);
    else if (event.key === 'ArrowLeft') this.step(-1);
  }

  private get locale(): string {
    return this.languageService.lang() === 'bn' ? 'bn-BD' : 'en-GB';
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat(this.locale).format(value);
  }

  /** "12 photos" / "১২টি ছবি" — `#` in the i18n string is the count. */
  get photoCount(): string {
    const n = this.total;
    const key = n === 1 ? 'gallery.countOne' : 'gallery.countMany';
    return this.languageService.translate(key).replace('#', this.formatNumber(n));
  }
}

import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
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

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, PageHeaderComponent, EmptyStateComponent, RevealDirective, TranslatePipe],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss'
})
export class GalleryComponent implements OnInit {
  photos: GalleryImage[] = [];
  categories: string[] = [];
  activeCategory = '';
  loading = true;
  loadError = false;
  selected: GalleryImage | null = null;
  /** Set from ?event= — shows only the photos linked to that event. */
  eventId: number | null = null;

  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  constructor(private galleryService: GalleryService, private languageService: LanguageService) { }

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

  private fetch(): void {
    this.loading = true;
    this.loadError = false;
    this.galleryService.getAll(this.activeCategory || undefined, this.eventId ?? undefined).pipe(
      catchError(() => of(null))
    ).subscribe(photos => {
      this.loading = false;
      if (!photos) {
        this.loadError = true;
        return;
      }
      this.photos = photos;
    });
  }

  open(photo: GalleryImage): void {
    this.selected = photo;
  }

  close(): void {
    this.selected = null;
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
    const n = this.photos.length;
    const key = n === 1 ? 'gallery.countOne' : 'gallery.countMany';
    return this.languageService.translate(key).replace('#', this.formatNumber(n));
  }
}

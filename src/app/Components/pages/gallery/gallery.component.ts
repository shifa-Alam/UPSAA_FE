import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
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

  constructor(private galleryService: GalleryService, private languageService: LanguageService) { }

  ngOnInit(): void {
    this.galleryService.getCategories().pipe(catchError(() => of([]))).subscribe(cats => {
      this.categories = cats;
    });
    this.fetch();
  }

  filterByCategory(category: string): void {
    this.activeCategory = category;
    this.fetch();
  }

  private fetch(): void {
    this.loading = true;
    this.loadError = false;
    this.galleryService.getAll(this.activeCategory || undefined).pipe(
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

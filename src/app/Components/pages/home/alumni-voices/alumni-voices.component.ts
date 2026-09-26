import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, NgZone, OnDestroy, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { TranslatePipe } from '../../../../Pipes/translate.pipe';
import { SizedImagePipe } from '../../../../Pipes/sized-image.pipe';
import { LanguageService } from '../../../../Services/language.service';
import { Testimonial, TestimonialService } from '../../../../Services/testimonial.service';
import { RevealDirective } from '../../../shared/reveal/reveal.directive';

const TAKE = 12;
const AUTOPLAY_MS = 6500;

/**
 * Homepage "Alumni Voices": quotes from alumni (curated in the back office) in a
 * swipeable, scroll-snapping slider with prev/next and dots. Advances on its own
 * in the browser, pausing while hovered/focused or when motion is reduced.
 * Renders nothing until at least one quote is published.
 */
@Component({
  selector: 'app-alumni-voices',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe, SizedImagePipe, RevealDirective],
  templateUrl: './alumni-voices.component.html',
  styleUrl: './alumni-voices.component.scss'
})
export class AlumniVoicesComponent implements OnInit, OnDestroy {
  @ViewChild('track') track?: ElementRef<HTMLElement>;

  items: Testimonial[] = [];
  active = 0;

  private paused = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly service = inject(TestimonialService);
  private readonly lang = inject(LanguageService);
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit(): void {
    this.service.getPage({ take: TAKE }).pipe(catchError(() => of({ items: [] as Testimonial[], total: 0 }))).subscribe(page => {
      this.items = page.items;
      this.startAutoplay();
    });
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }

  meta(t: Testimonial): string {
    const batch = t.batch
      ? `${this.lang.translate('home.voices.batch')} ${new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB', { useGrouping: false }).format(t.batch)}`
      : '';
    return [batch, t.profession].filter(Boolean).join(' · ');
  }

  go(index: number): void {
    const el = this.track?.nativeElement;
    if (!el || !this.items.length) return;
    const i = (index + this.items.length) % this.items.length;
    const card = el.children[i] as HTMLElement | undefined;
    if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' });
    this.active = i;
  }

  /** Keep the dots in step with swipes. */
  onScroll(): void {
    const el = this.track?.nativeElement;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft - el.offsetLeft - el.scrollLeft);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    this.active = best;
  }

  pause(value: boolean): void {
    this.paused = value;
  }

  private startAutoplay(): void {
    if (!this.isBrowser || this.items.length < 2 || this.timer) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.zone.runOutsideAngular(() => {
      this.timer = setInterval(() => {
        if (this.paused || document.hidden) return;
        this.zone.run(() => this.go(this.active + 1));
      }, AUTOPLAY_MS);
    });
  }
}

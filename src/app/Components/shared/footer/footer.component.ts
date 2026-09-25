import { CommonModule } from '@angular/common';
import { Component, ElementRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  year = new Date().getFullYear();

  /** The school on Google Maps. The embed only loads after a tap (mapLoaded). */
  private readonly mapQuery = 'Uttaran Public School, Thana Road, Jhenaigati, Sherpur';
  readonly mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.mapQuery)}`;
  readonly mapUrl: SafeResourceUrl;
  mapLoaded = false;

  constructor(private host: ElementRef<HTMLElement>, sanitizer: DomSanitizer) {
    // A fixed Google Maps embed URL (no user input) — safe to allow as an iframe source.
    this.mapUrl = sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.google.com/maps?q=${encodeURIComponent(this.mapQuery)}&z=15&output=embed`);
  }

  /** The page scrolls inside the app shell, not the window — scroll whichever ancestor actually scrolls. */
  backToTop(): void {
    let el: HTMLElement | null = this.host.nativeElement.parentElement;
    while (el && el.scrollHeight <= el.clientHeight) el = el.parentElement;
    (el ?? document.scrollingElement ?? document.documentElement).scrollTo({ top: 0, behavior: 'smooth' });
  }
}

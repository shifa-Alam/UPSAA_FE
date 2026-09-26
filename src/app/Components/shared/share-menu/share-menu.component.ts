import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { SnackbarService } from '../../../Services/snackbar.service';
import { LanguageService } from '../../../Services/language.service';
import { CalendarEvent, downloadIcs, googleCalendarUrl } from '../../../Utils/calendar';
import { ShareKind, facebookShareUrl, publicPageUrl, sharePageUrl, whatsappShareUrl } from '../../../Utils/share-links';

/**
 * "Share" (and, for events, "Add to calendar") for an event or notice.
 * Phones get the native share sheet; elsewhere a small menu offers Facebook,
 * WhatsApp and copy-link. Shared links carry the item's own preview card.
 */
@Component({
  selector: 'app-share-menu',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatMenuModule, TranslatePipe],
  templateUrl: './share-menu.component.html',
  styleUrl: './share-menu.component.scss'
})
export class ShareMenuComponent {
  @Input({ required: true }) kind!: ShareKind;
  @Input({ required: true }) itemId!: number;
  @Input({ required: true }) title!: string;
  /** Pass the event to also offer "Add to calendar". */
  @Input() calendar: CalendarEvent | null = null;
  /** 'button' = outlined pill (feature areas); 'link' = compact text links (cards). */
  @Input() look: 'button' | 'link' = 'button';

  constructor(private snackbar: SnackbarService, private lang: LanguageService) { }

  get shareUrl(): string {
    return sharePageUrl(this.kind, this.itemId);
  }

  get canNativeShare(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
      && typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  }

  async nativeShare(): Promise<void> {
    try {
      await navigator.share({ title: this.title, url: this.shareUrl });
    } catch {
      /* dismissed */
    }
  }

  facebook(): void {
    this.popup(facebookShareUrl(this.shareUrl));
  }

  whatsapp(): void {
    this.popup(whatsappShareUrl(this.shareUrl, this.title));
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.shareUrl);
      this.snackbar.showSuccess(this.lang.translate('share.copied'));
    } catch {
      this.snackbar.showError(this.lang.translate('share.copyFailed'));
    }
  }

  googleCalendar(): void {
    if (this.calendar) this.popup(googleCalendarUrl(this.calendar, publicPageUrl(this.kind, this.itemId)));
  }

  ics(): void {
    if (this.calendar) downloadIcs(this.calendar, publicPageUrl(this.kind, this.itemId));
  }

  private popup(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer,width=640,height=640');
  }
}

import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../Pipes/translate.pipe';
import { MemberService } from '../../../Services/member.service';
import { SnackbarService } from '../../../Services/snackbar.service';
import { LanguageService } from '../../../Services/language.service';

/**
 * Profile: the member's digital membership card (rendered by the API as a PNG with
 * photo, member ID, batch and a QR code to their public profile). Fetched only when
 * asked for, then shown and/or saved.
 */
@Component({
  selector: 'app-member-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  templateUrl: './member-card.component.html',
  styleUrl: './member-card.component.scss'
})
export class MemberCardComponent implements OnDestroy {
  /** Used for the downloaded file name. */
  @Input() memberCode: string | null = null;

  url: string | null = null;
  shown = false;
  loading = false;

  private memberService = inject(MemberService);
  private snackbar = inject(SnackbarService);
  private lang = inject(LanguageService);

  toggle(): void {
    if (this.shown) {
      this.shown = false;
      return;
    }
    this.fetch(() => this.shown = true);
  }

  download(): void {
    this.fetch(url => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `UPSAA-member-card${this.memberCode ? '-' + this.memberCode : ''}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  }

  ngOnDestroy(): void {
    if (this.url) URL.revokeObjectURL(this.url);
  }

  /** Reuses the card once fetched — it only changes when the profile does. */
  private fetch(then: (url: string) => void): void {
    if (this.url) {
      then(this.url);
      return;
    }
    if (this.loading) return;
    this.loading = true;
    this.memberService.getMyCard().subscribe({
      next: blob => {
        this.loading = false;
        this.url = URL.createObjectURL(blob);
        then(this.url);
      },
      error: async err => {
        this.loading = false;
        // Error bodies arrive as a Blob here (responseType: 'blob').
        let message: string | undefined;
        try {
          message = err?.error instanceof Blob ? JSON.parse(await err.error.text())?.message : err?.error?.message;
        } catch { /* not JSON */ }
        this.snackbar.showError(message || this.lang.translate('memberCard.failed'));
      }
    });
  }
}

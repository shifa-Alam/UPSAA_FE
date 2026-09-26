import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { EventItem, EventService } from '../../../Services/event.service';
import { AuthService } from '../../../Services/auth.service';
import { SnackbarService } from '../../../Services/snackbar.service';
import { LanguageService } from '../../../Services/language.service';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

/**
 * "আমি যাচ্ছি" for an upcoming event, with how many are going. Signed-in alumni toggle
 * it (the count updates straight away and settles on the server's number); visitors see
 * the count and a sign-in link. People going get a push reminder the day before.
 */
@Component({
  selector: 'app-rsvp-button',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, TranslatePipe],
  templateUrl: './rsvp-button.component.html',
  styleUrl: './rsvp-button.component.scss'
})
export class RsvpButtonComponent {
  @Input({ required: true }) event!: EventItem;

  readonly auth = inject(AuthService);
  private events = inject(EventService);
  private snackbar = inject(SnackbarService);
  private lang = inject(LanguageService);
  busy = false;

  get count(): number {
    return this.event.goingCount ?? 0;
  }

  formatCount(n: number): string {
    return new Intl.NumberFormat(this.lang.lang() === 'bn' ? 'bn-BD' : 'en-GB').format(n);
  }

  toggle(): void {
    if (this.busy) return;
    const was = !!this.event.iAmGoing;
    // Optimistic: flip now, correct from the server's answer.
    this.event.iAmGoing = !was;
    this.event.goingCount = Math.max(0, this.count + (was ? -1 : 1));
    this.busy = true;
    this.events.toggleRsvp(this.event.id).subscribe({
      next: res => {
        this.event.iAmGoing = res.going;
        this.event.goingCount = res.goingCount;
        this.busy = false;
        if (res.going) this.snackbar.showSuccess(this.lang.translate('events.rsvp.saved'));
      },
      error: err => {
        this.event.iAmGoing = was;
        this.event.goingCount = Math.max(0, this.count + (was ? 1 : -1));
        this.busy = false;
        this.snackbar.showError(err?.error?.message ?? this.lang.translate('events.rsvp.failed'));
      }
    });
  }
}

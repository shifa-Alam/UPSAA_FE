import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmService } from '../../../Services/confirm.service';
import { FacebookPageService, FacebookPostKind, FacebookPostable } from '../../../Services/facebook-page.service';
import { LanguageService } from '../../../Services/language.service';
import { SnackbarService } from '../../../Services/snackbar.service';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

/**
 * A notice/event row's Facebook page state for admins: posted (with a link), waiting for
 * the background sweep, or failed — plus "post now" when it hasn't gone out.
 */
@Component({
  selector: 'app-fb-post-status',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  templateUrl: './fb-post-status.component.html',
  styleUrl: './fb-post-status.component.scss'
})
export class FbPostStatusComponent {
  @Input({ required: true }) kind!: FacebookPostKind;
  @Input({ required: true }) item!: FacebookPostable;
  /** e.g. an alumni-only notice — never goes to Facebook, so nothing is shown. */
  @Input() disabled = false;
  @Output() posted = new EventEmitter<string | null>();

  busy = false;

  private api = inject(FacebookPageService);
  private confirm = inject(ConfirmService);
  private snackbar = inject(SnackbarService);
  private lang = inject(LanguageService);

  get postUrl(): string | null {
    return FacebookPageService.postUrl(this.item.facebookPostId);
  }

  /** Ticked and not failed yet: the sweep will post it within a minute (or at a notice's publish time). */
  get waiting(): boolean {
    return !!this.item.postToFacebook && !this.item.facebookError;
  }

  postNow(): void {
    this.confirm.ask({
      title: this.lang.translate('facebookPage.confirmTitle'),
      message: this.lang.translate('facebookPage.confirmMessage'),
      confirmText: this.lang.translate('facebookPage.confirmButton')
    }).subscribe(ok => {
      if (!ok) return;
      this.busy = true;
      this.api.postNow(this.kind, this.item.id).subscribe({
        next: res => {
          this.busy = false;
          this.item.facebookPostId = res.postId ?? 'posted';
          this.item.facebookError = null;
          this.item.postToFacebook = true;
          this.snackbar.showSuccess(this.lang.translate('facebookPage.postedSuccess'));
          this.posted.emit(res.postId);
        },
        error: err => {
          this.busy = false;
          const message = err?.error?.message || this.lang.translate('facebookPage.postFailed');
          this.item.facebookError = message;
          this.snackbar.showError(message);
        }
      });
    });
  }
}

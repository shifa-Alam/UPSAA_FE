import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PushService } from '../../../Services/push.service';
import { LanguageService } from '../../../Services/language.service';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

/**
 * Notifications on/off. `compact` is the one-line version for the side menu; the
 * default is a small card (member dashboard). Hidden where push can't work at all.
 */
@Component({
  selector: 'app-push-toggle',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  templateUrl: './push-toggle.component.html',
  styleUrl: './push-toggle.component.scss'
})
export class PushToggleComponent {
  @Input() compact = false;

  readonly push = inject(PushService);
  private snackBar = inject(MatSnackBar);
  private lang = inject(LanguageService);

  get hint(): string {
    switch (this.push.state()) {
      case 'on': return 'pwa.push.on';
      case 'blocked': return 'pwa.push.blocked';
      case 'ios-install': return 'pwa.push.iosInstallFirst';
      default: return 'pwa.push.off';
    }
  }

  async toggle(): Promise<void> {
    if (this.push.state() === 'on') {
      await this.push.disable();
      this.toast('pwa.push.disabledToast');
    } else if (this.push.state() === 'off') {
      const ok = await this.push.enable();
      this.toast(ok ? 'pwa.push.enabledToast' : (this.push.state() === 'blocked' ? 'pwa.push.blocked' : 'pwa.push.failed'));
    }
  }

  private toast(key: string): void {
    this.snackBar.open(this.lang.translate(key), undefined, { duration: 3500, panelClass: ['snackbar-update'] });
  }
}

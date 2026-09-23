import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PwaService } from '../../../Services/pwa.service';
import { TranslatePipe } from '../../../Pipes/translate.pipe';

/** Give people a moment with the site before suggesting they install it. */
const SHOW_AFTER_MS = 20000;

/**
 * "Install the UPSAA app" card for phones. Android/Chrome gets a real Install button
 * (the browser's own prompt); iPhone Safari can't be prompted, so it gets the
 * Share → Add to Home Screen hint instead. Never shown inside the installed app,
 * and "Not now" keeps it away for two weeks.
 */
@Component({
  selector: 'app-install-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  templateUrl: './install-banner.component.html',
  styleUrl: './install-banner.component.scss'
})
export class InstallBannerComponent implements OnInit, OnDestroy {
  private pwa = inject(PwaService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private ready = signal(false);
  private closed = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  /** iPhone/iPad Safari — no install prompt exists, only the manual hint. */
  readonly iosHint = computed(() => this.pwa.isIos() && !this.pwa.canInstall());

  readonly visible = computed(() =>
    this.ready() && !this.closed() && !this.pwa.isStandalone() && (this.pwa.canInstall() || this.pwa.isIos())
  );

  ngOnInit(): void {
    if (!this.isBrowser || this.pwa.installSnoozed) return;
    this.timer = setTimeout(() => this.ready.set(true), SHOW_AFTER_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }

  async install(): Promise<void> {
    this.closed.set(true);
    await this.pwa.install();
  }

  dismiss(): void {
    this.closed.set(true);
    this.pwa.snoozeInstall();
  }
}

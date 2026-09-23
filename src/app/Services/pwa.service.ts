import { Injectable, NgZone, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, interval } from 'rxjs';
import { LanguageService } from './language.service';

/** Chrome/Edge/Samsung's install event — not in TypeScript's DOM types yet. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_DISMISSED_KEY = 'upsaa-install-dismissed';
const INSTALL_SNOOZE_DAYS = 14;
const UPDATE_CHECK_MINUTES = 30;

/**
 * The installable-app side of the site (see ngsw-config.json and manifest.webmanifest):
 * - tells the user when a new release is ready, so nobody is stuck on an old cached copy;
 * - keeps the browser's install prompt so our own banner can offer "Install";
 * - knows whether we're running as the installed app (standalone) or in a browser tab.
 */
@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly swUpdate = inject(SwUpdate);
  private readonly snackBar = inject(MatSnackBar);
  private readonly lang = inject(LanguageService);
  private readonly zone = inject(NgZone);

  private installEvent: BeforeInstallPromptEvent | null = null;

  /** Android/desktop Chrome has offered installation and we can trigger it. */
  readonly canInstall = signal(false);
  /** Opened from the home screen (no browser UI). */
  readonly isStandalone = signal(false);
  /** iPhone/iPad Safari — installable only by hand (Share → Add to Home Screen). */
  readonly isIos = signal(false);
  readonly online = signal(true);

  init(): void {
    if (!this.isBrowser) return;

    const standalone = () =>
      window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    this.isStandalone.set(standalone());
    window.matchMedia('(display-mode: standalone)').addEventListener('change', () => this.isStandalone.set(standalone()));

    const ua = navigator.userAgent;
    // iPadOS 13+ reports itself as a Mac — the touch points give it away.
    this.isIos.set(/iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1));

    this.online.set(navigator.onLine);
    window.addEventListener('online', () => this.zone.run(() => this.online.set(true)));
    window.addEventListener('offline', () => this.zone.run(() => this.online.set(false)));

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault(); // we show our own banner instead of the mini-infobar
      this.zone.run(() => {
        this.installEvent = e as BeforeInstallPromptEvent;
        this.canInstall.set(true);
      });
    });
    window.addEventListener('appinstalled', () => this.zone.run(() => {
      this.installEvent = null;
      this.canInstall.set(false);
    }));

    this.watchForUpdates();
  }

  async install(): Promise<void> {
    const event = this.installEvent;
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    this.installEvent = null;
    this.canInstall.set(false);
    if (outcome === 'dismissed') this.snoozeInstall();
  }

  /** The install banner was closed — don't offer again for a couple of weeks. */
  snoozeInstall(): void {
    try { localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now())); } catch { /* storage off */ }
  }

  get installSnoozed(): boolean {
    try {
      const at = Number(localStorage.getItem(INSTALL_DISMISSED_KEY));
      return !!at && Date.now() - at < INSTALL_SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }

  private watchForUpdates(): void {
    if (!this.swUpdate.isEnabled) return; // dev server / unsupported browser

    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => {
        const ref = this.snackBar.open(this.lang.translate('pwa.update.message'), this.lang.translate('pwa.update.action'), {
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['snackbar-update'],
        });
        ref.onAction().subscribe(() => document.location.reload());
      });

    // A broken cache (e.g. files removed from the server) — start clean.
    this.swUpdate.unrecoverable.subscribe(() => document.location.reload());

    // People keep an installed app open for days: look for a release now and then,
    // and whenever the app comes back to the foreground.
    this.zone.runOutsideAngular(() => {
      interval(UPDATE_CHECK_MINUTES * 60 * 1000).subscribe(() => this.checkForUpdate());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.checkForUpdate();
      });
    });
  }

  private checkForUpdate(): void {
    this.swUpdate.checkForUpdate().catch(() => { /* offline — try again later */ });
  }
}

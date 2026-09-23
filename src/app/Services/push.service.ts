import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { PwaService } from './pwa.service';

export type PushState = 'unsupported' | 'ios-install' | 'blocked' | 'off' | 'on';

/**
 * Web Push through Angular's service worker. The API keeps one row per phone/browser
 * (PushController) and sends a notification when a notice or event is published;
 * tapping it opens that page. Needs the production build (the service worker is off
 * on the dev server). On iPhone it only works inside the installed home-screen app.
 */
@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly http = inject(HttpClient);
  private readonly swPush = inject(SwPush);
  private readonly pwa = inject(PwaService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly apiUrl = environment.baseUrl + '/Push';

  private readonly subscribed = signal(false);
  private readonly permission = signal<NotificationPermission>('default');
  readonly busy = signal(false);

  readonly state = computed<PushState>(() => {
    if (!this.isBrowser) return 'unsupported';
    // iOS only offers push to home-screen apps (16.4+).
    if (this.pwa.isIos() && !this.pwa.isStandalone()) return 'ios-install';
    if (!this.swPush.isEnabled || !('PushManager' in window) || !('Notification' in window)) return 'unsupported';
    if (this.permission() === 'denied') return 'blocked';
    return this.subscribed() ? 'on' : 'off';
  });

  constructor() {
    if (!this.isBrowser) return;
    if ('Notification' in window) this.permission.set(Notification.permission);
    this.swPush.subscription.subscribe(sub => this.subscribed.set(!!sub));
  }

  async enable(): Promise<boolean> {
    if (this.state() !== 'off') return this.state() === 'on';
    this.busy.set(true);
    try {
      const { publicKey } = await firstValueFrom(this.http.get<{ publicKey: string }>(`${this.apiUrl}/PublicKey`));
      const sub = await this.swPush.requestSubscription({ serverPublicKey: publicKey });
      await this.register(sub);
      return true;
    } catch {
      return false;
    } finally {
      if ('Notification' in window) this.permission.set(Notification.permission);
      this.busy.set(false);
    }
  }

  async disable(): Promise<void> {
    this.busy.set(true);
    try {
      const sub = await firstValueFrom(this.swPush.subscription);
      if (sub) {
        await firstValueFrom(this.http.post(`${this.apiUrl}/Unsubscribe`, { endpoint: sub.endpoint })).catch(() => null);
        await sub.unsubscribe();
      }
    } finally {
      this.busy.set(false);
    }
  }

  /** After login, re-send the existing subscription so it's linked to the member
   *  (alumni-only notices then reach this phone too). Harmless if not subscribed. */
  async linkToCurrentUser(): Promise<void> {
    if (!this.isBrowser || !this.swPush.isEnabled) return;
    const sub = await firstValueFrom(this.swPush.subscription);
    if (sub) await this.register(sub).catch(() => null);
  }

  private register(sub: PushSubscription): Promise<unknown> {
    return firstValueFrom(this.http.post(`${this.apiUrl}/Subscribe`, sub.toJSON()));
  }
}

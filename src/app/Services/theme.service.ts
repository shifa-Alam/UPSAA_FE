import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'upsaa-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private isBrowser: boolean;
  readonly theme = signal<ThemeMode>('light');

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      // The inline script in index.html already set this on <html> before
      // Angular booted (avoids a light->dark flash) — just mirror it here.
      const current = document.documentElement.getAttribute('data-theme');
      this.theme.set(current === 'dark' ? 'dark' : 'light');
    }
  }

  toggle(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
    if (!this.isBrowser) return;

    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Private-browsing/storage-disabled — theme just won't persist across visits.
    }

    const apply = () => document.documentElement.setAttribute('data-theme', mode);

    // Progressive enhancement: browsers that support the View Transition API get
    // a smooth circular-reveal swap; everyone else just gets the CSS transition
    // already defined globally in styles.scss.
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(apply);
    } else {
      apply();
    }
  }
}

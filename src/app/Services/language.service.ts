import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { translations } from '../i18n/translations';
import { Dict, Lang } from '../i18n/i18n.types';

const STORAGE_KEY = 'upsaa-lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private isBrowser: boolean;
  readonly lang = signal<Lang>('bn');

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'bn' || saved === 'en') {
        this.lang.set(saved);
      }
      document.documentElement.setAttribute('lang', this.lang());
    }
  }

  toggle(): void {
    this.setLang(this.lang() === 'bn' ? 'en' : 'bn');
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
    if (this.isBrowser) {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // Private browsing / storage disabled — language just won't persist across visits.
      }
      document.documentElement.setAttribute('lang', lang);
    }
  }

  /** Dot-path lookup, e.g. translate('nav.home'). Falls back to the key itself if missing. */
  translate(key: string): string {
    const dict = translations[this.lang()];
    const value = key.split('.').reduce<string | Dict | undefined>(
      (node, part) => (node && typeof node === 'object' ? node[part] : undefined),
      dict
    );
    return typeof value === 'string' ? value : key;
  }
}

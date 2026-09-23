import { Injectable, effect } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { LanguageService } from '../Services/language.service';

const SITE = 'UPSAA';
const HOME_TITLE = 'UPSAA — Uttaran Public School Alumni Association';

/**
 * Browser-tab titles per page. Each route's `title` is an i18n key (pageTitles.*);
 * this translates it and appends the site name — "ইভেন্ট — UPSAA". Routes without
 * one (the homepage) get the full association name. Re-applies on language change.
 */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private key: string | undefined;

  constructor(private readonly title: Title, private readonly lang: LanguageService) {
    super();
    effect(() => {
      this.lang.lang();
      this.apply();
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.key = this.buildTitle(snapshot);
    this.apply();
  }

  private apply(): void {
    const page = this.key ? this.lang.translate(this.key) : '';
    this.title.setTitle(page && page !== this.key ? `${page} — ${SITE}` : HOME_TITLE);
  }
}

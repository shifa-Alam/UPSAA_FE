import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, effect } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { LanguageService } from '../Services/language.service';

const SITE = 'UPSAA';
const HOME_TITLE = 'UPSAA — Uttaran Public School Alumni Association';
/** The address this app is served from — link previews and canonical links need it absolute. */
const SITE_URL = 'https://upsaa-fe.vercel.app';

/**
 * Browser-tab titles per page. Each route's `title` is an i18n key (pageTitles.*);
 * this translates it and appends the site name — "ইভেন্ট — UPSAA". Routes without
 * one (the homepage) get the full association name. Re-applies on language change.
 *
 * It also keeps the link-preview tags in step (og:title, og:url, canonical, and the
 * description when the route has `data.description`, an i18n key). Crawlers don't run
 * JavaScript, so this matters on the prerendered pages, whose HTML carries these tags.
 */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private key: string | undefined;
  private descriptionKey: string | undefined;
  private path = '/';
  /** The site-wide description from index.html, for pages without their own. */
  private readonly defaultDescription: string | null;
  private readonly defaultOgDescription: string | null;

  constructor(
    private readonly title: Title,
    private readonly meta: Meta,
    private readonly lang: LanguageService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {
    super();
    this.defaultDescription = this.meta.getTag('name="description"')?.content ?? null;
    this.defaultOgDescription = this.meta.getTag('property="og:description"')?.content ?? null;
    effect(() => {
      this.lang.lang();
      this.apply();
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.key = this.buildTitle(snapshot);
    this.descriptionKey = this.deepestData(snapshot.root, 'description');
    this.path = snapshot.url.split(/[?#]/)[0] || '/';
    this.apply();
  }

  private apply(): void {
    const page = this.key ? this.lang.translate(this.key) : '';
    const full = page && page !== this.key ? `${page} — ${SITE}` : HOME_TITLE;
    this.title.setTitle(full);
    this.meta.updateTag({ property: 'og:title', content: full });
    this.meta.updateTag({ name: 'twitter:title', content: full });

    const url = SITE_URL + this.path;
    this.meta.updateTag({ property: 'og:url', content: url });
    this.canonical(url);

    const own = this.descriptionKey ? this.lang.translate(this.descriptionKey) : '';
    const description = own && own !== this.descriptionKey ? own : null;
    const text = description ?? this.defaultDescription;
    const ogText = description ?? this.defaultOgDescription;
    if (text) this.meta.updateTag({ name: 'description', content: text });
    if (ogText) this.meta.updateTag({ property: 'og:description', content: ogText });
  }

  private canonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  /** The innermost route's value for a `data` key (child routes win). */
  private deepestData(route: ActivatedRouteSnapshot, key: string): string | undefined {
    let value: string | undefined;
    for (let r: ActivatedRouteSnapshot | null = route; r; r = r.firstChild) {
      if (typeof r.data?.[key] === 'string') value = r.data[key];
    }
    return value;
  }
}

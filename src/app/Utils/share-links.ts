import { environment } from '../../environments/environment';

/**
 * Links for sharing an event or notice: /share/{kind}/{id} on the website itself.
 * Vercel proxies that path to the API's share page (vercel.json), which carries the
 * item's own Open Graph preview (title, text, photo) for Facebook/WhatsApp and
 * forwards people to the real page (see ShareController on the API). So shared links
 * show the site's address, never the API's.
 */
export type ShareKind = 'event' | 'notice';

export function sharePageUrl(kind: ShareKind, id: number): string {
  // `ng serve` on localhost has no such proxy — link straight to the API while developing.
  const local = typeof window === 'undefined' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
  if (local) return `${environment.baseUrl}/share/${kind}/${id}`;
  return `${window.location.origin}/share/${kind}/${id}`;
}

/** The public page itself — used for "copy link" and calendar entries. */
export function publicPageUrl(kind: ShareKind, id: number): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/${kind === 'event' ? 'events' : 'notices'}?id=${id}`;
}

export function facebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function whatsappShareUrl(url: string, title: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
}

import { environment } from '../../environments/environment';

/**
 * Links for sharing an event or notice. They point at the API's /share pages, which
 * carry the item's own Open Graph preview (title, text, photo) for Facebook/WhatsApp
 * and forward people to the real page (see ShareController on the API).
 */
export type ShareKind = 'event' | 'notice';

export function sharePageUrl(kind: ShareKind, id: number): string {
  return `${environment.baseUrl}/share/${kind}/${id}`;
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

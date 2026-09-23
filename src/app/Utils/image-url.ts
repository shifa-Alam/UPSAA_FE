/**
 * Sized photos. Every photo endpoint of the API (gallery, events, achievements,
 * teachers, member profiles) serves resized WebP copies with ?w=400|800|1600 (see the
 * backend's ImageFileResults / ImageVariants), so grids, cards and avatars request a
 * small copy and let the browser pick via srcset. Only the fullscreen viewer should
 * load the original URL.
 *
 * Anything else — local previews (blob:/data:), static /images assets — passes
 * through unchanged.
 */

export const IMAGE_WIDTHS = [400, 800, 1600] as const;

const SIZABLE = /\/api\/(?:(?:Gallery|Event|Achievement|Teacher)\/GetImageFile|Member\/GetProfileImageFile)\//i;

function isSizable(url: string | null | undefined): url is string {
  return !!url && SIZABLE.test(url);
}

/** The URL for a copy at least `width` px wide (the server snaps to 400/800/1600). */
export function imageAt(url: string, width: number): string;
export function imageAt(url: string | null | undefined, width: number): string | null | undefined;
export function imageAt(url: string | null | undefined, width: number): string | null | undefined {
  if (!isSizable(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}w=${width}`;
}

/** `srcset` for an <img>; empty for URLs the server can't resize (the browser then uses src). */
export function imageSrcset(url: string | null | undefined): string {
  if (!isSizable(url)) return '';
  return IMAGE_WIDTHS.map(w => `${imageAt(url, w)} ${w}w`).join(', ');
}

/** Width to request for a full-bleed background (hero), from the screen size and pixel density. */
export function backgroundWidth(): number {
  if (typeof window === 'undefined') return 1600;
  const needed = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
  return IMAGE_WIDTHS.find(w => w >= needed) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
}

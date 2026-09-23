import { Pipe, PipeTransform } from '@angular/core';
import { imageAt, imageSrcset } from '../Utils/image-url';

/**
 * `[src]="photo | sizedImage:400"` — a resized copy of an API photo (400/800/1600 px).
 * Non-API URLs (blob:/data: previews, static assets) come back unchanged.
 */
@Pipe({ name: 'sizedImage', standalone: true })
export class SizedImagePipe implements PipeTransform {
  transform(url: string | null | undefined, width: number): string | null | undefined {
    return imageAt(url, width);
  }
}

/** `[attr.srcset]="photo | sizedSrcset"` — the 400/800/1600 set; null when the URL can't be resized. */
@Pipe({ name: 'sizedSrcset', standalone: true })
export class SizedSrcsetPipe implements PipeTransform {
  transform(url: string | null | undefined): string | null {
    return imageSrcset(url) || null;
  }
}

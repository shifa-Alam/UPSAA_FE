/**
 * Blur-up for photos: every `<img loading="lazy">` shows a soft grey placeholder
 * while it downloads, then sharpens in from a blur once it arrives (styles in
 * styles.scss, "Photo blur-up"). Done once for the whole app with a capturing
 * listener, so no template has to opt in. Eager images (logo, hero, icons) are
 * untouched. `load` doesn't bubble, but capture sees it on every image.
 */
export function installImageFadeIn(doc: Document): void {
  const mark = (e: Event) => {
    const img = e.target;
    if (img instanceof HTMLImageElement && img.loading === 'lazy') img.classList.add('is-loaded');
  };
  doc.addEventListener('load', mark, true);
  doc.addEventListener('error', mark, true); // show the alt text / broken state rather than a blank box
}

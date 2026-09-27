// After a production build: derive the client-only page shell from the prerendered homepage.
//
// `ng build` prerenders "/" into dist/browser/index.html (full homepage markup, hydration
// annotations, the page's data). Every OTHER route must boot from an empty shell instead —
// hydrating /events on top of homepage markup would fail. This writes that shell to
// dist/browser/index.csr.html; vercel.json rewrites non-file routes to it, and the service
// worker (ngsw-config.json "index") uses it as its navigation fallback.
//
// Then refreshes ngsw.json's hash for the new file, so the service worker accepts it.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'dist', 'browser');
const html = readFileSync(join(dir, 'index.html'), 'utf8');

if (!html.includes('ng-server-context')) {
  // Not prerendered (e.g. prerender switched off) — the plain index.html already is the shell.
  writeFileSync(join(dir, 'index.csr.html'), html);
  console.log('index.csr.html: copied (index.html was not prerendered)');
} else {
  const shell = html
    // Empty app root, without the server-context marker.
    .replace(/<app-root[^>]*>[\s\S]*<\/app-root>/, '<app-root></app-root>')
    // The page's serialized state (transfer cache) belongs to the homepage only.
    .replace(/<script id="ng-state"[^>]*>[\s\S]*?<\/script>/, '')
    // Component styles the server inlined for the rendered homepage.
    .replace(/<style ng-app-id="[^"]*">[\s\S]*?<\/style>/g, '')
    // Preloads Angular added for homepage-only lazy chunks.
    .replace(/<link rel="modulepreload" href="chunk-[^"]+" data-ng-preload>/g, '');

  if (!shell.includes('<app-root></app-root>')) {
    console.error('make-csr-shell: could not find <app-root> in index.html');
    process.exit(1);
  }
  writeFileSync(join(dir, 'index.csr.html'), shell);
  console.log(`index.csr.html: written (${(shell.length / 1024).toFixed(1)} kB, from a ${(html.length / 1024).toFixed(1)} kB prerendered index.html)`);
}

// Keep the service worker manifest in step (it hash-checks every file it caches).
const ngswPath = join(dir, 'ngsw.json');
if (existsSync(ngswPath)) {
  const ngsw = JSON.parse(readFileSync(ngswPath, 'utf8'));
  const sha1 = file => createHash('sha1').update(readFileSync(join(dir, file))).digest('hex');
  ngsw.hashTable['/index.csr.html'] = sha1('index.csr.html');
  if (ngsw.hashTable['/index.html']) ngsw.hashTable['/index.html'] = sha1('index.html');
  writeFileSync(ngswPath, JSON.stringify(ngsw, null, 2));
  console.log('ngsw.json: hashes updated');
}

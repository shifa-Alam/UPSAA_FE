// Lists icon names used in the app that are missing from the icon font subset in
// src/index.html (icon_names=…). A missing name renders as plain text, so run this
// after adding icons:   npm run check:icons
// It looks at <mat-icon> contents and icon-like string literals, so it can report a
// few false positives (ordinary words that happen to be icon-ish) — check by eye.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = dir => readdirSync(dir).flatMap(f => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

const html = readFileSync('src/index.html', 'utf8');
const subset = new Set((html.match(/icon_names=([a-z0-9_,]+)/) ?? [, ''])[1].split(',').filter(Boolean));

// Names of the app's own drawn icons (<app-nav-icon name="…">) — not font icons.
const navIcons = new Set([...readFileSync('src/app/Components/shared/nav-icon/nav-icon.component.html', 'utf8')
  .matchAll(/'([a-z-]+)'/g)].map(m => m[1]));

const found = new Set();
for (const file of walk('src/app')) {
  if (!/\.(html|ts)$/.test(file) || file.endsWith('.spec.ts')) continue;
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/<mat-icon[^>]*>\s*([a-z][a-z0-9_]+)\s*<\/mat-icon>/g)) found.add(m[1]);
  for (const m of text.matchAll(/icon[A-Za-z]*\s*[:=]\s*['"]([a-z][a-z0-9_]+)['"]/g)) found.add(m[1]);
  for (const m of text.matchAll(/icon="([a-z][a-z0-9_]+)"/g)) found.add(m[1]);
}

const missing = [...found].filter(n => !subset.has(n) && !navIcons.has(n)).sort();
if (missing.length) {
  console.log(`Icons not in the index.html subset (${missing.length}):\n  ${missing.join('\n  ')}`);
  console.log('Add real icon names to icon_names=… (alphabetical) in src/index.html.');
  process.exit(1);
}
console.log(`All ${found.size} icons are in the subset.`);

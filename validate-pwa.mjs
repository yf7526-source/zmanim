import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const manifest = JSON.parse(await readFile(new URL('../public/manifest.json', import.meta.url), 'utf8'));
assert.equal(manifest.id, '/');
assert.equal(manifest.start_url, '/');
assert.equal(manifest.scope, '/');
assert.equal(manifest.display, 'standalone');
assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192' && icon.type === 'image/png'));
assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512' && icon.type === 'image/png'));
assert.ok(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length > 0);

const serviceWorker = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
new vm.Script(serviceWorker, { filename: 'public/sw.js' });
for (const required of ['install', 'activate', 'fetch', 'notificationclick']) {
  assert.match(serviceWorker, new RegExp(`addEventListener\\(['\"]${required}['\"]`));
}

const offlinePage = await readFile(new URL('../public/offline.html', import.meta.url), 'utf8');
assert.match(offlinePage, /<title>SolarZmanim — Offline<\/title>/);
assert.match(offlinePage, /Try again/);

console.log('PWA validation passed: manifest, service worker, offline fallback, and notification handler.');

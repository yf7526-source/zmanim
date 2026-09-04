import fs from 'node:fs';
const read = p => { try { return fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'); } catch { return ''; } };

const app = read('src/App.jsx');
const navDrawer = read('src/components/NavigationDrawer.jsx');
const commandCenter = read('src/components/DesktopCommandCenter.jsx');
const commandPalette = read('src/components/DesktopCommandPalette.jsx');
const sitemap = read('public/sitemap.xml');
const seoConfig = read('src/lib/seoConfig.js');

// Extract all route paths from App.jsx (path="..." patterns)
const routeMatches = [...app.matchAll(/path="([^"]+)"/g)];
const routes = new Set(routeMatches.map(m => m[1]));
// The wildcard "*" route is not a real navigation target
routes.delete('*');

// Known dead routes that must never reappear
const DEAD_ROUTES = ['/community', '/compare', '/display'];

// Collect all internal navigation destinations from navigation surfaces
const navDestinations = new Set();

// NavigationDrawer: to="..." in Link components
for (const m of navDrawer.matchAll(/to="([^"]+)"/g)) navDestinations.add(m[1]);

// DesktopCommandCenter: to="..." in Link components
for (const m of commandCenter.matchAll(/to="([^"]+)"/g)) navDestinations.add(m[1]);

// DesktopCommandPalette: navigate('...') calls
for (const m of commandPalette.matchAll(/navigate\('([^']+)'\)/g)) navDestinations.add(m[1]);

// Sitemap: <loc>...</loc> URLs — extract path portion
for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  try {
    const u = new URL(m[1]);
    navDestinations.add(u.pathname);
  } catch {
    navDestinations.add(m[1]);
  }
}

// SeoMeta: PAGE_METADATA paths
for (const m of seoConfig.matchAll(/path:\s*'([^']+)'/g)) navDestinations.add(m[1]);

const checks = [];

// Check 1: No dead routes in App.jsx
for (const dead of DEAD_ROUTES) {
  checks.push([`No dead route ${dead} in App.jsx`, !app.includes(`path="${dead}"`)]);
}

// Check 2: No dead routes in NavigationDrawer
for (const dead of DEAD_ROUTES) {
  checks.push([`No dead route ${dead} in NavigationDrawer`, !navDrawer.includes(`to="${dead}"`)]);
}

// Check 3: No dead routes in Command Center
for (const dead of DEAD_ROUTES) {
  checks.push([`No dead route ${dead} in Command Center`, !commandCenter.includes(`to="${dead}"`)]);
}

// Check 4: No dead routes in Command Palette
for (const dead of DEAD_ROUTES) {
  checks.push([`No dead route ${dead} in Command Palette`, !commandPalette.includes(`navigate('${dead}')`)]);
}

// Check 5: Every navigation destination exists as a real route
for (const dest of navDestinations) {
  if (dest === '/' || routes.has(dest)) continue;
  // Skip external URLs and non-path strings
  if (dest.startsWith('http')) continue;
  checks.push([`Navigation destination "${dest}" has a matching route in App.jsx`, routes.has(dest)]);
}

// Check 6: Sitemap only contains public routes that exist
const sitemapPaths = [];
for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  try {
    const u = new URL(m[1]);
    sitemapPaths.push(u.pathname);
  } catch {
    sitemapPaths.push(m[1]);
  }
}
for (const path of sitemapPaths) {
  checks.push([`Sitemap path "${path}" has a matching route in App.jsx`, routes.has(path)]);
}

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${name}`);
  if (!ok) failed++;
}

if (failed) {
  console.error(`\n${failed} route validation check(s) failed.`);
  process.exit(1);
}

console.log(`\nRoute validation passed (${checks.length} checks).`);
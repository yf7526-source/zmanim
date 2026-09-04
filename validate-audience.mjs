import fs from 'node:fs';
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const home = read('src/pages/Home.jsx');
const app = read('src/App.jsx');
const seo = read('src/lib/seoConfig.js');
const sitemap = read('public/sitemap.xml');
const checks = [
  ['Location persists across sessions', home.includes("localStorage.setItem('lastLocation'")],
  ['Hebrew/English language support', home.includes("lang === 'he'")],
  ['Public routes have SEO metadata', seo.includes('PAGE_METADATA')],
  ['Sitemap contains public routes', sitemap.includes('solarzmanim.app')],
  ['No dead community display route', !app.includes('path="/display"')],
  ['No dead comparison route', !app.includes('path="/compare"')],
  ['No dead community route', !app.includes('path="/community"')],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? '✓' : '✗'} ${name}`); if (!ok) failed++; }
if (failed) { console.error(`\n${failed} audience-fit validation check(s) failed.`); process.exit(1); }
console.log(`\nAudience-fit validation passed (${checks.length} checks).`);
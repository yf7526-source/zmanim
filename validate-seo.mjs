import fs from 'node:fs';
import path from 'node:path';

const seo = fs.readFileSync('src/lib/seoConfig.js', 'utf8');
const meta = fs.readFileSync('src/components/SeoMeta.jsx', 'utf8');
const sitemap = fs.readFileSync('public/sitemap.xml', 'utf8');
const robots = fs.readFileSync('public/robots.txt', 'utf8');
const og = fs.readFileSync('public/og-card.svg', 'utf8');
const issues = [];
if (!seo.includes("https://solarzmanim.app")) issues.push('Canonical production domain missing.');
if (!seo.includes('/og-card.svg')) issues.push('SEO config is not using the share card.');
if (!meta.includes("summary_large_image")) issues.push('Twitter large-card metadata missing.');
if (!meta.includes("application/ld+json")) issues.push('Structured data missing.');
if (!og.includes('width="1200"') || !og.includes('height="630"')) issues.push('Share card must be 1200x630.');
for (const route of ['/', '/about', '/contact', '/zmanim-guide', '/solar-calculator', '/glossary']) {
  const url = route === '/' ? 'https://solarzmanim.app/' : `https://solarzmanim.app${route}`;
  if (!sitemap.includes(`<loc>${url}</loc>`)) issues.push(`Sitemap missing ${route}.`);
}
for (const route of ['/login','/dashboard','/settings','/profile']) {
  if (!robots.includes(`Disallow: ${route}`)) issues.push(`robots.txt does not disallow ${route}.`);
}
if (!fs.existsSync(path.join('public','og-card.svg'))) issues.push('Share-card asset missing.');
if (issues.length) { console.error('SEO validation failed:\n- ' + issues.join('\n- ')); process.exit(1); }
console.log('SEO validation passed: canonical metadata, sitemap, robots, structured data, and 1200x630 share card.');

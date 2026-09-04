/**
 * Centralized SEO configuration for SolarZmanim.
 *
 * ⚠️ CANONICAL_DOMAIN must be verified/set to the production domain before publishing.
 * It is used by robots.txt, sitemap.xml, manifest.json, and all route-level meta tags.
 * If the app is deployed to a different domain (e.g. a .pages.dev or .base44.app URL),
 * update this constant and the static files in public/ accordingly.
 */
export const CANONICAL_DOMAIN = 'https://solarzmanim.app';

export const SITE_NAME = 'SolarZmanim';
export const SITE_SHORT = 'SolarZmanim';
export const THEME_COLOR = '#0D1B2A';
export const DEFAULT_OG_IMAGE = '/og-card.svg';

/**
 * Metadata for each stable public route.
 * Used by <SeoMeta pageKey="..." /> to set document-level head tags.
 */
export const PAGE_METADATA = {
  home: {
    path: '/',
    title: 'SolarZmanim — Halachic Zmanim & Sun Position',
    description: 'Track halachic zmanim, sun position, candle lighting times, and Jewish calendar events for any location. Real-time prayer times with multiple halachic opinions.',
  },
  about: {
    path: '/about',
    title: 'About SolarZmanim — Halachic Time Tracking',
    description: 'Learn about SolarZmanim, a free tool for tracking halachic zmanim, sun position, and Jewish calendar events with multiple halachic opinions.',
  },
  contact: {
    path: '/contact',
    title: 'Contact SolarZmanim',
    description: 'Get in touch with the SolarZmanim team for questions, feedback, or corrections about halachic zmanim and sun position data.',
  },
  'zmanim-guide': {
    path: '/zmanim-guide',
    title: 'Zmanim Guide — Halachic Times Explained',
    description: 'A comprehensive guide to halachic zmanim: alot hashachar, misheyakir, netz, sof zman shema, chatzot, mincha, shkiah, and tzait hakochavim with their sources and opinions.',
  },
  'solar-calculator': {
    path: '/solar-calculator',
    title: 'Solar Calculator — Sun Position & Elevation',
    description: 'Calculate sun position, elevation, azimuth, and daylight hours for any date and location. Solar data for halachic time calculations.',
  },
  glossary: {
    path: '/glossary',
    title: 'Halachic Terms Glossary — Zmanim Definitions',
    description: 'A glossary of halachic time terms and definitions used in Jewish prayer time calculations, from alot to tzait hakochavim.',
  },
};

/**
 * Routes that require authentication or are private.
 * These get noindex,follow as defense in depth.
 */
export const PRIVATE_ROUTE_PATTERNS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/dashboard',
  '/profile',
  '/locations',
  '/saved-locations',
  '/settings',
  '/export-history',
  '/search-history',
  '/report-issue',
  '/system-status',
];
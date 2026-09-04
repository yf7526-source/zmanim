import { useEffect } from 'react';
import { CANONICAL_DOMAIN, PAGE_METADATA, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seoConfig';

/**
 * Sets document-level SEO metadata for a public route.
 * Usage: <SeoMeta pageKey="about" />
 */
export default function SeoMeta({ pageKey }) {
  const meta = PAGE_METADATA[pageKey];

  useEffect(() => {
    if (!meta) return;

    const origin = CANONICAL_DOMAIN || window.location.origin;
    const url = `${origin}${meta.path}`;

    document.title = meta.title;

    setMetaTag('name', 'description', meta.description);

    // Canonical — self-referencing
    setLinkTag('canonical', url);
    setAlternateLink('he', url);
    setAlternateLink('en', url);
    setAlternateLink('x-default', url);

    // Open Graph
    setMetaTag('property', 'og:title', meta.title);
    setMetaTag('property', 'og:description', meta.description);
    setMetaTag('property', 'og:url', url);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('property', 'og:image', DEFAULT_OG_IMAGE.startsWith('http') ? DEFAULT_OG_IMAGE : `${origin}${DEFAULT_OG_IMAGE}`);
    setMetaTag('property', 'og:image:width', '1200');
    setMetaTag('property', 'og:image:height', '630');
    setMetaTag('property', 'og:image:alt', `${SITE_NAME} app preview`);

    // Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', meta.title);
    setMetaTag('name', 'twitter:description', meta.description);
    setMetaTag('name', 'twitter:url', url);
    setMetaTag('name', 'twitter:image', DEFAULT_OG_IMAGE.startsWith('http') ? DEFAULT_OG_IMAGE : `${origin}${DEFAULT_OG_IMAGE}`);
    setMetaTag('name', 'twitter:image:alt', `${SITE_NAME} app preview`);

    setJsonLd(meta, url, origin);

    // Remove any stale robots noindex from a previous private route
    removeMetaTag('robots');
  }, [pageKey, meta]);

  return null;
}

/**
 * Adds noindex,follow meta tag as defense in depth for private routes.
 * Usage: <NoIndexMeta />
 */
export function NoIndexMeta() {
  useEffect(() => {
    setMetaTag('name', 'robots', 'noindex, follow');
    return () => removeMetaTag('robots');
  }, []);
  return null;
}

function setJsonLd(meta, url, origin) {
  const id = 'solarzmanim-jsonld';
  let el = document.head.querySelector(`#${id}`);
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': meta.path === '/' ? 'WebApplication' : 'WebPage',
    name: meta.title,
    description: meta.description,
    url,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: origin },
    ...(meta.path === '/' ? {
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    } : {}),
  });
}

// ── Helpers ──

function setMetaTag(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLinkTag(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setAlternateLink(language, href) {
  let el = document.head.querySelector(`link[rel="alternate"][hreflang="${language}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = 'alternate';
    el.hreflang = language;
    document.head.appendChild(el);
  }
  el.href = href;
}

function removeMetaTag(name) {
  const el = document.head.querySelector(`meta[name="${name}"]`);
  if (el) el.remove();
}
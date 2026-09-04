import { describe, expect, it } from 'vitest';
import { CANONICAL_DOMAIN, DEFAULT_OG_IMAGE, PAGE_METADATA } from './seoConfig';

describe('SEO configuration', () => {
  it('sets the canonical production domain', () => {
    expect(CANONICAL_DOMAIN).toBe('https://solarzmanim.app');
  });

  it('uses the local share card asset', () => {
    expect(DEFAULT_OG_IMAGE).toBe('/og-card.svg');
  });

  it('defines complete metadata for every public page', () => {
    for (const page of Object.values(PAGE_METADATA)) {
      expect(page.path).toMatch(/^\//);
      expect(page.title.length).toBeGreaterThan(10);
      expect(page.description.length).toBeGreaterThan(50);
    }
  });
});
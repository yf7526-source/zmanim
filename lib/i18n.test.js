import { describe, expect, it } from 'vitest';
import { translate, translations } from './i18n';

describe('translations', () => {
  it('has matching English and Hebrew keys', () => {
    expect(Object.keys(translations.he).sort()).toEqual(Object.keys(translations.en).sort());
  });

  it('resolves every key in all language modes', () => {
    for (const key of Object.keys(translations.en)) {
      expect(translate('en', key)).toBeTruthy();
      expect(translate('he', key)).toBeTruthy();
      expect(translate('both', key)).toContain(' · ');
    }
  });
});
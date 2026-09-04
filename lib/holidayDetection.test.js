import { describe, expect, it } from 'vitest';
import { categorizeHebcalEvent, isShabbatOrYomTov, isYomTovEvent, resolveDayTier } from './holidayDetection.js';

const event = (title, category = 'holiday', date = '2026-09-12') => ({ title, category, date });

describe('holiday detection', () => {
  it('recognizes Yom Tov but excludes Chol HaMoed', () => {
    expect(isYomTovEvent(event('Shavuot'))).toBe(true);
    expect(isYomTovEvent(event("Pesach CH''M"))).toBe(false);
  });

  it('recognizes Shabbat and a weekday Yom Tov', () => {
    expect(isShabbatOrYomTov(new Date('2026-09-12T12:00:00Z'), [], 'UTC')).toBe(true);
    expect(isShabbatOrYomTov(new Date('2026-09-14T12:00:00Z'), [event('Rosh Hashana', 'holiday', '2026-09-14')], 'UTC')).toBe(true);
  });

  it('categorizes event tiers', () => {
    expect(categorizeHebcalEvent(event('Shavuot'))).toBe('yomtov');
    expect(categorizeHebcalEvent(event("Tish'a B'Av", 'fast'))).toBe('fast');
    expect(categorizeHebcalEvent(event('Chanukah'))).toBe('minor');
  });

  it('resolves the strongest day tier', () => {
    expect(resolveDayTier([event('Chanukah'), event("Tish'a B'Av", 'fast')], false)).toBe('minor');
    expect(resolveDayTier([], true)).toBe('major');
    expect(resolveDayTier([], false)).toBe('plain');
  });
});
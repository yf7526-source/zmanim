import { describe, expect, it } from 'vitest';
import { getSunTimes } from './sunCalc.js';

describe('solar calculations', () => {
  it('returns ordered sunrise and sunset for Jerusalem', () => {
    const times = getSunTimes(new Date(2026, 8, 1), 31.7767, 35.2345);
    expect(times.netz).toBeInstanceOf(Date);
    expect(times.shkiah).toBeInstanceOf(Date);
    expect(times.netz.getTime()).toBeLessThan(times.shkiah.getTime());
  });

  it('returns null crossings during polar night', () => {
    const times = getSunTimes(new Date(2026, 11, 21), 78.2232, 15.6469);
    expect(times.netz).toBeNull();
    expect(times.shkiah).toBeNull();
  });

  it('keeps fixed Rabbeinu Tam at 72 minutes after sunset', () => {
    const times = getSunTimes(new Date(2026, 8, 1), 31.7767, 35.2345);
    expect(times.rabbeinuTam_fixed.getTime() - times.shkiah.getTime()).toBe(72 * 60000);
  });
});
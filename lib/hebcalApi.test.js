import { describe, expect, it } from 'vitest';
import { normalizeTimes } from './hebcalApi.js';

const at = (hour, minute = 0) => new Date(Date.UTC(2026, 8, 1, hour, minute));
const baseTimes = {
  sunrise: at(3), sunset: at(16), chatzot: at(9, 30),
  alotHaShachar: at(1), tzeit7083deg: at(16, 30), tzeit85deg: at(16, 40), tzeit72min: at(17, 12),
  misheyakir: at(2), sofZmanShma: at(6), sofZmanTfilla: at(7), minchaGedola: at(10), minchaKetana: at(13), plagHaMincha: at(14),
};

describe('Hebcal normalization', () => {
  it('resolves selected alot and tzait opinions', () => {
    const result = normalizeTimes(baseTimes, { alot: '72min', tzait: '7.083' }, null, 0, '2026-09-01');
    expect(result.alot.toISOString()).toBe(at(1, 48).toISOString());
    expect(result.tzait.toISOString()).toBe(at(16, 30).toISOString());
  });

  it('resolves the shared Shabbat-end opinion', () => {
    const result = normalizeTimes(baseTimes, { shabbatEnds: '8.5' }, null, 0, '2026-09-01');
    expect(result.motzeiShabbat.toISOString()).toBe(at(16, 40).toISOString());
  });

  it('uses provider sunrise when no manual horizon is supplied', () => {
    const result = normalizeTimes(baseTimes, {}, { lat: 31.7767, lng: 35.2345 }, 0, '2026-09-01');
    expect(result.netz.toISOString()).toBe(baseTimes.sunrise.toISOString());
  });
});
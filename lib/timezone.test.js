import { describe, expect, it } from 'vitest';
import { getStableDateForHebrew, makeWallTimeDate, toDateOnly } from './timezone.js';

describe('timezone date math', () => {
  it('extracts the civil date in the requested timezone', () => {
    const instant = new Date('2026-09-01T02:00:00Z');
    expect(toDateOnly(instant, 'America/Toronto')).toBe('2026-08-31');
    expect(toDateOnly(instant, 'Asia/Jerusalem')).toBe('2026-09-01');
  });

  it('constructs valid wall time across DST', () => {
    const date = makeWallTimeDate('2026-11-01', '01:30', 'America/Toronto');
    expect(date).toBeInstanceOf(Date);
    expect(toDateOnly(date, 'America/Toronto')).toBe('2026-11-01');
  });

  it('rejects a nonexistent spring-forward wall time', () => {
    expect(makeWallTimeDate('2026-03-08', '02:30', 'America/Toronto')).toBeNull();
  });

  it('creates a timezone-independent Hebrew conversion date', () => {
    expect(getStableDateForHebrew(new Date('2026-09-01T02:00:00Z'), 'America/Toronto').toISOString()).toBe('2026-08-31T12:00:00.000Z');
  });
});
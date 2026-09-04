import { describe, expect, it } from 'vitest';
import { getKiddushLevanahDeadline, getMoladForDate } from './molad.js';

describe('Kiddush Levanah deadline', () => {
  it('is exactly half a mean synodic month after the molad', () => {
    const date = new Date('2026-09-15T12:00:00Z');
    const { molad } = getMoladForDate(date);
    const deadline = getKiddushLevanahDeadline(date);
    expect(deadline).toBeInstanceOf(Date);
    // Date values are truncated to integer milliseconds (ECMAScript TimeClip), so
    // the deadline difference is an integer while the exact half-month is fractional.
    // Use a 5ms tolerance (numDigits = -1) — still extremely precise for a ~1.27e9ms span.
    expect(deadline.getTime() - molad.getTime()).toBeCloseTo((29.53058867 / 2) * 86400000, -1);
  });

  it('returns a deadline after the containing month molad', () => {
    const date = new Date('2026-04-10T12:00:00Z');
    const { molad } = getMoladForDate(date);
    expect(getKiddushLevanahDeadline(date).getTime()).toBeGreaterThan(molad.getTime());
  });
});
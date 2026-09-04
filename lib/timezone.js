import { fetchWithTimeout, isAbortError } from './fetchWithTimeout.js';

/**
 * Timezone helpers for displaying times in a selected location's timezone.
 *
 * The IANA timezone identifier is resolved authoritatively by the Hebcal
 * zmanim API (which auto-detects it from the coordinates), so no separate
 * timezone-lookup service is required. These helpers only provide the
 * browser-timezone fallback and the display formatter.
 */

export function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Format a Date as a full clock string (with seconds) in the given timezone.
 * Locale follows the language toggle so AM/PM and numbering match the UI lang.
 */
export function formatClockInTz(date, tz, hour12 = true, locale = 'en-US') {
  if (!date || isNaN(date?.getTime?.())) return '--:--';
  const opts = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12, timeZone: tz || 'UTC' };
  try {
    return new Intl.DateTimeFormat(locale, opts).format(date);
  } catch {
    try { return date.toLocaleTimeString(locale, opts); } catch { return '--:--'; }
  }
}

/**
 * Format a Date as a time string in the given IANA timezone.
 * Returns "HH:MM" (24h) or "h:MM AM/PM" (12h).
 */
export function formatTimeInTz(date, tz, hour12 = true) {
  if (!date || isNaN(date?.getTime?.())) return '--:--';
  const opts = { hour: '2-digit', minute: '2-digit', hour12, timeZone: tz || 'UTC' };
  try {
    return new Intl.DateTimeFormat('en-US', opts).format(date);
  } catch {
    try {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12 });
    } catch {
      return '--:--';
    }
  }
}

/**
 * Extract the hour-of-day (with minutes as fraction) in a specific timezone.
 * Returns e.g. 6.5 for 6:30 AM. Used by charts that plot numeric hour values.
 */
export function getHourInTz(date, tz) {
  if (!date || isNaN(date?.getTime?.())) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz || 'UTC',
    }).formatToParts(date);
    const h = Number(parts.find(p => p.type === 'hour')?.value) % 24;
    const m = Number(parts.find(p => p.type === 'minute')?.value);
    return h + m / 60;
  } catch {
    return date.getHours() + date.getMinutes() / 60;
  }
}

/**
 * Resolve the IANA timezone identifier from coordinates using a free API.
 * Returns a string like "Asia/Jerusalem" or null on failure.
 */
export async function getTimezoneFromCoords(lat, lng, signal = null) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
  try {
    const res = await fetchWithTimeout(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=auto`,
      { signal, timeoutMs: 10000 }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.timezone || null;
  } catch (error) {
    if (isAbortError(error)) throw error;
    return null;
  }
}

/**
 * Returns a Date object representing noon in the given IANA timezone
 * for "today" (or the given ref instant). Noon (not midnight) is chosen
 * so the instant falls squarely within the correct civil day in the
 * target timezone, ensuring toDateOnly(date, tz) returns the correct
 * date regardless of the browser's local timezone.
 */
export function getDateInTz(tz, ref = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      timeZone: tz || 'UTC',
    }).formatToParts(ref);
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    if (!y || !m || !d) return new Date(ref);
    const dateStr = `${y}-${m}-${d}`;
    // noon in target tz = a stable instant within the correct civil day
    return makeWallTimeDate(dateStr, '12:00', tz) || new Date(`${dateStr}T12:00:00Z`);
  } catch {
    return new Date(ref);
  }
}

/**
 * Convert a Date to a date-only string (YYYY-MM-DD) in the given timezone.
 * This is the canonical date representation for API/calculations —
 * independent of the browser's local timezone.
 */
export function toDateOnly(date, tz) {
  if (!date || isNaN(date?.getTime?.())) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      timeZone: tz || 'UTC',
    }).formatToParts(date);
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    if (!y || !m || !d) return null;
    return `${y}-${m}-${d}`;
  } catch {
    return null;
  }
}

/**
 * Construct a Date representing a specific wall-clock time in the given timezone.
 * @param {string} dateStr  — YYYY-MM-DD
 * @param {string} timeStr  — HH:MM (24h)
 * @param {string} tz       — IANA timezone identifier
 * Returns a Date (absolute timestamp) or null on failure.
 */
export function makeWallTimeDate(dateStr, timeStr, tz) {
  if (!dateStr) return null;
  try {
    const [y, mo, d] = dateStr.split('-').map(Number);
    const [h, mi] = (timeStr || '12:00').split(':').map(Number);
    if (![y, mo, d, h, mi].every(Number.isInteger) ||
        mo < 1 || mo > 12 || d < 1 || d > 31 || h < 0 || h > 23 || mi < 0 || mi > 59) return null;

    const nominalMs = Date.UTC(y, mo - 1, d, h, mi, 0, 0);
    const nominal = new Date(nominalMs);
    if (nominal.getUTCFullYear() !== y || nominal.getUTCMonth() !== mo - 1 || nominal.getUTCDate() !== d) return null;

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz || 'UTC',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const wallParts = (instantMs) => {
      const parts = formatter.formatToParts(new Date(instantMs));
      const value = (type) => Number(parts.find(part => part.type === type)?.value);
      return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour') % 24, minute: value('minute') };
    };
    const offsetAt = (instantMs) => {
      const p = wallParts(instantMs);
      return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - instantMs;
    };
    const offsets = new Set([
      offsetAt(nominalMs - 36 * 60 * 60 * 1000),
      offsetAt(nominalMs),
      offsetAt(nominalMs + 36 * 60 * 60 * 1000),
    ]);
    const matches = [...offsets]
      .map(offset => nominalMs - offset)
      .filter((instantMs) => {
        const p = wallParts(instantMs);
        return p.year === y && p.month === mo && p.day === d && p.hour === h && p.minute === mi;
      })
      .sort((a, b) => a - b);
    return matches.length ? new Date(matches[0]) : null;
  } catch {
    return null;
  }
}

/**
 * Add (or subtract) days from a YYYY-MM-DD date string.
 * Arithmetic is done in UTC to avoid timezone interference.
 * Returns a new YYYY-MM-DD string.
 */
export function addDays(dateStr, days) {
  if (!dateStr) return null;
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + days);
    const yy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
    } catch {
    return null;
    }
    }

    /**
    * Extract Gregorian year/month/day for a Date in a specific timezone.
    * Returns { year, month (1-based), day } — independent of browser timezone.
    */
    export function getDatePartsInTz(date, tz) {
    if (!date || isNaN(date?.getTime?.())) return null;
    try {
    const parts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    timeZone: tz || 'UTC',
    }).formatToParts(date);
    const y = Number(parts.find(p => p.type === 'year')?.value);
    const m = Number(parts.find(p => p.type === 'month')?.value);
    const d = Number(parts.find(p => p.type === 'day')?.value);
    if (!y || !m || !d) return null;
    return { year: y, month: m, day: d };
    } catch {
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
    }
    }

    /**
    * Get the day-of-week (0=Sunday…6=Saturday) for a Date in a specific timezone.
    */
    export function getWeekdayInTz(date, tz) {
    if (!date || isNaN(date?.getTime?.())) return 0;
    try {
    const parts = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: tz || 'UTC',
    }).formatToParts(date);
    const wd = parts.find(p => p.type === 'weekday')?.value;
    const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return map[wd] ?? date.getDay();
    } catch {
    return date.getDay();
    }
    }

    /**
    * Create a Date at UTC noon for the civil date of `date` in `tz`.
    * This "stable date" is safe for Hebrew-date conversion because its
    * UTC getters return the correct civil date regardless of browser timezone.
    */
    export function getStableDateForHebrew(date, tz) {
    const dateStr = toDateOnly(date, tz);
    if (!dateStr) return date;
    return new Date(dateStr + 'T12:00:00Z');
    }

    /**
    * Format a Date as a locale date string in the given timezone.
    */
    export function formatDateInTz(date, tz, options = {}) {
    if (!date || isNaN(date?.getTime?.())) return '';
    try {
    return new Intl.DateTimeFormat('en-US', { ...options, timeZone: tz || 'UTC' }).format(date);
    } catch {
    return date.toLocaleDateString('en-US', options);
    }
    }
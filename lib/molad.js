/**
 * Jerusalem Molad calculation for the Hebrew calendar.
 *
 * The molad (mean lunar conjunction) is calculated using the traditional
 * Hebrew calendar algorithm: 29 days, 12 hours, 793 parts per lunar month,
 * anchored to the BaHaRaD epoch (year 1 Tishri: day 2, 5h, 204 parts).
 *
 * Times are in Jerusalem Solar Time (UTC + 2h 20m 56s, based on Jerusalem's
 * longitude of 35.235°), which is the traditional convention for announcing
 * the molad regardless of the user's actual location.
 *
 * Verified against Chabad.org published molad times for 5786.
 */

import { toHebrewDate } from './sunCalc.js';

const _EPOCH = 347997; // Julian Day of Hebrew calendar epoch (1 Tishri year 1)
const PARTS_PER_DAY = 25920; // 24 hours × 1080 parts/hour
const JERUSALEM_OFFSET_MS = (2 * 3600 + 20 * 60 + 56) * 1000; // 2h 20m 56s

function _hebLeap(y) { return (7 * y + 1) % 19 < 7; }

function _monthsFromEpochToYear(year) {
  const y = year - 1;
  return 235 * Math.floor(y / 19) + 12 * (y % 19) + Math.floor((7 * (y % 19) + 1) / 19);
}

function _hebMonthOrder(y) {
  if (_hebLeap(y)) return [7, 8, 9, 10, 11, 12, 13, 1, 2, 3, 4, 5, 6];
  return [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
}

/**
 * Calculate the molad of a specific Hebrew month as a UTC Date.
 * @param {number} year - Hebrew year
 * @param {number} month - Hebrew month (1=Nisan, 7=Tishri, 13=Adar II)
 * @returns {Date} The molad moment in UTC
 */
export function getMolad(year, month) {
  const monthsToYear = _monthsFromEpochToYear(year);
  const order = _hebMonthOrder(year);
  const monthOffset = order.indexOf(month);
  const m = monthsToYear + (monthOffset >= 0 ? monthOffset : 0);

  // Standard molad calculation (same algorithm as _hebElapsed, without dehiyot)
  const p = 204 + 793 * (m % 1080);
  const h = 5 + 12 * m + 793 * Math.floor(m / 1080) + Math.floor(p / 1080);
  const cD = 1 + 29 * m + Math.floor(h / 24);
  const cP = 1080 * (h % 24) + p % 1080;

  // Convert to Julian Day (UTC):
  //   (cD - 1)  — days from Hebrew epoch
  //   0.25      — noon → 6 PM (Hebrew day starts at sunset)
  //   -offset   — Jerusalem Solar Time → UTC
  //   cP/25920  — parts of day from 6 PM
  const jerusalemOffsetDays = JERUSALEM_OFFSET_MS / 86400000;
  const moladJD = _EPOCH + (cD - 1) + (0.25 - jerusalemOffsetDays) + cP / PARTS_PER_DAY;

  const timestamp = (moladJD - 2440587.5) * 86400000;
  return new Date(timestamp);
}

/**
 * Get the molad of the Hebrew month containing the given Gregorian date.
 * @param {Date} date - Gregorian date
 * @returns {{ molad: Date, hebrewDate: object } | null}
 */
export function getMoladForDate(date) {
  const hd = toHebrewDate(date);
  if (!hd) return null;
  const molad = getMolad(hd.year, hd.month);
  return { molad, hebrewDate: hd };
}

/**
 * Format a UTC Date in Jerusalem Solar Time.
 * @param {Date} date - UTC date
 * @param {boolean} hour12 - use 12-hour format
 * @returns {string}
 */
export function formatJerusalemTime(date, hour12 = true) {
  if (!date || isNaN(date.getTime())) return '--';
  const jt = new Date(date.getTime() + JERUSALEM_OFFSET_MS);
  const hours = jt.getUTCHours();
  const minutes = jt.getUTCMinutes();
  if (hour12) {
    const period = hours < 12 ? 'AM' : 'PM';
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${h12}:${String(minutes).padStart(2, '0')} ${period}`;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Format a UTC Date as a full Jerusalem Solar Time display (day, date, time).
 * @param {Date} date - UTC date
 * @param {boolean} hour12 - use 12-hour format
 * @returns {{ dayName: string, dateStr: string, timeStr: string }}
 */
function _hebrewDayStr(n) {
  const ones = ['','א','ב','ג','ד','ה','ו','ז','ח','ט'];
  const tens = ['','י','כ','ל','מ','נ','ס','ע','פ','צ'];
  const mod = n % 100;
  let s;
  if (mod === 15) s = 'טו';
  else if (mod === 16) s = 'טז';
  else s = tens[Math.floor(mod / 10)] + ones[mod % 10];
  if (s.length === 1) s += '׳';
  else if (s.length > 1) s = s.slice(0, -1) + '״' + s.slice(-1);
  return s;
}

export function formatMoladDisplay(date, hour12 = true) {
  if (!date || isNaN(date.getTime())) return { dayName: '--', dateStr: '--', timeStr: '--', dayNameHe: '--', hebrewDateStr: '--' };
  const jt = new Date(date.getTime() + JERUSALEM_OFFSET_MS);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysHe = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const jerusalemLocal = new Date(jt.getUTCFullYear(), jt.getUTCMonth(), jt.getUTCDate());
  const hd = toHebrewDate(jerusalemLocal);
  return {
    dayName: days[jt.getUTCDay()],
    dateStr: `${months[jt.getUTCMonth()]} ${jt.getUTCDate()}`,
    timeStr: formatJerusalemTime(date, hour12),
    dayNameHe: daysHe[jt.getUTCDay()],
    hebrewDateStr: hd ? `${_hebrewDayStr(hd.day)} ${hd.monthName}` : '--',
  };
}

const _SYNODIC_MONTH = 29.53058867;

export function getKiddushLevanahDeadline(date) {
  const result = getMoladForDate(date);
  if (!result?.molad || isNaN(result.molad.getTime())) return null;
  return new Date(result.molad.getTime() + (_SYNODIC_MONTH / 2) * 86400000);
}

/**
 * Format a countdown duration in ms to a short string.
 */
export function fmtCountdown(ms) {
  if (ms <= 0) return 'now';
  const totalH = Math.floor(ms / 3600000);
  const d = Math.floor(totalH / 24);
  const h = totalH % 24;
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Kiddush Levanah status for a given start-day opinion.
 * Uses the Jerusalem molad as the anchor.
 * @param {Date} now - Current time
 * @param {Date} molad - Molad time (UTC)
 * @param {number} startDays - Days after molad to start (3 or 7)
 * @returns {{ status: string, startTime: Date, endTime: Date, countdownMs: number }}
 */
/**
 * Get molad with full breakdown including chalakim (1/18 of a minute).
 * Returns Jerusalem Solar Time components.
 * @param {number} year - Hebrew year
 * @param {number} month - Hebrew month (1=Nisan, 7=Tishri)
 * @param {boolean} hour12 - use 12-hour format
 */
export function getMoladWithChalakim(year, month, hour12 = true) {
  const molad = getMolad(year, month);
  if (!molad || isNaN(molad.getTime())) return null;
  const jt = new Date(molad.getTime() + JERUSALEM_OFFSET_MS);
  const dayOfWeek = jt.getUTCDay();
  const hour = jt.getUTCHours();
  const minute = jt.getUTCMinutes();
  const second = jt.getUTCSeconds();
  const ms = jt.getUTCMilliseconds();
  const fractionalMin = (second + ms / 1000) / 60;
  const chalakim = Math.round(fractionalMin * 18) % 18;

  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysHe = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  let timeStr;
  if (hour12) {
    const period = hour < 12 ? 'AM' : 'PM';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    timeStr = `${h12}:${String(minute).padStart(2, '0')} ${period}`;
  } else {
    timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  return {
    molad,
    dayOfWeek,
    dayName: daysEn[dayOfWeek],
    dayNameHe: daysHe[dayOfWeek],
    hour, minute, chalakim,
    timeStr,
    chalakimStr: `${chalakim} ${chalakim === 1 ? 'chelek' : 'chalakim'}`,
  };
}

export function kiddushStatus(now, molad, startDays) {
  const startTime = new Date(molad.getTime() + startDays * 86400000);
  const endTime = new Date(molad.getTime() + (_SYNODIC_MONTH / 2) * 86400000);

  if (now < startTime) {
    return { status: 'too_early', startTime, endTime, countdownMs: startTime.getTime() - now.getTime() };
  }
  if (now >= startTime && now < endTime) {
    return { status: 'available', startTime, endTime, countdownMs: endTime.getTime() - now.getTime() };
  }
  return { status: 'closed', startTime, endTime, countdownMs: 0 };
}
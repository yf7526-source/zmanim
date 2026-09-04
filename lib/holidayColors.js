// Unified Hebrew day-tier color system shared by the Jewish Calendar sheet,
// the Monthly Zmanim table, and the Calendar Settings panel.
// Five tiers: major, minor, fast, plain, plus custom events.
// A single source of truth so the grid and the table always agree.

import { categorizeHebcalEvent, isHiddenEvent } from './holidayDetection';

// Canonical day-tier categories, in display/priority order.
export const DAY_TIERS = ['major', 'minor', 'fast', 'plain', 'custom'];

// Tier colors — applied at low alpha for fills, full for accents.
// major  = Shabbat + Yom Tov (one shared gold)
// minor  = Chol HaMoed, Rosh Chodesh, Purim, Chanukah (much lighter gold)
// fast   = Fast days (a bit different from plain but similar — warm off-white)
// plain  = Normal days, Erev, Tu Bishvat, Pesach Sheni, Lag BaOmer, Omer, Tu B'Av (white)
// custom = User-created events (sky)
export const DEFAULT_HOLIDAY_COLORS = {
  major: '#e0a84e',   // gold
  minor: '#f0d89e',   // light gold — much lighter than major
  fast: '#d4c8b8',    // warm off-white — slightly different from plain
  plain: '#e5e7eb',   // white
  custom: '#0ea5e9',  // sky
};

export const COLOR_LABELS = {
  major: { en: 'Major (Shabbat & Yom Tov)', he: 'שבת ויום טוב' },
  minor: { en: 'Minor Holiday', he: 'חג משני' },
  fast: { en: 'Fast Day', he: 'תענית' },
  plain: { en: 'Plain Day', he: 'יום רגיל' },
  custom: { en: 'Custom Event', he: 'אירוע אישי' },
};

// Map legacy keys stored by older versions of the settings panel.
const LEGACY_KEY_MAP = {
  shabbat: 'major', yomtov: 'major',
  cholhamoed: 'minor', roshchodesh: 'minor', minor: 'minor',
  erev: 'plain', normal: 'plain',
};

export function getHolidayColors() {
  try {
    const s = localStorage.getItem('calendarColors');
    if (s) {
      const parsed = JSON.parse(s);
      const merged = { ...DEFAULT_HOLIDAY_COLORS };
      for (const [k, v] of Object.entries(parsed)) {
        const key = LEGACY_KEY_MAP[k] || k;
        if (merged[key] !== undefined && typeof v === 'string') merged[key] = v;
      }
      return merged;
    }
  } catch {}
  return { ...DEFAULT_HOLIDAY_COLORS };
}

// Backward-compat alias.
export function getCalendarColors() { return getHolidayColors(); }

export function hexToRgba(hex, alpha) {
  // Clamp + validate alpha so a bad stored value never produces invalid CSS.
  const a = typeof alpha === 'number' && isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1;
  if (!hex) return `rgba(229,231,235,${a})`;
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  if (full.length !== 6) return `rgba(229,231,235,${a})`;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Determine the dominant day-tier from a day's events + Shabbat flag.
// Priority: Major (Yom Tov > Shabbat) > Minor > Fast > Plain.
// Hidden observances are filtered out before this is called.
export function getDayCategory(events, isShabbat) {
  let hasYomTov = false, hasMinor = false, hasFast = false;
  for (const e of events || []) {
    if (e.category === 'custom') continue;
    if (isHiddenEvent(e)) continue;
    const cat = categorizeHebcalEvent(e);
    if (cat === 'yomtov') hasYomTov = true;
    else if (cat === 'cholhamoed' || cat === 'roshchodesh' || cat === 'minor') hasMinor = true;
    else if (cat === 'fast') hasFast = true;
  }
  if (hasYomTov || isShabbat) return 'major';
  if (hasMinor) return 'minor';
  if (hasFast) return 'fast';
  return 'plain';
}

// Calendar grid cell style — tinted fill + colored ring (today gets a solid ring).
export function cellStyle(category, colors, isToday) {
  const color = colors[category] || colors.plain;
  const isPlain = category === 'plain';
  return {
    backgroundColor: isPlain ? 'rgba(255,255,255,0.03)' : hexToRgba(color, 0.14),
    boxShadow: isToday
      ? `inset 0 0 0 2px ${color}`
      : isPlain
        ? `inset 0 0 0 1px ${hexToRgba(color, 0.10)}`
        : `inset 0 0 0 1px ${hexToRgba(color, 0.28)}`,
  };
}

// PDF row background — light, printable tints keyed by tier + format.
// format: 'clean' | 'earth' (compact reuses clean).
export function pdfRowBg(category, isShabbat, format) {
  const isEarth = format === 'earth';
  if (isShabbat) return isEarth ? '#e8c894' : '#f5e6c0';
  switch (category) {
    case 'major': return isEarth ? '#f0d58a' : '#f5e6c0';
    case 'minor': return isEarth ? '#f7f0d8' : '#fdf6e3';
    case 'fast': return isEarth ? '#e8e0d4' : '#f0ebe4';
    case 'plain': return isEarth ? '#fffef0' : '#ffffff';
    default: return isEarth ? '#fffef0' : '#ffffff';
  }
}
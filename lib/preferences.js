// Central lightweight preference helpers shared across SolarZmanim views.
// Keep view preferences in one place so Calendar, Monthly Times and Home stay in sync.

export const PREF_KEYS = {
  hour12: 'pref.hour12',
  calendarMonthSystem: 'pref.calendarMonthSystem',
  monthlyFollowMain: 'pref.monthlyFollowMain',
  followLocationDefaults: 'pref.followLocationDefaults',
  zmanimDisplayLevel: 'pref.zmanimDisplayLevel',
  showSecondaryTimes: 'pref.showSecondaryTimes',
  secondaryZmanimDisplay: 'pref.secondaryZmanimDisplay',
};

// Default secondary-display opinions for NEW users.
// These are DISPLAY-ONLY — they never change the primary calculation method.
// Uses the same internal method keys as OPINION_RESOLVERS in ZmanimCard.
export const DEFAULT_SECONDARY_DISPLAY = {
  shema: ['gra'],
  tefilla: ['gra'],
  tzait: ['72min'],
};

export function readBoolPref(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (value == null) return fallback;
    return value === 'true';
  } catch { return fallback; }
}

export function writeBoolPref(key, value) {
  try { localStorage.setItem(key, String(Boolean(value))); } catch {}
}

export function getCalendarMonthSystem() {
  try {
    const value = localStorage.getItem(PREF_KEYS.calendarMonthSystem);
    return value === 'greg' ? 'greg' : 'heb';
  } catch { return 'heb'; }
}

export function setCalendarMonthSystem(value) {
  const normalized = value === 'greg' ? 'greg' : 'heb';
  try { localStorage.setItem(PREF_KEYS.calendarMonthSystem, normalized); } catch {}
  try { window.dispatchEvent(new CustomEvent('calendarMonthSystemChanged', { detail: normalized })); } catch {}
  return normalized;
}

export function getMonthlyFollowMain() {
  return readBoolPref(PREF_KEYS.monthlyFollowMain, true);
}

export function setMonthlyFollowMain(value) {
  writeBoolPref(PREF_KEYS.monthlyFollowMain, value);
}

export function getZmanimDisplayLevel() {
  try {
    const saved = localStorage.getItem(PREF_KEYS.zmanimDisplayLevel);
    if (['simple', 'full', 'expert'].includes(saved)) return saved;
    const legacy = localStorage.getItem('simpleMode');
    if (legacy != null) return legacy === 'true' ? 'simple' : 'full';
    // New users default to Full — all normal main zmanim.
    return 'full';
  } catch { return 'full'; }
}

export function setZmanimDisplayLevel(value) {
  const normalized = ['simple', 'full', 'expert'].includes(value) ? value : 'full';
  try { localStorage.setItem(PREF_KEYS.zmanimDisplayLevel, normalized); } catch {}
  return normalized;
}

// ── Secondary-opinion DISPLAY preferences (display-only, never calculations) ──

export function getShowSecondaryTimes() {
  return readBoolPref(PREF_KEYS.showSecondaryTimes, true);
}

export function setShowSecondaryTimes(value) {
  writeBoolPref(PREF_KEYS.showSecondaryTimes, value);
}

export function getSecondaryZmanimDisplay() {
  try {
    const saved = localStorage.getItem(PREF_KEYS.secondaryZmanimDisplay);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults so new categories pick up sensible defaults,
      // but never overwrite a returning user's saved selections.
      return { ...DEFAULT_SECONDARY_DISPLAY, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_SECONDARY_DISPLAY };
}

export function setSecondaryZmanimDisplay(value) {
  try { localStorage.setItem(PREF_KEYS.secondaryZmanimDisplay, JSON.stringify(value || {})); } catch {}
}
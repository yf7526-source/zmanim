/**
 * Shared holiday detection utilities using Hebcal event data.
 * Ensures candle lighting and Shabbat Ends zmanim appear accurately
 * for all festivals (including Shavuot), fast days, and Shabbatot.
 */

import { toDateOnly, addDays, getWeekdayInTz } from './timezone.js';

function dateKey(date, tz) {
  if (tz) return toDateOnly(date, tz);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

// Normalize curly/smart quotes to straight quotes for reliable matching
// Hebcal sends CH''M with U+2019 characters in the title field
function normalizeTitle(title) {
  return (title || '').toLowerCase().replace(/[\u2018\u2019\u201c\u201d]/g, "'");
}

// Holiday titles that are Yom Tov days (melacha forbidden)
const YOM_TOV_KEYWORDS = [
  'rosh hashana', 'rosh hashanah',
  'yom kippur',
  'sukkot',
  'shmini atzeret', 'shemini atzeret',
  'simchat torah',
  'pesach', 'passover',
  'shavuot',
];

// Keywords that disqualify an event from being Yom Tov
const NON_YOM_TOV_KEYWORDS = [
  'chol hamoed', "ch''m",
  'erev',
  'hoshana raba', 'hoshana rabbah',
  'pesach sheni',
  'tu b',
  'purim',
  'chanukah', 'hanukah',
  'lag ba', "lag b'",
  'rosh chodesh',
  'sigd',
  'sefirat', 'omer',
  'isru chag',
];

/**
 * Check if a Hebcal event is a Yom Tov day (melacha forbidden).
 * Excludes chol hamoed, erev, and minor holidays.
 */
export function isYomTovEvent(event) {
  if (!event) return false;
  const cat = event.category;
  if (cat !== 'holiday' && cat !== 'fast') return false;
  const title = normalizeTitle(event.title);

  if (NON_YOM_TOV_KEYWORDS.some(kw => title.includes(kw))) return false;

  return YOM_TOV_KEYWORDS.some(kw => title.includes(kw));
}

/**
 * Returns true if the date is Erev Shabbat (Friday) or Erev Yom Tov
 * (the day before a festival where melacha is forbidden).
 * Controls visibility of Candle Lighting zman.
 */
export function isErevShabbatOrYomTov(date, events = [], tz) {
  if (!date) return false;
  const weekday = tz ? getWeekdayInTz(date, tz) : date.getDay();
  if (weekday === 5) return true;
  const todayStr = dateKey(date, tz);
  if (!todayStr) return false;
  const tomorrowKey = addDays(todayStr, 1);
  return events.some(e => e.date === tomorrowKey && isYomTovEvent(e));
}

/**
 * Returns true if the date is Shabbat (Saturday) or a Yom Tov
 * (a festival day where melacha is forbidden).
 * Controls visibility of Shabbat Ends zman.
 */
export function isShabbatOrYomTov(date, events = [], tz) {
  if (!date) return false;
  const weekday = tz ? getWeekdayInTz(date, tz) : date.getDay();
  if (weekday === 6) return true;
  const todayKey = dateKey(date, tz);
  return events.some(e => e.date === todayKey && isYomTovEvent(e));
}

// Fast day title keywords
const FAST_KEYWORDS = [
  "tish'a b'av", "tisha b'av", "tish'a bav", "tisha bav",
  'tzom gedaliah', 'fast of gedaliah',
  'asara b', '10th of tevet',
  "ta'anit esther", 'taanit esther', 'fast of esther',
  'shiva asar b', '17th of tammuz',
  'fast', 'tzom', 'taanit',
];

// Chol HaMoed keywords (including Hoshana Rabbah)
const CHOL_HAMOED_KEYWORDS = [
  'chol hamoed', 'chol ha-moed', "ch''m", "ch'm",
  'hoshana raba', 'hoshana rabbah',
];

// Minor-holiday keywords (lighter tier): Purim, Chanukah, Rosh Chodesh.
// Rosh Chodesh is handled by its own category, but listed here for clarity.
const MINOR_HOLIDAY_KEYWORDS = [
  'purim', 'shushan purim',
  'chanukah', 'hanukah', 'chanuka',
];

// Plain-tier holidays — observances that stay white like a normal day.
// (Erev days also fall here, handled separately via the 'erev' branch.)
const PLAIN_HOLIDAY_KEYWORDS = [
  "tu bishvat", "tu b'shvat", 'tu bshvat',
  'pesach sheni',
  'lag baomer', "lag b'omer", 'lag ba\'omer',
  "tu b'av", 'tu bav', 'tu b\'av',
];

// Hidden-tier observances — never displayed, never notified.
// (Also filtered at the API layer; this is a defense-in-depth safety net.)
const HIDDEN_KEYWORDS = [
  'sigd',
  'yom hashoah', 'yom hazikaron', 'yom haatzmaut', 'yom ha-atzmaut',
  'yom yerushalayim', 'jerusalem day',
  'family day', 'aliyah day',
  'labehemot', 'behemot', 'maaser behemot', 'ma\'aser behemot',
  'ראש השנה למעשר בהמה', 'מעשר בהמה',
];

/**
 * Categorize a Hebcal event into a badge type for display.
 * Returns one of: 'yomtov', 'fast', 'minor', 'cholhamoed',
 * 'erev', 'roshchodesh', 'omer', 'parasha', 'other'.
 * Hebcal event data is authoritative — the local fixed-date table
 * should only be used as an offline fallback.
 */
export function categorizeHebcalEvent(event) {
  if (!event) return 'other';
  if (event.category === 'parashat') return 'parasha';
  if (event.category === 'roshchodesh') return 'roshchodesh';
  if (event.category === 'omer') return 'omer';
  if (event.category !== 'holiday' && event.category !== 'fast') return 'other';

  const title = normalizeTitle(event.title);

  // Erev (preparation day before a festival)
  if (title.includes('erev')) return 'erev';

  // Chol HaMoed (including Hoshana Rabbah)
  if (CHOL_HAMOED_KEYWORDS.some(kw => title.includes(kw))) return 'cholhamoed';

  // Yom Tov (melacha forbidden)
  if (isYomTovEvent(event)) return 'yomtov';

  // Fast days
  if (FAST_KEYWORDS.some(kw => title.includes(kw)) || event.category === 'fast') return 'fast';

  // Plain-tier holidays: Tu Bishvat, Pesach Sheni, Lag BaOmer, Tu B'Av
  if (PLAIN_HOLIDAY_KEYWORDS.some(kw => title.includes(kw))) return 'plain';

  // Minor-tier holidays: Purim, Chanukah
  if (MINOR_HOLIDAY_KEYWORDS.some(kw => title.includes(kw))) return 'minor';

  // Sefirat HaOmer counting → plain tier
  if (event.category === 'omer') return 'plain';

  // Anything else unrecognized → plain
  return 'plain';
}

/**
 * Returns true if an event should be hidden entirely (never shown, never notified).
 * Sigd and Modern Israeli holidays.
 */
export function isHiddenEvent(event) {
  if (!event) return false;
  const title = normalizeTitle(event.title);
  return HIDDEN_KEYWORDS.some(kw => title.includes(kw));
}

/**
 * Filter out hidden-tier observances from an event list.
 */
export function filterHiddenEvents(events) {
  return (events || []).filter(e => !isHiddenEvent(e));
}

/**
 * Resolve a day's tier from its events + Shabbat flag.
 * Returns 'major' | 'minor' | 'fast' | 'plain'.
 * (Hidden observances are ignored — they should be filtered before calling.)
 */
export function resolveDayTier(events, isShabbat) {
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
// Israel vs Diaspora detection from a resolved IANA timezone, plus the
// region-based default zmanim opinion set. A single source of truth so Home,
// DayZmanimDetail and the calendar sheet all agree on what "Israel" means.

// Strict set of IANA zones that are unambiguously Israel.
const ISRAEL_TIMEZONES = new Set(['Asia/Jerusalem', 'Asia/Tel_Aviv', 'Israel']);

export function isIsraelTimezone(tz) {
  if (!tz) return false;
  return ISRAEL_TIMEZONES.has(tz);
}

// Region-based default opinions.
// Israel  → alot 90min, tzait 8.5°, shabbatEnds 8.5°
// Diaspora → alot 72min, tzait 72min, shabbatEnds 72min
// candleLighting stays 18 (city-specific offsets like Yerushalayim 40 are
// applied elsewhere) so we don't surprise existing users.
export function defaultOpinionsForTimezone(tz) {
  const isIsrael = isIsraelTimezone(tz);
  return {
    alot: isIsrael ? '90min' : '72min',
    misheyakir: '11.5',
    netz: 'sealevel',
    shema: 'mga',
    tefilla: 'mga',
    chatzot: 'standard',
    minchaGedola: 'mga',
    minchaKetana: 'mga',
    plagHaMincha: 'mga',
    candleLighting: '18',
    shabbatEnds: isIsrael ? '8.5' : '72min',
    shkiah: 'sealevel',
    beinHaShmashos: 'standard',
    tzait: isIsrael ? '8.5' : '72min',
    chatzotNight: 'standard',
    elevationAdjust: 'off',
    _v: 5,
  };
}

// Options for the shared Shabbat Ends selector (used by SettingsSheet and
// resolved by ZmanimCard + DayZmanimDetail).
export const SHABBAT_ENDS_OPTIONS = [
  { key: '7.083', label: '7.083°', sub: '3 medium stars (lenient)' },
  { key: '8.5',   label: '8.5°',   sub: 'Most Ashkenaz (standard)' },
  { key: '16.1',  label: '16.1°',  sub: 'Stringent / Geonim' },
  { key: '72min', label: '72 min', sub: 'Rabbeinu Tam — fixed' },
];
/**
 * Hebcal API integration for calculated zmanim, parasha, holidays, and Omer.
 * Docs: https://www.hebcal.com/home/1663/zmanim-halachic-times-api
 */

const BASE_ZMANIM = 'https://www.hebcal.com/zmanim';
const BASE_CAL = 'https://www.hebcal.com/hebcal';

import { getSunTimes, findSunTime, elevationMetersToDegrees } from './sunCalc.js';
import { getKiddushLevanahDeadline } from './molad.js';
import { addDays, toDateOnly, getBrowserTimezone } from './timezone.js';

function validateCoordinates(lat, lng) {
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (!Number.isFinite(numLat) || !Number.isFinite(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
    throw new Error('Invalid coordinates');
  }
  return { numLat, numLng };
}

/**
 * Fetch calculated zmanim from Hebcal for a given date + location.
 * Returns the `times` object with ISO strings.
 */
export async function fetchHebcalZmanim(dateOrStr, lat, lng, elevation = 0, tzid = null, signal = null) {
  const { numLat, numLng } = validateCoordinates(lat, lng);
  const safeTzid = tzid || getBrowserTimezone();
  // Accept either a YYYY-MM-DD string or a Date object.
  // For Date objects, extract the date in the target timezone — never the browser's.
  const dateStr = typeof dateOrStr === 'string'
    ? dateOrStr
    : toDateOnly(dateOrStr, safeTzid);
  if (!dateStr) throw new Error('Invalid date');
  const params = new URLSearchParams({
    cfg: 'json',
    latitude: numLat.toFixed(6),
    longitude: numLng.toFixed(6),
    date: dateStr,
    sec: '1',
  });
  if (tzid) params.set('tzid', tzid);
  // Send elevation as integer (including negative for below sea level)
  const numElev = Number(elevation);
  if (isFinite(numElev) && numElev !== 0) {
    params.set('elevation', String(Math.round(numElev)));
  }

  const res = await fetch(`${BASE_ZMANIM}?${params}`, { signal });
  if (!res.ok) throw new Error('Hebcal zmanim fetch failed');
  const json = await res.json();
  // Convert all ISO strings in times to Date objects
  const times = {};
  for (const [k, v] of Object.entries(json.times || {})) {
    times[k] = v ? new Date(v) : null;
  }
  const resolvedTzid = (json.location && json.location.tzid) || tzid || null;
  return { times, tzid: resolvedTzid };
}

/**
 * Fetch Jewish calendar events for a date range: parasha, holidays, omer, rosh chodesh.
 * Returns array of event items.
 */
/** Fetch multi-day zmanim using Hebcal's documented 180-day batch endpoint. */
export async function fetchHebcalZmanimRange(startOrStr, endOrStr, lat, lng, elevation = 0, tzid = null, signal = null) {
  const { numLat, numLng } = validateCoordinates(lat, lng);
  const safeTzid = tzid || getBrowserTimezone();
  const start = typeof startOrStr === 'string' ? startOrStr : toDateOnly(startOrStr, safeTzid);
  const end = typeof endOrStr === 'string' ? endOrStr : toDateOnly(endOrStr, safeTzid);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start || '') || !/^\d{4}-\d{2}-\d{2}$/.test(end || '') || start > end) throw new Error('Invalid date range');

  const timesByDate = {};
  let resolvedTzid = tzid || null;
  let chunkStart = start;
  while (chunkStart <= end) {
    const candidateEnd = addDays(chunkStart, 179);
    const chunkEnd = candidateEnd && candidateEnd < end ? candidateEnd : end;
    const params = new URLSearchParams({
      cfg: 'json', latitude: numLat.toFixed(6), longitude: numLng.toFixed(6),
      start: chunkStart, end: chunkEnd, sec: '1',
    });
    if (tzid) params.set('tzid', tzid);
    const numElev = Number(elevation);
    if (Number.isFinite(numElev) && numElev !== 0) params.set('elevation', String(Math.round(numElev)));
    const res = await fetch(`${BASE_ZMANIM}?${params}`, { signal });
    if (!res.ok) throw new Error('Hebcal zmanim range fetch failed');
    const json = await res.json();
    resolvedTzid = resolvedTzid || json.location?.tzid || null;
    for (const [field, values] of Object.entries(json.times || {})) {
      for (const [date, value] of Object.entries(values || {})) {
        if (!timesByDate[date]) timesByDate[date] = {};
        timesByDate[date][field] = value ? new Date(value) : null;
      }
    }
    chunkStart = addDays(chunkEnd, 1);
  }
  return { timesByDate, tzid: resolvedTzid || safeTzid };
}

export async function fetchHebcalEvents(startOrStr, endOrStr, lat, lng, isIsrael = false, tzid = null, signal = null) {
  const { numLat, numLng } = validateCoordinates(lat, lng);
  const safeTzid = tzid || getBrowserTimezone();
  // Accept either YYYY-MM-DD strings or Date objects.
  // For Date objects, extract the date in the target timezone — never the browser's.
  const start = typeof startOrStr === 'string' ? startOrStr : toDateOnly(startOrStr, safeTzid);
  const end = typeof endOrStr === 'string' ? endOrStr : toDateOnly(endOrStr, safeTzid);
  if (!start || !end) throw new Error('Invalid date range');
  const params = new URLSearchParams({
    v: '1',
    cfg: 'json',
    maj: 'on',
    min: 'on',
    mod: 'off',
    nx: 'on',
    mf: 'on',
    ss: 'on',
    s: 'on',
    o: 'on',
    start,
    end,
    geo: 'pos',
    latitude: numLat.toFixed(6),
    longitude: numLng.toFixed(6),
    i: isIsrael ? 'on' : 'off',
    leyning: 'off',
  });
  if (tzid) params.set('tzid', tzid);

  const res = await fetch(`${BASE_CAL}?${params}`, { signal });
  if (!res.ok) throw new Error('Hebcal calendar fetch failed');
  const json = await res.json();
  // Exclude modern Zionist/state holidays (including Yom HaShoah); only traditional dates are retained
  const STATE_HOLIDAY_KEYWORDS = ['haatzmaut', 'ha-atzmaut', 'hazikaron', 'ha-zikaron', 'yerushalayim', 'jerusalem day', 'hashoah', 'shoah', 'sigd', 'family day', 'aliyah', 'yom ha'];
  return (json.items || [])
    .filter(item => {
      const title = (item.title || '').toLowerCase();
      const hebrew = (item.hebrew || '').toLowerCase();
      if (item.category === 'havdalah') return false;
      if (title.includes('havdalah') || hebrew.includes('הבדלה')) return false;
      return !STATE_HOLIDAY_KEYWORDS.some(kw => title.includes(kw));
    })
    .map(item => ({
      ...item,
      // Normalize datetime strings to date-only for consistent date matching
      date: item.date ? item.date.substring(0, 10) : item.date,
    }));
}

/**
 * From the raw hebcal zmanim times object, build a normalized sunTimes object
 * compatible with ZmanimCard + the rest of the app.
 */
export function normalizeTimes(times, zmanimOpinions = {}, location = null, horizonOffsetDeg = 0, dateStr = null) {
  if (!times) return null;
  const t = times;

  let netz   = t.sunrise   || null;
  let shkiah = t.sunset    || null;
  const chatzot = t.chatzot  || null;

  // Derive calcDate from the explicit date-only string — never from
  // refDate.getFullYear()/getMonth()/getDate() which are browser-local.
  // Local noon is used so getFullYear/getMonth/getDate give the correct
  // civil date regardless of the browser timezone.
  const calcDate = dateStr
    ? (() => { const [y, m, d] = dateStr.split('-').map(Number); return new Date(y, m - 1, d, 12, 0, 0, 0); })()
    : (() => { const r = netz || shkiah || chatzot; return r ? new Date(r.getFullYear(), r.getMonth(), r.getDate(), 12, 0, 0, 0) : new Date(); })();

  // ELEVATION OWNERSHIP (applied exactly once — never both):
  // - "geometric" mode: Hebcal API receives physical elevation; horizonOffsetDeg = 0 (skip).
  // - "manual" mode: Hebcal gets 0; local calc applies user angles { sunrise, sunset }.
  // - "none" mode: standard -0.833° horizon; horizonOffsetDeg = 0 (skip).
  // Note: geometric elevation does NOT account for terrain, buildings, or trees.
  const _hasHorizonOffset = horizonOffsetDeg && (
    typeof horizonOffsetDeg === 'object'
      ? (horizonOffsetDeg.sunrise || horizonOffsetDeg.sunset)
      : horizonOffsetDeg
  );
  if (_hasHorizonOffset && location) {
    const offsetSt = getSunTimes(calcDate, location.lat, location.lng, zmanimOpinions.alot || '16.1', zmanimOpinions.tzait || '8.5', horizonOffsetDeg);
    if (offsetSt) {
      netz = offsetSt.netz;
      shkiah = offsetSt.shkiah;
    }
  }

  // Shaah zmanit GRA (netz→shkiah / 12)
  const shaahGra = (netz && shkiah) ? (shkiah.getTime() - netz.getTime()) / 12 : null;

  // Local fallback for opinions Hebcal doesn't provide
  const localSt = location
    ? getSunTimes(calcDate, location.lat, location.lng, zmanimOpinions.alot || '16.1', zmanimOpinions.tzait || '8.5', horizonOffsetDeg)
    : null;

  // Resolve alotActive from user's alot opinion
  const alotOp = zmanimOpinions.alot || '16.1';
  let alotActive;
  switch (alotOp) {
    case '16.1':   alotActive = t.alotHaShachar || null; break;
    case '72min':  alotActive = netz ? new Date(netz.getTime() - 72 * 60000) : null; break;
    case '90min':  alotActive = netz ? new Date(netz.getTime() - 90 * 60000) : null; break;
    case '96min':  alotActive = netz ? new Date(netz.getTime() - 96 * 60000) : null; break;
    case '120min': alotActive = netz ? new Date(netz.getTime() - 120 * 60000) : null; break;
    case '18':     alotActive = localSt?.alot_18 || null; break;
    case '19.8':   alotActive = localSt?.alot_19_8 || null; break;
    default:       alotActive = null;
  }

  // Resolve tzaitActive from user's tzait opinion
  const tzaitOp = zmanimOpinions.tzait || '8.5';
  let tzaitActive;
  switch (tzaitOp) {
    case '7.083': tzaitActive = t.tzeit7083deg || null; break;
    case '8.5':   tzaitActive = t.tzeit85deg || null; break;
    case '72min': tzaitActive = t.tzeit72min || null; break;
    case '13':    tzaitActive = localSt?.tzait_13 || null; break;
    case '16.1':  tzaitActive = localSt?.tzait_16_1 || null; break;
    default:       tzaitActive = null;
  }

  const shaahMga = (alotActive && tzaitActive) ? (tzaitActive - alotActive) / 12 : null;

  // Sea-level sunrise/sunset — always at the standard −0.833° horizon with no
  // elevation dip, independent of the app's horizon/elevation mode.
  const netzSealevel = location
    ? (findSunTime(calcDate, location.lat, location.lng, -0.833, true) || netz)
    : netz;
  const shkiahSealevel = location
    ? (findSunTime(calcDate, location.lat, location.lng, -0.833, false) || shkiah)
    : shkiah;
  // Elevation-adjusted sunrise/sunset (horizon dip from physical elevation).
  const _elev = location?.elevation || 0;
  const _dip = (Math.abs(_elev) >= 1) ? elevationMetersToDegrees(_elev) : 0;
  const netzElevation = _dip
    ? (findSunTime(calcDate, location.lat, location.lng, -0.833 - _dip, true) || netzSealevel)
    : netzSealevel;
  const shkiahElevation = _dip
    ? (findSunTime(calcDate, location.lat, location.lng, -0.833 - _dip, false) || shkiahSealevel)
    : shkiahSealevel;

  return {
    // Location metadata (for custom degree-based zmanim)
    _lat: location?.lat ?? null,
    _lng: location?.lng ?? null,
    _dateStr: dateStr || null,

    // Calculation method metadata — maps each zman key to its calculation type
    _calcMethods: {
      netz: 'solar_degrees', shkiah: 'solar_degrees', chatzot: 'proportional_hours',
      shaahGra: 'proportional_hours', shaahMga: 'proportional_hours',
      alot_16_1: 'solar_degrees', alot_18: 'solar_degrees', alot_19_8: 'solar_degrees',
      alot_72min: 'fixed_minutes', alot_90min: 'fixed_minutes', alot_96min: 'fixed_minutes', alot_120min: 'fixed_minutes',
      misheyakir_10_2: 'solar_degrees', misheyakir_11: 'solar_degrees', misheyakir_11_5: 'solar_degrees', misheyakir_60min: 'fixed_minutes',
      shema_gra: 'proportional_hours', shema_mga: 'proportional_hours', shema_bht: 'provider_value',
      tefilla_gra: 'proportional_hours', tefilla_mga: 'proportional_hours', tefilla_bht: 'provider_value',
      minchaGedola_gra: 'proportional_hours', minchaGedola_mga: 'proportional_hours', minchaGedola_bht: 'provider_value',
      minchaKetana_gra: 'proportional_hours', minchaKetana_mga: 'proportional_hours', minchaKetana_bht: 'provider_value',
      plagHaMincha_gra: 'proportional_hours', plagHaMincha_mga: 'proportional_hours', plagHaMincha_bht: 'provider_value',
      candleLighting_18: 'fixed_minutes', candleLighting_20: 'fixed_minutes', candleLighting_30: 'fixed_minutes', candleLighting_40: 'fixed_minutes',
      tzait_7_083: 'solar_degrees', tzait_8_5: 'solar_degrees', tzait_13: 'solar_degrees', tzait_16_1: 'solar_degrees',
      rabbeinuTam_fixed: 'fixed_minutes', rabbeinuTam_deg: 'solar_degrees',
    },

    // Sea-level & elevation-adjusted sunrise/sunset opinions
    netzSealevel, shkiahSealevel, netzElevation, shkiahElevation,

    // Core
    netz, shkiah, chatzot, shaahGra, shaahMga,

    // Alot
    alotActive,
    alot_16_1:  t.alotHaShachar   || localSt?.alot_16_1 || null,
    alot_18:    localSt?.alot_18    || null,
    alot_19_8:  localSt?.alot_19_8  || null,
    alot_72min: netz ? new Date(netz.getTime() - 72*60000)  : null,
    alot_90min: netz ? new Date(netz.getTime() - 90*60000)  : null,
    alot_96min: netz ? new Date(netz.getTime() - 96*60000)  : null,
    alot_120min:netz ? new Date(netz.getTime() - 120*60000) : null,

    // Baal Hatanya alot
    alotBaalHatanya: t.alosBaalHatanya || null,

    // Misheyakir
    misheyakir_10_2:  t.misheyakirMachmir || localSt?.misheyakir_10_2 || null,
    misheyakir_11:    localSt?.misheyakir_11 || null,
    misheyakir_11_5:  t.misheyakir        || localSt?.misheyakir_11_5 || null,
    misheyakir_60min: netz ? new Date(netz.getTime() - 60*60000) : null,

    // Shema
    shema_gra: t.sofZmanShma      || null,
    shema_mga: (alotActive && shaahMga) ? new Date(alotActive.getTime() + 3 * shaahMga) : (t.sofZmanShmaMGA || null),
    shema_bht: t.sofZmanShmaBaalHatanya || null,

    // Tefilla
    tefilla_gra: t.sofZmanTfilla    || null,
    tefilla_mga: (alotActive && shaahMga) ? new Date(alotActive.getTime() + 4 * shaahMga) : (t.sofZmanTfillaMGA || null),
    tefilla_bht: t.sofZmanTfilaBaalHatanya || null,

    // Mincha — GRA from Hebcal; MGA computed from alotActive + shaahMga
    minchaGedola_gra: t.minchaGedola           || null,
    minchaGedola_mga: (alotActive && shaahMga && chatzot)
      ? new Date(Math.max(alotActive.getTime() + 6.5 * shaahMga, chatzot.getTime() + 30 * 60000))
      : null,
    minchaGedola_bht: t.minchaGedolaBaalHatanya || null,
    minchaKetana_gra: t.minchaKetana           || null,
    minchaKetana_mga: (alotActive && shaahMga)
      ? new Date(alotActive.getTime() + 9.5 * shaahMga)
      : null,
    minchaKetana_bht: t.minchaKetanaBaalHatanya || null,
    plagHaMincha_gra: t.plagHaMincha           || null,
    plagHaMincha_mga: (alotActive && shaahMga)
      ? new Date(alotActive.getTime() + 10.75 * shaahMga)
      : null,
    plagHaMincha_bht: t.plagHaminchaBaalHatanya || null,

    // Candle lighting (calculated from shkiah, not from Hebcal event)
    candleLighting:    (() => {
      const op = zmanimOpinions.candleLighting || '18';
      const mins = parseInt(op, 10) || 18;
      return shkiah ? new Date(shkiah.getTime() - mins * 60000) : null;
    })(),
    candleLighting_18: shkiah ? new Date(shkiah.getTime() - 18*60000) : null,
    candleLighting_20: shkiah ? new Date(shkiah.getTime() - 20*60000) : null,
    candleLighting_30: shkiah ? new Date(shkiah.getTime() - 30*60000) : null,
    candleLighting_40: shkiah ? new Date(shkiah.getTime() - 40*60000) : null,

    // Motzei Shabbat (based on the shared shabbatEnds opinion, default 72 min)
    motzeiShabbat: (() => {
      const mOp = zmanimOpinions.shabbatEnds || zmanimOpinions.motzeiShabbat || '72min';
      switch (mOp) {
        case '8.5':   return t.tzeit85deg || null;
        case '7.083': return t.tzeit7083deg || null;
        case '16.1':  return localSt?.tzait_16_1 || null;
        case '72min': default: return t.tzeit72min || (shkiah ? new Date(shkiah.getTime() + 72 * 60000) : null);
      }
    })(),

    // Tzait
    tzait_7_083:      t.tzeit7083deg  || localSt?.tzait_7_083 || null,
    tzait_8_5:        t.tzeit85deg    || localSt?.tzait_8_5   || null,
    tzait_13:         localSt?.tzait_13  || null,
    tzait_16_1:       localSt?.tzait_16_1 || null,
    // Rabbeinu Tam — 72 fixed minutes (never degree-based)
    rabbeinuTam_fixed: t.tzeit72min || (shkiah ? new Date(shkiah.getTime() + 72 * 60000) : null),
    // Tzait at 16.1° — degree-based, separate concept from 72 fixed minutes
    rabbeinuTam_deg:  localSt?.tzait_16_1 || null,
    tzaitBaalHatanya: t.tzaisBaalHatanya || null,

    // Bein HaShmashos variants (offsets from shkiah / tzait_7_083)
    yereim_start:     shkiah ? new Date(shkiah.getTime() - 13.5 * 60000) : null,
    geonim_13_5:      shkiah ? new Date(shkiah.getTime() + 13.5 * 60000) : null,
    rabbeinuTam_58_5: shkiah ? new Date(shkiah.getTime() + 58.5 * 60000) : null,
    before_7_083:    (t.tzeit7083deg || shkiah) ? new Date((t.tzeit7083deg || shkiah).getTime() - 13.5 * 60000) : null,

    // Extras
    beinHaShmashos:   t.beinHaShmashos || null,
    chatzotNight:     t.chatzotNight   || null,
    sofZmanKidushLevana: getKiddushLevanahDeadline(dateStr ? new Date(`${dateStr}T12:00:00Z`) : calcDate),

    // ── Resolved top-level keys (based on user's selected opinion) ──
    // Used by SunCircle ring markers — each maps to the opinion the user picked.
    alot:           alotActive || null,
    misheyakir:     (() => {
      const op = zmanimOpinions.misheyakir || '11.5';
      switch (op) {
        case '10.2':  return t.misheyakirMachmir || localSt?.misheyakir_10_2 || null;
        case '11':    return localSt?.misheyakir_11 || null;
        case '11.5':  return t.misheyakir || localSt?.misheyakir_11_5 || null;
        case '60min': return netz ? new Date(netz.getTime() - 60*60000) : null;
        default:      return null;
      }
    })(),
    shema:          (() => {
      const op = zmanimOpinions.shema || 'gra';
      const map = { 'gra': t.sofZmanShma, 'mga': (alotActive && shaahMga) ? new Date(alotActive.getTime() + 3 * shaahMga) : (t.sofZmanShmaMGA || null), 'bht': t.sofZmanShmaBaalHatanya };
      return map[op] || t.sofZmanShma || null;
    })(),
    tefilla:        (() => {
      const op = zmanimOpinions.tefilla || 'gra';
      const map = { 'gra': t.sofZmanTfilla, 'mga': (alotActive && shaahMga) ? new Date(alotActive.getTime() + 4 * shaahMga) : (t.sofZmanTfillaMGA || null), 'bht': t.sofZmanTfilaBaalHatanya };
      return map[op] || t.sofZmanTfilla || null;
    })(),
    minchaGedola:   (() => {
      const op = zmanimOpinions.minchaGedola || 'gra';
      const mga = (alotActive && shaahMga && chatzot) ? new Date(Math.max(alotActive.getTime() + 6.5 * shaahMga, chatzot.getTime() + 30 * 60000)) : null;
      const map = { 'gra': t.minchaGedola, 'mga': mga, 'bht': t.minchaGedolaBaalHatanya };
      return map[op] || t.minchaGedola || null;
    })(),
    minchaKetana:   (() => {
      const op = zmanimOpinions.minchaKetana || 'gra';
      const mga = (alotActive && shaahMga) ? new Date(alotActive.getTime() + 9.5 * shaahMga) : null;
      const map = { 'gra': t.minchaKetana, 'mga': mga, 'bht': t.minchaKetanaBaalHatanya };
      return map[op] || t.minchaKetana || null;
    })(),
    plagHaMincha:   (() => {
      const op = zmanimOpinions.plagHaMincha || 'gra';
      const mga = (alotActive && shaahMga) ? new Date(alotActive.getTime() + 10.75 * shaahMga) : null;
      const map = { 'gra': t.plagHaMincha, 'mga': mga, 'bht': t.plagHaminchaBaalHatanya };
      return map[op] || t.plagHaMincha || null;
    })(),
    tzait:          tzaitActive || null,
  };
}
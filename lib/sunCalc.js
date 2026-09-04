/**
 * Solar position calculations based on NOAA/astronomical algorithms.
 * All calculations are client-side, no API needed.
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/**
 * Convert physical elevation (meters) to horizon dip angle (degrees).
 * Positive elevation → horizon lower → earlier sunrise, later sunset.
 * Below sea level → negative offset (horizon higher → later sunrise).
 */
export function elevationMetersToDegrees(meters) {
  if (!meters || Math.abs(meters) < 1) return 0;
  const R = 6371000; // Earth radius in meters
  if (meters > 0) {
    const ratio = R / (R + meters);
    return ratio < 1 ? Math.acos(ratio) * 180 / Math.PI : 0;
  }
  return -Math.sqrt(2 * Math.abs(meters) / R) * 180 / Math.PI;
}

export function toJulianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

export function fromJulianDay(jd) {
  return new Date((jd - 2440587.5) * 86400000);
}

/**
 * Calculate sun position (altitude and azimuth) for a given date/time and location.
 */
export function getSunPosition(date, lat, lng) {
  const jd = toJulianDay(date);
  const n = jd - 2451545.0;

  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * DEG;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG;
  const epsilon = (23.439 - 0.0000004 * n) * DEG;

  const sinDec = Math.sin(epsilon) * Math.sin(lambda);
  const dec = Math.asin(sinDec);
  const cosDec = Math.cos(dec);
  const RA = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda));

  const UT = (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600);
  const GMST = (6.697375 + 0.0657098242 * n + UT) % 24;
  const LMST = ((GMST + lng / 15) % 24 + 24) % 24;
  const H = (LMST * 15 - RA * RAD) * DEG;

  const latRad = lat * DEG;
  const sinAlt = Math.sin(latRad) * Math.sin(dec) + Math.cos(latRad) * Math.cos(dec) * Math.cos(H);
  const altitude = Math.asin(sinAlt) * RAD;

  const cosAz = (Math.sin(dec) - Math.sin(latRad) * sinAlt) / (Math.cos(latRad) * Math.cos(altitude * DEG));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * RAD;
  if (Math.sin(H) > 0) azimuth = 360 - azimuth;

  return { altitude, azimuth };
}

/**
 * Find the time when sun reaches a specific altitude.
 * rising=true → find morning crossing (below→at/above target).
 * rising=false → find evening crossing (above→at/below target).
 * Returns null if no real crossing exists (polar day/night, or
 * the sun never reaches the requested twilight angle).
 */
export function findSunTime(date, lat, lng, targetAltitude, rising) {
  const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
  const noonMs = dayStart.getTime() + (12 - lng / 15) * 3600000;

  const windowStart = rising ? noonMs - 12 * 3600000 : noonMs;
  const windowEnd = rising ? noonMs : noonMs + 12 * 3600000;

  // Verify a real altitude crossing exists before binary search.
  // Sample at regular intervals and look for a transition in the correct direction.
  const samples = 48; // every ~15 minutes over 12 hours
  const stepMs = (windowEnd - windowStart) / samples;
  let crossLo = null, crossHi = null;

  for (let i = 0; i < samples; i++) {
    const t0 = windowStart + i * stepMs;
    const t1 = windowStart + (i + 1) * stepMs;
    const alt0 = getSunPosition(new Date(t0), lat, lng).altitude;
    const alt1 = getSunPosition(new Date(t1), lat, lng).altitude;

    if (rising) {
      if (alt0 < targetAltitude && alt1 >= targetAltitude) { crossLo = t0; crossHi = t1; break; }
    } else {
      if (alt0 >= targetAltitude && alt1 < targetAltitude) { crossLo = t0; crossHi = t1; break; }
    }
  }

  // No crossing found — sun never reaches the target altitude in this window
  if (crossLo === null) return null;

  // Binary search within the verified crossing interval
  let lo = crossLo, hi = crossHi;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const pos = getSunPosition(new Date(mid), lat, lng);
    if (pos.altitude < targetAltitude) {
      if (rising) lo = mid; else hi = mid;
    } else {
      if (rising) hi = mid; else lo = mid;
    }
    if (hi - lo < 500) break;
  }
  return new Date((lo + hi) / 2);
}

/**
 * Get all key sun times for a given date and location.
 *
 * Alot options (alotOpinion):
 *   '72min'   = 72 fixed minutes before netz (Rabbeinu Tam / some use for MGA base)
 *   '90min'   = 90 fixed minutes before netz (stringent Ashkenaz)
 *   '96min'   = 96 fixed minutes before netz (some Sephardic)
 *   '120min'  = 120 fixed minutes (very stringent Shabbat)
 *   '16.1'    = 16.1° below horizon (Ohr HaChaim / most common MGA base)
 *   '18'      = 18° below horizon (astronomical twilight)
 *   '19.8'    = 19.8° below horizon (Chacham Tzvi / R' Tukaczinsky)
 *
 * Default alot: 16.1° (most common for Ashkenaz/MGA base per KosherJava / MyZmanim)
 */
export function getSunTimes(date, lat, lng, alotOpinion = '16.1', tzaitOpinion = '8.5', horizonOffsetDeg = 0) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));

  try {
    // === Horizon degree offset ===
    // User-supplied degree offset below the standard -0.833° horizon.
    // Positive value = sun must be lower → sunrise earlier, sunset later.
    // Support separate sunrise/sunset horizon angles (east/west can differ).
    // horizonOffsetDeg can be a number (same for both) or { sunrise, sunset }.
    const _offset = (typeof horizonOffsetDeg === 'object' && horizonOffsetDeg !== null)
      ? horizonOffsetDeg : { sunrise: horizonOffsetDeg || 0, sunset: horizonOffsetDeg || 0 };
    const sunriseAlt = -0.833 - _offset.sunrise;
    const sunsetAlt  = -0.833 - _offset.sunset;

    // === Core: Netz & Shkiah ===
    const netz   = findSunTime(d, lat, lng, sunriseAlt, true);
    const shkiah = findSunTime(d, lat, lng, sunsetAlt, false);

    // === Alot HaShachar (Dawn) — all opinions ===
    const alot_16_1  = findSunTime(d, lat, lng, -16.1, true);
    const alot_18    = findSunTime(d, lat, lng, -18,   true);
    const alot_19_8  = findSunTime(d, lat, lng, -19.8, true);
    const alot_72min = netz ? new Date(netz.getTime() - 72  * 60000) : null;
    const alot_90min = netz ? new Date(netz.getTime() - 90  * 60000) : null;
    const alot_96min = netz ? new Date(netz.getTime() - 96  * 60000) : null;
    const alot_120min= netz ? new Date(netz.getTime() - 120 * 60000) : null;

    // The "active" alot = what drives MGA/halachic day start
    const alotMap = {
      '16.1':  alot_16_1,
      '18':    alot_18,
      '19.8':  alot_19_8,
      '72min': alot_72min,
      '90min': alot_90min,
      '96min': alot_96min,
      '120min':alot_120min,
    };
    const alotActive = alotMap[alotOpinion] || alot_16_1;

    // === Tzait Kochavim (nightfall) — all opinions ===
    const tzait_7_083 = findSunTime(d, lat, lng, -7.083, false); // 3 medium stars (Shabbat lenient)
    const tzait_8_5   = findSunTime(d, lat, lng, -8.5,   false); // GRA / most Ashkenaz
    const tzait_13    = findSunTime(d, lat, lng, -13,    false); // R' Moshe Feinstein (Shabbat)
    const tzait_16_1  = findSunTime(d, lat, lng, -16.1,  false); // Geonim / stringent
    const rabbeinuTam_fixed = shkiah ? new Date(shkiah.getTime() + 72 * 60000) : null; // Rabbeinu Tam: 72 min after shkiah
    // Some use Rabbeinu Tam as degrees: ~16.1° (same as alot_16_1 mirrored)
    const rabbeinuTam_deg = tzait_16_1;

    // Active tzait for MGA day end — respects user's tzait opinion
    const tzaitMap = {
      '7.083': tzait_7_083,
      '8.5':   tzait_8_5,
      '13':    tzait_13,
      '16.1':  tzait_16_1,
      '72min': rabbeinuTam_fixed,
    };
    const tzaitActive = tzaitMap[tzaitOpinion] || tzait_8_5;

    // === Sha'a Zmanit (halachic hour) ===
    // GRA: netz to shkiah / 12
    const shaahGra = (netz && shkiah) ? (shkiah.getTime() - netz.getTime()) / 12 : null;
    // MGA: alotActive to tzaitActive / 12
    const shaahMga = (alotActive && tzaitActive) ? (tzaitActive.getTime() - alotActive.getTime()) / 12 : null;

    // === Misheyakir (earliest tallit & tefillin) ===
    const misheyakir_10_2  = findSunTime(d, lat, lng, -10.2, true);  // Ateret / some Rishonim
    const misheyakir_11    = findSunTime(d, lat, lng, -11,   true);  // R' Moshe Feinstein
    const misheyakir_11_5  = findSunTime(d, lat, lng, -11.5, true);  // Achronim (most common)
    const misheyakir_60min = netz ? new Date(netz.getTime() - 60 * 60000) : null;  // Baladi Yemenite: 60 min before netz

    // === Sof Zman Kriat Shema ===
    // GRA: netz + 3 shaahGra
    const shema_gra = (netz && shaahGra != null) ? new Date(netz.getTime() + 3 * shaahGra) : null;
    // MGA: alotActive + 3 shaahMga
    const shema_mga = (alotActive && shaahMga != null) ? new Date(alotActive.getTime() + 3 * shaahMga) : null;

    // === Sof Zman Tefilla (Shacharit) ===
    // GRA: netz + 4 shaahGra
    const tefilla_gra = (netz && shaahGra != null) ? new Date(netz.getTime() + 4 * shaahGra) : null;
    // MGA: alotActive + 4 shaahMga
    const tefilla_mga = (alotActive && shaahMga != null) ? new Date(alotActive.getTime() + 4 * shaahMga) : null;

    // === Chatzot (solar noon) ===
    // GRA: exactly 6 shaahGra from netz
    const chatzot = (netz && shaahGra != null) ? new Date(netz.getTime() + 6 * shaahGra) : null;

    // === Mincha Gedola ===
    // Earliest Mincha = 6.5 shaahGra from netz OR 30 real min after chatzot, whichever is LATER
    const minchaGedola_gra_raw = (netz && shaahGra != null) ? new Date(netz.getTime()       + 6.5 * shaahGra) : null;
    const minchaGedola_mga_raw = (alotActive && shaahMga != null) ? new Date(alotActive.getTime() + 6.5 * shaahMga) : null;
    const chatzot30 = chatzot ? new Date(chatzot.getTime() + 30 * 60000) : null;
    const minchaGedola_gra = (minchaGedola_gra_raw && chatzot30)
      ? new Date(Math.max(minchaGedola_gra_raw.getTime(), chatzot30.getTime()))
      : (minchaGedola_gra_raw || chatzot30 || null);
    const minchaGedola_mga = (minchaGedola_mga_raw && chatzot30)
      ? new Date(Math.max(minchaGedola_mga_raw.getTime(), chatzot30.getTime()))
      : (minchaGedola_mga_raw || chatzot30 || null);

    // === Mincha Ketana ===
    // 9.5 shaahGra from netz (GRA) / alotActive (MGA)
    const minchaKetana_gra = (netz && shaahGra != null) ? new Date(netz.getTime()       + 9.5 * shaahGra) : null;
    const minchaKetana_mga = (alotActive && shaahMga != null) ? new Date(alotActive.getTime() + 9.5 * shaahMga) : null;

    // === Plag HaMincha ===
    // 10.75 shaahGra from netz (GRA) / alotActive (MGA)
    const plagHaMincha_gra = (netz && shaahGra != null) ? new Date(netz.getTime()       + 10.75 * shaahGra) : null;
    const plagHaMincha_mga = (alotActive && shaahMga != null) ? new Date(alotActive.getTime() + 10.75 * shaahMga) : null;

    // === Bein HaShmashos variants ===
    const yereim_start     = shkiah ? new Date(shkiah.getTime() - 13.5 * 60000) : null;     // Yereim: 13.5m before shkiah
    const geonim_13_5      = shkiah ? new Date(shkiah.getTime() + 13.5 * 60000) : null;     // Geonim: 13.5m after shkiah
    const rabbeinuTam_58_5 = shkiah ? new Date(shkiah.getTime() + 58.5 * 60000) : null;     // Rabbeinu Tam: 58.5m after shkiah
    const before_7_083     = tzait_7_083 ? new Date(tzait_7_083.getTime() - 13.5 * 60000) : null; // 13.5m before tzait 7.083°

    // === Candle Lighting ===
    // Standard: 18 min before shkiah (Ashkenaz); some use 40 min (Yerushalayim)
    const candleLighting_18 = shkiah ? new Date(shkiah.getTime() - 18 * 60000) : null;
    const candleLighting_40 = shkiah ? new Date(shkiah.getTime() - 40 * 60000) : null;

    return {
      // Location metadata (for custom degree-based zmanim)
      _lat: lat, _lng: lng,

      // Calculation method metadata — maps each zman key to its calculation type
      _calcMethods: {
        netz: 'solar_degrees', shkiah: 'solar_degrees', chatzot: 'proportional_hours',
        shaahGra: 'proportional_hours', shaahMga: 'proportional_hours',
        alot_16_1: 'solar_degrees', alot_18: 'solar_degrees', alot_19_8: 'solar_degrees',
        alot_72min: 'fixed_minutes', alot_90min: 'fixed_minutes', alot_96min: 'fixed_minutes', alot_120min: 'fixed_minutes',
        misheyakir_10_2: 'solar_degrees', misheyakir_11: 'solar_degrees', misheyakir_11_5: 'solar_degrees', misheyakir_60min: 'fixed_minutes',
        shema_gra: 'proportional_hours', shema_mga: 'proportional_hours',
        tefilla_gra: 'proportional_hours', tefilla_mga: 'proportional_hours',
        minchaGedola_gra: 'proportional_hours', minchaGedola_mga: 'proportional_hours',
        minchaKetana_gra: 'proportional_hours', minchaKetana_mga: 'proportional_hours',
        plagHaMincha_gra: 'proportional_hours', plagHaMincha_mga: 'proportional_hours',
        candleLighting_18: 'fixed_minutes', candleLighting_40: 'fixed_minutes',
        tzait_7_083: 'solar_degrees', tzait_8_5: 'solar_degrees', tzait_13: 'solar_degrees', tzait_16_1: 'solar_degrees',
        rabbeinuTam_fixed: 'fixed_minutes', rabbeinuTam_deg: 'solar_degrees',
      },

      // Core
      netz, shkiah, chatzot,
      shaahGra, shaahMga,

      // Alot — all opinions
      alotActive,
      alot_16_1, alot_18, alot_19_8,
      alot_72min, alot_90min, alot_96min, alot_120min,

      // Misheyakir
      misheyakir_10_2, misheyakir_11, misheyakir_11_5, misheyakir_60min,

      // Shema
      shema_gra, shema_mga,

      // Tefilla
      tefilla_gra, tefilla_mga,

      // Mincha
      minchaGedola_gra, minchaGedola_mga,
      minchaKetana_gra, minchaKetana_mga,
      plagHaMincha_gra, plagHaMincha_mga,

      // Candle lighting
      candleLighting: candleLighting_18,
      candleLighting_18, candleLighting_40,

      // Tzait
      tzait_7_083, tzait_8_5, tzait_13, tzait_16_1,
      rabbeinuTam_fixed, rabbeinuTam_deg,

      // Bein HaShmashos variants
      yereim_start, geonim_13_5, rabbeinuTam_58_5, before_7_083,
    };
  } catch {
    return null;
  }
}

/** Format a Date to local time string */
export function formatTime(date, tz) {
  if (!date) return '--:--';
  try {
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, ...(tz ? { timeZone: tz } : {}) });
  } catch {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}

export function formatTimeDiff(ms) {
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  const sign = ms < 0 ? '-' : '+';
  if (h > 0) return `${sign}${h}h ${m}m`;
  if (m > 0) return `${sign}${m}m ${s}s`;
  return `${sign}${s}s`;
}

export function formatDuration(ms) {
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function getSkyColor(altitude) {
  const stops = [
    { alt: -18,    color: [8,   5,   23]  },
    { alt: -16.1,  color: [26,  5,   51]  },
    { alt: -12,    color: [30,  15,  80]  },
    { alt: -8.5,   color: [45,  25,  110] },
    { alt: -6,     color: [80,  50,  140] },
    { alt: -4,     color: [120, 80,  160] },
    { alt: -2,     color: [180, 110, 140] },
    { alt: -0.833, color: [220, 100, 60]  },
    { alt: 0,      color: [240, 120, 50]  },
    { alt: 2,      color: [255, 160, 60]  },
    { alt: 5,      color: [255, 200, 100] },
    { alt: 10,     color: [200, 210, 240] },
    { alt: 20,     color: [130, 185, 230] },
    { alt: 45,     color: [80,  155, 210] },
    { alt: 90,     color: [60,  130, 200] },
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (altitude >= a.alt && altitude <= b.alt) {
      const t = (altitude - a.alt) / (b.alt - a.alt);
      return `rgb(${Math.round(a.color[0] + t*(b.color[0]-a.color[0]))},${Math.round(a.color[1] + t*(b.color[1]-a.color[1]))},${Math.round(a.color[2] + t*(b.color[2]-a.color[2]))})`;
    }
  }
  return altitude < -18 ? 'rgb(8,5,23)' : 'rgb(60,130,200)';
}

export function getSkyGradientStops(altitude) {
  return [-2,-1,0,1,3,6].map(offset => ({ offset, color: getSkyColor(altitude + offset) }));
}

/**
 * Hebrew date conversion
 */
/**
 * Calculate moon phase and illumination
 */
export function getMoonPhase(date) {
  const jd = toJulianDay(date);
  const knownNewMoon = 2451550.25972; // Jan 6, 2000 18:14 UTC
  const synodicMonth = 29.53058867;
  const daysSinceNew = jd - knownNewMoon;
  const cycles = daysSinceNew / synodicMonth;
  const cycleFraction = ((cycles % 1) + 1) % 1;
  const phase = cycleFraction * 8;
  const phaseIndex = Math.round(phase) % 8;
  
  const phaseNames = [
    { en: 'New Moon', he: 'ראש חודש', emoji: '🌑' },
    { en: 'Waxing Crescent', he: 'סהר מתמלא', emoji: '🌒' },
    { en: 'First Quarter', he: 'רבע ראשון', emoji: '🌓' },
    { en: 'Waxing Gibbous', he: 'מתמלא', emoji: '🌔' },
    { en: 'Full Moon', he: 'ירח מלא', emoji: '🌕' },
    { en: 'Waning Gibbous', he: 'מתחסר', emoji: '🌖' },
    { en: 'Last Quarter', he: 'רבע אחרון', emoji: '🌗' },
    { en: 'Waning Crescent', he: 'סהר מתחסר', emoji: '🌘' },
  ];
  
  // Calculate illumination (0-100%)
  const age = cycleFraction * synodicMonth;
  const illumination = 50 * (1 - Math.cos((age / synodicMonth) * 2 * Math.PI));
  
  return {
    phaseIndex,
    phaseName: phaseNames[phaseIndex],
    illumination: Math.round(illumination),
    age: Math.round(age),
    phase: age, // exact age in days (0–29.53) for MoonDisc rendering
  };
}

// ── Moon position and visibility times ──

/**
 * Calculate moon position (altitude and azimuth) for a given date/time and location.
 * Based on simplified lunar theory from Jean Meeus' "Astronomical Algorithms".
 */
export function getMoonPosition(date, lat, lng) {
  const jd = toJulianDay(date);
  const n = jd - 2451545.0;

  const L = (218.316 + 13.176396 * n) % 360;
  const M = (134.963 + 13.064993 * n) % 360;
  const F = (93.272 + 13.229350 * n) % 360;

  const lambda = (L + 6.289 * Math.sin(M * DEG)) * DEG;
  const beta = (5.128 * Math.sin(F * DEG)) * DEG;

  const epsilon = (23.439 - 0.0000004 * n) * DEG;

  const sinDec = Math.sin(beta) * Math.cos(epsilon) + Math.cos(beta) * Math.sin(epsilon) * Math.sin(lambda);
  const dec = Math.asin(sinDec);

  const ra = Math.atan2(
    Math.sin(lambda) * Math.cos(epsilon) - Math.tan(beta) * Math.sin(epsilon),
    Math.cos(lambda)
  );

  const UT = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const GMST = (6.697375 + 0.0657098242 * n + UT) % 24;
  const LMST = ((GMST + lng / 15) % 24 + 24) % 24;
  const H = (LMST * 15 - ra * RAD) * DEG;

  const latRad = lat * DEG;
  const sinAlt = Math.sin(latRad) * Math.sin(dec) + Math.cos(latRad) * Math.cos(dec) * Math.cos(H);
  const altitude = Math.asin(sinAlt) * RAD;

  const cosAz = (Math.sin(dec) - Math.sin(latRad) * sinAlt) / (Math.cos(latRad) * Math.cos(altitude * DEG));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * RAD;
  if (Math.sin(H) > 0) azimuth = 360 - azimuth;

  return { altitude, azimuth };
}

function _findMoonCrossing(lo, hi, lat, lng, rising) {
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    const alt = getMoonPosition(new Date(mid), lat, lng).altitude;
    if (rising) {
      if (alt < 0) lo = mid; else hi = mid;
    } else {
      if (alt < 0) hi = mid; else lo = mid;
    }
  }
  return new Date((lo + hi) / 2);
}

/**
 * Get moonrise and moonset for a given date and location.
 * Scans a 48-hour window to handle cases where the moon rises one day and sets the next.
 * @returns {{ moonrise: Date|null, moonset: Date|null, moonUpAtStart: boolean }}
 */
export function getMoonTimes(date, lat, lng) {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const step = 15 * 60 * 1000;
  let prevAlt = getMoonPosition(dayStart, lat, lng).altitude;
  const moonUpAtStart = prevAlt > 0;

  const rises = [];
  const sets = [];

  for (let t = step; t <= 48 * 3600000; t += step) {
    const d = new Date(dayStart.getTime() + t);
    const alt = getMoonPosition(d, lat, lng).altitude;

    if (prevAlt < 0 && alt >= 0) {
      rises.push(_findMoonCrossing(dayStart.getTime() + t - step, dayStart.getTime() + t, lat, lng, true));
    }
    if (prevAlt >= 0 && alt < 0) {
      sets.push(_findMoonCrossing(dayStart.getTime() + t - step, dayStart.getTime() + t, lat, lng, false));
    }

    prevAlt = alt;
    if (rises.length >= 2 && sets.length >= 2) break;
  }

  let moonrise, moonset;

  if (moonUpAtStart) {
    moonset = sets[0] || null;
    moonrise = rises[0] || null;
  } else {
    moonrise = rises[0] || null;
    moonset = sets.find(s => !moonrise || s > moonrise) || null;
  }

  return { moonrise, moonset, moonUpAtStart };
}

// ── Hebrew calendar helpers (shared by toHebrewDate + hebrewToGregorian) ──
function _hebLeap(y)        { return (7 * y + 1) % 19 < 7; }
function _hebElapsed(y) {
  const m  = 235 * Math.floor((y-1)/19) + 12*((y-1)%19) + Math.floor((7*((y-1)%19)+1)/19);
  const p  = 204 + 793*(m%1080);
  const h  = 5 + 12*m + 793*Math.floor(m/1080) + Math.floor(p/1080);
  const cD = 1 + 29*m + Math.floor(h/24);
  const cP = 1080*(h%24) + p%1080;
  let d = cD;
  if (cP>=19440 || (cD%7===2 && cP>=9924 && !_hebLeap(y)) || (cD%7===1 && cP>=16789 && _hebLeap(y-1))) d=cD+1;
  if ([0,3,5].includes(d%7)) d++;
  return d;
}
function _daysInHebYear(y)  { return _hebElapsed(y+1) - _hebElapsed(y); }
function _lastDayOfHebMonth(m, y) {
  if ([2,4,6,10,13].includes(m)) return 29;
  if (m===12 && !_hebLeap(y)) return 29;
  if (m===8 && _daysInHebYear(y)%10!==5) return 29;
  if (m===9 && _daysInHebYear(y)%10===3) return 29;
  return 30;
}
// Ordered list of months starting from Tishri (month 7)
function _hebMonthOrder(y) {
  // Standard: Tishri(7) Cheshvan(8) Kislev(9) Tevet(10) Shvat(11) Adar(12)[or AdarI(12)+AdarII(13)] Nisan(1) Iyar(2) Sivan(3) Tammuz(4) Av(5) Elul(6)
  if (_hebLeap(y)) return [7,8,9,10,11,12,13,1,2,3,4,5,6];
  return [7,8,9,10,11,12,1,2,3,4,5,6];
}
const _EPOCH = 347997;
const _MONTH_NAMES_HE = ['','ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשון','כסלו','טבת','שבט','אדר','אדר ב׳'];
const _MONTH_NAMES_EN = ['','Nisan','Iyar','Sivan','Tammuz','Av','Elul','Tishri','Cheshvan','Kislev','Tevet','Shvat','Adar','Adar II'];

export function toHebrewDate(date) {
  try {
    const noon = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0));
    const jd = Math.floor(toJulianDay(noon));

    let year = Math.floor(((jd - _EPOCH) * 98496) / 35975351) + 1;
    if (year < 1) year = 1;
    for (let i = 0; i < 5; i++) { if (_hebElapsed(year+1)+_EPOCH <= jd) year++; else break; }

    const startOfYear = _EPOCH + _hebElapsed(year);
    const dayOfYear   = jd - startOfYear; // 0-based

    const order = _hebMonthOrder(year);
    let month = order[0], daysAccum = 0;
    for (const m of order) {
      const mLen = _lastDayOfHebMonth(m, year);
      if (dayOfYear < daysAccum + mLen) { month = m; break; }
      daysAccum += mLen;
      month = m;
    }

    const day = dayOfYear - daysAccum + 1;
    const ones = ['','א','ב','ג','ד','ה','ו','ז','ח','ט'];
    const tens = ['','י','כ','ל','מ','נ','ס','ע','פ','צ'];
    const toHNum = (n) => { const mod=n%100; if(mod===15) return 'טו'; if(mod===16) return 'טז'; return tens[Math.floor(mod/10)]+ones[mod%10]; };
    const hundreds = ['','ק','ר','ש','ת','תק','תר','תש','תת','תתק'];
    const yearMod = year % 1000;
    const yearStr = hundreds[Math.floor(yearMod/100)] + toHNum(yearMod % 100);
    const safeDay = Math.max(1, Math.min(30, Math.round(day)));
    const safeMon = Math.max(1, Math.min(13, month));

    return {
      year, month: safeMon, day: safeDay,
      monthName: (safeMon === 12 && _hebLeap(year)) ? 'אדר א׳' : (_MONTH_NAMES_HE[safeMon] || ''),
      monthNameEn: _MONTH_NAMES_EN[safeMon] || '',
      yearStr,
      formatted: `${safeDay} ${(safeMon === 12 && _hebLeap(year)) ? 'אדר א׳' : (_MONTH_NAMES_HE[safeMon]||'')} ${yearStr}`,
    };
  } catch { return null; }
}

/**
 * Convert a Hebrew date {year, month, day} back to a Gregorian Date.
 * Returns a Date object (noon local time) or null on failure.
 */
export function hebrewToGregorian(hYear, hMonth, hDay) {
  try {
    const order = _hebMonthOrder(hYear);
    let daysAccum = 0;
    for (const m of order) {
      if (m === hMonth) break;
      daysAccum += _lastDayOfHebMonth(m, hYear);
    }
    const jd = _EPOCH + _hebElapsed(hYear) + daysAccum + (hDay - 1);
    // JD to Gregorian
    const ms = (jd - 2440587.5) * 86400000;
    const d = new Date(ms);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  } catch { return null; }
}

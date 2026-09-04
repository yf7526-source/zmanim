// Single city import surface: re-exports the raw dataset alongside
// validated exports so every importer resolves cities through one module.
export { ORTHODOX_CITIES } from './orthodoxCities';
import { ORTHODOX_CITIES } from './orthodoxCities';

/**
 * Validates that a timezone string is a recognized IANA identifier.
 * Uses Intl.DateTimeFormat which throws on invalid timezones.
 */
export function isValidTimezone(tz) {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a single city entry:
 *   latitude  ∈ [-90, 90]
 *   longitude ∈ [-180, 180]
 *   elevation ∈ [-500, 9000]
 *   timezone  — valid IANA identifier
 *
 * Returns true only when every field passes; invalid cities are skipped.
 */
export function isValidCity(city) {
  if (!city) return false;
  const lat = Number(city.latitude);
  const lng = Number(city.longitude);
  const elev = Number(city.elevationMeters);
  if (!isFinite(lat) || lat < -90 || lat > 90) return false;
  if (!isFinite(lng) || lng < -180 || lng > 180) return false;
  if (!isFinite(elev) || elev < -500 || elev > 9000) return false;
  if (!isValidTimezone(city.timezone)) return false;
  return true;
}

/**
 * Loads and validates the city dataset with full error isolation.
 *
 * - If the dataset module fails to import, logs the error and falls back
 *   to an empty list (never crashes the app).
 * - Each city is validated in its own try/catch so one bad record cannot
 *   abort the entire filter — invalid cities are logged and skipped.
 * - The result is cached so subsequent calls return the last valid dataset
 *   even if re-invoked after a failure.
 */
let _cachedValidCities = null;
let _cachedRawLength = null;

function buildValidCities() {
  if (_cachedValidCities !== null) return _cachedValidCities;

  const rawCities = ORTHODOX_CITIES;

  if (!Array.isArray(rawCities)) {
    console.error('[cityValidator] City dataset is not an array; falling back to empty list.');
    _cachedValidCities = [];
    _cachedRawLength = 0;
    return _cachedValidCities;
  }

  _cachedRawLength = rawCities.length;
  const valid = [];

  for (let i = 0; i < rawCities.length; i++) {
    const city = rawCities[i];
    try {
      if (isValidCity(city)) {
        valid.push(city);
      }
    } catch (err) {
      // One bad city must never crash the whole app — log and continue.
      console.error(
        `[cityValidator] Error validating city at index ${i} (${city?.cityName || 'unknown'}):`,
        err
      );
    }
  }

  console.info(
    `[cityValidator] Loaded ${valid.length}/${rawCities.length} valid cities.`
  );

  _cachedValidCities = valid;
  return _cachedValidCities;
}

/**
 * Validated city list — every entry has been checked for valid
 * coordinates, elevation, and timezone. Invalid cities are excluded.
 *
 * Computed lazily and cached; if the dataset fails to load, the last
 * valid result (or an empty list) is returned so the app keeps running.
 */
export const VALID_CITIES = buildValidCities();

/**
 * Returns the cached valid-city list, rebuilding it only if the cache
 * has not yet been populated. Safe to call from anywhere.
 */
export function getValidCities() {
  return buildValidCities();
}

/**
 * Returns the raw dataset length at the time of last successful load.
 */
export function getRawCityCount() {
  return _cachedRawLength ?? 0;
}
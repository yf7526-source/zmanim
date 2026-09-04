import { VALID_CITIES as ORTHODOX_CITIES } from './cityValidator';

/**
 * Application-wide default candle-lighting offset (minutes before sunset).
 * Used when no city-specific value is available.
 */
export const DEFAULT_CANDLE_LIGHTING_MINUTES = 18;

/**
 * Returns the candle-lighting offset for a given location.
 *
 * Each city in the database carries its own offset (defaultCandleLightingMinutes)
 * — there is no blanket Israel=20 / Diaspora=18 assumption. When a city match is
 * found (by name or nearest coordinates), its individual offset is used.
 * If no match exists, the application default is returned.
 */
export function getCandleOffset(name, lat, lng) {
  const numLat = Number(lat);
  const numLng = Number(lng);
  const lower = (name || '').toLowerCase().trim();

  // 1. Match by name (including alternate names)
  if (lower) {
    const nameMatch = ORTHODOX_CITIES.find(c =>
      c.name.toLowerCase() === lower ||
      (c.alternateNames || []).some(a => a.toLowerCase() === lower)
    );
    if (nameMatch && nameMatch.defaultCandleLightingMinutes != null) {
      return nameMatch.defaultCandleLightingMinutes;
    }
  }

  // 2. Find nearest city by coordinates
  if (isFinite(numLat) && isFinite(numLng)) {
    let nearest = null;
    let minDist = Infinity;
    for (const city of ORTHODOX_CITIES) {
      const dLat = city.latitude - numLat;
      const dLng = city.longitude - numLng;
      const dist = dLat * dLat + dLng * dLng;
      if (dist < minDist) {
        minDist = dist;
        nearest = city;
      }
    }
    // Within ~0.5° (~55km) — close enough to share a local minhag
    if (nearest && minDist < 0.25) {
      return nearest.defaultCandleLightingMinutes ?? DEFAULT_CANDLE_LIGHTING_MINUTES;
    }
  }

  // 3. No city match — use the application default
  return DEFAULT_CANDLE_LIGHTING_MINUTES;
}
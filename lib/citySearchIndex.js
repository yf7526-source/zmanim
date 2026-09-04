/**
 * Fast City Search Index
 *
 * Pre-builds a normalized, lowercase index over all searchable fields so
 * per-keystroke queries run without re-normalizing. Supports searching by:
 *   - City name
 *   - Aliases (alternateNames)
 *   - Country (code + full name)
 *   - State / Province
 *   - Hebrew name
 *
 * Results are sorted by a relevance score (exact > prefix > contains,
 * name > hebrew > alias > country > state).
 */

import { ORTHODOX_CITIES } from './cityValidator';

// Hebrew names for Israeli cities (and major diaspora centers with common Hebrew names)
const HEBREW_NAMES = {
  'Jerusalem': 'ירושלים', 'Tel Aviv': 'תל אביב', 'Bnei Brak': 'בני ברק',
  'Tzfat': 'צפת', 'Tiberias': 'טבריה', 'Haifa': 'חיפה',
  'Beer Sheva': 'באר שבע', 'Ashdod': 'אשדוד', 'Eilat': 'אילת',
  'Beit Shemesh': 'בית שמש', 'Modiin Illit': 'מודיעין עילית',
  'Kiryat Sefer': 'קרית ספר', 'Rechovot': 'רחובות',
  'Petah Tikva': 'פתח תקווה', 'Netanya': 'נתניה', 'Ramat Gan': 'רמת גן',
  'Herzliya': 'הרצליה', 'Nahariya': 'נהריה', 'Hebron': 'חברון',
  'Ashkelon': 'אשקלון', 'Rishon LeZion': 'ראשון לציון',
  'Kfar Saba': 'כפר סבא', 'Raanana': 'רעננה', 'Hod Hasharon': 'הוד השרון',
  'Givatayim': 'גבעתיים', 'Kiryat Gat': 'קרית גת',
  'Beitar Illit': 'ביתר עילית', 'Ariel': 'אריאל', 'Sderot': 'שדרות',
  'Netivot': 'נתיבות', 'Ofakim': 'אופקים', 'Hadera': 'חדרה',
  'Yokneam': 'יוקנעם', 'Or Yehuda': 'אור יהודה', 'Dimona': 'דימונה',
  'Arad': 'ערד', 'Kiryat Shmona': 'קרית שמונה',
  'New York': 'ניו יורק', 'London': 'לונדון', 'Paris': 'פריז',
  'Toronto': 'טורונטו', 'Miami Beach': 'מיאמי ביץ', 'Chicago': 'שיקגו',
};

// Pre-build the normalized index once at module load
const _index = ORTHODOX_CITIES.map((city) => {
  const hebrewName = HEBREW_NAMES[city.name] || '';
  return {
    ref: city,
    name: (city.name || '').toLowerCase(),
    hebrew: hebrewName.toLowerCase(),
    aliases: (city.alternateNames || []).map((a) => a.toLowerCase()),
    country: (city.countryName || city.country || '').toLowerCase(),
    countryCode: (city.country || '').toLowerCase(),
    state: (city.stateProvince || '').toLowerCase(),
  };
});

/**
 * Search cities by any combination of city name, alias, country, state, or Hebrew name.
 * Returns results sorted by best match (highest relevance score first).
 *
 * @param {string} query — free-text search query
 * @param {number} limit — max results (default 20)
 * @returns {Array} matching city objects from ORTHODOX_CITIES
 */
export function searchCities(query, limit = 20) {
  if (!query || !query.trim()) {
    return ORTHODOX_CITIES.slice(0, limit);
  }

  const q = query.toLowerCase().trim();
  const tokens = q.split(/\s+/).filter((t) => t.length > 0);

  const scored = _index.map((entry) => {
    let score = 0;

    for (const token of tokens) {
      // --- City name ---
      if (entry.name === token) score += 100;
      else if (entry.name.startsWith(token)) score += 60;
      else if (entry.name.includes(token)) score += 35;

      // --- Hebrew name ---
      if (entry.hebrew) {
        if (entry.hebrew === q) score += 95;
        else if (entry.hebrew.includes(q)) score += 55;
      }

      // --- Aliases / alternate names ---
      for (const alias of entry.aliases) {
        if (alias === token) score += 70;
        else if (alias.startsWith(token)) score += 45;
        else if (alias.includes(token)) score += 25;
      }

      // --- Country (full name + code) ---
      if (entry.country === token || entry.countryCode === token) score += 20;
      else if (entry.country.includes(token) || entry.countryCode.includes(token)) score += 10;

      // --- State / Province ---
      if (entry.state === token) score += 15;
      else if (entry.state.includes(token)) score += 8;
    }

    // Multi-word bonus: all tokens matched in the city name itself
    if (tokens.length > 1 && tokens.every((t) => entry.name.includes(t))) {
      score += 50;
    }

    return { ref: entry.ref, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.ref);
}

/** Get a city by its stable id */
export function getCityById(id) {
  return ORTHODOX_CITIES.find((c) => c.id === id) || null;
}

/** Get the Hebrew name for a city, if known */
export function getHebrewName(cityName) {
  return HEBREW_NAMES[cityName] || '';
}

/** Total number of indexed cities */
export const CITY_COUNT = ORTHODOX_CITIES.length;
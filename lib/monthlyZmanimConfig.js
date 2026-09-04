/**
 * Shared configuration for Monthly Zmanim table column definitions,
 * home-screen opinion mapping, and dynamic column building (incl. custom posekim).
 */

// ── All Opinions columns (expanded, RTL order) ──
export const ALL_COLUMNS = [
  { group: 'Alot', groupHe: 'עלות השחר', sub: [
    { key: 'alot_120min', label: '120 דק׳' },
    { key: 'alot_96min', label: '96 דק׳' },
    { key: 'alot_90min', label: '90 דק׳' },
    { key: 'alot_72min', label: 'ר"ת 72′' },
    { key: 'alot_19_8', label: '19.8°' },
    { key: 'alot_18', label: '18°' },
    { key: 'alot_16_1', label: '16.1°' },
  ]},
  { group: 'Misheyakir', groupHe: 'משיכיר', sub: [
    { key: 'misheyakir_60min', label: '60 דק׳' },
    { key: 'misheyakir_10_2', label: '10.2°' },
    { key: 'misheyakir_11', label: '11°' },
    { key: 'misheyakir_11_5', label: '11.5°' },
  ]},
  { group: 'Netz', groupHe: 'נץ החמה', sub: [
    { key: 'netz', label: 'ים' },
    { key: 'netzElevation', label: 'גובה' },
  ]},
  { group: 'Shema', groupHe: 'קריאת שמע', sub: [
    { key: 'shema_mga', label: 'מג"א' },
    { key: 'shema_bht', label: 'בעה"ת' },
    { key: 'shema_gra', label: 'גר"א' },
  ]},
  { group: 'Tefilla', groupHe: 'זמן תפילה', sub: [
    { key: 'tefilla_mga', label: 'מג"א' },
    { key: 'tefilla_bht', label: 'בעה"ת' },
    { key: 'tefilla_gra', label: 'גר"א' },
  ]},
  { group: 'Chatzot', groupHe: 'חצות היום', sub: [{ key: 'chatzot', label: '' }] },
  { group: 'Mincha Gd', groupHe: 'מנחה גדולה', sub: [
    { key: 'minchaGedola_mga', label: 'מג"א' },
    { key: 'minchaGedola_bht', label: 'בעה"ת' },
    { key: 'minchaGedola_gra', label: 'גר"א' },
  ]},
  { group: 'Mincha Kt', groupHe: 'מנחה קטנה', sub: [
    { key: 'minchaKetana_mga', label: 'מג"א' },
    { key: 'minchaKetana_bht', label: 'בעה"ת' },
    { key: 'minchaKetana_gra', label: 'גר"א' },
  ]},
  { group: 'Plag', groupHe: 'פלג המנחה', sub: [
    { key: 'plagHaMincha_mga', label: 'מג"א' },
    { key: 'plagHaMincha_bht', label: 'בעה"ת' },
    { key: 'plagHaMincha_gra', label: 'גר"א' },
  ]},
  { group: 'Candles', groupHe: 'הדלקת נרות', erevOnly: true, sub: [
    { key: 'candleLighting_40', label: '40 דק׳' },
    { key: 'candleLighting_30', label: '30 דק׳' },
    { key: 'candleLighting_20', label: '20 דק׳' },
    { key: 'candleLighting_18', label: '18 דק׳' },
  ]},
  { group: 'Shkiah', groupHe: 'שקיעת החמה', sub: [
    { key: 'shkiah', label: 'ים' },
    { key: 'shkiahElevation', label: 'גובה' },
  ]},
  { group: 'Tzait', groupHe: 'צאת כוכבים', sub: [
    { key: 'tzait_7_083', label: '7.08°' },
    { key: 'tzait_8_5', label: '8.5°' },
    { key: 'tzait_13', label: '13°' },
    { key: 'tzait_16_1', label: '16.1°' },
    { key: 'rabbeinuTam_fixed', label: 'ר"ת 72′' },
  ]},
  { group: 'Chatzot L', groupHe: 'חצות הלילה', sub: [{ key: 'chatzotNight', label: '' }] },
];

// Maps group name → zmanType (for placing custom posekim into the right group)
const GROUP_TO_ZMAN_TYPE = {
  'Alot': 'alot',
  'Misheyakir': 'misheyakir',
  'Netz': 'netz',
  'Shema': 'shema',
  'Tefilla': 'tefilla',
  'Chatzot': 'chatzot',
  'Mincha Gd': 'minchaGedola',
  'Mincha Kt': 'minchaKetana',
  'Plag': 'plagHaMincha',
  'Candles': 'candleLighting',
  'Motzei': 'motzeiShabbat',
  'Shkiah': 'shkiah',
  'Tzait': 'tzait',
  'Chatzot L': 'chatzotNight',
};

// Maps home-screen zmanimOpinions → table column keys
const OPINION_MAPS = {
  alot:          { '16.1': 'alot_16_1', '18': 'alot_18', '19.8': 'alot_19_8', '72min': 'alot_72min', '90min': 'alot_90min', '96min': 'alot_96min', '120min': 'alot_120min' },
  misheyakir:    { '10.2': 'misheyakir_10_2', '11': 'misheyakir_11', '11.5': 'misheyakir_11_5', '60min': 'misheyakir_60min' },
  shema:         { 'gra': 'shema_gra', 'mga': 'shema_mga', 'bht': 'shema_bht' },
  tefilla:       { 'gra': 'tefilla_gra', 'mga': 'tefilla_mga', 'bht': 'tefilla_bht' },
  minchaGedola:  { 'gra': 'minchaGedola_gra', 'mga': 'minchaGedola_mga', 'bht': 'minchaGedola_bht' },
  minchaKetana:  { 'gra': 'minchaKetana_gra', 'mga': 'minchaKetana_mga', 'bht': 'minchaKetana_bht' },
  plagHaMincha:  { 'gra': 'plagHaMincha_gra', 'mga': 'plagHaMincha_mga', 'bht': 'plagHaMincha_bht' },
  candleLighting:{ '18': 'candleLighting_18', '20': 'candleLighting_20', '30': 'candleLighting_30', '40': 'candleLighting_40' },
  tzait:         { '7.083': 'tzait_7_083', '8.5': 'tzait_8_5', '13': 'tzait_13', '16.1': 'tzait_16_1', '72min': 'rabbeinuTam_fixed' },
  netz:         { 'sealevel': 'netz', 'elevation': 'netzElevation', 'standard': 'netz' },
  shkiah:       { 'sealevel': 'shkiah', 'elevation': 'shkiahElevation', 'standard': 'shkiah' },
  shabbatEnds:  { '72min': 'rabbeinuTam_fixed', '8.5': 'tzait_8_5', '7.083': 'tzait_7_083', '16.1': 'tzait_16_1' },
};

// All zmanim categories shown in the Prayer Times tab on Home.
// The Monthly Zmanim default mirrors exactly these rows.
const PRAYER_TIMES_CATEGORIES = [
  'alot', 'misheyakir', 'netz', 'shema', 'tefilla', 'chatzot',
  'minchaGedola', 'minchaKetana', 'plagHaMincha', 'candleLighting',
  'shkiah', 'tzait', 'shabbatEnds', 'chatzotNight',
];

// Fallback column key for each category when no opinion is selected.
const DEFAULT_OPINION_KEYS = {
  alot: 'alot_16_1',
  misheyakir: 'misheyakir_11_5',
  netz: 'netz',
  shema: 'shema_gra',
  tefilla: 'tefilla_gra',
  chatzot: 'chatzot',
  minchaGedola: 'minchaGedola_gra',
  minchaKetana: 'minchaKetana_gra',
  plagHaMincha: 'plagHaMincha_gra',
  candleLighting: 'candleLighting_18',
  shkiah: 'shkiah',
  tzait: 'tzait_8_5',
  shabbatEnds: 'rabbeinuTam_fixed',
  chatzotNight: 'chatzotNight',
};

/**
 * Convert home-screen zmanimOpinions → Set of table column keys for VISIBILITY.
 * Mirrors every zmanim row shown in the Prayer Times tab, using the selected
 * opinion for each. Only ONE sunrise variant and ONE sunset variant are
 * included (the selected one), not both.
 */
export function homeOpinionsToKeys(zmanimOpinions = {}) {
  const keys = new Set();
  for (const zman of PRAYER_TIMES_CATEGORIES) {
    const sel = zmanimOpinions[zman];
    const colKey = sel ? OPINION_MAPS[zman]?.[sel] : null;
    keys.add(colKey || DEFAULT_OPINION_KEYS[zman]);
  }
  return keys;
}

/**
 * Like homeOpinionsToKeys, but also adds the secondary DISPLAY opinions that
 * appear under each zman in the Prayer Times tab (secondaryZmanimDisplay).
 * These extra opinions are visible in the Monthly table but NOT highlighted —
 * homeStandardKeys returns only the primary selected keys.
 */
export function homeKeysWithSecondary(zmanimOpinions = {}, secondaryZmanimDisplay = {}) {
  const keys = homeOpinionsToKeys(zmanimOpinions);
  for (const zman of PRAYER_TIMES_CATEGORIES) {
    const primarySel = zmanimOpinions[zman];
    const secKeys = secondaryZmanimDisplay[zman] || [];
    for (const sk of secKeys) {
      if (sk === primarySel) continue; // don't duplicate the primary
      const colKey = OPINION_MAPS[zman]?.[sk];
      if (colKey) keys.add(colKey);
    }
  }
  return keys;
}

/**
 * Convert home-screen zmanimOpinions → Set of table column keys for STANDARD
 * (highlighted) styling. Only the PRIMARY selected opinion per category is
 * highlighted — secondary display opinions are never highlighted.
 */
export function homeStandardKeys(zmanimOpinions = {}) {
  return homeOpinionsToKeys(zmanimOpinions);
}

/**
 * Build the full column list, injecting custom posekim into their respective groups.
 */
export function buildAllColumns(customZmanim = []) {
  const cols = ALL_COLUMNS.map(c => ({ ...c, sub: [...c.sub] }));
  for (const cz of customZmanim) {
    const groupName = Object.entries(GROUP_TO_ZMAN_TYPE).find(([, zt]) => zt === cz.zmanType)?.[0];
    if (!groupName) continue;
    const groupIdx = cols.findIndex(c => c.group === groupName);
    if (groupIdx >= 0) {
      cols[groupIdx].sub.push({
        key: `custom_${cz.id}`,
        label: cz.posekName,
        isCustom: true,
        customId: cz.id,
      });
    }
  }
  return cols;
}

/**
 * Flatten grouped columns into a flat array for iteration.
 */
export function flattenColumns(cols) {
  return cols.flatMap(c => c.sub.map(s => ({ ...s, erevOnly: c.erevOnly, groupHe: c.groupHe, group: c.group })));
}

// English labels for every standard column key, used by CSV/Excel export so
// English users get readable headers instead of Hebrew abbreviations or
// internal keys (e.g. shema_gra). Degree-based keys stay as-is.
export const LABEL_EN = {
  alot_120min: '120 min', alot_96min: '96 min', alot_90min: '90 min', alot_72min: 'RT 72 min',
  alot_19_8: '19.8°', alot_18: '18°', alot_16_1: '16.1°',
  misheyakir_60min: '60 min', misheyakir_10_2: '10.2°', misheyakir_11: '11°', misheyakir_11_5: '11.5°',
  netz: 'Sunrise (sea)', netzElevation: 'Sunrise (elev)',
  shema_mga: 'Shema MGA', shema_bht: 'Shema Baal HaTanya', shema_gra: 'Shema GRA',
  tefilla_mga: 'Tefilla MGA', tefilla_bht: 'Tefilla Baal HaTanya', tefilla_gra: 'Tefilla GRA',
  chatzot: 'Chatzot',
  minchaGedola_mga: 'Mincha Gd MGA', minchaGedola_bht: 'Mincha Gd Baal HaTanya', minchaGedola_gra: 'Mincha Gd GRA',
  minchaKetana_mga: 'Mincha Kt MGA', minchaKetana_bht: 'Mincha Kt Baal HaTanya', minchaKetana_gra: 'Mincha Kt GRA',
  plagHaMincha_mga: 'Plag MGA', plagHaMincha_bht: 'Plag Baal HaTanya', plagHaMincha_gra: 'Plag GRA',
  candleLighting_40: 'Candles 40 min', candleLighting_30: 'Candles 30 min', candleLighting_20: 'Candles 20 min', candleLighting_18: 'Candles 18 min',
  shkiah: 'Sunset (sea)', shkiahElevation: 'Sunset (elev)',
  tzait_7_083: 'Tzait 7.08°', tzait_8_5: 'Tzait 8.5°', tzait_13: 'Tzait 13°', tzait_16_1: 'Tzait 16.1°', rabbeinuTam_fixed: 'Tzait RT 72 min',
  chatzotNight: 'Chatzot Night',
};

// Return an English label for a column sub, falling back to the Hebrew label
// then the raw key. Custom posekim use their posekName as the label already.
export function columnLabelEn(sub) {
  if (!sub) return '';
  if (sub.isCustom) return sub.label || sub.key;
  return LABEL_EN[sub.key] || sub.label || sub.key;
}
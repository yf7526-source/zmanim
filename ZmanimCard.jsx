import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { calcCustomZman } from './CustomZmanManager';
import { formatTimeInTz, getStableDateForHebrew, formatDateInTz } from '../lib/timezone';
import { isErevShabbatOrYomTov, isShabbatOrYomTov } from '../lib/holidayDetection';
import { toHebrewDate } from '../lib/sunCalc';

function fmt(date, hour12 = true, tz) {
  return formatTimeInTz(date, tz, hour12);
}

function isPast(date, now) {
  return date && now && date < now;
}

function isSoon(date, now) {
  if (!date || !now) return false;
  const diff = date - now;
  return diff >= 0 && diff <= 45 * 60000;
}

// Maps each row label → zmanimOpinions category key
const ROW_CATEGORIES = {
  'Alot HaShachar': 'alot',
  'Misheyakir': 'misheyakir',
  'Netz HaChamah': 'netz',
  'Sof Zman Shema': 'shema',
  'Sof Zman Tefilla': 'tefilla',
  'Chatzot': 'chatzot',
  'Mincha Gedola': 'minchaGedola',
  'Mincha Ketana': 'minchaKetana',
  'Plag HaMincha': 'plagHaMincha',
  'Candle Lighting': 'candleLighting',
  'Motzei Shabbat': 'shabbatEnds',
  'Shkiah': 'shkiah',
  'Tzait Kochavim': 'tzait',
  'Chatzot HaLayla': 'chatzotNight',
};

// Resolvers: category → opinionKey → (st) => Date
const OPINION_RESOLVERS = {
  alot: {
    '16.1': (st) => st.alot_16_1, '18': (st) => st.alot_18, '19.8': (st) => st.alot_19_8,
    '72min': (st) => st.alot_72min, '90min': (st) => st.alot_90min, '96min': (st) => st.alot_96min, '120min': (st) => st.alot_120min,
  },
  misheyakir: {
    '10.2': (st) => st.misheyakir_10_2, '11': (st) => st.misheyakir_11, '11.5': (st) => st.misheyakir_11_5, '60min': (st) => st.misheyakir_60min,
  },
  netz: { 'standard': (st) => st.netz, 'sealevel': (st) => st.netzSealevel || st.netz, 'elevation': (st) => st.netzElevation || st.netz },
  shema: { 'gra': (st) => st.shema_gra, 'mga': (st) => st.shema_mga, 'bht': (st) => st.shema_bht },
  tefilla: { 'gra': (st) => st.tefilla_gra, 'mga': (st) => st.tefilla_mga, 'bht': (st) => st.tefilla_bht },
  chatzot: { 'standard': (st) => st.chatzot },
  minchaGedola: { 'gra': (st) => st.minchaGedola_gra, 'mga': (st) => st.minchaGedola_mga, 'bht': (st) => st.minchaGedola_bht },
  minchaKetana: { 'gra': (st) => st.minchaKetana_gra, 'mga': (st) => st.minchaKetana_mga, 'bht': (st) => st.minchaKetana_bht },
  plagHaMincha: { 'gra': (st) => st.plagHaMincha_gra, 'mga': (st) => st.plagHaMincha_mga, 'bht': (st) => st.plagHaMincha_bht },
  candleLighting: { '18': (st) => st.candleLighting_18, '20': (st) => st.candleLighting_20, '30': (st) => st.candleLighting_30, '40': (st) => st.candleLighting_40 },
  shabbatEnds: {
    '72min': (st) => st.rabbeinuTam_fixed,
    '8.5': (st) => st.tzait_8_5,
    '7.083': (st) => st.tzait_7_083,
    '16.1': (st) => st.tzait_16_1,
  },
  shkiah: { 'standard': (st) => st.shkiah, 'sealevel': (st) => st.shkiahSealevel || st.shkiah, 'elevation': (st) => st.shkiahElevation || st.shkiah },
  tzait: {
    '7.083': (st) => st.tzait_7_083, '8.5': (st) => st.tzait_8_5,
    '16.1': (st) => st.tzait_16_1, '72min': (st) => st.rabbeinuTam_fixed,
  },
  chatzotNight: { 'standard': (st) => st.chatzotNight },
};

// Display labels for the selected opinion badge
const OPINION_LABELS = {
  alot: { '16.1': '16.1°', '18': '18°', '19.8': '19.8°', '72min': '72 min', '90min': '90 min', '96min': '96 min', '120min': '120 min' },
  misheyakir: { '10.2': '10.2°', '11': '11°', '11.5': '11.5°', '60min': '60 min' },
  netz: { 'standard': '−0.833°', 'sealevel': 'Sea level', 'elevation': 'Elevation' },
  shema: { 'gra': '3h GRA', 'mga': '3h MGA', 'bht': '3h BHT' },
  tefilla: { 'gra': '4h GRA', 'mga': '4h MGA', 'bht': '4h BHT' },
  chatzot: { 'standard': 'solar noon' },
  minchaGedola: { 'gra': '6.5h GRA', 'mga': '6.5h MGA', 'bht': '6.5h BHT' },
  minchaKetana: { 'gra': '9.5h GRA', 'mga': '9.5h MGA', 'bht': '9.5h BHT' },
  plagHaMincha: { 'gra': '10.75h GRA', 'mga': '10.75h MGA', 'bht': '10.75h BHT' },
  candleLighting: { '18': '18 min', '20': '20 min', '30': '30 min', '40': '40 min' },
  shabbatEnds: { '72min': '72 min (R. Tam)', '8.5': '8.5°', '7.083': '7.083°', '16.1': '16.1°' },
  shkiah: { 'standard': '−0.833°', 'sealevel': 'Sea level', 'elevation': 'Elevation' },
  tzait: { '7.083': '7.083°', '8.5': '8.5°', '16.1': '16.1°', '72min': '72 min (R. Tam)' },
  chatzotNight: { 'standard': '6h night' },
};

// Hebrew equivalents for each opinion label (shown alongside the English label)
const HEBREW_OPINION_LABELS = {
  alot: { '16.1': '16.1°', '18': '18°', '19.8': '19.8°', '72min': '72 דק', '90min': '90 דק', '96min': '96 דק', '120min': '120 דק' },
  misheyakir: { '10.2': '10.2°', '11': '11°', '11.5': '11.5°', '60min': '60 דק' },
  netz: { 'standard': 'נץ', 'sealevel': 'גובה ים', 'elevation': 'גובה' },
  shema: { 'gra': 'גר״א', 'mga': 'מג״א', 'bht': 'בעה״ט' },
  tefilla: { 'gra': 'גר״א', 'mga': 'מג״א', 'bht': 'בעה״ט' },
  chatzot: { 'standard': 'חצות' },
  minchaGedola: { 'gra': 'גר״א', 'mga': 'מג״א', 'bht': 'בעה״ט' },
  minchaKetana: { 'gra': 'גר״א', 'mga': 'מג״א', 'bht': 'בעה״ט' },
  plagHaMincha: { 'gra': 'גר״א', 'mga': 'מג״א', 'bht': 'בעה״ט' },
  candleLighting: { '18': '18 דק', '20': '20 דק', '30': '30 דק', '40': '40 דק' },
  shabbatEnds: { '72min': 'ר״ת', '8.5': '8.5°', '7.083': '7.083°', '16.1': '16.1°' },
  shkiah: { 'standard': 'שקיעה', 'sealevel': 'גובה ים', 'elevation': 'גובה' },
  tzait: { '7.083': '7.083°', '8.5': '8.5°', '16.1': '16.1°', '72min': 'ר״ת' },
  chatzotNight: { 'standard': 'חצות לילה' },
};

function resolvePrimary(row, st, category, zmanimOpinions, customZmanim) {
  const sel = zmanimOpinions?.[category];
  if (!sel) return row.primary(st);
  if (sel.startsWith('custom_')) {
    const cz = (customZmanim || []).find((c) => c.id === Number(sel.replace('custom_', '')));
    if (cz) return calcCustomZman(cz, st);
  }
  const resolver = OPINION_RESOLVERS[category]?.[sel];
  return resolver ? resolver(st) : row.primary(st);
}

// Hebrew label for a variant's deg string (used in the expanded opinions list)
function heLabelForDeg(deg) {
  if (!deg) return '';
  if (deg.includes('GRA')) return 'גר״א';
  if (deg.includes('MGA')) return 'מג״א';
  if (deg.includes('BHT')) return 'בעה״ט';
  if (deg.includes('R. Tam')) return 'ר״ת';
  if (deg.includes('elev')) return 'גובה';
  if (deg.includes('sea level')) return 'גובה ים';
  const minMatch = deg.match(/^(\d+)\s*min/);
  if (minMatch) return `${minMatch[1]} דק`;
  if (deg.includes('solar noon') || deg.includes('night')) return 'חצות';
  return ''; // plain degree values need no Hebrew gloss
}

// Infer calculation method from the degree/label string for metadata
function inferCalcMethod(deg) {
  if (!deg) return 'provider_value';
  if (deg.includes('°')) return 'solar_degrees';
  if (deg.includes('min')) return 'fixed_minutes';
  if (deg.includes('h') || deg.includes('solar noon') || deg.includes('night')) return 'proportional_hours';
  return 'provider_value';
}

function resolvePrimaryDeg(row, category, zmanimOpinions, customZmanim) {
  const sel = zmanimOpinions?.[category];
  if (!sel) return row.primaryDeg;
  if (sel.startsWith('custom_')) {
    const cz = (customZmanim || []).find((c) => c.id === Number(sel.replace('custom_', '')));
    if (cz) return cz.posekName;
  }
  return OPINION_LABELS[category]?.[sel] || row.primaryDeg;
}

/**
 * Each zman row has:
 *   label        – display name
 *   sub          – short description
 *   primary(st)  – the "GRA" or main time (used for sorting / upcoming logic)
 *   secondary(st)– the "MGA" time (null if same)
 *   variants(st) – array of { posek, time } for the expandable detail panel
 *   sameGraMga   – true if GRA and MGA times are identical
 */
const ZMANIM_ROWS = [
{
  label: 'Alot HaShachar', labelHe: 'עלות השחר',
  sub: 'Dawn — first light',
  primaryDeg: '16.1°',
  primary: (st) => st.alot_16_1,
  secondary: (st) => null,
  secondaryDeg: null,
  sameGraMga: true,
  variants: (st) => [
  { posek: "Ohr HaChaim / MGA base", deg: "16.1°", time: st.alot_16_1 },
  { posek: "Baal HaTanya", deg: "16.9°", time: st.alotBaalHatanya },
  { posek: "Astronomical twilight", deg: "18°", time: st.alot_18 },
  { posek: "Chacham Tzvi / Tukaczinsky", deg: "19.8°", time: st.alot_19_8 },
  { posek: "Rabbeinu Tam", deg: "72 min", time: st.alot_72min },
  { posek: "Stringent Ashkenaz", deg: "90 min", time: st.alot_90min },
  { posek: "Some Sephardic", deg: "96 min", time: st.alot_96min },
  { posek: "Very stringent", deg: "120 min", time: st.alot_120min }]

},
{
  label: 'Misheyakir', labelHe: 'משיכיר',
  sub: 'Earliest tallit & tefillin',
  primaryDeg: '11.5°',
  primary: (st) => st.misheyakir_11_5,
  secondary: (st) => null,
  secondaryDeg: null,
  sameGraMga: true,
  variants: (st) => [
  { posek: "Ateret / some Rishonim", deg: "10.2°", time: st.misheyakir_10_2 },
  { posek: "R' Moshe Feinstein", deg: "11°", time: st.misheyakir_11 },
  { posek: "Achronim — most common", deg: "11.5°", time: st.misheyakir_11_5 },
  { posek: "Baladi Yemenite", deg: "60 min", time: st.misheyakir_60min }]

},
{
  label: 'Netz HaChamah', labelHe: 'נץ החמה',
  sub: 'Sunrise',
  primaryDeg: '−0.833°',
  primary: (st) => st.netz,
  secondary: (st) => null,
  secondaryDeg: null,
  sameGraMga: true,
  variants: (st) => [
  { posek: "Sea level (−0.833° horizon)", deg: "sea level", time: st.netzSealevel || st.netz },
  { posek: "Adjusted for elevation", deg: "elev. dip", time: st.netzElevation || st.netzSealevel || st.netz }]

},
{
  label: 'Sof Zman Shema', labelHe: 'סוף זמן קריאת שמע',
  sub: 'Latest Kriat Shema',
  primaryDeg: '3h GRA',
  primary: (st) => st.shema_gra,
  secondary: (st) => null,
  secondaryDeg: null,
  sameGraMga: true,
  variants: (st) => [
  { posek: "GRA / Vilna Gaon", deg: "3h GRA", time: st.shema_gra },
  { posek: "MGA / Magen Avraham", deg: "3h MGA", time: st.shema_mga },
  { posek: "Baal HaTanya", deg: "3h BHT", time: st.shema_bht }]

},
{
  label: 'Sof Zman Tefilla', labelHe: 'סוף זמן תפילה',
  sub: 'Latest Shacharit',
  primaryDeg: '4h GRA',
  primary: (st) => st.tefilla_gra,
  secondary: (st) => null,
  secondaryDeg: null,
  sameGraMga: true,
  variants: (st) => [
  { posek: "GRA / Vilna Gaon", deg: "4h GRA", time: st.tefilla_gra },
  { posek: "MGA / Magen Avraham", deg: "4h MGA", time: st.tefilla_mga },
  { posek: "Baal HaTanya", deg: "4h BHT", time: st.tefilla_bht }]

},
{
  label: 'Chatzot', labelHe: 'חצות',
  sub: 'Halachic midday',
  primaryDeg: 'solar noon',
  primary: (st) => st.chatzot,
  secondary: (st) => null,
  secondaryDeg: null,
  sameGraMga: true,
  variants: (st) => [
  { posek: "Solar noon, all opinions", deg: "6h", time: st.chatzot },
  { posek: "Chatzot Night (midnight)", deg: "6h after shkiah", time: st.chatzotNight }]

},
{
  label: 'Mincha Gedola', labelHe: 'מנחה גדולה',
  sub: 'Earliest Mincha',
  primaryDeg: '6.5h',
  primary: (st) => st.minchaGedola_gra,
  secondary: (st) => null,
  secondaryDeg: null,
  sameGraMga: true,
  variants: (st) => [
  { posek: "GRA", deg: "6.5h / +30m", time: st.minchaGedola_gra },
  { posek: "MGA", deg: "6.5h MGA", time: st.minchaGedola_mga },
  { posek: "Baal HaTanya", deg: "6.5h BHT", time: st.minchaGedola_bht }]

},
{
  label: 'Mincha Ketana', labelHe: 'מנחה קטנה',
  sub: 'Preferred time for Mincha',
  primaryDeg: '9.5h',
  primary: (st) => st.minchaKetana_gra,
  secondary: (st) => null,
  secondaryDeg: null,
  sameGraMga: true,
  variants: (st) => [
  { posek: "GRA", deg: "9.5h", time: st.minchaKetana_gra },
  { posek: "MGA", deg: "9.5h", time: st.minchaKetana_mga },
  { posek: "Baal HaTanya", deg: "9.5h", time: st.minchaKetana_bht }]

},
{
  label: 'Plag HaMincha', labelHe: 'פלג המנחה',
  sub: 'Early Kabbalat Shabbat',
  primaryDeg: '10.75h',
  primary: (st) => st.plagHaMincha_gra,
  secondary: (st) => null,
  secondaryDeg: null,
  sameGraMga: true,
  variants: (st) => [
  { posek: "GRA", deg: "10.75h", time: st.plagHaMincha_gra },
  { posek: "MGA", deg: "10.75h", time: st.plagHaMincha_mga },
  { posek: "Baal HaTanya", deg: "10.75h", time: st.plagHaMincha_bht }]

},
{
  label: 'Candle Lighting', labelHe: 'הדלקת נרות',
  sub: 'Shabbat / Yom Tov candles',
  primaryDeg: '18 min',
  primary: (st) => st.candleLighting_18,
  secondary: (st) => null,
  secondaryDeg: null,
  sameGraMga: true,
  erevOnly: true,
  variants: (st) => [
  { posek: "Ashkenaz standard", deg: "18 min", time: st.candleLighting_18 },
  { posek: "Israeli standard (outside Jerusalem)", deg: "20 min", time: st.candleLighting_20 },
  { posek: "Mishnah Berurah", deg: "30 min", time: st.candleLighting_30 },
  { posek: "Yerushalayim", deg: "40 min", time: st.candleLighting_40 }]
},
{
  label: 'Shkiah', labelHe: 'שקיעה',
  sub: 'Sunset',
  primaryDeg: '−0.833°',
  primary: (st) => st.shkiah,
  secondary: (st) => null,
  secondaryDeg: null,
  sameGraMga: true,
  variants: (st) => [
  { posek: "Sea level (−0.833° horizon)", deg: "sea level", time: st.shkiahSealevel || st.shkiah },
  { posek: "Adjusted for elevation", deg: "elev. dip", time: st.shkiahElevation || st.shkiahSealevel || st.shkiah }]
},
{
  label: 'Tzait Kochavim', labelHe: 'צאת הכוכבים',
  sub: 'Stars visible — nightfall',
  primaryDeg: '8.5°',
  primary: (st) => st.tzait_8_5,
  secondary: (st) => null,
  secondaryDeg: null,
  sameGraMga: true,
  variants: (st) => [
  { posek: "3 medium stars, lenient", deg: "7.083°", time: st.tzait_7_083 },
  { posek: "Most Ashkenaz (standard)", deg: "8.5°", time: st.tzait_8_5 },
 
  { posek: "Tzait at 16.1° (stringent)", deg: "16.1°", time: st.tzait_16_1 },
  { posek: "Baal HaTanya", deg: "6°", time: st.tzaitBaalHatanya },
  { posek: "Rabbeinu Tam (fixed 72 min)", deg: "72 min", time: st.rabbeinuTam_fixed }]

},
{
  label: 'Motzei Shabbat', labelHe: 'מוצאי שבת',
  sub: 'Shabbat ends — nightfall',
  primaryDeg: '72 min',
  primary: (st) => st.rabbeinuTam_fixed,
  secondary: (st) => null,
  secondaryDeg: null,
  sameGraMga: true,
  shabbatOnly: true,
  variants: (st) => [
  { posek: "Rabbeinu Tam (fixed 72 min)", deg: "72 min", time: st.rabbeinuTam_fixed },
  { posek: "Most Ashkenaz (standard)", deg: "8.5°", time: st.tzait_8_5 },
  { posek: "3 medium stars, lenient", deg: "7.083°", time: st.tzait_7_083 },
  { posek: "Tzait at 16.1° (stringent)", deg: "16.1°", time: st.tzait_16_1 }]

},
{
  label: 'Chatzot HaLayla', labelHe: 'חצות הלילה',
  sub: 'Halachic midnight',
  primaryDeg: '6h night',
  primary: (st) => st.chatzotNight,
  secondary: (st) => null,
  secondaryDeg: null,
  sameGraMga: true,
  variants: (st) => [
  { posek: "12 halachic hours after chatzot", deg: "12h night", time: st.chatzotNight }]

}];


function ZmanRow({ row, st, now, hour12, opinion, lang = 'both', tz, locationName, elevationStatus, secondaryOpinions = [] }) {
  const [expanded, setExpanded] = useState(false);
  const primaryTime = row.primary(st);
  const secondaryTime = row.sameGraMga ? null : row.secondary(st);
  const soon = isSoon(primaryTime, now);
  const past = isPast(primaryTime, now);
  const variants = row.variants(st).filter((v) => v.time);
  const hasSecondary = secondaryOpinions.length > 0;

  const showMga = (opinion === 'mga' || opinion === 'both') && !row.sameGraMga && secondaryTime;
  const showGra = opinion === 'gra' || opinion === 'both';
  const isExpandable = Boolean(primaryTime);
  const RowTag = isExpandable ? 'button' : 'div';

  return (
    <div className={`border-b border-gray-200 last:border-0 ${soon ? 'bg-yellow-50' : ''}`}>
      {/* Main row */}
      <RowTag
        {...(isExpandable ? { type: 'button', 'aria-expanded': expanded, onClick: () => setExpanded((e) => !e) } : {})}
        className="w-full px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center gap-2 sm:gap-3 text-left hover:bg-gray-200/60 transition-all opacity-100 rounded"
      >
        
        {/* Label */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {row.labelHe && (lang === 'he' || lang === 'both') &&
            <span className={`text-xs sm:text-sm font-semibold leading-snug ${soon ? 'text-yellow-700' : 'text-gray-900'}`} dir="rtl">
                {row.labelHe}
              </span>
            }
            {lang === 'both' && row.labelHe && <span className="text-gray-300 text-xs">·</span>}
            {(lang === 'en' || lang === 'both') &&
            <span className={`text-xs sm:text-sm font-semibold leading-snug ${soon ? 'text-yellow-700' : 'text-gray-900'}`}>
                {row.label}
              </span>
            }
            {soon && <span className="text-[10px] sm:text-xs bg-yellow-400/30 text-yellow-800 px-1.5 sm:px-2 py-0.5 rounded-full font-medium">{lang === 'he' ? 'בקרוב' : 'upcoming'}</span>}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
            <span className="text-[11px] sm:text-xs text-gray-500">{row.sub}</span>
            {row.primaryDeg &&
            <span className="text-[10px] sm:text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded" title={`Method: ${inferCalcMethod(row.primaryDeg)}`}>{row.primaryDeg}</span>
            }
          </div>
        </div>

        {/* GRA time */}
        {showGra &&
        <div className="flex flex-col items-end shrink-0">
            <div className="flex items-baseline gap-1">
              <span className={`font-mono font-bold text-sm sm:text-base tabular-nums ${
            soon ? 'text-yellow-700' : 'text-gray-900'}`
            }>
                {fmt(primaryTime, hour12, tz)}
              </span>
              {row.primaryDeg &&
              <span className="text-[10px] sm:text-xs text-gray-500 font-mono">/ {row.primaryDeg}</span>
              }
            </div>
          </div>
        }

        {/* MGA time */}
        {showMga &&
        <div className="flex flex-col items-end shrink-0">
            <span className={`font-mono font-bold text-sm sm:text-base tabular-nums ${
          soon ? 'text-sky-600' : 'text-gray-900'}`
          }>
              {fmt(secondaryTime, hour12, tz)}
            </span>
            {row.secondaryDeg &&
          <span className="text-[9px] sm:text-[10px] text-gray-400 font-mono leading-none mt-0.5">{row.secondaryDeg}</span>
          }
          </div>
        }

        {/* Expand chevron */}
        {isExpandable &&
        <span className="text-gray-400 ml-0.5 sm:ml-1 shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        }
      </RowTag>

      {/* Secondary displayed opinions — smaller, indented, display-only */}
      {hasSecondary &&
      <div className="px-3 sm:px-5 pb-1.5 pl-7 sm:pl-10 space-y-0.5">
        {secondaryOpinions.map((sec, i) => (
          <div key={i} className="flex items-center justify-between text-[11px] text-gray-900">
            <span className="flex items-center gap-1.5" dir="rtl">
              {sec.heLabel && <span className="font-semibold">{sec.heLabel}</span>}
              <span className="font-mono text-gray-500">{sec.label}</span>
            </span>
            <span className="font-mono tabular-nums font-semibold">{fmt(sec.time, hour12, tz)}</span>
          </div>
        ))}
      </div>
      }

      {/* Expanded variants — all opinions, compact dark + Hebrew style, earliest → latest */}
      {expanded &&
      <div className="px-3 sm:px-5 pb-2 pt-1 space-y-0.5">
        {[...variants].sort((a, b) => a.time - b.time).map((v, i) => {
          const he = heLabelForDeg(v.deg);
          return (
          <div key={i} className="flex items-center justify-between text-[11px] text-gray-900">
            <span className="flex items-center gap-1.5 min-w-0" dir="rtl">
              {he && <span className="font-semibold shrink-0">{he}</span>}
              <span className="font-mono text-gray-500 shrink-0">{v.deg || ''}</span>
              <span className="text-gray-400 truncate hidden sm:inline">· {v.posek}</span>
            </span>
            <span className="font-mono tabular-nums font-semibold shrink-0 ml-2">{fmt(v.time, hour12, tz)}</span>
          </div>
          );
        })}
      </div>
      }
    </div>);

}

export default function ZmanimCard({ sunTimes, currentTime, date, opinion = 'both', hour12 = true, lang = 'both', zmanimOpinions = {}, customZmanim = [], locationTz, locationName, elevationStatus, nextDaySunTimes, calendarEvents = [], onPrevDay, onNextDay, displayLevel = 'full', zmanimSource = 'hebcal', showSecondaryTimes = true, secondaryZmanimDisplay = {} }) {
  const [showAll, setShowAll] = useState(true);
  useEffect(() => { setShowAll(true); }, [displayLevel]);
  const now = currentTime;
  const st = sunTimes;
  if (!st) return null;

  const showCandleLighting = date ? isErevShabbatOrYomTov(date, calendarEvents, locationTz) : false;
  const isShabbatOrYT = date ? isShabbatOrYomTov(date, calendarEvents, locationTz) : false;

  // Build annotated rows from any sunTimes object.
  // applyMajorFilter scopes the Major-day zman-hiding to the current day only,
  // so tomorrow's morning preview (after sunset) is unaffected.
  function buildAnnotated(stObj, applyMajorFilter = true) {
    return ZMANIM_ROWS.
    filter((row) => !row.erevOnly || showCandleLighting).
    filter((row) => !row.shabbatOnly || isShabbatOrYT).
    map((row) => {
      const category = ROW_CATEGORIES[row.label] || '';
      const resolvedTime = resolvePrimary(row, stObj, category, zmanimOpinions, customZmanim);
      const resolvedDeg = resolvePrimaryDeg(row, category, zmanimOpinions, customZmanim);
      const customVariants = (customZmanim || [])
        .filter((cz) => cz.zmanType === category)
        .map((cz) => ({
          posek: `${cz.posekName} (custom)`,
          deg: cz.definitionType === 'degree' ? `${cz.degree}°` : `${cz.offsetMinutes >= 0 ? '+' : '−'}${Math.abs(cz.offsetMinutes)}m`,
          time: calcCustomZman(cz, stObj),
        }));
      // Secondary DISPLAY opinions (display-only — never changes the primary calculation).
      // Resolved from the same sunTimes object via OPINION_RESOLVERS, excluding the primary.
      const primarySel = zmanimOpinions?.[category];
      const secKeys = showSecondaryTimes ? (secondaryZmanimDisplay[category] || []).filter(k => k !== primarySel) : [];
      const secondaryOpinions = secKeys
        .map(k => {
          const resolver = OPINION_RESOLVERS[category]?.[k];
          const time = resolver ? resolver(stObj) : null;
          const label = OPINION_LABELS[category]?.[k] || k;
          const heLabel = HEBREW_OPINION_LABELS[category]?.[k] || '';
          return time ? { label, heLabel, time } : null;
        })
        .filter(Boolean);
      return {
        ...row,
        category,
        primaryDeg: resolvedDeg,
        primary: () => resolvedTime,
        variants: (stInner) => [...row.variants(stInner), ...customVariants],
        _primaryTime: resolvedTime,
        secondaryOpinions,
      };
    });
  }

  const annotated = buildAnnotated(st);

  const upcoming = annotated.filter((r) => r._primaryTime && !isPast(r._primaryTime, now)).
  sort((a, b) => a._primaryTime - b._primaryTime);

  // After sunset: show next morning's zmanim from tomorrow's data
  const afterSunset = st?.shkiah && now > st.shkiah;
  const MORNING_LABELS = ['Alot HaShachar', 'Misheyakir', 'Netz HaChamah', 'Sof Zman Shema'];

  // Collapsed ("upcoming only") set — used when the user taps the collapse button.
  const UPCOMING_LABELS = ['Netz HaChamah', 'Sof Zman Shema', 'Chatzot', 'Shkiah', 'Tzait Kochavim'];
  let visibleRows;
  if (showAll || displayLevel === 'expert') {
    // Default: all zmanim rows render regardless of Simple/Full/Expert level.
    visibleRows = annotated;
  } else if (afterSunset && nextDaySunTimes) {
    const tomorrowAnnotated = buildAnnotated(nextDaySunTimes, false);
    visibleRows = tomorrowAnnotated.filter(r => MORNING_LABELS.includes(r.label)).slice(0, 4);
  } else {
    visibleRows = annotated.filter(row => UPCOMING_LABELS.includes(row.label));
  }

  return (
    <div className="rounded-3xl border border-gray-300 bg-gray-100 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-widest">🕐 {lang === 'he' ? 'זמני תפילה' : 'Prayer Times'}</h3>
            {!showAll && afterSunset && nextDaySunTimes ?
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                {lang === 'he' ? 'זמני מחר בבוקר · לחץ לרשימה מלאה' : "Tomorrow's morning · tap for full list"}
              </p>
            : !showAll && upcoming.length > 0 &&
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                {lang === 'he' ? `הבאים ${Math.min(5, upcoming.length)} · לחץ לרשימה מלאה` : `Next ${Math.min(5, upcoming.length)} upcoming · tap for full list`}
              </p>
            }
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium ${zmanimSource === 'local-fallback' ? 'text-amber-700 bg-amber-100' : 'text-emerald-700 bg-emerald-100'}`}>
              {zmanimSource === 'local-fallback' ? (lang === 'he' ? 'מקומי' : 'Local') : 'Hebcal'}
            </span>
            <div className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
              {opinion === 'both' ? lang === 'he' ? 'כל הדעות' : 'All opinions' : opinion.toUpperCase()}
            </div>
          </div>
        </div>
        {(onPrevDay || onNextDay) && (
          <div className="flex items-center justify-between mt-2.5 sm:mt-3 gap-2">
            <button onClick={onPrevDay} aria-label="Previous day" className="p-1.5 sm:p-2 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all">
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </button>
            <div className="flex flex-col items-center text-center min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-gray-900">
                {date ? formatDateInTz(date, locationTz, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
              </span>
              {(() => { const hd = toHebrewDate(getStableDateForHebrew(date, locationTz)); return hd ? <span className="text-xs sm:text-sm font-semibold text-yellow-600" dir="rtl">{hd.formatted}</span> : null; })()}
            </div>
            <button onClick={onNextDay} aria-label="Next day" className="p-1.5 sm:p-2 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all">
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </button>
          </div>
        )}
      </div>

      {/* Rows */}
      <div>
        {visibleRows.map((row) =>
        <ZmanRow key={row.label} row={row} st={st} now={now} hour12={hour12} opinion={opinion} lang={lang} tz={locationTz} locationName={locationName} elevationStatus={elevationStatus} secondaryOpinions={row.secondaryOpinions || []} />
        )}
      </div>

      {/* Show all / collapse */}
      {displayLevel !== 'expert' && <button
        onClick={() => setShowAll((s) => !s)}
        className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 sm:py-3.5 border-t border-gray-200 text-[11px] sm:text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all">
        
        {showAll ?
        <><ChevronUp className="w-3.5 h-3.5" /> {lang === 'he' ? 'הצג רק את הבאים' : 'Show upcoming only'}</> :
        <><ChevronDown className="w-3.5 h-3.5" /> {lang === 'he' ? 'הצג הכל' : 'Show all'}</>
        }
      </button>}
    </div>);

}
/**
 * Jewish calendar utilities: Omer count, Parasha display, Yom Tov names,
 * special day notes, and Molad calculation.
 */

import { toHebrewDate } from './sunCalc';

// ── Sefirat HaOmer ──────────────────────────────────────────────────────────

const OMER_WEEKS = ['', 'חסד', 'גבורה', 'תפארת', 'נצח', 'הוד', 'יסוד', 'מלכות'];
const OMER_DAYS  = ['', 'חסד', 'גבורה', 'תפארת', 'נצח', 'הוד', 'יסוד', 'מלכות'];
const OMER_WEEKS_EN = ['', 'Chesed', 'Gevurah', 'Tiferet', 'Netzach', 'Hod', 'Yesod', 'Malchut'];
const OMER_DAYS_EN  = ['', 'Chesed', 'Gevurah', 'Tiferet', 'Netzach', 'Hod', 'Yesod', 'Malchut'];

const HEB_NUMS = ['','א','ב','ג','ד','ה','ו','ז','ח','ט','י','יא','יב','יג','יד','טו','טז','יז','יח','יט','כ','כא','כב','כג','כד','כה','כו','כז','כח','כט','ל','לא','לב','לג','לד','לה','לו','לז','לח','לט','מ','מא','מב','מג','מד','מה','מו','מז','מח','מט'];

/**
 * Returns the Omer day (1–49) for the given date, or null if not in Omer period.
 * Omer starts 16 Nisan (day after first Pesach seder) and ends 49 Omer = Erev Shavuot.
 */
export function getOmerDay(date) {
  const hd = toHebrewDate(date);
  if (!hd) return null;
  const { month, day } = hd;
  // Nisan = month 1, Iyar = month 2, Sivan = month 3
  if (month === 1 && day >= 16) return day - 15; // 16 Nisan = day 1
  if (month === 2) return day + 15;               // all Iyar (1-29) = 16-44
  if (month === 3 && day <= 5)  return day + 44;  // 1-5 Sivan = 45-49
  return null;
}

/**
 * Returns the Omer count text in the requested language.
 */
export function getOmerText(omerDay, lang = 'both') {
  if (!omerDay || omerDay < 1 || omerDay > 49) return null;
  const weeks = Math.floor((omerDay - 1) / 7);
  const days  = ((omerDay - 1) % 7) + 1;

  let heText = `הַיּוֹם ${HEB_NUMS[omerDay]} יוֹם`;
  if (weeks > 0 && days === 7) {
    heText += ` שֶׁהֵם ${HEB_NUMS[weeks + 1]} שָׁבוּעוֹת בָּעֹמֶר`;
  } else if (weeks > 0) {
    heText += ` שֶׁהֵם ${HEB_NUMS[weeks]} שָׁבוּעוֹת וְ${HEB_NUMS[days]} יָמִים בָּעֹמֶר`;
  } else {
    heText += ` בָּעֹמֶר`;
  }

  let enText = `Day ${omerDay} of the Omer`;
  if (weeks > 0 && days === 7) {
    enText += ` (${OMER_WEEKS_EN[weeks]} of ${OMER_WEEKS_EN[weeks]})`;
  } else if (weeks > 0) {
    enText += ` — ${OMER_WEEKS_EN[weeks+1] || ''} sh'b'${OMER_DAYS_EN[days]}`;
  }

  const weekOf = weeks > 0 ? `Week of ${OMER_WEEKS_EN[weeks+1] || OMER_WEEKS_EN[weeks]}, Day of ${OMER_DAYS_EN[days]}` : `Day of ${OMER_DAYS_EN[days]}`;

  if (lang === 'he') return heText;
  if (lang === 'en') return enText;
  return { he: heText, en: enText, day: omerDay, weeks, days, weekOf };
}

// ── Special Day Notes ────────────────────────────────────────────────────────

const SPECIAL_DAYS = [
  // Tishri (month 7)
  { month: 7, day: 1,  he: 'ראש השנה א׳',     en: 'Rosh Hashana I',          type: 'yomtov' },
  { month: 7, day: 2,  he: 'ראש השנה ב׳',     en: 'Rosh Hashana II',         type: 'yomtov' },
  { month: 7, day: 3,  he: 'צום גדליה',        en: 'Tzom Gedaliah',           type: 'fast' },
  { month: 7, day: 9,  he: 'ערב יום כיפור',   en: 'Erev Yom Kippur',         type: 'erev' },
  { month: 7, day: 10, he: 'יום כיפור',        en: 'Yom Kippur',              type: 'yomtov' },
  { month: 7, day: 14, he: 'ערב סוכות',        en: 'Erev Sukkot',             type: 'erev' },
  { month: 7, day: 15, he: 'סוכות א׳',         en: 'Sukkot I',                type: 'yomtov' },
  { month: 7, day: 16, he: 'סוכות ב׳',         en: 'Sukkot II',               type: 'yomtov' },
  { month: 7, day: 17, he: 'חול המועד סוכות',  en: 'Chol HaMoed Sukkot',      type: 'cholhamoed' },
  { month: 7, day: 18, he: 'חול המועד סוכות',  en: 'Chol HaMoed Sukkot',      type: 'cholhamoed' },
  { month: 7, day: 19, he: 'חול המועד סוכות',  en: 'Chol HaMoed Sukkot',      type: 'cholhamoed' },
  { month: 7, day: 20, he: 'חול המועד סוכות',  en: 'Chol HaMoed Sukkot',      type: 'cholhamoed' },
  { month: 7, day: 21, he: 'הושענא רבה',       en: 'Hoshana Raba',            type: 'special' },
  { month: 7, day: 22, he: 'שמיני עצרת',       en: 'Shemini Atzeret',         type: 'yomtov' },
  { month: 7, day: 23, he: 'שמחת תורה',        en: 'Simchat Torah',           type: 'yomtov' },
  // Kislev (month 9)
  { month: 9, day: 25, he: 'חנוכה א׳',         en: 'Chanuka I',               type: 'minor' },
  { month: 9, day: 26, he: 'חנוכה ב׳',         en: 'Chanuka II',              type: 'minor' },
  { month: 9, day: 27, he: 'חנוכה ג׳',         en: 'Chanuka III',             type: 'minor' },
  { month: 9, day: 28, he: 'חנוכה ד׳',         en: 'Chanuka IV',              type: 'minor' },
  { month: 9, day: 29, he: 'חנוכה ה׳',         en: 'Chanuka V',               type: 'minor' },
  // Tevet (month 10)
  { month: 10, day: 1, he: 'חנוכה ו׳',         en: 'Chanuka VI',              type: 'minor' },
  { month: 10, day: 2, he: 'חנוכה ז׳',         en: 'Chanuka VII',             type: 'minor' },
  { month: 10, day: 3, he: 'חנוכה ח׳',         en: 'Chanuka VIII',            type: 'minor' },
  { month: 10, day: 10,he: 'עשרה בטבת',        en: 'Asara B\'Tevet',          type: 'fast' },
  // Shvat (month 11)
  { month: 11, day: 15,he: 'ט"ו בשבט',         en: 'Tu B\'Shvat',             type: 'minor' },
  // Adar (month 12) / Adar II (month 13)
  { month: 12, day: 13,he: 'תענית אסתר',        en: 'Ta\'anit Esther',         type: 'fast',   nonLeap: true },
  { month: 12, day: 14,he: 'פורים',             en: 'Purim',                   type: 'minor',  nonLeap: true },
  { month: 12, day: 15,he: 'שושן פורים',        en: 'Shushan Purim',           type: 'minor',  nonLeap: true },
  { month: 13, day: 13,he: 'תענית אסתר',        en: 'Ta\'anit Esther (Adar II)', type: 'fast' },
  { month: 13, day: 14,he: 'פורים',             en: 'Purim (Adar II)',          type: 'minor' },
  { month: 13, day: 15,he: 'שושן פורים',        en: 'Shushan Purim (Adar II)', type: 'minor' },
  // Nisan (month 1)
  { month: 1, day: 14, he: 'ערב פסח',           en: 'Erev Pesach',             type: 'erev' },
  { month: 1, day: 15, he: 'פסח א׳',            en: 'Pesach I',                type: 'yomtov' },
  { month: 1, day: 16, he: 'פסח ב׳',            en: 'Pesach II',               type: 'yomtov' },
  { month: 1, day: 17, he: 'חול המועד פסח',     en: 'Chol HaMoed Pesach',      type: 'cholhamoed' },
  { month: 1, day: 18, he: 'חול המועד פסח',     en: 'Chol HaMoed Pesach',      type: 'cholhamoed' },
  { month: 1, day: 19, he: 'חול המועד פסח',     en: 'Chol HaMoed Pesach',      type: 'cholhamoed' },
  { month: 1, day: 20, he: 'חול המועד פסח',     en: 'Chol HaMoed Pesach',      type: 'cholhamoed' },
  { month: 1, day: 21, he: 'פסח ז׳',            en: 'Pesach VII',              type: 'yomtov' },
  { month: 1, day: 22, he: 'פסח ח׳',            en: 'Pesach VIII',             type: 'yomtov' },
  // Iyar (month 2)
  { month: 2, day: 14, he: 'פסח שני',           en: 'Pesach Sheni',            type: 'minor' },
  { month: 2, day: 18, he: 'ל"ג בעומר',         en: 'Lag B\'Omer',             type: 'minor' },
  // Sivan (month 3)
  { month: 3, day: 5,  he: 'ערב שבועות',        en: 'Erev Shavuot',            type: 'erev' },
  { month: 3, day: 6,  he: 'שבועות א׳',         en: 'Shavuot I',               type: 'yomtov' },
  { month: 3, day: 7,  he: 'שבועות ב׳',         en: 'Shavuot II',              type: 'yomtov' },
  // Tamuz (month 4)
  { month: 4, day: 17, he: 'שבעה עשר בתמוז',   en: 'Shiva Asar B\'Tamuz',     type: 'fast' },
  // Av (month 5)
  { month: 5, day: 9,  he: 'תשעה באב',          en: 'Tisha B\'Av',             type: 'fast' },
  { month: 5, day: 15, he: 'ט"ו באב',           en: 'Tu B\'Av',                type: 'minor' },
  // Elul (month 6)
  { month: 6, day: 29, he: 'ערב ראש השנה',      en: 'Erev Rosh Hashana',       type: 'erev' },
];

export function getSpecialDay(date) {
  const hd = toHebrewDate(date);
  if (!hd) return null;
  const { month, day, year } = hd;
  const isLeap = (7 * year + 1) % 19 < 7;
  return SPECIAL_DAYS.find(s => s.month === month && s.day === day && !(s.nonLeap && isLeap)) || null;
}

export function isRoshChodesh(date) {
  const hd = toHebrewDate(date);
  if (!hd) return false;
  const { day } = hd;
  return day === 1 || day === 30;
}

export function getRoshChodeshName(date) {
  const hd = toHebrewDate(date);
  if (!hd) return null;
  const MONTHS_HE = ['','ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשון','כסלו','טבת','שבט','אדר','אדר ב׳'];
  const MONTHS_EN = ['','Nisan','Iyar','Sivan','Tamuz','Av','Elul','Tishri','Cheshvan','Kislev','Tevet','Shvat','Adar','Adar II'];
  // Day 1: Rosh Chodesh is for the current month.
  // Day 30: Rosh Chodesh is for the NEXT month, using actual Hebrew month order.
  // The year changes at Tishri (month 7), not at month 1.
  if (hd.day === 1) {
    return { he: `ראש חודש ${MONTHS_HE[hd.month] || ''}`, en: `Rosh Chodesh ${MONTHS_EN[hd.month] || ''}` };
  }
  const isLeap = (7 * hd.year + 1) % 19 < 7;
  const order = isLeap
    ? [7, 8, 9, 10, 11, 12, 13, 1, 2, 3, 4, 5, 6]
    : [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
  const idx = order.indexOf(hd.month);
  const nextIdx = (idx + 1) % order.length;
  const nextMonth = idx === -1 ? hd.month : order[nextIdx];
  const nextYear = nextIdx === 0 ? hd.year + 1 : hd.year;
  return { he: `ראש חודש ${MONTHS_HE[nextMonth] || ''}`, en: `Rosh Chodesh ${MONTHS_EN[nextMonth] || ''}` };
}

// ── Day type badge ────────────────────────────────────────────────────────────
export function getDayBadge(date) {
  const special = getSpecialDay(date);
  if (special) return special;
  const rc = isRoshChodesh(date);
  if (rc) {
    const name = getRoshChodeshName(date);
    return { he: name.he, en: name.en, type: 'roshchodesh' };
  }
  const omer = getOmerDay(date);
  if (omer) return { he: `עומר ${omer}`, en: `Omer Day ${omer}`, type: 'omer' };
  return null;
}

// ── Badge color by type ───────────────────────────────────────────────────────
export function getBadgeStyle(type) {
  switch (type) {
    case 'yomtov':     return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
    case 'erev':       return 'bg-orange-500/20 text-orange-200 border-orange-500/30';
    case 'cholhamoed': return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
    case 'fast':       return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    case 'minor':      return 'bg-purple-500/20 text-purple-200 border-purple-500/30';
    case 'special':    return 'bg-teal-500/20 text-teal-200 border-teal-500/30';
    case 'roshchodesh':return 'bg-sky-500/20 text-sky-200 border-sky-500/30';
    case 'omer':       return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30';
    default:           return 'bg-white/10 text-white/60 border-white/20';
  }
}
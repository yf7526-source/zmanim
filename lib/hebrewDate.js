/**
 * Hebrew calendar conversion using astronomical algorithms
 * Based on the Meeus algorithm adapted for Hebrew dates
 */

const HEBREW_MONTHS = [
  'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול',
  'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר', 'אדר ב׳'
];

const HEBREW_NUMBERS = {
  1: 'א׳', 2: 'ב׳', 3: 'ג׳', 4: 'ד׳', 5: 'ה׳',
  6: 'ו׳', 7: 'ז׳', 8: 'ח׳', 9: 'ט׳', 10: 'י׳',
  11: 'י״א', 12: 'י״ב', 13: 'י״ג', 14: 'י״ד', 15: 'ט״ו',
  16: 'ט״ז', 17: 'י״ז', 18: 'י״ח', 19: 'י״ט', 20: 'כ׳',
  21: 'כ״א', 22: 'כ״ב', 23: 'כ״ג', 24: 'כ״ד', 25: 'כ״ה',
  26: 'כ״ו', 27: 'כ״ז', 28: 'כ״ח', 29: 'כ״ט', 30: 'ל׳',
};

function isHebrewLeapYear(year) {
  return ((7 * year) + 1) % 19 < 7;
}

function daysInHebrewYear(year) {
  return hebrewNewYear(year + 1) - hebrewNewYear(year);
}

function hebrewNewYear(year) {
  const months = Math.floor((235 * year - 234) / 19);
  const parts = 12084 + 13753 * months;
  let day = months * 29 + Math.floor(parts / 25920);
  if ((3 * (day + 1)) % 7 < 3) day++;
  return day;
}

function hebrewMonthDays(month, year) {
  if (month === 2 || month === 4 || month === 6 || month === 10 || month === 13) return 29;
  if (month === 12) return isHebrewLeapYear(year) ? 29 : 30; // Adar/Adar I
  if (month === 8) { // Cheshvan
    const days = daysInHebrewYear(year);
    return (days % 10 === 5) ? 30 : 29;
  }
  if (month === 9) { // Kislev
    const days = daysInHebrewYear(year);
    return (days % 10 === 3) ? 29 : 30;
  }
  return 30;
}

export function gregorianToHebrew(date) {
  // Accurate conversion using Julian Day Number
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  // Julian Day Number
  const jdn = Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
    Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) +
    d - 32075;

  // Hebrew epoch (1 Tishri 1) = JDN 347997
  const hebrewEpoch = 347997;
  const days = jdn - hebrewEpoch;

  // Approximate Hebrew year
  let hebrewYear = Math.floor((days * 19) / 6940) + 1;
  while (hebrewNewYear(hebrewYear + 1) <= days) hebrewYear++;
  while (hebrewNewYear(hebrewYear) > days) hebrewYear--;

  let dayOfYear = days - hebrewNewYear(hebrewYear) + 1;

  // Find month
  const monthsInYear = isHebrewLeapYear(hebrewYear) ? 13 : 12;
  let hebrewMonth = 7; // Start from Tishri (month 7)
  let daysLeft = dayOfYear;

  // Month order starting from Tishri
  const monthOrder = [7, 8, 9, 10, 11, 12, 13, 1, 2, 3, 4, 5, 6];

  for (let i = 0; i < monthOrder.length; i++) {
    const mo = monthOrder[i];
    if (mo === 13 && !isHebrewLeapYear(hebrewYear)) continue;
    const moLen = hebrewMonthDays(mo, hebrewYear);
    if (daysLeft <= moLen) {
      hebrewMonth = mo;
      break;
    }
    daysLeft -= moLen;
  }

  const hebrewDay = daysLeft;

  const monthName = HEBREW_MONTHS[hebrewMonth - 1] || HEBREW_MONTHS[11];
  const dayStr = HEBREW_NUMBERS[hebrewDay] || hebrewDay.toString();

  // Year in Hebrew letters (simplified - just show number)
  const yearStr = hebrewYearString(hebrewYear);

  return {
    day: hebrewDay,
    month: hebrewMonth,
    year: hebrewYear,
    dayStr,
    monthName,
    yearStr,
    formatted: `${dayStr} ${monthName} ${yearStr}`,
  };
}

function hebrewYearString(year) {
  // Return last 3 digits of Hebrew year in Hebrew letters
  const thousands = Math.floor(year / 1000);
  const remainder = year % 1000;

  const hebrewLetterMap = {
    1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט',
    10: 'י', 20: 'כ', 30: 'ל', 40: 'מ', 50: 'נ', 60: 'ס', 70: 'ע', 80: 'פ', 90: 'צ',
    100: 'ק', 200: 'ר', 300: 'ש', 400: 'ת',
  };

  let str = '';
  let n = remainder;
  const hundreds = Math.floor(n / 100) * 100;
  if (hundreds > 0) { str += hebrewLetterMap[hundreds] || ''; n -= hundreds; }
  const tens = Math.floor(n / 10) * 10;
  if (tens > 0) { str += hebrewLetterMap[tens] || ''; n -= tens; }
  if (n > 0) { str += hebrewLetterMap[n] || ''; }

  // Add geresh/gershayim
  if (str.length === 1) str += '׳';
  else if (str.length > 1) str = str.slice(0, -1) + '״' + str.slice(-1);

  return 'ה׳' + str;
}

export function getDayOfWeek(date) {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  return days[date.getDay()];
}
import { toHebrewDate } from './sunCalc.js';
import { categorizeHebcalEvent } from './holidayDetection.js';

export const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const HE_MONTH_NAMES = ['','Nissan','Iyar','Sivan','Tammuz','Av','Elul','Tishri','Cheshvan','Kislev','Tevet','Shvat','Adar','Adar II'];
export const HE_MONTH_NAMES_HE = ['','ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשון','כסלו','טבת','שבט','אדר','אדר ב׳'];
export const DAY_NAMES_HE = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
export const SYNODIC_MONTH = 29.53058867;

export function isHebrewLeapYear(year) { return (7 * year + 1) % 19 < 7; }
export function getHebrewMonthOrder(year) {
  return isHebrewLeapYear(year)
    ? [7,8,9,10,11,12,13,1,2,3,4,5,6]
    : [7,8,9,10,11,12,1,2,3,4,5,6];
}
export function navigateHebrewMonth(year, month, dir) {
  const order = getHebrewMonthOrder(year);
  const index = order.indexOf(month);
  if (index < 0 || !Number.isInteger(dir) || dir === 0) return { year, month };
  if (dir > 0 && index === order.length - 1) return { year: year + 1, month: 7 };
  if (dir < 0 && index === 0) return { year: year - 1, month: 6 };
  return { year, month: order[index + Math.sign(dir)] };
}

export function hebrewDayLetter(n) {
  const ones = ['','א','ב','ג','ד','ה','ו','ז','ח','ט'];
  const tens = ['','י','כ','ל','מ','נ','ס','ע','פ','צ'];
  const mod = n % 100;
  if (mod === 15) return 'טו';
  if (mod === 16) return 'טז';
  return tens[Math.floor(mod / 10)] + ones[mod % 10];
}

export function isErevShabbatOrYomTov(date) {
  if (date.getDay() === 5) return true;
  try {
    const hd = toHebrewDate(date);
    if (!hd) return false;
    const { month, day } = hd;
    const erevYomTovDates = [
      { month: 1, day: 14 }, { month: 6, day: 29 }, { month: 7, day: 9 },
      { month: 7, day: 14 }, { month: 7, day: 21 }, { month: 3, day: 5 },
    ];
    return erevYomTovDates.some((e) => e.month === month && e.day === day);
  } catch { return false; }
}

export function getHebrewMonthDays(year, month) {
  function isLeap(y) { return (7*y+1)%19<7; }
  function elapsed(y) {
    const m=235*Math.floor((y-1)/19)+12*((y-1)%19)+Math.floor((7*((y-1)%19)+1)/19);
    const p=204+793*(m%1080); const h=5+12*m+793*Math.floor(m/1080)+Math.floor(p/1080);
    const cD=1+29*m+Math.floor(h/24); const cP=1080*(h%24)+p%1080;
    let d=cD;
    if(cP>=19440||(cD%7===2&&cP>=9924&&!isLeap(y))||(cD%7===1&&cP>=16789&&isLeap(y-1)))d=cD+1;
    if([0,3,5].includes(d%7))d++;
    return d;
  }
  function daysY(y){return elapsed(y+1)-elapsed(y);}
  if([2,4,6,10,13].includes(month))return 29;
  if(month===12&&!isLeap(year))return 29;
  if(month===8&&daysY(year)%10!==5)return 29;
  if(month===9&&daysY(year)%10===3)return 29;
  return 30;
}

export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export function getEventInfo(date, eventsMap) {
  const items = eventsMap[dateKey(date)] || [];
  const labels = [];
  let isYomTov = false, isFast = false, isRoshChodesh = false,
      isErev = false, isMinor = false, isCholHamoed = false, parasha = null;
  for (const item of items) {
    const he = item.hebrew || item.title || '';
    if (item.category === 'parashat') { parasha = he; continue; }
    // Use the shared, authoritative categorizer so erev / fast / minor /
    // chol-hamoed days are never mistaken for major Yom Tov.
    const cat = categorizeHebcalEvent(item);
    if (cat === 'yomtov') { isYomTov = true; labels.push(he); }
    else if (cat === 'fast') { isFast = true; labels.push(he); }
    else if (cat === 'erev') { isErev = true; labels.push(he); }
    else if (cat === 'cholhamoed') { isCholHamoed = true; labels.push(he); }
    else if (cat === 'roshchodesh') { isRoshChodesh = true; labels.push('ראש חודש'); }
    else if (cat === 'minor') { isMinor = true; labels.push(he); }
    else if (he) { labels.push(he); }
  }
  return { labels, isYomTov, isFast, isRoshChodesh, isErev, isMinor, isCholHamoed, parasha };
}

export function isKiddushLevanahDay(date, startWindow, endWindow) {
  if (!startWindow || !endWindow) return false;
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  return dayEnd > startWindow && dayStart < endWindow;
}

export function getMonthlyOverview(days, eventsMap) {
  const roshChodesh = [];
  const holidays = [];
  const fasts = [];
  const seen = new Set();
  for (const day of days) {
    const items = eventsMap[dateKey(day.greg)] || [];
    for (const item of items) {
      const label = item.hebrew || item.title || '';
      const key = `${item.category}_${label}_${dateKey(day.greg)}`;
      if (seen.has(key)) continue;
      const category = categorizeHebcalEvent(item);
      if (category === 'roshchodesh') {
        seen.add(key);
        roshChodesh.push({ date: day.greg, label });
      } else if (category === 'yomtov') {
        seen.add(key);
        holidays.push({ date: day.greg, label });
      } else if (category === 'fast') {
        seen.add(key);
        fasts.push({ date: day.greg, label });
      }
    }
  }
  return { roshChodesh, holidays, fasts };
}

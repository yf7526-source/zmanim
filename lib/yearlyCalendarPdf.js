import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toHebrewDate, hebrewToGregorian } from './sunCalc';
import { fetchHebcalZmanimRange, normalizeTimes } from './hebcalApi';
import { calcCustomZman } from '../components/CustomZmanManager';
import { buildAllColumns, flattenColumns } from './monthlyZmanimConfig';
import { formatTimeInTz } from './timezone';
import { escapeHtml } from './html';
import { categorizeHebcalEvent } from './holidayDetection';

const GREG_MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const HE_MONTH_NAMES_HE = ['','ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשון','כסלו','טבת','שבט','אדר','אדר ב׳'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function hebrewDayLetter(n) {
  const ones = ['','א','ב','ג','ד','ה','ו','ז','ח','ט'];
  const tens = ['','י','כ','ל','מ','נ','ס','ע','פ','צ'];
  const mod = n % 100;
  if (mod === 15) return 'טו';
  if (mod === 16) return 'טז';
  return tens[Math.floor(mod / 10)] + ones[mod % 10];
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getHebrewMonthDays(year, month) {
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

function categorizeEvent(item) {
  const category = categorizeHebcalEvent(item);
  return category === 'yomtov' ? 'holiday' : category;
}

function getCellBg(d, events, colors) {
  const dow = d.getDay();
  const isShabbat = dow === 6;
  let hasHoliday = false, hasFast = false, hasRC = false, hasCholHamoed = false;
  for (const e of events) {
    const cat = categorizeEvent(e);
    if (cat === 'holiday') hasHoliday = true;
    else if (cat === 'fast') hasFast = true;
    else if (cat === 'roshchodesh') hasRC = true;
    else if (cat === 'cholhamoed') hasCholHamoed = true;
  }
  if (hasHoliday) return colors.holiday;
  if (hasCholHamoed) return colors.cholhamoed;
  if (isShabbat) return colors.shabbat;
  if (hasFast) return colors.fast;
  if (hasRC) return colors.roshchodesh;
  return colors.normal;
}

function getMonthsPerPage(zmanimCount, oneSheetPerMonth) {
  if (oneSheetPerMonth) return 1;
  if (zmanimCount === 0) return 12;
  if (zmanimCount <= 4) return 12;
  if (zmanimCount <= 8) return 6;
  if (zmanimCount <= 12) return 4;
  return 3;
}

function getGridLayout(monthsPerPage) {
  if (monthsPerPage === 12) return { cols: 4, rows: 3 };
  if (monthsPerPage === 6) return { cols: 3, rows: 2 };
  if (monthsPerPage === 4) return { cols: 2, rows: 2 };
  if (monthsPerPage === 2) return { cols: 2, rows: 1 };
  if (monthsPerPage === 1) return { cols: 1, rows: 1 };
  return { cols: 3, rows: 1 };
}

async function fetchYearlyZmanim(
  year, location, zmanimOpinions, customZmanim, elevation, onProgress,
  calMode, monthList, locationTz = null, horizonMode = 'none', signal = null
) {
  const zmanimMap = {};
  const days = [];

  if (calMode === 'heb') {
    for (const m of monthList) {
      const maxDay = getHebrewMonthDays(year, m);
      for (let d = 1; d <= maxDay; d++) {
        const greg = hebrewToGregorian(year, m, d);
        if (greg && !isNaN(greg.getTime())) days.push(greg);
      }
    }
  } else {
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        days.push(new Date(year, m, d));
      }
    }
  }

  days.sort((a, b) => a - b);
  const start = dateKey(days[0]);
  const end = dateKey(days[days.length - 1]);
  const hebcalElevation = horizonMode === 'geometric' ? (location?.elevation || 0) : 0;
  const localHorizonOffset = horizonMode === 'manual' ? elevation : 0;
  const { timesByDate } = await fetchHebcalZmanimRange(
    start, end, location.lat, location.lng, hebcalElevation, locationTz, signal
  );

  days.forEach((date, index) => {
    if (signal?.aborted) return;
    const key = dateKey(date);
    const normalized = normalizeTimes(timesByDate[key] || {}, zmanimOpinions, location, localHorizonOffset, key);
    if (customZmanim && customZmanim.length > 0 && normalized) {
      for (const cz of customZmanim) {
        const val = calcCustomZman(cz, normalized);
        if (val) normalized[`custom_${cz.id}`] = val;
      }
    }
    zmanimMap[key] = normalized;
    if (onProgress) onProgress(Math.round(((index + 1) / days.length) * 100));
  });

  return zmanimMap;
}

function buildMonthHtml(year, month, eventsMap, colors, zmanimMap, selectedZmanKeys, flatColumns, format, hour12, resolvedTz, calMode) {
  const isEarth = format === 'earth';
  const isCompact = format === 'compact';
  const textColor = isEarth ? '#3a2e1f' : '#111';
  const mutedColor = isEarth ? '#6b5a3e' : '#888';
  const borderColor = isEarth ? '#d4c9a8' : '#eee';

  const zmanimCount = selectedZmanKeys ? selectedZmanKeys.size : 0;
  const cellHeight = zmanimCount === 0 ? 32 : Math.max(36, 22 + zmanimCount * 9);
  const zmanFontSize = isCompact ? 6 : 7;

  let monthLabel, firstDay, dayList;
  if (calMode === 'heb') {
    monthLabel = HE_MONTH_NAMES_HE[month] || '';
    const maxDay = getHebrewMonthDays(year, month);
    dayList = [];
    for (let dd = 1; dd <= maxDay; dd++) {
      const greg = hebrewToGregorian(year, month, dd);
      if (greg && !isNaN(greg.getTime())) dayList.push(greg);
    }
    firstDay = dayList[0] || new Date();
  } else {
    monthLabel = GREG_MONTH_NAMES[month];
    firstDay = new Date(year, month, 1);
    dayList = null;
  }
  const startOffset = firstDay.getDay();
  const totalDays = dayList ? dayList.length : new Date(year, month + 1, 0).getDate();

  let html = `<div style="border:1px solid ${borderColor};border-radius:10px;padding:10px;background:#fff;">`;
  html += `<div style="text-align:center;font-size:18px;font-weight:900;margin-bottom:6px;color:${textColor};" dir="rtl">${monthLabel}</div>`;
  html += `<table style="border-collapse:collapse;width:100%;font-size:11px;">`;
  html += '<tr>';
  for (const d of DAY_NAMES) {
    html += `<th style="padding:2px;text-align:center;font-size:9px;color:${mutedColor};font-weight:700;">${d}</th>`;
  }
  html += '</tr>';

  let dayCounter = 0;
  for (let week = 0; week < 6; week++) {
    if (dayCounter >= totalDays) break;
    html += '<tr>';
    for (let dow = 0; dow < 7; dow++) {
      if ((week === 0 && dow < startOffset) || dayCounter >= totalDays) {
        html += `<td style="padding:2px;min-height:${cellHeight}px;">&nbsp;</td>`;
      } else {
        const d = dayList ? dayList[dayCounter] : new Date(year, month, dayCounter + 1);
        const key = dateKey(d);
        const events = eventsMap[key] || [];
        const hd = toHebrewDate(d);
        const bg = getCellBg(d, events, colors);
        const isShabbat = d.getDay() === 6;
        const mainEvents = events.filter(e => categorizeEvent(e) !== 'parasha');
        let eventLabels = mainEvents.slice(0, 2).map(e => {
          const label = e.hebrew || e.title || '';
          return `<div style="font-size:7px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.1;" dir="rtl">${escapeHtml(label)}</div>`;
        }).join('');
        if (mainEvents.length > 2) eventLabels += `<div style="font-size:6px;color:#999;">+${mainEvents.length - 2}</div>`;

        let zmanimHtml = '';
        if (zmanimCount > 0 && zmanimMap[key]) {
          const zmanim = zmanimMap[key];
          for (const zkey of selectedZmanKeys) {
            const t = zmanim[zkey];
            if (t && !isNaN(t?.getTime?.())) {
              const col = flatColumns.find(c => c.key === zkey);
              const label = col?.label || col?.groupHe || '';
              const time = formatTimeInTz(t, resolvedTz, hour12);
              zmanimHtml += `<div style="font-size:${zmanFontSize}px;color:${mutedColor};line-height:1.3;white-space:nowrap;" dir="rtl">${escapeHtml(label)}: ${escapeHtml(time)}</div>`;
            }
          }
        }

        const displayDay = calMode === 'heb' ? hebrewDayLetter(dayCounter + 1) : d.getDate();
        html += `<td style="padding:2px;text-align:center;background:${bg};border:1px solid ${borderColor};border-radius:4px;height:${cellHeight}px;vertical-align:top;">
          <div style="font-size:10px;font-weight:${isShabbat?'900':'700'};color:${textColor};" dir="rtl">${displayDay}</div>
          ${calMode !== 'heb' && hd ? `<div style="font-size:8px;color:${mutedColor};" dir="rtl">${hebrewDayLetter(hd.day)}</div>` : ''}
          ${eventLabels}
          ${zmanimHtml}
        </td>`;
        dayCounter++;
      }
    }
    html += '</tr>';
  }
  html += '</table></div>';
  return html;
}

export async function downloadYearlyCalendarPDF(
  year, eventsMap, colors, locationName, customEvents = [],
  { format = 'clean', selectedZmanKeys = null, location = null, locationTz = null, zmanimOpinions = {}, customZmanim = [], elevation = 0, horizonMode = 'none', hour12 = true, onProgress = null, calMode = 'heb', oneSheetPerMonth = false, signal = null } = {}
) {
  const mergedMap = { ...eventsMap };
  for (const ce of customEvents) {
    if (!mergedMap[ce.date]) mergedMap[ce.date] = [];
    mergedMap[ce.date] = [...mergedMap[ce.date], { ...ce, category: 'custom' }];
  }

  const allColumns = buildAllColumns(customZmanim);
  const flatColumns = flattenColumns(allColumns);

  let monthList, totalMonths, hebrewYearLabel, fetchYear;
  if (calMode === 'heb') {
    const jan1Hd = toHebrewDate(new Date(year, 0, 1));
    hebrewYearLabel = jan1Hd?.year || year;
    fetchYear = hebrewYearLabel;
    const isLeap = (7 * fetchYear + 1) % 19 < 7;
    const maxMonth = isLeap ? 13 : 12;
    monthList = [];
    for (let m = 1; m <= maxMonth; m++) monthList.push(m);
    totalMonths = monthList.length;
  } else {
    monthList = [0,1,2,3,4,5,6,7,8,9,10,11];
    totalMonths = 12;
    fetchYear = year;
  }

  let zmanimMap = {};
  const resolvedTz = locationTz || 'UTC';
  if (selectedZmanKeys && selectedZmanKeys.size > 0 && location) {
    zmanimMap = await fetchYearlyZmanim(
      fetchYear, location, zmanimOpinions, customZmanim, elevation, onProgress,
      calMode, monthList, locationTz, horizonMode, signal
    );
  }

  const zmanimCount = selectedZmanKeys ? selectedZmanKeys.size : 0;
  const monthsPerPage = getMonthsPerPage(zmanimCount, oneSheetPerMonth);
  const gridLayout = getGridLayout(monthsPerPage);
  const totalPages = Math.ceil(totalMonths / monthsPerPage);

  const isEarth = format === 'earth';
  const isCompact = format === 'compact';
  const bgColor = isEarth ? '#fffef0' : '#fff';
  const textColor = isEarth ? '#3a2e1f' : '#111';
  const mutedColor = isEarth ? '#6b5a3e' : '#555';
  const borderColor = isEarth ? '#d4c9a8' : '#d4d4d4';
  const brandColor = isEarth ? '#99a161' : '#1e40af';

  const containerWidth = gridLayout.cols === 4 ? 2400 : gridLayout.cols === 3 ? 2000 : gridLayout.cols === 2 ? 1600 : 1200;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = 297, pageH = 210, margin = 10;

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const startMonth = pageIdx * monthsPerPage;
    const endMonth = Math.min(startMonth + monthsPerPage, totalMonths);

    const container = document.createElement('div');
    container.style.cssText = `position:fixed;left:-99999px;top:0;width:${containerWidth}px;background:${bgColor};padding:36px;font-family:Arial,Helvetica,sans-serif;direction:rtl;`;

    let html = '';
    if (pageIdx === 0) {
      const titleText = calMode === 'heb' ? `${hebrewYearLabel} · ${year}` : `${year}`;
      html += `
        <div style="text-align:center;margin-bottom:18px;padding-bottom:12px;border-bottom:3px solid ${textColor};">
          <div style="font-size:42px;font-weight:900;color:${textColor};" dir="rtl">${titleText}</div>
          <div style="font-size:20px;color:${mutedColor};margin-top:4px;">${escapeHtml(locationName || '')}</div>
        </div>
      `;
    }

    html += `<div style="display:grid;grid-template-columns:repeat(${gridLayout.cols},1fr);gap:14px;">`;
    for (let mIdx = startMonth; mIdx < endMonth; mIdx++) {
      const m = monthList[mIdx];
      html += buildMonthHtml(fetchYear, m, mergedMap, colors, zmanimMap, selectedZmanKeys, flatColumns, format, hour12, resolvedTz, calMode);
    }
    html += '</div>';

    if (pageIdx === totalPages - 1) {
      html += `<div style="margin-top:16px;text-align:center;font-size:14px;color:${brandColor};font-weight:700;">solarzmanim.app</div>`;
    }

    container.innerHTML = html;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, { scale: 2, backgroundColor: bgColor });
      let imgW = pageW - 2 * margin;
      let imgH = (canvas.height / canvas.width) * imgW;
      if (imgH > pageH - 2 * margin) { imgH = pageH - 2 * margin; imgW = (canvas.width / canvas.height) * imgH; }
      if (pageIdx > 0) doc.addPage();
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', (pageW - imgW) / 2, margin, imgW, imgH);
    } finally {
      document.body.removeChild(container);
    }

    if (onProgress) {
      const baseProgress = selectedZmanKeys && selectedZmanKeys.size > 0 ? 100 : 0;
      const renderProgress = Math.round(baseProgress + ((pageIdx + 1) / totalPages) * (100 - baseProgress));
      onProgress(renderProgress);
    }
  }

  doc.save(`calendar-${year}.pdf`);
}

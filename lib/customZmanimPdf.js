import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toHebrewDate } from './sunCalc';
import { fetchHebcalZmanimRange, normalizeTimes } from './hebcalApi';
import { calcCustomZman } from '../components/CustomZmanManager';
import { formatTimeInTz } from './timezone';
import { escapeHtml, safeFileSegment } from './html';

const GREG_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAY_NAMES_HE = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function hebrewDayLetter(n) {
  const ones = ['','א','ב','ג','ד','ה','ו','ז','ח','ט'];
  const tens = ['','י','כ','ל','מ','נ','ס','ע','פ','צ'];
  const mod = n % 100;
  if (mod === 15) return 'טו';
  if (mod === 16) return 'טז';
  return tens[Math.floor(mod / 10)] + ones[mod % 10];
}

/**
 * Fetch a full year of zmanim data (batched) and compute custom zman times.
 * @param {number} year - Gregorian year
 * @param {object} location - { lat, lng, name }
 * @param {object} zmanimOpinions - opinions config
 * @param {array} customZmanim - custom zman definitions
 * @param {number} elevation - horizon offset in degrees
 * @param {function} onProgress - callback(percent)
 * @returns {object} map of dateKey -> { date, hebrew, customTimes: { customId: Date } }
 */
export async function fetchYearlyCustomZmanim(
  year, location, zmanimOpinions, customZmanim, elevation, onProgress,
  locationTz = null, horizonMode = 'none', signal = null
) {
  const result = {};
  const days = [];
  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, m, d));
    }
  }

  const start = dateKey(days[0]);
  const end = dateKey(days[days.length - 1]);
  const hebcalElevation = horizonMode === 'geometric' ? (location?.elevation || 0) : 0;
  const localHorizonOffset = horizonMode === 'manual' ? elevation : 0;
  const { timesByDate, tzid } = await fetchHebcalZmanimRange(
    start, end, location.lat, location.lng, hebcalElevation, locationTz, signal
  );

  days.forEach((date, index) => {
    if (signal?.aborted) return;
    const key = dateKey(date);
    const normalized = normalizeTimes(timesByDate[key] || {}, zmanimOpinions, location, localHorizonOffset, key);
    if (normalized && customZmanim.length > 0) {
      const customTimes = {};
      for (const cz of customZmanim) {
        const val = calcCustomZman(cz, normalized);
        if (val) customTimes[cz.id] = val;
      }
      result[key] = { date, hebrew: toHebrewDate(date), customTimes, tzid };
    }
    if (onProgress) onProgress(Math.round(((index + 1) / days.length) * 100));
  });

  return result;
}

/**
 * Generate a clean, printable PDF report of custom zmanim for a full year.
 * Renders as a multi-page table with one row per day.
 */
export async function downloadCustomZmanimYearPDF(
  year,
  location,
  locationTz,
  zmanimOpinions,
  customZmanim,
  elevation,
  hour12 = true,
  onProgress = null,
  horizonMode = 'none',
  signal = null
) {
  if (!customZmanim || customZmanim.length === 0) {
    throw new Error('No custom zmanim defined');
  }

  // Phase 1: Fetch all data
  const data = await fetchYearlyCustomZmanim(
    year, location, zmanimOpinions, customZmanim, elevation, onProgress,
    locationTz, horizonMode, signal
  );

  // Phase 2: Build HTML table
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = 297, pageH = 210, margin = 8;
  const colCount = customZmanim.length;
  const dayColWidth = 32; // mm for date column

  // Render in batches by month for multi-page
  for (let month = 0; month < 12; month++) {
    const monthDays = new Date(year, month + 1, 0).getDate();
    const monthRows = [];

    for (let day = 1; day <= monthDays; day++) {
      const date = new Date(year, month, day);
      const key = dateKey(date);
      const entry = data[key];
      const dow = date.getDay();
      const isShabbat = dow === 6;
      const hd = entry?.hebrew;
      const heDay = hd ? hebrewDayLetter(hd.day) : '';
      const heMonth = hd ? hd.monthName || '' : '';

      const cells = customZmanim.map(cz => {
        const t = entry?.customTimes?.[cz.id];
        if (!t || isNaN(t.getTime())) return '--:--';
        return formatTimeInTz(t, locationTz, hour12);
      });

      monthRows.push({ date, dow, isShabbat, heDay, heMonth, cells, dowName: DAY_NAMES[dow] });
    }

    // Build HTML for this month
    const container = document.createElement('div');
    container.style.cssText = `position:fixed;left:-99999px;top:0;width:2400px;background:#fff;padding:24px;font-family:Arial,Helvetica,sans-serif;`;

    let html = '';

    // Title (only on first page/month)
    if (month === 0) {
      html += `
        <div style="text-align:center;margin-bottom:16px;padding-bottom:10px;border-bottom:3px solid #1a1a2e;">
          <div style="font-size:36px;font-weight:900;color:#1a1a2e;">Custom Zmanim Report — ${year}</div>
          <div style="font-size:18px;color:#555;margin-top:4px;">${escapeHtml(location?.name || '')} · ${escapeHtml(location?.lat?.toFixed(3))}, ${escapeHtml(location?.lng?.toFixed(3))}</div>
        </div>
      `;
    }

    // Month header
    html += `<div style="font-size:24px;font-weight:800;color:#1a1a2e;margin-bottom:8px;border-bottom:2px solid #d4a84b;padding-bottom:4px;">${GREG_MONTHS[month]} ${year}</div>`;

    // Table
    html += `<table style="border-collapse:collapse;width:100%;font-size:13px;">`;

    // Header row
    html += '<tr>';
    html += '<th style="padding:6px 10px;text-align:left;border:1px solid #ddd;background:#f5f0e0;color:#333;font-size:12px;font-weight:800;">Date</th>';
    html += '<th style="padding:6px 6px;text-align:center;border:1px solid #ddd;background:#f5f0e0;color:#333;font-size:11px;font-weight:700;">Day</th>';
    html += '<th style="padding:6px 8px;text-align:center;border:1px solid #ddd;background:#f5f0e0;color:#333;font-size:12px;font-weight:700;" dir="rtl">עברי</th>';
    for (const cz of customZmanim) {
      html += `<th style="padding:6px 10px;text-align:center;border:1px solid #ddd;background:#f5f0e0;color:#333;font-size:12px;font-weight:800;">${escapeHtml(cz.posekName)}<br><span style="font-size:9px;font-weight:400;color:#888;">${escapeHtml(cz.zmanType)}</span></th>`;
    }
    html += '</tr>';

    // Data rows
    for (const row of monthRows) {
      const bg = row.isShabbat ? '#f8f4e8' : (row.dow === 5 ? '#fcfaf3' : '#fff');
      html += `<tr style="background:${bg};">`;
      html += `<td style="padding:5px 10px;border:1px solid #e8e8e8;font-size:12px;font-weight:700;color:#1a1a2e;">${row.date.getDate()} ${GREG_MONTHS[month].slice(0,3)}</td>`;
      html += `<td style="padding:5px 6px;text-align:center;border:1px solid #e8e8e8;font-size:11px;color:#666;">${row.dowName}</td>`;
      html += `<td style="padding:5px 8px;text-align:center;border:1px solid #e8e8e8;font-size:11px;color:#888;" dir="rtl">${row.heDay}</td>`;
      for (const time of row.cells) {
        html += `<td style="padding:5px 10px;text-align:center;border:1px solid #e8e8e8;font-size:12px;font-family:monospace;font-weight:600;color:#1a1a2e;">${escapeHtml(time)}</td>`;
      }
      html += '</tr>';
    }

    html += '</table>';

    // Footer
    if (month === 11) {
      html += `<div style="margin-top:12px;text-align:center;font-size:11px;color:#d4a84b;font-weight:600;">solarzmanim.app · Generated ${new Date().toLocaleDateString()}</div>`;
    }

    container.innerHTML = html;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#fff' });
      let imgW = pageW - 2 * margin;
      let imgH = (canvas.height / canvas.width) * imgW;
      if (imgH > pageH - 2 * margin) { imgH = pageH - 2 * margin; imgW = (canvas.width / canvas.height) * imgH; }
      if (month > 0) doc.addPage();
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', (pageW - imgW) / 2, margin, imgW, imgH);
    } finally {
      document.body.removeChild(container);
    }

    if (onProgress) {
      onProgress(100 + Math.round(((month + 1) / 12) * 100));
    }
  }

  doc.save(`custom-zmanim-${year}-${safeFileSegment(location?.name, 'report')}.pdf`);
}

// PDF builders for the Monthly Zmanim table, extracted from the sheet so the
// component stays lean. Logic is preserved; row backgrounds route through the
// shared holiday-color system (getDayCategory + pdfRowBg).

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getDayCategory, pdfRowBg } from './holidayColors';
import {
  hebrewDayLetter, getMonthlyOverview, getEventInfo, isErevShabbatOrYomTov,
  isKiddushLevanahDay, DAY_NAMES_HE, HE_MONTH_NAMES_HE, dateKey,
} from './monthlyZmanimHelpers';
import { getMoladWithChalakim } from './molad';
import { formatTimeInTz } from './timezone';
import { escapeHtml, safeFileSegment } from './html';

function catFor(row, eventsMap) {
  const isShabbat = row.greg.getDay() === 6;
  return getDayCategory(eventsMap[dateKey(row.greg)] || [], isShabbat);
}

export async function buildMonthlyPdf(opts) {
  const {
    rows, days, eventsMap, moladInfo, allColumns, visibleGrouped,
    visibleOpinionKeys, standardOpinionKeys,
    monthLabel, hebMonthLabel, location, hour12, resolvedTz,
    format, selectedKeys, stdKeysOverride, isRtl = true,
  } = opts;

  const dirMode = isRtl ? 'rtl' : 'ltr';
  const alignMode = isRtl ? 'right' : 'left';
  const filterKeys = selectedKeys || new Set(visibleOpinionKeys || []);
  const orderedCols = filterKeys
    ? allColumns.map(c => ({ ...c, sub: c.sub.filter(s => filterKeys.has(s.key)) })).filter(c => c.sub.length > 0)
    : visibleGrouped;
  const totalSubCols = orderedCols.reduce((s, c) => s + c.sub.length, 0);
  const isCompact = format === 'compact';
  const isEarth = format === 'earth';
  const compactLevel = isCompact ? 2 : totalSubCols > 26 ? 2 : totalSubCols > 20 ? 1 : 0;
  const colWidth = isCompact ? 60 : 82;
  const pageRatio = (297 - 2 * 25.4) / (210 - 2 * 25.4);
  const rowCount = rows.length || 30;
  const minContentHeight = 300 + rowCount * 72;
  const minContainerWidthForHeight = Math.round(minContentHeight * pageRatio);
  const containerWidth = Math.max(1600, 300 + totalSubCols * (colWidth + 16) + 120, minContainerWidthForHeight);
  const bgColor = isEarth ? '#fffef0' : '#fff';
  const textColor = isEarth ? '#3a2e1f' : '#000';
  const containerHeight = Math.round(containerWidth / pageRatio);
  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:-99999px;top:0;width:${containerWidth}px;height:${containerHeight}px;background:${bgColor};padding:32px;font-family:Arial,Helvetica,sans-serif;direction:${dirMode};text-align:${alignMode};color:${textColor};display:flex;flex-direction:column;`;

  let html = `
    <div style="display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:10px;margin-bottom:6px;">
      <div>
        <div style="font-size:26px;font-weight:900;color:${textColor};" dir="${dirMode}">זמנים חודשיים — Monthly Zmanim</div>
        <div style="font-size:16px;font-weight:800;color:${textColor};margin-top:2px;">${escapeHtml(monthLabel)} · ${escapeHtml(location?.name || '')}</div>
      </div>
      <div style="text-align:left;">
        ${hebMonthLabel ? `<div style="font-size:28px;font-weight:900;color:${textColor};" dir="rtl">${hebMonthLabel}</div>` : ''}
        <div style="font-size:14px;font-weight:800;color:${isEarth ? '#99a161' : '#1e40af'};margin-top:1px;">solarzmanim.app</div>
      </div>
    </div>
  `;

  const overview = getMonthlyOverview(days, eventsMap);
  const overviewItems = [];
  if (overview.roshChodesh.length > 0) {
    overviewItems.push(`<b>ראש חודש:</b> ${overview.roshChodesh.map(r => `${escapeHtml(r.label)} (${escapeHtml(r.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }))})`).join(', ')}`);
  }
  if (overview.holidays.length > 0) {
    overviewItems.push(`<b>חגים:</b> ${overview.holidays.map(h => `${escapeHtml(h.label)} (${escapeHtml(h.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }))})`).join(', ')}`);
  }
  if (overview.fasts.length > 0) {
    overviewItems.push(`<b>תעניות:</b> ${overview.fasts.map(f => `${escapeHtml(f.label)} (${escapeHtml(f.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }))})`).join(', ')}`);
  }
  if (overviewItems.length > 0) {
    html += `<div style="font-size:15px;color:#000;line-height:1.6;padding:6px 0 8px;border-bottom:1px solid #999;margin-bottom:5px;" dir="rtl">${overviewItems.join(' &nbsp;·&nbsp; ')}</div>`;
  }

  html += '<div style="flex:1;display:flex;flex-direction:column;">';
  html += `<table style="border-collapse:collapse;width:100%;height:100%;table-layout:fixed;font-size:18px;font-family:Arial,Helvetica,sans-serif;direction:${dirMode};border-top:3px solid #000;"><thead>`;
  html += '<tr style="border-bottom:1px solid #000;">';
  html += '<th rowspan="2" style="padding:8px 8px;text-align:center;font-size:18px;font-weight:900;color:#000;width:80px;vertical-align:middle;">יום<div style="font-size:13px;font-weight:800;color:#000;margin-top:1px;">Date</div></th>';
  html += '<th rowspan="2" style="padding:8px 8px;text-align:center;font-size:18px;font-weight:900;color:#000;width:150px;vertical-align:middle;">יום / אירועים<div style="font-size:13px;font-weight:800;color:#000;margin-top:1px;">Day / Events</div></th>';
  for (const col of orderedCols) {
    html += `<th colspan="${col.sub.length}" style="padding:8px 5px;text-align:center;font-size:18px;font-weight:900;color:#000;">${escapeHtml(col.groupHe)}<div style="font-size:13px;font-weight:800;color:#000;margin-top:1px;">${escapeHtml(col.group)}</div></th>`;
  }
  html += '</tr>';
  html += '<tr style="border-bottom:2px solid #000;">';
  for (const col of orderedCols) {
    col.sub.forEach((sub) => {
      const isStd = stdKeysOverride?.has(sub.key);
      html += `<th style="padding:6px 4px;text-align:center;font-size:16px;font-weight:${isStd ? '900' : '800'};color:#000;">${escapeHtml(sub.label || '—')}</th>`;
    });
  }
  html += '</tr></thead><tbody>';

  rows.forEach((row) => {
    const eventInfo = getEventInfo(row.greg, eventsMap);
    const isShabbat = row.greg.getDay() === 6;
    const cat = catFor(row, eventsMap);
    const isErev = isErevShabbatOrYomTov(row.greg);
    const isAfterShabbat = row.greg.getDay() === 6;
    const weekBorder = isAfterShabbat ? 'border-bottom:2px solid #000;' : '';
    const bg = pdfRowBg(cat, isShabbat, isEarth ? 'earth' : 'clean');

    html += `<tr style="background:${bg};">`;
    html += `<td style="padding:6px 6px;text-align:center;font-weight:900;color:#000;${weekBorder}">
      <div style="font-size:20px;" dir="rtl">${row.hebrew ? hebrewDayLetter(row.hebrew.day) : '—'}</div>
      <div style="font-size:14px;color:#000;">${row.greg.toLocaleDateString('en-US', { day: 'numeric' })}</div>
    </td>`;
    let dayHtml = `<div style="font-size:17px;color:#000;font-weight:${(isShabbat || eventInfo.isYomTov) ? '900' : '800'};" dir="rtl">${DAY_NAMES_HE[row.greg.getDay()]}</div>`;
    if (isShabbat && eventInfo.parasha) dayHtml += `<div style="font-size:14px;color:#000;font-weight:900;margin-top:2px;" dir="rtl">${escapeHtml(eventInfo.parasha)}</div>`;
    if (eventInfo.labels.length > 0) dayHtml += `<div style="font-size:12px;color:${eventInfo.isFast ? '#900' : '#000'};font-weight:700;margin-top:2px;" dir="rtl">${eventInfo.labels.map(escapeHtml).join(' · ')}</div>`;
    html += `<td style="padding:6px 6px;text-align:right;${weekBorder}">${dayHtml}</td>`;
    for (const col of orderedCols) {
      col.sub.forEach((sub) => {
        const t = row.zmanim?.[sub.key];
        const hideOnShabbat = (isShabbat || eventInfo.isYomTov) && sub.key === 'tzait_7_083';
        const showValue = hideOnShabbat ? false : (col.erevOnly ? isErevShabbatOrYomTov(row.greg) : (col.shabbatOnly ? row.greg.getDay() === 6 : true));
        const isStd = stdKeysOverride?.has(sub.key);
        let valHtml = '<span style="direction:ltr;display:inline-block;">—</span>';
        if (showValue && t && !isNaN(t?.getTime())) {
          const full = formatTimeInTz(t, resolvedTz, hour12);
          if (hour12) {
            const m = full.match(/^(.+?)\s*(AM|PM)$/i);
            if (m) {
              const numSize = compactLevel === 2 ? 18 : compactLevel === 1 ? 20 : 22;
              valHtml = `<span style="direction:ltr;display:inline-block;white-space:nowrap;font-size:${numSize}px;font-weight:800;line-height:1;">${m[1]}</span>`;
            } else { valHtml = `<span style="direction:ltr;display:inline-block;">${full}</span>`; }
          } else { valHtml = `<span style="direction:ltr;display:inline-block;">${full}</span>`; }
        }
        html += `<td style="padding:6px 4px;text-align:center;width:${colWidth}px;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#000;font-weight:${isStd ? '900' : '800'};${weekBorder}">${valHtml}</td>`;
      });
    }
    html += '</tr>';
  });

  html += '</tbody></table></div>';

  let footerMolad = '';
  if (moladInfo) {
    const mp = moladInfo.moladParts;
    footerMolad = `<span dir="rtl" style="font-size:17px;color:#000;font-weight:900;"><b>מולד ${HE_MONTH_NAMES_HE[moladInfo.month]}:</b> ${mp.dayNameHe}, ${mp.chalakim} חלקים + ${mp.timeStr}</span>`;
    let nextMonth = moladInfo.month + 1;
    let nextYear = moladInfo.year;
    const isLeap = (7 * nextYear + 1) % 19 < 7;
    const maxM = isLeap ? 13 : 12;
    if (nextMonth > maxM) { nextMonth = 1; nextYear++; }
    const nextParts = getMoladWithChalakim(nextYear, nextMonth, hour12);
    if (nextParts) {
      footerMolad += ` &nbsp;·&nbsp; <span dir="rtl" style="font-size:17px;color:#000;font-weight:900;"><b>מולד ${HE_MONTH_NAMES_HE[nextMonth]}:</b> ${nextParts.dayNameHe}, ${nextParts.chalakim} חלקים + ${nextParts.timeStr}</span>`;
    }
  }
  html += `
    <div style="margin-top:10px;padding-top:8px;border-top:2px solid #000;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:17px;color:#000;font-weight:900;">${footerMolad}</div>
        <div style="font-size:14px;font-weight:900;color:#1e40af;">solarzmanim.app</div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, {
      scale: 2, backgroundColor: bgColor, useCORS: true, windowWidth: containerWidth, width: containerWidth,
      onclone: (clonedDoc) => {
        const el = clonedDoc.body;
        if (el) { el.setAttribute('dir', dirMode); el.style.textAlign = alignMode; }
      },
    });
    const fileBase = safeFileSegment(`SolarZmanim-Monthly-${location?.name || 'location'}-${monthLabel}`, 'SolarZmanim-Monthly');
    return { canvas, fileName: `${fileBase}.pdf`, orientation: 'landscape' };
  } catch (e) {
    console.error('PDF preview generation failed:', e);
    return null;
  } finally {
    document.body.removeChild(container);
  }
}

export async function buildWeeklyPdf(opts) {
  const {
    rows, days, eventsMap, moladInfo, allColumns, visibleGrouped,
    visibleOpinionKeys, standardOpinionKeys,
    monthLabel, hebMonthLabel, location, hour12, resolvedTz,
    format, selectedKeys, stdKeysOverride, isRtl = true,
  } = opts;

  const dirMode = isRtl ? 'rtl' : 'ltr';
  const alignMode = isRtl ? 'right' : 'left';
  const filterKeys = selectedKeys || new Set(visibleOpinionKeys || []);
  const rawCols = filterKeys
    ? allColumns.map(c => ({ ...c, sub: c.sub.filter(s => filterKeys.has(s.key)) })).filter(c => c.sub.length > 0)
    : visibleGrouped;
  const orderedCols = rawCols.filter(c => c.group !== 'Motzei');
  const totalSubCols = orderedCols.reduce((s, c) => s + c.sub.length, 0);
  const isCompact = format === 'compact';
  const isClean = format === 'clean';
  const compactLevel = isCompact ? 2 : totalSubCols > 26 ? 2 : totalSubCols > 20 ? 1 : 0;
  const colWidth = isCompact ? 70 : 90;
  const containerWidth = Math.max(1200, 320 + totalSubCols * (colWidth + 20) + 120);
  const bgColor = isClean ? '#ffffff' : '#fffef0';
  const textColor = isClean ? '#000000' : '#3a2e1f';
  const headerBg = isClean ? '#e8edf3' : '#99a161';
  const headerText = isClean ? '#000000' : '#fffef0';
  const subHeaderBg = isClean ? '#f0f0f0' : '#f5edd6';
  const borderColor = isClean ? '#ccc' : '#d4c9a8';
  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:-99999px;top:0;width:${containerWidth}px;background:${bgColor};padding:40px 48px;font-family:Arial,Helvetica,sans-serif;direction:${dirMode};color:${textColor};`;

  const startStr = days[0]?.greg.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) || '';
  const endStr = days[days.length - 1]?.greg.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || '';

  let weekParsha = '';
  for (const day of days) {
    const info = getEventInfo(day.greg, eventsMap);
    if (info.parasha) { weekParsha = info.parasha; break; }
  }

  const subTextColor = isClean ? '#666666' : '#e8c894';
  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;background:${headerBg};padding:24px 36px;border-radius:16px;margin-bottom:20px;">
      <div>
        <div style="font-size:48px;font-weight:900;color:${headerText};" dir="rtl">זמני השבוע</div>
        <div style="font-size:28px;font-weight:700;color:${subTextColor};margin-top:4px;">Weekly Zmanim</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:30px;font-weight:800;color:${headerText};">${escapeHtml(location?.name || '')}</div>
        <div style="font-size:24px;font-weight:700;color:${subTextColor};margin-top:2px;">${startStr} – ${endStr}</div>
        ${weekParsha ? `<div style="font-size:30px;font-weight:900;color:${headerText};margin-top:4px;" dir="rtl">${escapeHtml(weekParsha)}</div>` : ''}
        ${hebMonthLabel ? `<div style="font-size:22px;font-weight:700;color:${subTextColor};margin-top:2px;" dir="rtl">${hebMonthLabel}</div>` : ''}
      </div>
    </div>
  `;

  html += `<table style="border-collapse:collapse;width:100%;table-layout:fixed;font-family:Arial,Helvetica,sans-serif;direction:${dirMode};"><thead>`;
  const mutedText = isClean ? '#888888' : '#6b5a3e';
  html += `<tr style="background:${isClean ? '#e8edf3' : '#e8c894'};">`;
  html += `<th rowspan="2" style="padding:14px 12px;text-align:center;font-size:28px;font-weight:900;color:${textColor};width:100px;vertical-align:middle;border:1px solid ${borderColor};">יום<div style="font-size:18px;font-weight:700;color:${mutedText};margin-top:2px;">Date</div></th>`;
  html += `<th rowspan="2" style="padding:14px 12px;text-align:center;font-size:28px;font-weight:900;color:${textColor};width:220px;vertical-align:middle;border:1px solid ${borderColor};">יום / אירועים<div style="font-size:18px;font-weight:700;color:${mutedText};margin-top:2px;">Day / Events</div></th>`;
  for (const col of orderedCols) {
    html += `<th colspan="${col.sub.length}" style="padding:14px 8px;text-align:center;font-size:26px;font-weight:900;color:${textColor};border:1px solid ${borderColor};">${escapeHtml(col.groupHe)}<div style="font-size:16px;font-weight:700;color:${mutedText};margin-top:2px;">${escapeHtml(col.group)}</div></th>`;
  }
  html += '</tr>';
  html += `<tr style="background:${subHeaderBg};">`;
  for (const col of orderedCols) {
    col.sub.forEach((sub) => {
      const isStd = stdKeysOverride?.has(sub.key);
      html += `<th style="padding:12px 6px;text-align:center;font-size:22px;font-weight:${isStd ? '900' : '700'};color:${isStd ? textColor : mutedText};border:1px solid ${borderColor};">${escapeHtml(sub.label || '—')}</th>`;
    });
  }
  html += '</tr></thead><tbody>';

  rows.forEach((row) => {
    const eventInfo = getEventInfo(row.greg, eventsMap);
    const isShabbat = row.greg.getDay() === 6;
    const cat = catFor(row, eventsMap);
    const bg = pdfRowBg(cat, isShabbat, isClean ? 'clean' : 'earth');

    html += `<tr style="background:${bg};">`;
    html += `<td style="padding:14px 12px;text-align:center;border:1px solid ${borderColor};font-weight:900;color:${textColor};">
      <div style="font-size:36px;" dir="rtl">${row.hebrew ? hebrewDayLetter(row.hebrew.day) : '—'}</div>
      <div style="font-size:24px;color:${mutedText};margin-top:2px;">${row.greg.toLocaleDateString('en-US', { day: 'numeric' })}</div>
    </td>`;
    let dayHtml = `<div style="font-size:28px;color:${textColor};font-weight:900;" dir="rtl">${DAY_NAMES_HE[row.greg.getDay()]}</div>`;
    if (isShabbat && eventInfo.parasha) dayHtml += `<div style="font-size:22px;color:${textColor};font-weight:800;margin-top:4px;" dir="rtl">${escapeHtml(eventInfo.parasha)}</div>`;
    if (eventInfo.labels.length > 0) dayHtml += `<div style="font-size:16px;color:${eventInfo.isFast ? (isClean ? '#c62828' : '#fffef0') : mutedText};font-weight:700;margin-top:4px;" dir="rtl">${eventInfo.labels.map(escapeHtml).join(' · ')}</div>`;
    html += `<td style="padding:14px 12px;text-align:right;border:1px solid ${borderColor};">${dayHtml}</td>`;
    for (const col of orderedCols) {
      col.sub.forEach((sub) => {
        const t = row.zmanim?.[sub.key];
        const hideOnShabbat = (isShabbat || eventInfo.isYomTov) && sub.key === 'tzait_7_083';
        const showValue = hideOnShabbat ? false : (col.erevOnly ? isErevShabbatOrYomTov(row.greg) : (col.shabbatOnly ? row.greg.getDay() === 6 : true));
        const isStd = stdKeysOverride?.has(sub.key);
        let valHtml = '<span style="direction:ltr;display:inline-block;">—</span>';
        if (showValue && t && !isNaN(t?.getTime())) {
          const full = formatTimeInTz(t, resolvedTz, hour12);
          if (hour12) {
            const m = full.match(/^(.+?)\s*(AM|PM)$/i);
            if (m) {
              const numSize = compactLevel === 2 ? 26 : compactLevel === 1 ? 30 : 34;
              valHtml = `<span style="direction:ltr;display:inline-block;white-space:nowrap;font-size:${numSize}px;color:#3a2e1f;font-weight:800;line-height:1;">${m[1]}</span>`;
            } else { valHtml = `<span style="direction:ltr;display:inline-block;font-size:30px;color:#3a2e1f;">${full}</span>`; }
          } else { valHtml = `<span style="direction:ltr;display:inline-block;font-size:30px;color:#3a2e1f;">${full}</span>`; }
        }
        html += `<td style="padding:14px 6px;text-align:center;width:${colWidth}px;border:1px solid ${borderColor};font-family:Arial,Helvetica,sans-serif;font-weight:${isStd ? '900' : '700'};">${valHtml}</td>`;
      });
    }
    html += '</tr>';
  });
  html += '</tbody></table>';

  const hasRoshChodeshNearby = (() => {
    const weekStart = days[0]?.greg;
    const weekEnd = days[days.length - 1]?.greg;
    if (!weekStart || !weekEnd) return false;
    const checkStart = new Date(weekStart); checkStart.setDate(checkStart.getDate() - 7);
    const checkEnd = new Date(weekEnd); checkEnd.setDate(checkEnd.getDate() + 7);
    for (let d = new Date(checkStart); d <= checkEnd; d.setDate(d.getDate() + 1)) {
      const items = eventsMap[dateKey(d)] || [];
      if (items.some(item => item.category === 'roshchodesh')) return true;
    }
    return false;
  })();
  let footerMolad = '';
  if (moladInfo && hasRoshChodeshNearby) {
    const mp = moladInfo.moladParts;
    footerMolad = `<span dir="rtl" style="font-size:24px;color:${textColor};font-weight:900;"><b>מולד ${HE_MONTH_NAMES_HE[moladInfo.month]}:</b> ${mp.dayNameHe}, ${mp.chalakim} חלקים + ${mp.timeStr}</span>`;
  }
  const footerBg = isClean ? '#f0f0f0' : '#f5edd6';
  const brandColor = isClean ? '#1e40af' : '#99a161';
  html += `
    <div style="margin-top:16px;padding:16px 24px;background:${footerBg};border-radius:12px;display:flex;justify-content:space-between;align-items:center;">
      <div>${footerMolad}</div>
      <div style="font-size:22px;font-weight:900;color:${brandColor};">solarzmanim.app</div>
    </div>
  `;

  container.innerHTML = html;
  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, {
      scale: 2, backgroundColor: bgColor, useCORS: true, windowWidth: containerWidth, width: containerWidth,
      onclone: (clonedDoc) => {
        const el = clonedDoc.body;
        if (el) { el.setAttribute('dir', dirMode); el.style.textAlign = alignMode; }
      },
    });
    const weekDate = days[0]?.greg?.toISOString?.().slice(0, 10) || '';
    const fileBase = safeFileSegment(`SolarZmanim-Weekly-${location?.name || 'location'}-${weekDate}`, 'SolarZmanim-Weekly');
    return { canvas, fileName: `${fileBase}.pdf`, orientation: 'landscape' };
  } catch (e) {
    console.error('Weekly PDF preview generation failed:', e);
    return null;
  } finally {
    document.body.removeChild(container);
  }
}

export function savePdfFromCanvas(canvas, fileName) {
  const margin = 25.4;
  const pageW = 297;
  const pageH = 210;
  const maxW = pageW - 2 * margin;
  const maxH = pageH - 2 * margin;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, maxW, maxH);
  doc.save(fileName);
}
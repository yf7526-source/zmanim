import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronDown, ChevronUp, Calendar, Download, Loader2, Plus } from 'lucide-react';
import { fetchHebcalZmanim, normalizeTimes, fetchHebcalEvents } from '../lib/hebcalApi';
import { toHebrewDate } from '../lib/sunCalc';
import { addDays, formatTimeInTz } from '../lib/timezone';
import { calcCustomZman } from './CustomZmanManager';
import { isErevShabbatOrYomTov, isShabbatOrYomTov } from '../lib/holidayDetection';
import PdfPreviewModal from './PdfPreviewModal';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { base44 } from '@/api/base44Client';
import { hebrewDayLetter } from '@/lib/monthlyZmanimHelpers';
import { isIsraelTimezone } from '@/lib/regionDefaults';

const DAY_NAMES_HE = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const DAY_NAMES_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Hebrew labels for zman types (used by custom zmanim rows)
const ZMAN_TYPE_HE = {
  alot: 'עלות השחר', misheyakir: 'משיכיר', netz: 'נץ החמה', shema: 'סוף זמן ק"ש',
  tefilla: 'סוף זמן תפילה', chatzot: 'חצות היום', minchaGedola: 'מנחה גדולה',
  minchaKetana: 'מנחה קטנה', plagHaMincha: 'פלג המנחה', beinHaShmashos: 'בין השמשות',
  candleLighting: 'הדלקת נרות', shkiah: 'שקיעת החמה', tzait: 'צאת כוכבים', chatzotNight: 'חצות הלילה',
};
const ZMAN_TYPE_EN = {
  alot: 'Alot HaShachar', misheyakir: 'Misheyakir', netz: 'Netz HaChamah', shema: 'Sof Zman Shema',
  tefilla: 'Sof Zman Tefilla', chatzot: 'Chatzot', minchaGedola: 'Mincha Gedola',
  minchaKetana: 'Mincha Ketana', plagHaMincha: 'Plag HaMincha', beinHaShmashos: 'Bein HaShmashos',
  candleLighting: 'Candle Lighting', shkiah: 'Shkiah', tzait: 'Tzait Kochavim', chatzotNight: 'Chatzot HaLayla',
};

// Base zmanim rows (without custom)
const BASE_ROWS = [
  { label: 'Alot HaShachar', labelHe: 'עלות השחר', cat: 'alot', primary: (st, op) => {
      const sel = op?.alot || '16.1';
      const map = { '16.1': st.alot_16_1, '18': st.alot_18, '19.8': st.alot_19_8, '72min': st.alot_72min, '90min': st.alot_90min, '96min': st.alot_96min, '120min': st.alot_120min };
      return map[sel] || st.alot_16_1;
    }, variants: (st) => [
      { posek: '16.1°', time: st.alot_16_1 },
      { posek: '72 min', time: st.alot_72min },
      { posek: '90 min', time: st.alot_90min },
    ]
  },
  { label: 'Misheyakir', labelHe: 'משיכיר', cat: 'misheyakir', primary: (st, op) => {
      const sel = op?.misheyakir || '11.5';
      const map = { '10.2': st.misheyakir_10_2, '11': st.misheyakir_11, '11.5': st.misheyakir_11_5, '60min': st.misheyakir_60min };
      return map[sel] || st.misheyakir_11_5;
    }, variants: (st) => [
      { posek: '10.2°', time: st.misheyakir_10_2 },
      { posek: '11.5°', time: st.misheyakir_11_5 },
    ]
  },
  { label: 'Netz HaChamah', labelHe: 'נץ החמה', cat: 'netz', primary: (st, op) => {
      const sel = op?.netz || 'sealevel';
      const map = { 'sealevel': st.netzSealevel || st.netz, 'elevation': st.netzElevation || st.netz, 'standard': st.netz };
      return map[sel] || st.netz;
    }, variants: (st) => [
      { posek: 'Sea level', time: st.netzSealevel || st.netz },
      { posek: 'Adjusted for elevation', time: st.netzElevation || st.netz },
    ]
  },
  { label: 'Sof Zman Shema', labelHe: 'סוף זמן ק"ש', cat: 'shema', showBoth: true, primary: (st, op) => {
      const sel = op?.shema || 'gra';
      const map = { gra: st.shema_gra, mga: st.shema_mga, bht: st.shema_bht };
      return map[sel] || st.shema_gra;
    }, secondary: (st, op) => {
      const sel = op?.shema || 'gra';
      return sel === 'gra' ? st.shema_mga : st.shema_gra;
    }, secondaryLabel: (op) => (op?.shema || 'gra') === 'gra' ? 'מג"א' : 'גר"א', variants: (st) => [
      { posek: 'מג"א', time: st.shema_mga },
      { posek: 'בעה"ת', time: st.shema_bht },
      { posek: 'גר"א', time: st.shema_gra },
    ]
  },
  { label: 'Sof Zman Tefilla', labelHe: 'סוף זמן תפילה', cat: 'tefilla', showBoth: true, primary: (st, op) => {
      const sel = op?.tefilla || 'gra';
      const map = { gra: st.tefilla_gra, mga: st.tefilla_mga, bht: st.tefilla_bht };
      return map[sel] || st.tefilla_gra;
    }, secondary: (st, op) => {
      const sel = op?.tefilla || 'gra';
      return sel === 'gra' ? st.tefilla_mga : st.tefilla_gra;
    }, secondaryLabel: (op) => (op?.tefilla || 'gra') === 'gra' ? 'מג"א' : 'גר"א', variants: (st) => [
      { posek: 'מג"א', time: st.tefilla_mga },
      { posek: 'בעה"ת', time: st.tefilla_bht },
      { posek: 'גר"א', time: st.tefilla_gra },
    ]
  },
  { label: 'Chatzot', labelHe: 'חצות היום', cat: 'chatzot', primary: (st) => st.chatzot, variants: (st) => [{ posek: 'solar noon', time: st.chatzot }] },
  { label: 'Mincha Gedola', labelHe: 'מנחה גדולה', cat: 'minchaGedola', primary: (st, op) => {
      const sel = op?.minchaGedola || 'gra';
      const map = { gra: st.minchaGedola_gra, mga: st.minchaGedola_mga, bht: st.minchaGedola_bht };
      return map[sel] || st.minchaGedola_gra;
    }, variants: (st) => [
      { posek: 'גר"א', time: st.minchaGedola_gra },
      { posek: 'מג"א', time: st.minchaGedola_mga },
    ]
  },
  { label: 'Mincha Ketana', labelHe: 'מנחה קטנה', cat: 'minchaKetana', primary: (st, op) => {
      const sel = op?.minchaKetana || 'gra';
      const map = { gra: st.minchaKetana_gra, mga: st.minchaKetana_mga, bht: st.minchaKetana_bht };
      return map[sel] || st.minchaKetana_gra;
    }, variants: (st) => [
      { posek: 'גר"א', time: st.minchaKetana_gra },
      { posek: 'מג"א', time: st.minchaKetana_mga },
    ]
  },
  { label: 'Plag HaMincha', labelHe: 'פלג המנחה', cat: 'plagHaMincha', primary: (st, op) => {
      const sel = op?.plagHaMincha || 'gra';
      const map = { gra: st.plagHaMincha_gra, mga: st.plagHaMincha_mga, bht: st.plagHaMincha_bht };
      return map[sel] || st.plagHaMincha_gra;
    }, variants: (st) => [
      { posek: 'גר"א', time: st.plagHaMincha_gra },
      { posek: 'מג"א', time: st.plagHaMincha_mga },
    ]
  },
  { label: 'Candle Lighting', labelHe: 'הדלקת נרות', cat: 'candleLighting', erevOnly: true, primary: (st, op) => {
      const sel = op?.candleLighting || '18';
      const map = { '18': st.candleLighting_18, '30': st.candleLighting_30, '40': st.candleLighting_40 };
      return map[sel] || st.candleLighting_18;
    }, variants: (st) => [
      { posek: '18 min', time: st.candleLighting_18 },
      { posek: '40 min', time: st.candleLighting_40 },
    ]
  },
  { label: 'Shkiah', labelHe: 'שקיעת החמה', cat: 'shkiah', primary: (st, op) => {
      const sel = op?.shkiah || 'sealevel';
      const map = { 'sealevel': st.shkiahSealevel || st.shkiah, 'elevation': st.shkiahElevation || st.shkiah, 'standard': st.shkiah };
      return map[sel] || st.shkiah;
    }, variants: (st) => [
      { posek: 'Sea level', time: st.shkiahSealevel || st.shkiah },
      { posek: 'Adjusted for elevation', time: st.shkiahElevation || st.shkiah },
    ]
  },
  { label: 'Tzait Kochavim', labelHe: 'צאת כוכבים', cat: 'tzait', primary: (st, op) => {
      const sel = op?.tzait || '8.5';
      const map = { '7.083': st.tzait_7_083, '8.5': st.tzait_8_5, '72min': st.rabbeinuTam_fixed };
      return map[sel] || st.tzait_8_5;
    }, variants: (st) => [
      { posek: '7.08°', time: st.tzait_7_083 },
      { posek: '8.5°', time: st.tzait_8_5 },
      { posek: 'ר"ת', time: st.rabbeinuTam_fixed },
    ]
  },
  { label: 'Shabbat Ends', labelHe: 'צאת שבת', cat: 'shabbatEnds', shabbatOnly: true, primary: (st, op) => {
      const sel = op?.shabbatEnds || '8.5';
      const map = { '7.083': st.tzait_7_083, '8.5': st.tzait_8_5, '16.1': st.tzait_16_1, '72min': st.rabbeinuTam_fixed };
      return map[sel] || st.tzait_8_5;
    }, variants: (st) => [
      { posek: '7.08°', time: st.tzait_7_083 },
      { posek: '8.5°', time: st.tzait_8_5 },
      { posek: '16.1°', time: st.tzait_16_1 },
      { posek: 'ר"ת 72 min', time: st.rabbeinuTam_fixed },
    ] },
  { label: 'Chatzot HaLayla', labelHe: 'חצות הלילה', cat: 'chatzotNight', primary: (st) => st.chatzotNight, variants: (st) => [{ posek: '6h night', time: st.chatzotNight }] },
];

function fmt(date, hour12, tz) {
  return formatTimeInTz(date, tz, hour12);
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

const T = {
  loading: { en: 'Loading zmanim...', he: 'טוען זמנים...' },
  noData: { en: 'No data', he: 'אין נתונים' },
  expandAll: { en: 'Expand All', he: 'הכל' },
  less: { en: 'Less', he: 'פחות' },
  exportCalendar: { en: 'Export to Calendar', he: 'ייצא ליומן' },
  downloadPdf: { en: 'Download PDF', he: 'הורד PDF' },
  exportSuccess: { en: 'Zmanim exported to Google Calendar!', he: 'הזמנים יוצאו ליומן Google!' },
  exportError: { en: 'Export failed. Make sure Google Calendar is connected.', he: 'שגיאה בייצוא. ודא שחיברת את Google Calendar.' },
  time: { en: 'Time', he: 'שעה' },
};

function tr(key, lang) {
  if (lang === 'he') return T[key].he;
  if (lang === 'en') return T[key].en;
  return `${T[key].en} · ${T[key].he}`;
}

export default function DayZmanimDetail({ open, onClose, date, location, elevation = 0, horizonMode = null, hour12 = true, lang = 'both', locationTz, zmanimOpinions, customZmanim, onAddEvent }) {
  const [loading, setLoading] = useState(false);
  const [sunTimes, setSunTimes] = useState(null);
  const [resolvedTz, setResolvedTz] = useState(locationTz || null);
  const [expandedAll, setExpandedAll] = useState(false);
  const [dayEvents, setDayEvents] = useState([]);
  const [isErev, setIsErev] = useState(false);
  const [isShabbatOrYT, setIsShabbatOrYT] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewPending, setPreviewPending] = useState(null);

  useEffect(() => {
    if (!open || !location || !date) return;
    const controller = new AbortController();
    const effectiveMode = horizonMode || (elevation ? 'manual' : 'none');
    const hebcalElevation = effectiveMode === 'geometric' ? (location?.elevation || 0) : 0;
    const localHorizonOffset = effectiveMode === 'manual' ? elevation : 0;
    const requestedDate = dateKey(date);
    setLoading(true); setSunTimes(null);
    fetchHebcalZmanim(requestedDate, location.lat, location.lng, hebcalElevation, locationTz, controller.signal)
      .then(({ times, tzid }) => {
        if (controller.signal.aborted) return;
        if (tzid) setResolvedTz(tzid);
        const normalized = normalizeTimes(times, zmanimOpinions, location, localHorizonOffset, requestedDate);
        if (customZmanim && customZmanim.length > 0 && normalized) {
          for (const cz of customZmanim) {
            const val = calcCustomZman(cz, normalized);
            if (val) normalized[`custom_${cz.id}`] = val;
          }
        }
        setSunTimes(normalized);
      })
      .catch(() => { if (!controller.signal.aborted) setSunTimes(null); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    const start = addDays(requestedDate, -1);
    const end = addDays(requestedDate, 1);
    const isIsrael = isIsraelTimezone(locationTz);
    fetchHebcalEvents(start, end, location.lat, location.lng, isIsrael, locationTz, controller.signal)
      .then(items => {
        if (controller.signal.aborted) return;
        setDayEvents(items.filter(e => e.date === requestedDate));
        setIsErev(isErevShabbatOrYomTov(date, items, locationTz));
        setIsShabbatOrYT(isShabbatOrYomTov(date, items, locationTz));
      })
      .catch(() => { if (!controller.signal.aborted) { setDayEvents([]); setIsErev(false); setIsShabbatOrYT(false); } });
    return () => controller.abort();
  }, [open, date, location, elevation, horizonMode, zmanimOpinions, customZmanim, locationTz]);

  const hd = date ? toHebrewDate(date) : null;

  // Build rows including custom zmanim
  const allRows = useMemo(() => {
    const filterFn = (r) => (!r.shabbatOnly || isShabbatOrYT) && (!r.erevOnly || isErev);
    if (!customZmanim || customZmanim.length === 0) return BASE_ROWS.filter(filterFn);
    const customRows = customZmanim.map(cz => ({
      label: ZMAN_TYPE_EN[cz.zmanType] || cz.zmanType,
      labelHe: ZMAN_TYPE_HE[cz.zmanType] || cz.zmanType,
      cat: cz.zmanType,
      isCustom: true,
      customId: cz.id,
      primary: (st) => st[`custom_${cz.id}`],
      variants: (st) => [{ posek: cz.posekName, time: st[`custom_${cz.id}`] }],
    }));
    return [...BASE_ROWS, ...customRows].filter(filterFn);
  }, [customZmanim, date, isErev, isShabbatOrYT]);

  const locale = lang === 'he' ? 'he-IL' : 'en-US';
  const dayName = lang === 'he' ? DAY_NAMES_HE[date?.getDay() || 0] : lang === 'en' ? DAY_NAMES_EN[date?.getDay() || 0] : DAY_NAMES_HE[date?.getDay() || 0];

  async function downloadPDF() {
    if (!sunTimes) return;
    setExporting(true);
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-99999px;top:0;width:800px;background:#fff;padding:40px;font-family:Arial,Helvetica,sans-serif;color:#000;';

    const dateStr = date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const heStr = hd ? `${hd.formatted || ''}` : '';

    let html = `
      <div style="text-align:center;padding-bottom:16px;border-bottom:3px solid #000;margin-bottom:20px;">
        <div style="font-size:28px;font-weight:900;color:#000;" dir="rtl">${dayName} — ${heStr}</div>
        <div style="font-size:18px;color:#333;margin-top:4px;">${dateStr}</div>
        <div style="font-size:14px;color:#666;margin-top:2px;">${location?.name || ''}</div>
      </div>
    `;

    if (dayEvents.length > 0) {
      html += `<div style="margin-bottom:16px;" dir="rtl">`;
      for (const e of dayEvents) {
        html += `<div style="font-size:16px;font-weight:700;color:#000;">${e.hebrew || e.title}</div>`;
      }
      html += `</div>`;
    }

    html += `<table style="border-collapse:collapse;width:100%;font-family:Arial,Helvetica,sans-serif;">`;
    html += `<thead><tr style="border-bottom:2px solid #000;">
      <th style="padding:10px;text-align:right;font-size:16px;font-weight:900;color:#000;" dir="rtl">${tr('time', lang)}</th>
      <th style="padding:10px;text-align:right;font-size:16px;font-weight:900;color:#000;" dir="rtl">זמן</th>
    </tr></thead><tbody>`;

    for (const row of allRows) {
      const primary = row.primary(sunTimes, zmanimOpinions);
      const secondary = row.showBoth ? row.secondary(sunTimes, zmanimOpinions) : null;
      const secondaryLabel = row.secondaryLabel ? row.secondaryLabel(zmanimOpinions) : 'מג"א';
      const labelCell = lang === 'en' ? row.label : row.labelHe;
      html += `<tr style="border-bottom:1px solid #ddd;">
        <td style="padding:10px;text-align:right;" dir="rtl">
          <div style="font-size:15px;font-weight:700;color:#000;">${labelCell}</div>
          ${row.isCustom ? '<div style="font-size:11px;color:#7c3aed;">★</div>' : ''}
        </td>
        <td style="padding:10px;text-align:right;">
          <div style="font-size:16px;font-weight:900;color:#000;">${fmt(primary, hour12, resolvedTz)}</div>
          ${secondary ? `<div style="font-size:13px;color:#444;font-weight:700;">${secondaryLabel}: ${fmt(secondary, hour12, resolvedTz)}</div>` : ''}
        </td>
      </tr>`;
      if (expandedAll && row.variants) {
        for (const v of row.variants(sunTimes)) {
          if (v.time && !isNaN(v.time?.getTime?.())) {
            html += `<tr style="background:#f8f8f8;">
              <td style="padding:6px 10px;text-align:right;font-size:12px;color:#666;" dir="rtl">${v.posek}</td>
              <td style="padding:6px 10px;text-align:right;font-size:13px;color:#444;">${fmt(v.time, hour12, resolvedTz)}</td>
            </tr>`;
          }
        }
      }
    }
    html += `</tbody></table>`;
    html += `<div style="margin-top:20px;text-align:center;font-size:12px;color:#1e40af;font-weight:700;">solarzmanim.app</div>`;

    container.innerHTML = html;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, { scale: 3, backgroundColor: '#ffffff' });
      setPreviewPending({ canvas, fileName: `zmanim-${dateKey(date)}.pdf` });
      setPreviewUrl(canvas.toDataURL('image/png'));
    } catch (e) {
      console.error('PDF preview failed:', e);
    } finally {
      document.body.removeChild(container);
      setExporting(false);
    }
  }

  function savePdfFromCanvas(canvas, fileName) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210, pageH = 297, margin = 10;
    const maxW = pageW - 2 * margin;
    let imgW = maxW;
    let imgH = (canvas.height / canvas.width) * imgW;
    if (imgH > pageH - 2 * margin) { imgH = pageH - 2 * margin; imgW = (canvas.width / canvas.height) * imgH; }
    const x = (pageW - imgW) / 2;
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, margin, imgW, imgH);
    doc.save(fileName);
  }

  function confirmDownload() {
    if (previewPending) savePdfFromCanvas(previewPending.canvas, previewPending.fileName);
    setPreviewUrl(null);
    setPreviewPending(null);
  }

  function cancelPreview() {
    setPreviewUrl(null);
    setPreviewPending(null);
  }

  async function exportToGoogleCalendar() {
    if (!sunTimes) return;
    try {
      const zmanim = allRows.map(row => ({
        label: `${row.labelHe} (${row.label})`,
        time: row.primary(sunTimes, zmanimOpinions)?.toISOString(),
      })).filter(z => z.time);
      await base44.functions.invoke('exportZmanimToCalendar', {
        zmanim,
        date: dateKey(date),
        locationName: location?.name || '',
      });
      alert(tr('exportSuccess', lang));
    } catch (e) {
      alert(tr('exportError', lang));
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-white flex flex-col max-h-[90vh] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-4 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0 border-b-2 border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900" dir="rtl">{hd ? `${dayName} · ${hebrewDayLetter(hd.day)} ${hd.formatted?.split(' ').slice(1).join(' ') || ''}` : dayName}</h2>
            <p className="text-xs text-gray-500 mt-0.5" dir={lang === 'he' ? 'rtl' : 'ltr'}>{date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p className="text-xs text-gray-400">{location?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {onAddEvent && (
              <button onClick={() => onAddEvent(date)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all" title={lang === 'he' ? 'הוסף אירוע' : 'Add Event'}>
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            )}
            <button onClick={downloadPDF} disabled={loading || !sunTimes || exporting} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all disabled:opacity-40" title={tr('downloadPdf', lang)}>
              {exporting ? <Loader2 className="w-4 h-4 text-gray-600 animate-spin" /> : <Download className="w-4 h-4 text-gray-600" />}
            </button>
            <button onClick={onClose} aria-label="Close day details" className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Day events */}
        {dayEvents.length > 0 && (
          <div className="px-6 py-2 shrink-0 border-b border-gray-100 bg-amber-50">
            {dayEvents.map((e, i) => (
              <div key={i} className="text-sm font-semibold text-amber-800" dir="rtl">{e.hebrew || e.title}</div>
            ))}
          </div>
        )}

        {/* Zmanim list */}
        <div className="overflow-auto flex-1 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              <p className="text-sm text-gray-400">{tr('loading', lang)}</p>
            </div>
          ) : !sunTimes ? (
            <div className="py-16 text-center text-gray-400 text-sm">{tr('noData', lang)}</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {allRows.map((row, idx) => {
                const primary = row.primary(sunTimes, zmanimOpinions);
                const secondary = row.showBoth ? row.secondary(sunTimes, zmanimOpinions) : null;
                const secondaryLabel = row.secondaryLabel ? row.secondaryLabel(zmanimOpinions) : 'מג"א';
                const labelText = lang === 'en' ? row.label : lang === 'he' ? row.labelHe : `${row.labelHe} · ${row.label}`;
                return (
                  <div key={idx} className="px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="text-sm font-bold text-gray-900" dir="rtl">{labelText}</div>
                        {row.isCustom && <span className="text-[9px] text-purple-500 font-bold">★</span>}
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-gray-900 tabular-nums">{fmt(primary, hour12, resolvedTz)}</div>
                        {secondary && (
                          <div className="text-xs text-gray-500 font-semibold" dir="rtl">{secondaryLabel}: {fmt(secondary, hour12, resolvedTz)}</div>
                        )}
                      </div>
                    </div>
                    {expandedAll && row.variants && (
                      <div className="mt-2 pl-4 space-y-1">
                        {row.variants(sunTimes).filter(v => v.time && !isNaN(v.time?.getTime?.())).map((v, vi) => (
                          <div key={vi} className="flex items-center justify-between text-xs text-gray-500">
                            <span dir="rtl">{v.posek}</span>
                            <span className="tabular-nums">{fmt(v.time, hour12, resolvedTz)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 shrink-0 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-2">
          <button
            onClick={() => setExpandedAll(s => !s)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-100 text-indigo-700 text-xs font-bold hover:bg-indigo-200 transition-all"
          >
            {expandedAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expandedAll ? tr('less', lang) : tr('expandAll', lang)}
          </button>
          <button
            onClick={exportToGoogleCalendar}
            disabled={loading || !sunTimes}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-40"
          >
            <Calendar className="w-3.5 h-3.5" />
            {tr('exportCalendar', lang)}
          </button>
        </div>
      </div>

      <PdfPreviewModal
        open={!!previewUrl || !!previewPending}
        imageUrl={previewUrl}
        onConfirm={confirmDownload}
        onCancel={cancelPreview}
        lang={lang}
        title={lang === 'he' ? 'תצוגה מקדימה — יומי' : 'Daily Preview'}
      />
    </div>
  );
}
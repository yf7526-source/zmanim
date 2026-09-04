import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Loader2, FileSpreadsheet, Rows3, Printer, Zap } from 'lucide-react';
import { fetchHebcalZmanimRange, fetchHebcalEvents, normalizeTimes } from '@/lib/hebcalApi';
import { toHebrewDate, hebrewToGregorian } from '@/lib/sunCalc';
import { getMoladWithChalakim } from '@/lib/molad';
import { formatTimeInTz, getBrowserTimezone } from '@/lib/timezone';
import { buildAllColumns, flattenColumns, homeKeysWithSecondary, columnLabelEn } from '@/lib/monthlyZmanimConfig';
import { getCalendarMonthSystem, setCalendarMonthSystem } from '@/lib/preferences';
import {
  MONTH_NAMES, HE_MONTH_NAMES, HE_MONTH_NAMES_HE, DAY_NAMES_HE,
  SYNODIC_MONTH, hebrewDayLetter, isErevShabbatOrYomTov, getHebrewMonthDays,
  dateKey, getEventInfo,
} from '@/lib/monthlyZmanimHelpers';
import { getHolidayColors, getDayCategory, hexToRgba } from '@/lib/holidayColors';
import { isIsraelTimezone } from '@/lib/regionDefaults';
import { filterHiddenEvents } from '@/lib/holidayDetection';
import { buildMonthlyPdf, buildWeeklyPdf, savePdfFromCanvas } from '@/lib/monthlyZmanimPdf';
// Export pipeline: buildMonthlyPdf/buildWeeklyPdf use html2canvas for capture and
// escapeHtml for safe cell content (see @/lib/monthlyZmanimPdf.js).
import { calcCustomZman } from './CustomZmanManager';
import PdfPreviewModal from './PdfPreviewModal';
import PdfDownloadOptionsModal from './PdfDownloadOptionsModal';
import { safeFileSegment } from '@/lib/html';
import useFocusTrap from '@/hooks/useFocusTrap';
import { useToast } from '@/components/ui/use-toast';

function fmt(date, hour12 = true, tz) {
  if (!date || isNaN(date?.getTime())) return '—';
  return formatTimeInTz(date, tz, hour12);
}

export default function MonthlyZmanimSheet({
  open, onClose, location, date, elevation = 0, horizonMode = 'none', hour12 = true, lang = 'both', locationTz,
  visibleOpinionKeys, standardOpinionKeys, customZmanim = [], zmanimOpinions = {},
  secondaryZmanimDisplay = {},
  onEditColumns,
}) {
  const { toast } = useToast();
  const [calMode, setCalMode] = useState(() => getCalendarMonthSystem());
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [rows, setRows] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [eventsMap, setEventsMap] = useState({});
  const [resolvedTz, setResolvedTz] = useState(locationTz || getBrowserTimezone());
  const [viewMode, setViewMode] = useState('monthly');
  const [weekRefDate, setWeekRefDate] = useState(date || new Date());
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewPending, setPreviewPending] = useState(null);
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  const [denseTable, setDenseTable] = useState(true);
  const [colors, setColors] = useState(() => getHolidayColors());
  const dialogRef = useFocusTrap(open, onClose);

  const [gregYear, setGregYear] = useState(date?.getFullYear() || new Date().getFullYear());
  const [gregMonth, setGregMonth] = useState(date?.getMonth() ?? new Date().getMonth());
  const _initialHd = date ? toHebrewDate(date) : null;
  const [hebYear, setHebYear] = useState(_initialHd?.year || 5786);
  const [hebMonth, setHebMonth] = useState(_initialHd?.month || 4);

  useEffect(() => {
    const onCalendarSystem = (e) => setCalMode(e.detail === 'greg' ? 'greg' : 'heb');
    window.addEventListener('calendarMonthSystemChanged', onCalendarSystem);
    return () => window.removeEventListener('calendarMonthSystemChanged', onCalendarSystem);
  }, []);

  useEffect(() => {
    const handler = (e) => setColors(e.detail);
    window.addEventListener('calendarColorsChanged', handler);
    return () => window.removeEventListener('calendarColorsChanged', handler);
  }, []);

  const allColumns = useMemo(() => buildAllColumns(customZmanim), [customZmanim]);
  const allFlatColumns = useMemo(() => flattenColumns(allColumns), [allColumns]);
  const effectiveVisibleKeys = useMemo(() => visibleOpinionKeys?.size ? visibleOpinionKeys : homeKeysWithSecondary(zmanimOpinions, secondaryZmanimDisplay), [visibleOpinionKeys, zmanimOpinions, secondaryZmanimDisplay]);

  const visibleFlatColumns = useMemo(() => allFlatColumns.filter(c => effectiveVisibleKeys.has(c.key)), [allFlatColumns, effectiveVisibleKeys]);

  const visibleGrouped = useMemo(() => allColumns
    .map(c => ({ ...c, sub: c.sub.filter(s => effectiveVisibleKeys.has(s.key)) }))
    .filter(c => c.sub.length > 0), [allColumns, effectiveVisibleKeys]);

  useEffect(() => {
    if (date) {
      setGregYear(date.getFullYear());
      setGregMonth(date.getMonth());
      setWeekRefDate(date);
      const hd = toHebrewDate(date);
      if (hd) { setHebYear(hd.year); setHebMonth(hd.month); }
    }
  }, [date]);

  useEffect(() => { if (locationTz) setResolvedTz(locationTz); }, [locationTz]);

  const days = useMemo(() => {
    if (viewMode === 'weekly') {
      const ref = weekRefDate || date || new Date();
      const sunday = new Date(ref);
      sunday.setDate(ref.getDate() - ref.getDay());
      sunday.setHours(0, 0, 0, 0);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        return { greg: d, hebrew: toHebrewDate(d) };
      });
    }
    if (calMode === 'greg') {
      const daysInMonth = new Date(gregYear, gregMonth + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(gregYear, gregMonth, i + 1);
        return { greg: d, hebrew: toHebrewDate(d) };
      });
    } else {
      const maxDay = getHebrewMonthDays(hebYear, hebMonth);
      return Array.from({ length: maxDay }, (_, i) => {
        const greg = hebrewToGregorian(hebYear, hebMonth, i + 1);
        return { greg, hebrew: toHebrewDate(greg) };
      }).filter(d => d.greg && !isNaN(d.greg.getTime()));
    }
  }, [viewMode, weekRefDate, date, calMode, gregYear, gregMonth, hebYear, hebMonth]);

  useEffect(() => {
    if (!open || !location || days.length === 0) return;
    const controller = new AbortController();
    setLoading(true); setLoadError(false); setRows([]);
    const hebcalElev = horizonMode === 'geometric' ? (location?.elevation || 0) : 0;
    const start = dateKey(days[0].greg);
    const end = dateKey(days[days.length - 1].greg);
    fetchHebcalZmanimRange(start, end, location.lat, location.lng, hebcalElev, resolvedTz, controller.signal)
      .then(({ timesByDate, tzid }) => {
        if (controller.signal.aborted) return;
        if (tzid) setResolvedTz(tzid);
        const results = days.map((day) => {
          const dateStr = dateKey(day.greg);
          const normalized = normalizeTimes(timesByDate[dateStr] || {}, zmanimOpinions, location, elevation, dateStr);
          if (customZmanim && customZmanim.length > 0 && normalized) {
            for (const cz of customZmanim) {
              const val = calcCustomZman(cz, normalized);
              if (val) normalized[`custom_${cz.id}`] = val;
            }
          }
          return { ...day, zmanim: normalized };
        });
        setRows(results);
      })
      .catch(() => { if (!controller.signal.aborted) { setLoadError(true); setRows([]); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); };
  }, [open, days, location, elevation, horizonMode, customZmanim, resolvedTz, zmanimOpinions, retryKey]);

  useEffect(() => {
    if (!open || !location || days.length === 0) return;
    const controller = new AbortController();
    const start = dateKey(days[0].greg);
    const end = dateKey(days[days.length - 1].greg);
    const isIsrael = isIsraelTimezone(resolvedTz);
    fetchHebcalEvents(start, end, location.lat, location.lng, isIsrael, resolvedTz, controller.signal)
      .then(items => {
        if (controller.signal.aborted) return;
        const visible = filterHiddenEvents(items);
        const map = {};
        for (const item of visible) {
          if (!item.date) continue;
          if (!map[item.date]) map[item.date] = [];
          map[item.date].push(item);
        }
        setEventsMap(map);
      })
      .catch(() => { if (!controller.signal.aborted) setEventsMap({}); });
    return () => { controller.abort(); };
  }, [open, days, location, resolvedTz]);

  const moladInfo = useMemo(() => {
    if (days.length === 0) return null;
    const monthCounts = {};
    for (const d of days) {
      if (d.hebrew) {
        const key = `${d.hebrew.year}-${d.hebrew.month}`;
        monthCounts[key] = (monthCounts[key] || 0) + 1;
      }
    }
    const top = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];
    if (!top) return null;
    const [year, month] = top[0].split('-').map(Number);
    const moladParts = getMoladWithChalakim(year, month, hour12);
    if (!moladParts) return null;
    const start3 = new Date(moladParts.molad.getTime() + 3 * 86400000);
    const start7 = new Date(moladParts.molad.getTime() + 7 * 86400000);
    const end = new Date(moladParts.molad.getTime() + (SYNODIC_MONTH / 2) * 86400000);
    return { moladParts, start3, start7, end, year, month };
  }, [days, hour12]);

  const monthLabel = viewMode === 'weekly'
    ? (days.length > 0
        ? `${days[0].greg.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[days.length - 1].greg.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : 'Week')
    : calMode === 'greg'
      ? `${MONTH_NAMES[gregMonth]} ${gregYear}`
      : `${HE_MONTH_NAMES[hebMonth]} ${hebYear}`;
  const hebMonthLabel = moladInfo
    ? `${HE_MONTH_NAMES_HE[moladInfo.month]} ${moladInfo.year}`
    : (calMode === 'heb' ? `${HE_MONTH_NAMES_HE[hebMonth]} ${hebYear}` : '');

  function navigateMonth(dir) {
    if (viewMode === 'weekly') {
      const ref = weekRefDate || date || new Date();
      const next = new Date(ref);
      next.setDate(ref.getDate() + dir * 7);
      setWeekRefDate(next);
      return;
    }
    if (calMode === 'greg') {
      let m = gregMonth + dir, y = gregYear;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      setGregMonth(m); setGregYear(y);
    } else {
      const isLeap = (7 * hebYear + 1) % 19 < 7;
      const maxM = isLeap ? 13 : 12;
      let m = hebMonth + dir, y = hebYear;
      if (m < 1) { m = maxM; y--; }
      if (m > maxM) { m = 1; y++; }
      setHebMonth(m); setHebYear(y);
    }
  }

  async function handleGenerate(format, selectedKeys, opts) {
    const stdKeys = opts?.standardKeys || standardOpinionKeys;
    const ctx = {
      rows, days, eventsMap, moladInfo, allColumns, visibleGrouped,
      visibleOpinionKeys, standardOpinionKeys: stdKeys,
      monthLabel, hebMonthLabel, location, hour12, resolvedTz,
      format, selectedKeys, stdKeysOverride: stdKeys,
      isRtl: lang !== 'en',
    };
    setPdfLoading(true);
    try {
      const result = viewMode === 'weekly' ? await buildWeeklyPdf(ctx) : await buildMonthlyPdf(ctx);
      if (result) {
        setPreviewPending(result);
        setPreviewUrl(result.canvas.toDataURL('image/png'));
      } else {
        toast({ title: lang === 'he' ? 'יצירת PDF נכשלה' : 'Could not create PDF', description: lang === 'he' ? 'נסה שוב או בחר פחות עמודות.' : 'Try again or select fewer columns.', variant: 'destructive' });
      }
    } catch (e) {
      console.error('PDF generation error:', e);
      toast({ title: lang === 'he' ? 'יצירת PDF נכשלה' : 'Could not create PDF', description: lang === 'he' ? 'נסה שוב או בחר פחות עמודות.' : 'Try again or select fewer columns.', variant: 'destructive' });
    } finally {
      setPdfLoading(false);
    }
  }

  function confirmDownload() {
    if (previewPending) savePdfFromCanvas(previewPending.canvas, previewPending.fileName);
    setPreviewUrl(null);
    setPreviewPending(null);
  }
  function cancelPreview() { setPreviewUrl(null); setPreviewPending(null); }

  async function handleQuickPdf() {
    const stdKeys = standardOpinionKeys;
    const quickKeys = effectiveVisibleKeys;
    const ctx = {
      rows, days, eventsMap, moladInfo, allColumns, visibleGrouped,
      visibleOpinionKeys, standardOpinionKeys: stdKeys,
      monthLabel, hebMonthLabel, location, hour12, resolvedTz,
      format: 'clean', selectedKeys: quickKeys, stdKeysOverride: stdKeys,
      isRtl: lang !== 'en',
    };
    setPdfLoading(true);
    try {
      const result = viewMode === 'weekly' ? await buildWeeklyPdf(ctx) : await buildMonthlyPdf(ctx);
      if (result) savePdfFromCanvas(result.canvas, result.fileName);
      else toast({ title: lang === 'he' ? 'יצירת PDF נכשלה' : 'Could not create PDF', variant: 'destructive' });
    } catch (e) {
      console.error('Quick PDF error:', e);
      toast({ title: lang === 'he' ? 'יצירת PDF נכשלה' : 'Could not create PDF', variant: 'destructive' });
    } finally {
      setPdfLoading(false);
    }
  }

  async function handlePrint() {
    const stdKeys = standardOpinionKeys;
    const printKeys = effectiveVisibleKeys;
    const ctx = {
      rows, days, eventsMap, moladInfo, allColumns, visibleGrouped,
      visibleOpinionKeys, standardOpinionKeys: stdKeys,
      monthLabel, hebMonthLabel, location, hour12, resolvedTz,
      format: 'clean', selectedKeys: printKeys, stdKeysOverride: stdKeys,
      isRtl: lang !== 'en',
    };
    setPrinting(true);
    try {
      const result = viewMode === 'weekly' ? await buildWeeklyPdf(ctx) : await buildMonthlyPdf(ctx);
      if (!result) { toast({ title: lang === 'he' ? 'הדפסה נכשלה' : 'Could not print', variant: 'destructive' }); return; }
      const w = window.open('', '_blank');
      if (!w) { toast({ title: lang === 'he' ? 'חלון ההדפסה נחסם' : 'Print window was blocked', description: lang === 'he' ? 'אפשר חלונות קופצים ונסה שוב.' : 'Allow pop-ups and try again.', variant: 'destructive' }); return; }
      const img = result.canvas.toDataURL('image/png');
      const printDir = lang !== 'en' ? 'rtl' : 'ltr';
      w.document.write(`<html dir="${printDir}"><head><title>${monthLabel}</title><style>@page{size:landscape;margin:8mm}html,body{margin:0;padding:0;background:#fff}img{width:100%;height:auto;display:block}</style></head><body><img src="${img}" onload="window.focus();setTimeout(function(){window.print();},120)"/></body></html>`);
      w.document.close();
    } catch (e) {
      console.error('Print error:', e);
      toast({ title: lang === 'he' ? 'הכנת הזמנים להדפסה נכשלה' : 'Could not prepare Monthly Zmanim for printing.', variant: 'destructive' });
    } finally {
      setPrinting(false);
    }
  }

  function exportCsv() {
    if (!rows.length) return;
    try {
      const headerFor = (c) => {
        const en = columnLabelEn(c);
        const he = c.label || c.key;
        if (lang === 'he') return he;
        if (lang === 'en') return en;
        return `${en} / ${he}`;
      };
      const eventHeader = lang === 'he' ? 'אירועים' : 'Events';
      const headers = ['Date', 'Hebrew Date', eventHeader, ...visibleFlatColumns.map(headerFor)];
      const esc = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const lines = [headers.map(esc).join(',')];
      for (const row of rows) {
        const greg = row.greg?.toISOString?.().slice(0, 10) || '';
        const heb = row.hebrew?.formatted || row.hebrew?.hebrew || '';
        const eventInfo = getEventInfo(row.greg, eventsMap);
        const eventStr = [eventInfo.parasha, ...eventInfo.labels].filter(Boolean).join(' · ');
        const cells = visibleFlatColumns.map(c => fmt(row.zmanim?.[c.key], hour12, resolvedTz));
        lines.push([greg, heb, eventStr, ...cells].map(esc).join(','));
      }
      const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const modeLabel = viewMode === 'weekly' ? 'Weekly' : 'Monthly';
      const baseName = safeFileSegment(`SolarZmanim-${modeLabel}-${location?.name || 'location'}-${monthLabel}`, 'SolarZmanim');
      a.download = `${baseName}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: lang === 'he' ? 'CSV הורד' : 'CSV downloaded' });
    } catch (e) {
      console.error('CSV export error:', e);
      toast({ title: lang === 'he' ? 'ייצוא CSV נכשל' : 'Could not export CSV', variant: 'destructive' });
    }
  }

  if (!open) return null;
  const isRtl = lang !== 'en';
  const isStd = (key) => standardOpinionKeys?.has(key);
  const tr = (en, he) => lang === 'he' ? he : lang === 'en' ? en : `${en} · ${he}`;
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="monthly-zmanim-title" className="w-full max-w-7xl rounded-t-3xl md:rounded-3xl bg-card border border-white/10 flex flex-col max-h-[95vh] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0 border-b border-white/10">
          <div className="min-w-0">
            <h2 id="monthly-zmanim-title" className="text-lg font-bold text-foreground truncate">
              {viewMode === 'weekly' ? tr('Weekly Zmanim', 'טבלת זמנים שבועית') : tr('Monthly Zmanim', 'טבלת זמנים חודשית')}
            </h2>
            <p className="text-[11px] text-foreground/40 truncate">{location?.name} · {monthLabel}</p>
          </div>
          {hebMonthLabel && <span className="text-xl font-bold text-primary/80 px-3 shrink-0" dir="rtl">{hebMonthLabel}</span>}
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all shrink-0">
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        {/* Controls */}
        <div className="px-5 py-3 shrink-0 space-y-2 border-b border-white/10">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => navigateMonth(-1)} aria-label={tr('Previous', 'הקודם')} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <PrevIcon className="w-5 h-5 text-foreground/70" />
            </button>
            <span className="text-base font-bold text-foreground tabular-nums text-center">{monthLabel}</span>
            <button onClick={() => navigateMonth(1)} aria-label={tr('Next', 'הבא')} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <NextIcon className="w-5 h-5 text-foreground/70" />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {viewMode === 'monthly' && (
            <div className="flex gap-1.5">
              <button onClick={() => setCalMode(setCalendarMonthSystem('heb'))} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${calMode === 'heb' ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-foreground/50'}`}>
                {tr('Hebrew', 'עברי')}
              </button>
              <button onClick={() => setCalMode(setCalendarMonthSystem('greg'))} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${calMode === 'greg' ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-foreground/50'}`}>
                {tr('Gregorian', 'לועזי')}
              </button>
            </div>
            )}
            <button onClick={() => onEditColumns?.()} className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-primary/20 border-primary/40 text-primary hover:bg-primary/30 transition-all">
              {tr('My Columns', 'העמודות שלי')}
            </button>
            <div className="flex gap-1.5 ml-auto">
              <button onClick={() => setViewMode('monthly')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${viewMode === 'monthly' ? 'bg-teal-500/20 border-teal-400/40 text-teal-200' : 'bg-white/5 border-white/10 text-foreground/50'}`}>
                {tr('Monthly', 'חודשי')}
              </button>
              <button onClick={() => setViewMode('weekly')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${viewMode === 'weekly' ? 'bg-teal-500/20 border-teal-400/40 text-teal-200' : 'bg-white/5 border-white/10 text-foreground/50'}`}>
                {tr('Weekly', 'שבועי')}
              </button>
            </div>
            <button onClick={() => setDenseTable(v => !v)} className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-white/5 border-white/10 text-foreground/60 hover:bg-white/10 transition-all" title={tr('Toggle density', 'צפיפות')}>
              <Rows3 className="w-3.5 h-3.5" />
              {denseTable ? tr('Comfortable', 'רווח') : tr('Compact', 'צפוף')}
            </button>
            {/* Export menu — PDF / CSV / Print all reachable on mobile */}
            <div className="relative">
              <button onClick={() => setShowExportMenu(v => !v)} disabled={loading || rows.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-blue-500/15 border-blue-400/30 text-blue-200 hover:bg-blue-500/25 transition-all disabled:opacity-40">
                <Download className="w-3.5 h-3.5" /> {tr('Export', 'ייצא')}
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className={`absolute z-50 mt-1 ${isRtl ? 'left-0' : 'right-0'} rounded-xl bg-card border border-white/15 shadow-2xl py-1 min-w-[160px] max-w-[calc(100vw-2.5rem)]`}>
                    <button onClick={() => { setShowExportMenu(false); handleQuickPdf(); }} disabled={pdfLoading || rows.length === 0} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-foreground/80 hover:bg-white/10 transition-all disabled:opacity-40">
                      <Zap className="w-3.5 h-3.5 text-amber-300" /> {tr('Quick PDF', 'PDF מהיר')}
                    </button>
                    <button onClick={() => { setShowExportMenu(false); setShowPdfOptions(true); }} disabled={pdfLoading} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-foreground/80 hover:bg-white/10 transition-all disabled:opacity-40">
                      <Download className="w-3.5 h-3.5 text-blue-300" /> {tr('PDF Studio', 'סטודיו PDF')}
                    </button>
                    <button onClick={() => { setShowExportMenu(false); exportCsv(); }} disabled={loading || rows.length === 0} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-foreground/80 hover:bg-white/10 transition-all disabled:opacity-40">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" /> {tr('Excel / CSV', 'Excel / CSV')}
                    </button>
                    <button onClick={() => { setShowExportMenu(false); handlePrint(); }} disabled={printing || rows.length === 0} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-foreground/80 hover:bg-white/10 transition-all disabled:opacity-40">
                      <Printer className={`w-3.5 h-3.5 text-foreground/60 ${printing ? 'animate-spin' : ''}`} /> {tr('Print', 'הדפס')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-foreground/50">{tr('Loading Monthly Zmanim…', 'טוען זמנים חודשיים…')}</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <p className="text-sm font-bold text-red-300">{tr('Could not load Monthly Zmanim.', 'טעינת זמנים חודשיים נכשלה.')}</p>
              <div className="flex gap-2">
                <button onClick={() => setRetryKey(k => k + 1)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all">
                  {tr('Retry', 'נסה שוב')}
                </button>
                <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-foreground/70 font-bold text-sm hover:bg-white/15 transition-all">
                  {tr('Close', 'סגור')}
                </button>
              </div>
            </div>
          ) : visibleFlatColumns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <p className="text-sm font-bold text-foreground/70">{tr('No zmanim columns selected.', 'לא נבחרו עמודות זמנים.')}</p>
              <button onClick={() => onEditColumns?.()} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all">
                {tr('Choose columns', 'בחר עמודות')}
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-20 text-center text-foreground/40 text-sm">{tr('No data', 'אין נתונים')}</div>
          ) : (
            <table className={`text-xs whitespace-nowrap border-collapse w-full ${denseTable ? '[&_td]:!py-1 [&_th]:!py-1' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
              <thead className="sticky top-0 z-10">
                <tr className="bg-white/5">
                  <th rowSpan={2} className={`sticky ${isRtl ? 'right-0' : 'left-0'} z-30 bg-white/5 px-2 py-2 text-center text-foreground/70 font-bold w-14 border-b-2 border-white/15`}>
                    <div className="font-bold text-[11px]" dir="rtl">יום</div>
                    <div className="text-foreground/30 text-[9px]">Date</div>
                  </th>
                  <th rowSpan={2} className={`sticky ${isRtl ? 'right-14' : 'left-14'} z-30 bg-white/5 px-2 py-2 text-center text-foreground/70 font-bold w-24 border-b-2 border-white/15`}>
                    <div className="font-bold text-[11px]" dir="rtl">יום / אירועים</div>
                    <div className="text-foreground/30 text-[9px]">Day / Events</div>
                  </th>
                  {visibleGrouped.map(col => (
                    <th key={col.group} colSpan={col.sub.length} className="px-1 py-1 text-center">
                      <div className="text-foreground/80 font-bold text-[11px]" dir="rtl">{col.groupHe}</div>
                      <div className="text-foreground/30 text-[9px]">{col.group}</div>
                    </th>
                  ))}
                </tr>
                <tr className="border-b-2 border-white/15 bg-white/5">
                  {visibleGrouped.map(col => col.sub.map(sub => (
                    <th key={sub.key} className="bg-white/5 px-1 py-1 text-center text-[9px] min-w-[48px]">
                      <span className={isStd(sub.key) ? 'text-foreground font-bold' : 'text-foreground/50 font-medium'}>{sub.label || '—'}</span>
                      {sub.isCustom && <span className="text-[7px] text-purple-400 block">★</span>}
                    </th>
                  )))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const eventInfo = getEventInfo(row.greg, eventsMap);
                  const isShabbat = row.greg.getDay() === 6;
                  const cat = getDayCategory(eventsMap[dateKey(row.greg)] || [], isShabbat);
                  const accent = colors[cat] || colors.plain;
                  const isHighlight = isShabbat || eventInfo.isYomTov;
                  const rowBg = cat === 'plain' ? 'transparent' : hexToRgba(accent, 0.07);
                  const cols = visibleFlatColumns;
                  return (
                    <tr key={i} className={`${isShabbat ? 'border-b-2 border-white/15' : ''}`} style={{ backgroundColor: rowBg }}>
                      <td className={`sticky ${isRtl ? 'right-0' : 'left-0'} z-20 px-2 py-1.5 text-center`} style={isRtl ? { borderRight: `3px solid ${accent}` } : { borderLeft: `3px solid ${accent}` }}>
                        <div className="flex items-center gap-1 justify-center">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat === 'normal' ? 'transparent' : accent }} />
                          <span dir="rtl" className="text-[11px] font-bold text-foreground/80">{row.hebrew ? hebrewDayLetter(row.hebrew.day) : '—'}</span>
                        </div>
                        <div className="text-foreground/40 text-[9px]">{row.greg.toLocaleDateString('en-US', { day: 'numeric' })}</div>
                      </td>
                      <td className={`sticky ${isRtl ? 'right-14' : 'left-14'} z-20 px-2 py-1.5 ${isRtl ? 'text-right' : 'text-left'} ${isHighlight ? 'font-bold' : ''}`} style={{ backgroundColor: isHighlight ? hexToRgba(accent, 0.10) : 'transparent' }}>
                        <span className="text-[10px] text-foreground/70" dir="rtl">{DAY_NAMES_HE[row.greg.getDay()]}</span>
                        {isShabbat && eventInfo.parasha && <div className="text-[9px] text-primary/70 mt-0.5 truncate max-w-[110px]" dir="rtl" title={eventInfo.parasha}>[{eventInfo.parasha}]</div>}
                        {eventInfo.labels.length > 0 && (
                          <div className="text-[9px] mt-0.5 truncate max-w-[110px]" dir="rtl" style={{ color: eventInfo.isFast ? colors.fast : accent }} title={eventInfo.labels.join(' · ')}>{eventInfo.labels.join(' · ')}</div>
                        )}
                      </td>
                      {cols.map(col => {
                        const t = row.zmanim?.[col.key];
                        const hideOnShabbat = (isShabbat || eventInfo.isYomTov) && col.key === 'tzait_7_083';
                        const showValue = hideOnShabbat ? false : (col.erevOnly ? isErevShabbatOrYomTov(row.greg) : (col.shabbatOnly ? row.greg.getDay() === 6 : true));
                        const std = isStd(col.key);
                        return (
                          <td key={col.key} className={`px-1.5 py-1.5 text-center font-mono tabular-nums min-w-[48px] ${std ? 'font-bold text-foreground' : 'text-foreground/55'}`}>
                            {showValue ? fmt(t, hour12, resolvedTz) : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <PdfPreviewModal
        open={!!previewUrl || !!previewPending}
        imageUrl={previewUrl}
        onConfirm={confirmDownload}
        onCancel={cancelPreview}
        lang={lang}
        title={viewMode === 'weekly' ? tr('Weekly Preview', 'תצוגה מקדימה — שבועי') : tr('Monthly Preview', 'תצוגה מקדימה — חודשי')}
      />

      <PdfDownloadOptionsModal
        open={showPdfOptions}
        onClose={() => setShowPdfOptions(false)}
        onConfirm={(fmt, keys, opts) => { setShowPdfOptions(false); handleGenerate(fmt, keys, opts); }}
        allColumns={allColumns}
        defaultSelectedKeys={effectiveVisibleKeys}
        defaultStandardKeys={standardOpinionKeys}
        lang={lang}
        rowCount={rows.length || days.length}
      />
    </div>
  );
}
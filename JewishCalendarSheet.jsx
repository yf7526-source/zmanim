import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalIcon, Loader2, Settings as SettingsIcon, Home as HomeIcon } from 'lucide-react';
import { fetchHebcalEvents } from '@/lib/hebcalApi';
import { toHebrewDate, hebrewToGregorian } from '@/lib/sunCalc';
import { categorizeHebcalEvent, filterHiddenEvents } from '@/lib/holidayDetection';
import { getHolidayColors, getDayCategory } from '@/lib/holidayColors';
import {
  HE_MONTH_NAMES_HE, getHebrewMonthDays, navigateHebrewMonth, dateKey,
} from '@/lib/monthlyZmanimHelpers';
import { isIsraelTimezone } from '@/lib/regionDefaults';
import { getCalendarMonthSystem, setCalendarMonthSystem } from '@/lib/preferences';
import { matchesRecurrence } from '@/lib/customEvents';
import { addDays } from '@/lib/timezone';
import DayZmanimDetail from './DayZmanimDetail';
import CustomEventEditor from './CustomEventEditor';
import CalendarSettingsPanel from './CalendarSettingsPanel';
import CalendarDayCell from './calendar/CalendarDayCell';
import CalendarLegend from './calendar/CalendarLegend';
import useFocusTrap from '@/hooks/useFocusTrap';

const GREG_MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const GREG_MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const DAY_HEADERS_HE = ['א','ב','ג','ד','ה','ו','ש'];
const DAY_HEADERS_EN = ['S','M','T','W','T','F','S'];

// Event descriptions now live in @/lib/eventDescriptions (getEventDescription).

const CAT_TIER_MAP = {
  yomtov: 'major', cholhamoed: 'minor', roshchodesh: 'minor', minor: 'minor',
  fast: 'fast', erev: 'plain', plain: 'plain', omer: 'plain',
};

function withEventColor(events, colors) {
  return events.map(e => {
    if (e.category === 'custom') return { ...e, _color: e.color || colors.custom };
    const cat = categorizeHebcalEvent(e);
    const tier = CAT_TIER_MAP[cat] || 'plain';
    return { ...e, _color: colors[tier] || colors.plain };
  });
}

export default function JewishCalendarSheet({ open, onClose, location, date, elevation = 0, horizonMode = 'none', hour12 = true, lang = 'both', locationTz, zmanimOpinions, customZmanim }) {
  const [calMode, setCalMode] = useState(() => getCalendarMonthSystem());
  const [loading, setLoading] = useState(false);
  const [eventsMap, setEventsMap] = useState({});
  const [holidayDataStatus, setHolidayDataStatus] = useState('idle');
  const [selectedDay, setSelectedDay] = useState(null);
  const [customEvents, setCustomEvents] = useState(() => {
    try { const s = localStorage.getItem('customEvents'); if (s) return JSON.parse(s); } catch {}
    return [];
  });
  const [eventEditor, setEventEditor] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [calendarColors, setCalendarColors] = useState(() => getHolidayColors());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const [gregYear, setGregYear] = useState(date?.getFullYear() || new Date().getFullYear());
  const [gregMonth, setGregMonth] = useState(date?.getMonth() ?? new Date().getMonth());
  const _initHd = date ? toHebrewDate(date) : null;
  const [hebYear, setHebYear] = useState(_initHd?.year || 5786);
  const [hebMonth, setHebMonth] = useState(_initHd?.month || 4);

  const touchStartX = useRef(null);
  const dialogRef = useFocusTrap(open, onClose);

  useEffect(() => {
    const onCalendarSystem = (e) => setCalMode(e.detail === 'greg' ? 'greg' : 'heb');
    window.addEventListener('calendarMonthSystemChanged', onCalendarSystem);
    return () => window.removeEventListener('calendarMonthSystemChanged', onCalendarSystem);
  }, []);

  useEffect(() => {
    const handler = (e) => setCalendarColors(e.detail);
    window.addEventListener('calendarColorsChanged', handler);
    return () => window.removeEventListener('calendarColorsChanged', handler);
  }, []);

  useEffect(() => {
    try { localStorage.setItem('customEvents', JSON.stringify(customEvents)); } catch {}
  }, [customEvents]);

  useEffect(() => {
    if (date && open) {
      setGregYear(date.getFullYear());
      setGregMonth(date.getMonth());
      const hd = toHebrewDate(date);
      if (hd) { setHebYear(hd.year); setHebMonth(hd.month); }
    }
  }, [date, open]);

  const { gridDays, monthLabel, hebMonthLabel } = useMemo(() => {
    if (calMode === 'greg') {
      const firstDay = new Date(gregYear, gregMonth, 1);
      const startOffset = firstDay.getDay();
      const daysInMonth = new Date(gregYear, gregMonth + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < startOffset; i++) cells.push(null);
      for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(gregYear, gregMonth, d));
      while (cells.length % 7 !== 0) cells.push(null);
      while (cells.length < 42) cells.push(null);
      const gLabel = lang === 'he' ? GREG_MONTHS_HE[gregMonth] : lang === 'en' ? GREG_MONTHS_EN[gregMonth] : `${GREG_MONTHS_EN[gregMonth]} · ${GREG_MONTHS_HE[gregMonth]}`;
      return { gridDays: cells, monthLabel: `${gLabel} ${gregYear}`, hebMonthLabel: '' };
    } else {
      const maxDay = getHebrewMonthDays(hebYear, hebMonth);
      const cells = [];
      for (let d = 1; d <= maxDay; d++) {
        const greg = hebrewToGregorian(hebYear, hebMonth, d);
        if (greg && !isNaN(greg.getTime())) cells.push(greg);
      }
      const offset = cells[0] ? cells[0].getDay() : 0;
      const padded = [];
      for (let i = 0; i < offset; i++) padded.push(null);
      padded.push(...cells);
      while (padded.length % 7 !== 0) padded.push(null);
      while (padded.length < 42) padded.push(null);
      const hLabel = `${HE_MONTH_NAMES_HE[hebMonth]} ${hebYear}`;
      return { gridDays: padded, monthLabel: hLabel, hebMonthLabel: hLabel };
    }
  }, [calMode, gregYear, gregMonth, hebYear, hebMonth, lang]);

  // Memoize Hebrew-date conversion per visible cell so the 42-cell grid doesn't
  // re-run toHebrewDate on every render.
  const hebrewDateCache = useMemo(() => {
    const map = {};
    for (const d of gridDays) {
      if (!d) continue;
      map[dateKey(d)] = toHebrewDate(d);
    }
    return map;
  }, [gridDays]);

  useEffect(() => {
    if (!open || !location || gridDays.length === 0) return;
    const realDays = gridDays.filter(Boolean);
    if (realDays.length === 0) return;
    const start = addDays(dateKey(realDays[0]), -2);
    const end = addDays(dateKey(realDays[realDays.length - 1]), 2);
    const isIsrael = isIsraelTimezone(locationTz);
    const controller = new AbortController();
    setLoading(true);
    setHolidayDataStatus('loading');
    fetchHebcalEvents(start, end, location.lat, location.lng, isIsrael, locationTz, controller.signal)
      .then(items => {
        if (controller.signal.aborted) return;
        const map = {};
        for (const item of items) {
          if (!item.date) continue;
          if (!map[item.date]) map[item.date] = [];
          map[item.date].push(item);
        }
        setEventsMap(map);
        setHolidayDataStatus('live');
      })
      .catch(() => { if (!controller.signal.aborted) setHolidayDataStatus('unavailable'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, gridDays, location, locationTz]);

  function navigateMonth(dir) {
    if (calMode === 'greg') {
      let m = gregMonth + dir, y = gregYear;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      setGregMonth(m); setGregYear(y);
    } else {
      const { year, month } = navigateHebrewMonth(hebYear, hebMonth, dir);
      setHebYear(year); setHebMonth(month);
    }
  }

  function jumpToToday() {
    const now = new Date();
    setGregYear(now.getFullYear());
    setGregMonth(now.getMonth());
    const hd = toHebrewDate(now);
    if (hd) { setHebYear(hd.year); setHebMonth(hd.month); }
  }

  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 60) navigateMonth(delta < 0 ? 1 : -1);
    touchStartX.current = null;
  }

  function getDayEvents(d) {
    const hebcal = filterHiddenEvents(eventsMap[dateKey(d)] || []);
    const customs = customEvents.filter(ce => matchesRecurrence(ce, d)).map(ce => ({ ...ce, category: 'custom', hebrew: ce.title, title: ce.title }));
    return withEventColor([...hebcal, ...customs], calendarColors);
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (!open) return null;

  const headers = calMode === 'heb' ? DAY_HEADERS_HE : DAY_HEADERS_EN;
  const gridDir = calMode === 'heb' ? 'rtl' : 'ltr';
  const tr = (en, he) => lang === 'he' ? he : lang === 'en' ? en : `${en} · ${he}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="calendar-title" dir={lang === 'he' ? 'rtl' : 'ltr'} className="w-full max-w-4xl rounded-t-3xl md:rounded-3xl bg-card border border-white/10 flex flex-col max-h-[95vh] shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <CalIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 id="calendar-title" className="text-lg font-bold text-foreground">{tr('Calendar', 'לוח שנה')}</h2>
              <p className="text-[11px] text-foreground/40">{location?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={jumpToToday} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-foreground/70 text-xs font-bold transition-all">
              <HomeIcon className="w-3.5 h-3.5" /> {tr('Today', 'היום')}
            </button>
            <button onClick={() => setShowSettings(true)} aria-label={tr('Calendar settings', 'הגדרות לוח שנה')} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all" title={tr('Colors', 'צבעים')}>
              <SettingsIcon className="w-5 h-5 text-foreground/60" />
            </button>
            <button onClick={onClose} aria-label={tr('Close calendar', 'סגור לוח שנה')} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <X className="w-5 h-5 text-foreground/60" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="px-5 py-3 shrink-0 border-b border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => navigateMonth(-1)} aria-label={tr('Previous month', 'החודש הקודם')} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <ChevronLeft className="w-5 h-5 text-foreground/70" />
            </button>
            <div className="text-center flex-1 min-w-0">
              <div className="text-base font-bold text-foreground truncate">{monthLabel}</div>
              {hebMonthLabel && calMode === 'greg' && (
                <div className="text-xs font-semibold text-primary/80" dir="rtl">{toHebrewDate(new Date(gregYear, gregMonth, 15))?.formatted || ''}</div>
              )}
            </div>
            <button onClick={() => navigateMonth(1)} aria-label={tr('Next month', 'החודש הבא')} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <ChevronRight className="w-5 h-5 text-foreground/70" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-1.5">
              <button onClick={() => setCalMode(setCalendarMonthSystem('heb'))} className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${calMode === 'heb' ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-foreground/50'}`}>
                {tr('Hebrew', 'עברי')}
              </button>
              <button onClick={() => setCalMode(setCalendarMonthSystem('greg'))} className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${calMode === 'greg' ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-foreground/50'}`}>
                {tr('Gregorian', 'לועזי')}
              </button>
            </div>
            <button onClick={() => setShowYearPicker(s => !s)} className="px-3 py-1 rounded-lg text-xs font-bold border bg-white/5 border-white/10 text-foreground/50 hover:bg-white/10 transition-all">
              {tr('Year', 'שנה')}
            </button>
          </div>
          {showYearPicker && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => calMode === 'greg' ? setGregYear(y => y - 1) : setHebYear(y => y - 1)} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-foreground/70 font-bold hover:bg-white/10">−</button>
              <span className="text-sm font-bold text-foreground w-16 text-center tabular-nums">{calMode === 'greg' ? gregYear : hebYear}</span>
              <button onClick={() => calMode === 'greg' ? setGregYear(y => y + 1) : setHebYear(y => y + 1)} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-foreground/70 font-bold hover:bg-white/10">+</button>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="overflow-auto flex-1 p-4" dir={gridDir} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {loading && (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-sm text-foreground/40">{tr('Loading...', 'טוען...')}</span>
            </div>
          )}
          {holidayDataStatus === 'unavailable' && (
            <div className="mb-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {tr('Live holiday data is temporarily unavailable. Dates and personal events still show.', 'נתוני החגים אינם זמינים כרגע. התאריכים והאירועים האישיים מוצגים.')}
            </div>
          )}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {headers.map((d, i) => (
              <div key={i} className={`text-center text-[11px] font-bold py-1 ${i === 6 ? 'text-primary/70' : 'text-foreground/40'}`}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {gridDays.map((d, i) => {
              if (!d) return <CalendarDayCell key={i} day={null} colors={calendarColors} />;
              const events = getDayEvents(d);
              const isShabbat = d.getDay() === 6;
              const category = getDayCategory(events, isShabbat);
              const hd = hebrewDateCache[dateKey(d)];
              const parasha = events.find(e => e.category === 'parashat');
              const mainEvents = events.filter(e => e.category !== 'parashat');
              const isToday = dateKey(d) === dateKey(today);
              return (
                <CalendarDayCell
                  key={i}
                  day={d}
                  hebrewDay={hd?.day}
                  mainEvents={mainEvents}
                  parasha={parasha}
                  category={category}
                  colors={calendarColors}
                  isToday={isToday}
                  lang={lang}
                  onSelect={setSelectedDay}
                />
              );
            })}
          </div>
          <CalendarLegend colors={calendarColors} lang={lang} />
        </div>
      </div>

      {selectedDay && (
        <DayZmanimDetail
          open={!!selectedDay}
          onClose={() => setSelectedDay(null)}
          date={selectedDay}
          location={location}
          elevation={elevation}
          horizonMode={horizonMode}
          hour12={hour12}
          lang={lang}
          locationTz={locationTz}
          zmanimOpinions={zmanimOpinions}
          customZmanim={customZmanim}
          onAddEvent={(d) => setEventEditor({ date: d, event: null })}
        />
      )}

      <CustomEventEditor
        open={!!eventEditor}
        onClose={() => setEventEditor(null)}
        date={eventEditor?.date}
        event={eventEditor?.event}
        lang={lang}
        onSave={(evt) => setCustomEvents(prev => {
          const idx = prev.findIndex(ce => ce.id === evt.id);
          if (idx >= 0) { const next = [...prev]; next[idx] = evt; return next; }
          return [...prev, evt];
        })}
        onDelete={(id) => setCustomEvents(prev => prev.filter(ce => ce.id !== id))}
      />

      <CalendarSettingsPanel open={showSettings} onClose={() => setShowSettings(false)} lang={lang} />
    </div>
  );
}
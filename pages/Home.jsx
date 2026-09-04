import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { PREF_KEYS, readBoolPref, writeBoolPref, getZmanimDisplayLevel, setZmanimDisplayLevel, getShowSecondaryTimes, setShowSecondaryTimes, getSecondaryZmanimDisplay, setSecondaryZmanimDisplay } from '../lib/preferences';
import { Settings, Search, MapPin, Calendar, Home as HomeIcon, TableProperties, Menu } from 'lucide-react';
import DateTimeHeader from '../components/DateTimeHeader';
import SunCircle from '../components/SunCircle';
import ZmanimCard from '../components/ZmanimCard';
import SettingsSheet from '../components/SettingsSheet';
import { MoonDisc } from '../components/MoonInfo';

import JewishDayBanner from '../components/JewishDayBanner';
import ShaahZmanitBox from '../components/ShaahZmanitBox';
import CustomEventCard from '../components/CustomEventCard';

import SearchSheet from '../components/SearchSheet';
import CityPicker from '../components/CityPicker';
import WeatherBadge from '../components/WeatherBadge';
import NextZmanCountdown from '../components/NextZmanCountdown';
import ZmanimNotifier from '../components/ZmanimNotifier';
import SiteFooter from '../components/SiteFooter';
import NavigationDrawer from '../components/NavigationDrawer';


// Heavy components that are only opened on user action are lazy-loaded so the
// initial homepage bundle stays small. The essential zmanim display (SunCircle,
// ZmanimCard, NextZmanCountdown, ZmanimNotifier, WeatherBadge, etc.) stays in
// the initial bundle for instant first paint.
const SolarInfoPanel = lazy(() => import('../components/SolarInfoPanel'));
const MoonSheet = lazy(() => import('../components/moon/MoonSheet'));
const MonthlyZmanimSheet = lazy(() => import('../components/MonthlyZmanimSheet'));
const JewishCalendarSheet = lazy(() => import('../components/JewishCalendarSheet'));
const MonthlyZmanimSelector = lazy(() => import('../components/MonthlyZmanimSelector'));
const WeatherForecastSheet = lazy(() => import('../components/WeatherForecastSheet'));
const ChartsSheet = lazy(() => import('../components/ChartsSheet'));

// Local fallback shown while a lazy sheet loads — matches the dark theme.
// Kept minimal so we don't add duplicate loading spinners across the app.
const SheetLoadingFallback = () => (
  <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
    <div className="w-5 h-5 border-2 border-yellow-500/30 border-t-yellow-400 rounded-full animate-spin" />
    <span className="sr-only">Loading…</span>
  </div>
);
import { getSunPosition } from '../lib/sunCalc';
import { getDateInTz, toDateOnly, makeWallTimeDate, addDays } from '../lib/timezone';
import { defaultOpinionsForTimezone } from '../lib/regionDefaults';
import useCalendarEvents from '../hooks/useCalendarEvents';
import useLocationClock from '../hooks/useLocationClock';
import useSunMoon from '../hooks/useSunMoon';
import useZmanim from '../hooks/useZmanim';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import PullToRefresh from '../components/PullToRefresh';

import { useLanguage } from '../lib/LanguageContext';
import { useDragScroll } from '../hooks/useDragScroll';
import { base44 } from '@/api/base44Client';
import { BarChart3 } from 'lucide-react';

export default function Home() {
  const scrollRef = useDragScroll();
  const reduceMotion = useReducedMotion();
  const { lang, setLang } = useLanguage();
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('lastLocation');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { lat: 31.7767, lng: 35.2345, name: 'Jerusalem' };
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [date, setDate] = useState(() => {
    // Start with Jerusalem's date (default location) to avoid wrong-day zmanim on first load
    return getDateInTz('Asia/Jerusalem');
  });

  const [opinion] = useState('both');
  const [hour12, setHour12] = useState(() => readBoolPref(PREF_KEYS.hour12, true));
  const [horizonConfig, setHorizonConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('horizonConfig');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Migrate: if old horizonOffset was non-zero, preserve as geometric mode
    // (label "Geometric elevation" rather than implying a correct local horizon)
    try {
      const oldElev = parseFloat(localStorage.getItem('horizonOffset'));
      if (oldElev && oldElev !== 0) {
        return { mode: 'geometric', manualSunriseDeg: 0, manualSunsetDeg: 0 };
      }
    } catch {}
    return { mode: 'none', manualSunriseDeg: 0, manualSunsetDeg: 0 };
  });
  const [showChartsSheet, setShowChartsSheet] = useState(false);
  const [zmanimDisplayLevel, setDisplayLevel] = useState(() => getZmanimDisplayLevel());
  const [showSecondaryTimes, setShowSecondaryTimesState] = useState(() => getShowSecondaryTimes());
  const [secondaryZmanimDisplay, setSecondaryZmanimDisplayState] = useState(() => getSecondaryZmanimDisplay());
  const [followLocationDefaults, setFollowLocationDefaults] = useState(() => readBoolPref(PREF_KEYS.followLocationDefaults, true));
  const [zmanimOpinions, setZmanimOpinions] = useState(() => {
    // Region-based defaults from the resolved timezone (Israel vs Diaspora).
    // Default location is Jerusalem (Israel) → Israel defaults on first load.
    const defaults = defaultOpinionsForTimezone('Asia/Jerusalem');
    try {
      const saved = localStorage.getItem('zmanimOpinions');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Version migration: reset to new defaults when the structure changes.
        if (parsed._v !== 5) {
          // Migrate the legacy motzeiShabbat key → shabbatEnds if present.
          const migrated = { ...defaults };
          if (parsed.motzeiShabbat && !parsed.shabbatEnds) migrated.shabbatEnds = parsed.motzeiShabbat;
          localStorage.setItem('zmanimOpinions', JSON.stringify(migrated));
          return migrated;
        }
        return { ...defaults, ...parsed };
      }
    } catch {}
    return defaults;
  });
  const {
    locationTz, setLocationTz, currentTime, setCurrentTime,
    useCustomTime, setUseCustomTime, customTimeVal, setCustomTimeVal,
  } = useLocationClock({ location, setDate, followLocationDefaults, setZmanimOpinions });

  // Stable serialized key for cache lookups — computed once per opinions change
  // instead of re-serializing on every render/effect run.
  const opinionsKey = useMemo(() => JSON.stringify(zmanimOpinions), [zmanimOpinions]);
  const [customZmanim, setCustomZmanim] = useState(() => {
    try {
      const saved = localStorage.getItem('customZmanim');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [showSolarInfo, setShowSolarInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCountdown, setShowCountdown] = useState(() => {
    try {return localStorage.getItem('showCountdown') !== 'false';} catch {return true;}
  });
  const [sceneStyle, setSceneStyle] = useState(() => {
    try {return localStorage.getItem('sunCircleScene') || 'stone';} catch {return 'stone';}
  });
  const [showZmanimRing, setShowZmanimRing] = useState(() => {
    try {return localStorage.getItem('showZmanimRing') !== 'false';} catch {return true;}
  });
  const [showMoonChat, setShowMoonChat] = useState(false);
  const [showWeatherSheet, setShowWeatherSheet] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showMonthlyChart, setShowMonthlyChart] = useState(false);
  const [showJewishCalendar, setShowJewishCalendar] = useState(false);
  const [exportingToCal, setExportingToCal] = useState(false);
  const [exportMsg, setExportMsg] = useState(null);

  const [showMonthlySelector, setShowMonthlySelector] = useState(false);
  const [visibleOpinionKeys, setVisibleOpinionKeys] = useState(null);
  const [standardOpinionKeys, setStandardOpinionKeys] = useState(null);
  const [isShabbatMode, setIsShabbatMode] = useState(false);
  const [activeTab, setActiveTab] = useState('zmanim');
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchDate, setSearchDate] = useState(() => getDateInTz('Asia/Jerusalem'));
  const [searchTime, setSearchTime] = useState('12:00');
  const [searchLocation, setSearchLocation] = useState(null);

  // Elevation — always passed to astronomical calculations (never ignored).
  // Computed once here; reused by both zmanim effects and child component props.
  const physElevation = location?.elevation || 0;
  // ELEVATION OWNERSHIP (applied exactly once):
  // - "geometric": Hebcal API receives physical elevation; local calc gets 0
  // - "manual":    Hebcal gets 0; local calc gets user-supplied { sunrise, sunset }
  // - "none":      Hebcal gets 0; local calc gets 0 (standard sea-level horizon)
  const hebcalElevation = horizonConfig.mode === 'geometric' ? physElevation : 0;
  const effectiveHorizonOffset = useMemo(() => horizonConfig.mode === 'manual'
    ? { sunrise: horizonConfig.manualSunriseDeg || 0, sunset: horizonConfig.manualSunsetDeg || 0 }
    : 0, [horizonConfig.mode, horizonConfig.manualSunriseDeg, horizonConfig.manualSunsetDeg]);

  // Tab → sheet mapping
  useEffect(() => { writeBoolPref(PREF_KEYS.hour12, hour12); }, [hour12]);
  useEffect(() => { writeBoolPref(PREF_KEYS.followLocationDefaults, followLocationDefaults); }, [followLocationDefaults]);
  useEffect(() => { setZmanimDisplayLevel(zmanimDisplayLevel); }, [zmanimDisplayLevel]);
  useEffect(() => { setShowSecondaryTimes(showSecondaryTimes); }, [showSecondaryTimes]);
  useEffect(() => { setSecondaryZmanimDisplay(secondaryZmanimDisplay); }, [secondaryZmanimDisplay]);

  useEffect(() => {
    setShowMoonChat(activeTab === 'moon');
    setShowSettings(activeTab === 'settings');
  }, [activeTab]);

  // Pull-to-refresh handler is declared after the zmanim hook.

  // Auto-detect GPS on first load
  useEffect(() => {
    let cancelled = false;
    const hasStored = (() => {try {return !!localStorage.getItem('lastLocation');} catch {return false;}})();
    if (hasStored) return; // already have a saved location
    if (!navigator.geolocation) {setShowCityPicker(true);return;}
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return; // ignore stale GPS result if user switched to manual select
        const { latitude: lat, longitude: lng } = pos.coords;
        // Region-based opinion defaults are now applied centrally in the
        // location-change effect (from the resolved timezone), so GPS no
        // longer needs to set them here.
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          if (cancelled) return;
          const data = await res.json();
          const name = data.address?.city || data.address?.town || data.address?.village || '📍 My Location';
          if (cancelled) return;
          setLocation({ lat, lng, name });
          base44.functions.invoke('trackEvent', { event_type: 'gps_signin', location_name: name, lat, lng }).catch(() => {});
        } catch {
          if (cancelled) return;
          setLocation({ lat, lng, name: '📍 My Location' });
          base44.functions.invoke('trackEvent', { event_type: 'gps_signin', location_name: '📍 My Location', lat, lng }).catch(() => {});
        }
      },
      () => { if (!cancelled) setShowCityPicker(true); }, // GPS denied → show city picker
      { timeout: 8000 }
    );
    return () => { cancelled = true; };
  }, []);

  // Track site visit (fire-and-forget, once per session)
  useEffect(() => {
    try {
      if (sessionStorage.getItem('visitTracked')) return;
      sessionStorage.setItem('visitTracked', '1');
    } catch {}
    base44.functions.invoke('trackEvent', { event_type: 'visit' }).catch(() => {});
  }, []);

  // Persist location
  useEffect(() => {
    try {localStorage.setItem('lastLocation', JSON.stringify(location));} catch {}
  }, [location]);

  // Horizon config is user-controlled via SettingsSheet.
  // City elevation is applied automatically in "geometric" mode (via hebcalElevation).

  // Location timezone and live clock are managed by useLocationClock.

  // Persist countdown toggle
  useEffect(() => {
    try {localStorage.setItem('showCountdown', String(showCountdown));} catch {}
  }, [showCountdown]);

  // Persist scene style
  useEffect(() => {
    try {localStorage.setItem('sunCircleScene', sceneStyle);} catch {}
  }, [sceneStyle]);

  // Persist zmanim ring toggle
  useEffect(() => {
    try {localStorage.setItem('showZmanimRing', String(showZmanimRing));} catch {}
  }, [showZmanimRing]);

  // Persist zmanim opinions
  useEffect(() => {
    try {localStorage.setItem('zmanimOpinions', JSON.stringify(zmanimOpinions));} catch {}
  }, [zmanimOpinions]);

  // Persist custom zmanim
  useEffect(() => {
    try {localStorage.setItem('customZmanim', JSON.stringify(customZmanim));} catch {}
  }, [customZmanim]);

  // Persist horizon config
  useEffect(() => {
    try {localStorage.setItem('horizonConfig', JSON.stringify(horizonConfig));} catch {}
  }, [horizonConfig]);

  // Zmanim fetching and caching are managed by useZmanim.

  // Compute effective time for the selected location.
  // Custom time represents wall-clock time in locationTz, not the browser timezone
  const effectiveTime = useCustomTime && customTimeVal ?
    (makeWallTimeDate(toDateOnly(date, locationTz), customTimeVal, locationTz) || currentTime) :
    currentTime;
  const { sunTimes, zmanimSource, tomorrowSunTimes, clearCache } = useZmanim({
    date, location, locationTz, setLocationTz, hebcalElevation, effectiveHorizonOffset,
    zmanimOpinions, opinionsKey, refreshKey, effectiveTime,
  });
  const calendarEvents = useCalendarEvents({ date, location, locationTz });
  const { sunPos, moonTimes, moonPhase, moonPos } = useSunMoon({
    currentTime, date, location, useCustomTime, customTimeVal,
  });
  const handleRefresh = useCallback(async () => {
    clearCache();
    setRefreshKey(k => k + 1);
  }, [clearCache]);

  // Preview sun position when search sheet is open
  const [previewSunPos, setPreviewSunPos] = useState(null);
  useEffect(() => {
    if (!showSearch || !location) {
      setPreviewSunPos(null);
      return;
    }
    const loc = searchLocation || location;
    const baseDateStr = searchDate && !isNaN(searchDate.getTime())
      ? toDateOnly(searchDate, locationTz)
      : toDateOnly(date, locationTz);
    const base = makeWallTimeDate(baseDateStr, searchTime || '12:00', locationTz);
    if (!base || isNaN(base.getTime())) {setPreviewSunPos(null);return;}
    setPreviewSunPos(getSunPosition(base, loc.lat, loc.lng));
  }, [showSearch, searchLocation, searchDate, searchTime, location, date]);

  // Always show sun circle during search - use preview or current sun position
  const displaySunPos = showSearch ? previewSunPos || sunPos : sunPos;

  const handleSearch = () => {
    const effectiveTz = searchLocation?.timezone || locationTz;
    if (searchLocation) {
      setLocation(searchLocation);
    }
    if (searchDate && !isNaN(searchDate.getTime())) {
      // Extract civil date parts from the date picker (browser-local getters are
      // correct for the date the user picked), then construct noon in effectiveTz
      const searchDateStr = `${searchDate.getFullYear()}-${String(searchDate.getMonth()+1).padStart(2,'0')}-${String(searchDate.getDate()).padStart(2,'0')}`;
      const normalized = makeWallTimeDate(searchDateStr, '12:00', effectiveTz) || new Date(searchDateStr + 'T12:00:00Z');
      setDate(normalized);
    }
    if (searchTime) {
      // Construct wall-clock time in effectiveTz, not the browser timezone
      const baseDateStr = searchDate && !isNaN(searchDate.getTime())
        ? `${searchDate.getFullYear()}-${String(searchDate.getMonth()+1).padStart(2,'0')}-${String(searchDate.getDate()).padStart(2,'0')}`
        : toDateOnly(date, effectiveTz);
      const d = makeWallTimeDate(baseDateStr, searchTime, effectiveTz);
      if (d) {
        setCurrentTime(d);
        setUseCustomTime(true);
        setCustomTimeVal(searchTime);
      }
    }
    setShowSearch(false);
  };

  const resetToHome = () => {
    const now = new Date();
    setDate(getDateInTz(locationTz, now));
    setCurrentTime(now);
    setUseCustomTime(false);
    setCustomTimeVal('');
    setSearchLocation(null);
  };

  const ZMANIM_CAL_LABELS = [
    { key: 'alot', label: lang === 'he' ? 'עלות השחר' : 'Alot HaShachar' },
    { key: 'misheyakir', label: lang === 'he' ? 'משיכיר' : 'Misheyakir' },
    { key: 'netz', label: lang === 'he' ? 'נץ החמה' : 'Sunrise' },
    { key: 'shema', label: lang === 'he' ? 'סוף זמן ק"ש' : 'Sof Zman Shema' },
    { key: 'tefilla', label: lang === 'he' ? 'סוף זמן תפילה' : 'Sof Zman Tefilla' },
    { key: 'chatzot', label: lang === 'he' ? 'חצות היום' : 'Chatzot' },
    { key: 'minchaGedola', label: lang === 'he' ? 'מנחה גדולה' : 'Mincha Gedola' },
    { key: 'minchaKetana', label: lang === 'he' ? 'מנחה קטנה' : 'Mincha Ketana' },
    { key: 'plagHaMincha', label: lang === 'he' ? 'פלג המנחה' : 'Plag HaMincha' },
    { key: 'candleLighting', label: lang === 'he' ? 'הדלקת נרות' : 'Candle Lighting' },
    { key: 'shkiah', label: lang === 'he' ? 'שקיעה' : 'Sunset' },
    { key: 'tzait', label: lang === 'he' ? 'צאת כוכבים' : 'Tzait HaKochavim' },
    { key: 'beinHaShmashos', label: lang === 'he' ? 'בין השמשות' : 'Bein HaShmashos' },
    { key: 'chatzotNight', label: lang === 'he' ? 'חצות הלילה' : 'Chatzot HaLayla' },
  ];

  const handleExportToCalendar = async () => {
    if (!sunTimes) return;
    setExportingToCal(true);
    setExportMsg(null);
    const zmanim = ZMANIM_CAL_LABELS
      .filter(z => sunTimes[z.key])
      .map(z => ({ label: z.label, time: sunTimes[z.key].toISOString() }));
    try {
      const res = await base44.functions.invoke('exportZmanimToCalendar', {
        zmanim,
        date: toDateOnly(date, locationTz) || date.toISOString(),
        locationName: location?.name || '',
      });
      const data = res.data;
      if (data?.notConnected) {
        setExportMsg(lang === 'he' ? 'חיבור Google Calendar נדרש' : 'Google Calendar not connected');
      } else if (data?.results) {
        const ok = data.results.filter(r => r.success).length;
        setExportMsg(lang === 'he' ? `${ok} זמנים נוספו! ✓` : `${ok} zmanim added! ✓`);
      }
    } catch {
      setExportMsg(lang === 'he' ? 'שגיאה' : 'Error');
    } finally {
      setExportingToCal(false);
      setTimeout(() => setExportMsg(null), 4000);
    }
  };

  const DAY_NAMES_HE = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  const todayStr = toDateOnly(date, locationTz) || '';
  const parashaEvent = calendarEvents.find(e => e.category === 'parashat' && e.date >= todayStr);

  // Polar regions (above ~66° latitude) have days where sunrise/sunset don't occur.
  // Both Hebcal and local calc return null for netz/shkiah in these conditions.
  const isPolar = sunTimes && !sunTimes.netz && !sunTimes.shkiah;
  const clockLocale = lang === 'he' ? 'he-IL' : 'en-US';

  return (
    <div id="main-content" className="h-screen flex flex-col overflow-hidden">
      {/* Subtle animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-3xl animate-pulse-gold ${isShabbatMode ? 'bg-purple-500/4' : 'bg-yellow-500/5'}`} />
      </div>

      {/* Location and primary tools */}
      <header dir={lang === 'he' ? 'rtl' : 'ltr'} className="relative px-3 pb-2 flex flex-col gap-1.5" style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}>
        {/* Date / time block — sticky, compact, three lines */}
        <DateTimeHeader
          date={date}
          currentTime={currentTime}
          locationTz={locationTz}
          hour12={hour12}
          clockLocale={clockLocale}
          parashaEvent={parashaEvent}
          lang={lang}
        />
        {/* Location + shortcuts row */}
        <div className="flex items-center justify-between gap-1">
        {/* Location button */}
        <button
          onClick={() => setShowCityPicker(true)}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-2xl glass border border-yellow-400/30 hover:bg-yellow-500/15 active:scale-95 transition-all max-w-[140px] sm:max-w-[200px]">
          <MapPin className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <span className="text-xs font-semibold text-yellow-200 truncate">{location?.name || 'Jerusalem'}</span>
          <span className="text-[10px] text-yellow-400/60 shrink-0">▾</span>
        </button>

        {/* Top shortcuts: Calendar, Monthly, Settings, Search, Menu */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowJewishCalendar(true)}
            aria-label={lang === 'he' ? 'לוח שנה' : 'Calendar'}
            className="p-2 rounded-2xl glass-strong border-white/10 hover:bg-white/10 transition-all card-hover">
            <Calendar className="w-4 h-4 text-emerald-300" />
          </button>
          <button
            onClick={() => setShowMonthlySelector(true)}
            aria-label={lang === 'he' ? 'זמנים חודשיים' : 'Monthly Zmanim'}
            className="p-2 rounded-2xl glass-strong border-white/10 hover:bg-white/10 transition-all card-hover">
            <TableProperties className="w-4 h-4 text-purple-300" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            aria-label={lang === 'he' ? 'הגדרות' : 'Settings'}
            className="p-2 rounded-2xl glass-strong border-white/10 hover:bg-white/10 transition-all card-hover">
            <Settings className="w-4 h-4 text-yellow-300" />
          </button>
          <button
            onClick={() => setShowSearch(true)}
            aria-label={lang === 'he' ? 'חיפוש' : 'Search'}
            className="p-2 rounded-2xl glass-strong border-white/10 hover:bg-white/10 transition-all card-hover">
            <Search className="w-4 h-4 text-blue-300" />
          </button>
          <button
            onClick={() => setShowNav(true)}
            aria-label={lang === 'he' ? 'פתח תפריט' : 'Open menu'}
            className="p-2 rounded-2xl glass-strong border-white/10 hover:bg-white/10 transition-all card-hover">
            <Menu className="w-4 h-4 text-white/70" />
          </button>
        </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
        <AnimatePresence mode="wait">
        {activeTab === 'zmanim' && location && displaySunPos &&
        <motion.div key="zmanim" initial={reduceMotion ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -20 }} transition={{ duration: reduceMotion ? 0 : 0.25 }} className="px-4 pb-8 space-y-16">
          <PullToRefresh onRefresh={handleRefresh}>

          {/* Polar region warning — sun never rises/sets at this latitude today */}
          {isPolar && (
            <div className="rounded-2xl border border-blue-400/30 bg-blue-500/10 px-5 py-4 text-center">
              <p className="text-sm font-bold text-blue-200">
                {lang === 'he' ? 'זמנים לא זמינים בקו רוחב זה' : 'Zmanim unavailable at this latitude'}
              </p>
              <p className="text-xs text-blue-300/60 mt-1">
                {lang === 'he' ? 'השמש אינה זורחת או שוקעת ביום זה באזור קוטבי. השתמש בחיפוש לתאריך אחר או במיקום אחר.' : 'The sun does not rise or set today in this polar region. Use Search for a different date or location.'}
              </p>
            </div>
          )}
          {/* Non-intrusive notice when Hebcal is unavailable and we fell back to local calc */}
          {zmanimSource === 'local-fallback' && !isPolar && (
            <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200/80 text-center">
              {lang === 'he' ? 'מציג זמנים מחישוב מקומי (Hebcal לא זמין).' : 'Showing locally calculated zmanim (Hebcal unavailable).'}
            </div>
          )}

          {/* SunCircle — main visual identity, at the top */}
          <div className="rounded-3xl border border-white/8 bg-white/4 backdrop-blur-sm p-5 space-y-4 relative">
            {useCustomTime && (
              <button
                onClick={resetToHome}
                className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 hover:bg-blue-500/30 transition-all text-xs font-semibold"
              >
                <HomeIcon className="w-3.5 h-3.5" />
                {lang === 'he' ? 'חזרה' : 'Home'}
              </button>
            )}
            <div className="flex flex-col items-center relative">
              <SunCircle
              azimuth={displaySunPos.azimuth}
              elevation={displaySunPos.altitude}
              sunTimes={sunTimes}
              currentTime={showSearch && searchTime ? (() => {const [hh, mm] = searchTime.split(':').map(Number);const src = searchDate && !isNaN(searchDate.getTime()) ? searchDate : date;return new Date(src.getFullYear(), src.getMonth(), src.getDate(), hh || 0, mm || 0, 0, 0);})() : effectiveTime}
              moonTimes={moonTimes}
              moonPhase={moonPhase}
              moonPos={moonPos}
              size={Math.max(240, Math.min(320, window.innerWidth - 80))}
              sceneStyle={sceneStyle}
              showZmanimRing={showZmanimRing} />
            </div>
          </div>

          {showCountdown && sunTimes && (
            <NextZmanCountdown
              sunTimes={sunTimes}
              currentTime={effectiveTime}
              hour12={hour12}
              lang={lang}
              locationTz={locationTz}
              zmanimOpinions={zmanimOpinions}
            />
          )}

          {/* Weather — compact current forecast; disappears entirely on failure */}
          {location && (
            <WeatherBadge location={location} lang={lang} onClick={() => setShowWeatherSheet(true)} />
          )}

          {/* Today's Zmanim — all main zmanim + selected secondary opinions inline */}
          <ZmanimCard
            sunTimes={sunTimes}
            currentTime={effectiveTime}
            date={date}
            opinion={opinion}
            hour12={hour12}
            lang={lang}
            zmanimOpinions={zmanimOpinions}
            customZmanim={customZmanim}
            locationTz={locationTz}
            locationName={location?.name}
            elevationStatus={horizonConfig.mode === 'geometric' ? `${physElevation}m geometric` : horizonConfig.mode === 'manual' ? 'Manual horizon' : 'Standard horizon'}
            displayLevel={zmanimDisplayLevel}
            nextDaySunTimes={tomorrowSunTimes}
            calendarEvents={calendarEvents}
            zmanimSource={zmanimSource}
            showSecondaryTimes={showSecondaryTimes}
            secondaryZmanimDisplay={secondaryZmanimDisplay}
            onPrevDay={() => { const ds = toDateOnly(date, locationTz); setDate(ds ? (makeWallTimeDate(addDays(ds, -1), '12:00', locationTz) || new Date(date.getTime() - 86400000)) : new Date(date.getTime() - 86400000)); setUseCustomTime(false); }}
            onNextDay={() => { const ds = toDateOnly(date, locationTz); setDate(ds ? (makeWallTimeDate(addDays(ds, 1), '12:00', locationTz) || new Date(date.getTime() + 86400000)) : new Date(date.getTime() + 86400000)); setUseCustomTime(false); }}
          />

          {/* Sha'ah Zmanit — GRA + MGA clock visuals */}
          {sunTimes && (sunTimes.shaahGra || sunTimes.shaahMga) && (
            <ShaahZmanitBox sunTimes={sunTimes} currentTime={effectiveTime} lang={lang} locationTz={locationTz} />
          )}

          {/* Charts — all advanced charts behind one button */}
          <button
            onClick={() => setShowChartsSheet(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl glass-strong border border-teal-400/30 hover:bg-teal-500/20 transition-all card-hover"
          >
            <BarChart3 className="w-4 h-4 text-teal-300" />
            <span className="text-sm font-semibold text-teal-200">
              {lang === 'he' ? 'תרשימים' : 'Charts'}
            </span>
          </button>

          {/* Custom events for today */}
          <CustomEventCard date={date} locationTz={locationTz} lang={lang} />

          <ZmanimNotifier sunTimes={sunTimes} currentTime={effectiveTime} lang={lang} />

          {/* Add to Google Calendar */}
          <button
            onClick={handleExportToCalendar}
            disabled={exportingToCal || !sunTimes}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 hover:bg-emerald-500/25 transition-all card-hover disabled:opacity-40"
          >
            <Calendar className={`w-4 h-4 text-emerald-300 ${exportingToCal ? 'animate-spin' : ''}`} />
            <span className="text-sm font-semibold text-emerald-200">
              {exportingToCal
                ? (lang === 'he' ? 'מוסיף...' : 'Adding...')
                : (lang === 'he' ? 'הוסף זמנים ליומן' : 'Add Zmanim to Calendar')}
            </span>
          </button>
          {exportMsg && (
            <div className="text-center text-xs font-medium text-emerald-300 -mt-2">{exportMsg}</div>
          )}

          {/* Jewish day banner — secondary content */}
          <JewishDayBanner date={date} locationTz={locationTz} calendarEvents={calendarEvents} lang={lang} />

          {/* Secondary content — Today's Sun & Today's Moon */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowSolarInfo(true)}
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-yellow-500/15 border border-yellow-400/30 hover:bg-yellow-500/25 transition-all card-hover"
            >
              <span className="text-lg" aria-hidden="true">☀️</span>
              <span className="text-sm font-semibold text-yellow-200">{lang === 'he' ? 'השמש היום' : "Today's Sun"}</span>
            </button>
            <button
              onClick={() => setActiveTab('moon')}
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-blue-500/15 border border-blue-400/30 hover:bg-blue-500/25 transition-all card-hover"
            >
              <MoonDisc phase={moonPhase?.phase || 0} illumination={moonPhase?.illumination || 0} size={28} />
              <span className="text-sm font-semibold text-blue-200">{lang === 'he' ? 'הירח היום' : "Today's Moon"}</span>
            </button>
          </div>

          </PullToRefresh>
        </motion.div>
        }
        </AnimatePresence>
      </div>


      <Suspense fallback={<SheetLoadingFallback />}>
      <SolarInfoPanel
        open={showSolarInfo}
        onClose={() => setShowSolarInfo(false)}
        sunTimes={sunTimes}
        location={location}
        date={date}
        currentTime={effectiveTime}
        lang={lang}
        locationTz={locationTz}
        zmanimOpinions={zmanimOpinions}
        elevation={effectiveHorizonOffset}
        moonPhase={moonPhase}
        moonTimes={moonTimes} />
      </Suspense>
      

      <SettingsSheet
        open={showSettings}
        onClose={() => { setShowSettings(false); setActiveTab('zmanim'); }}
        location={location}
        onLocationChange={setLocation}
        hour12={hour12}
        onHour12Change={setHour12}
        date={date}
        onDateChange={setDate}
        horizonConfig={horizonConfig}
        onHorizonConfigChange={setHorizonConfig}
        lang={lang}
        onLangChange={setLang}
        zmanimOpinions={zmanimOpinions}
        onZmanimOpinionsChange={(next) => { setZmanimOpinions(next); setFollowLocationDefaults(false); }}
        followLocationDefaults={followLocationDefaults}
        onFollowLocationDefaultsChange={setFollowLocationDefaults}
        zmanimDisplayLevel={zmanimDisplayLevel}
        onZmanimDisplayLevelChange={setDisplayLevel}
        showCountdown={showCountdown}
        onShowCountdownChange={setShowCountdown}
        sunTimes={sunTimes}
        locationTz={locationTz}
        customZmanim={customZmanim}
        onCustomZmanimAdd={(cz) => setCustomZmanim(prev => [...prev, cz])}
        onCustomZmanimRemove={(id) => setCustomZmanim(prev => prev.filter(cz => cz.id !== id))}
        sceneStyle={sceneStyle}
        onSceneStyleChange={setSceneStyle}
        showZmanimRing={showZmanimRing}
        onShowZmanimRingChange={setShowZmanimRing}
        showSecondaryTimes={showSecondaryTimes}
        onShowSecondaryTimesChange={setShowSecondaryTimesState}
        secondaryZmanimDisplay={secondaryZmanimDisplay}
        onSecondaryZmanimDisplayChange={setSecondaryZmanimDisplayState}
      />
      

      {showCityPicker &&
      <CityPicker
        onSelect={(loc) => {
          setLocation(loc);
          // Sync timezone immediately to prevent a brief fetch with the old city's tz
          if (loc.timezone) setLocationTz(loc.timezone);
          setShowCityPicker(false);
          // Keep the old location workflow, but never overwrite a user's customized calculation choices.
          // Region-based alot/tzait/shabbatEnds defaults are applied centrally by
          // the location-change effect (from the resolved timezone). Here we only
          // preserve a city-specific candle-lighting offset (e.g. Yerushalayim 40).
          if (followLocationDefaults && loc?.candleOffset) {
            setZmanimOpinions(prev => ({ ...prev, candleLighting: String(loc.candleOffset) }));
          }
          if (loc?.name) base44.functions.invoke('trackEvent', { event_type: 'location_search', location_name: loc.name }).catch(() => {});
        }}
        onClose={() => setShowCityPicker(false)}
        currentLocation={location}
        lang={lang} />

      }

      <SearchSheet
        open={showSearch}
        onClose={() => setShowSearch(false)}
        searchLocation={searchLocation}
        setSearchLocation={setSearchLocation}
        searchDate={searchDate}
        setSearchDate={setSearchDate}
        searchTime={searchTime}
        setSearchTime={setSearchTime}
        onApply={handleSearch}
        lang={lang} />



      <Suspense fallback={<SheetLoadingFallback />}>
      <MonthlyZmanimSelector
        open={showMonthlySelector}
        onClose={() => setShowMonthlySelector(false)}
        onProceed={(vis, std) => {
          setVisibleOpinionKeys(vis);
          setStandardOpinionKeys(std);
          setShowMonthlySelector(false);
          setShowMonthlyChart(true);
        }}
        zmanimOpinions={zmanimOpinions}
        customZmanim={customZmanim}
        secondaryZmanimDisplay={secondaryZmanimDisplay}
        lang={lang}
      />
      </Suspense>

      <Suspense fallback={<SheetLoadingFallback />}>
      <MonthlyZmanimSheet
        open={showMonthlyChart}
        onClose={() => setShowMonthlyChart(false)}
        onEditColumns={() => setShowMonthlySelector(true)}
        location={location}
        date={date}
        elevation={effectiveHorizonOffset}
        horizonMode={horizonConfig.mode}
        hour12={hour12}
        lang={lang}
        locationTz={locationTz}
        visibleOpinionKeys={visibleOpinionKeys}
        standardOpinionKeys={standardOpinionKeys}
        customZmanim={customZmanim}
        zmanimOpinions={zmanimOpinions}
        secondaryZmanimDisplay={secondaryZmanimDisplay}
      />
      </Suspense>

      <Suspense fallback={<SheetLoadingFallback />}>
      <MoonSheet
        open={showMoonChat}
        onClose={() => { setShowMoonChat(false); setActiveTab('zmanim'); }}
        date={showSearch && searchDate ? searchDate : date}
        location={location}
        lang={lang}
        hour12={hour12}
        locationTz={locationTz} />
      </Suspense>

      <Suspense fallback={<SheetLoadingFallback />}>
      <JewishCalendarSheet
        open={showJewishCalendar}
        onClose={() => setShowJewishCalendar(false)}
        location={location}
        date={date}
        elevation={effectiveHorizonOffset}
        horizonMode={horizonConfig.mode}
        hour12={hour12}
        lang={lang}
        locationTz={locationTz}
        zmanimOpinions={zmanimOpinions}
        customZmanim={customZmanim}
      />
      </Suspense>

      <Suspense fallback={<SheetLoadingFallback />}>
      <WeatherForecastSheet
        open={showWeatherSheet}
        onClose={() => setShowWeatherSheet(false)}
        location={location}
        lang={lang}
        locationTz={locationTz} />
      </Suspense>

      <Suspense fallback={<SheetLoadingFallback />}>
      <ChartsSheet
        open={showChartsSheet}
        onClose={() => setShowChartsSheet(false)}
        location={location}
        date={date}
        lang={lang}
        locationTz={locationTz}
        elevation={effectiveHorizonOffset}
        hour12={hour12}
        zmanimOpinions={zmanimOpinions}
        customZmanim={customZmanim} />
      </Suspense>

      <NavigationDrawer open={showNav} onClose={() => setShowNav(false)} lang={lang} />

      <SiteFooter />

      </div>);

}
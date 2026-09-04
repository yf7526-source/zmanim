import React, { useState, useEffect } from 'react';
import { X, Moon } from 'lucide-react';
import { getMoonPhase, getMoonTimes, getMoonPosition, toHebrewDate, getSunTimes } from '../../lib/sunCalc';
import { MoonDisc } from '../MoonInfo';
import MoonAstronomyGrid from './MoonAstronomyGrid';
import MoonVisibilityInfo from '../MoonVisibilityInfo';
import KiddushLevanahInfo from '../KiddushLevanahInfo';
import useFocusTrap from '@/hooks/useFocusTrap';

export default function MoonSheet({ open, onClose, date, location, lang = 'both', hour12 = true, locationTz }) {
  const dialogRef = useFocusTrap(open, onClose);
  const [selectedDate, setSelectedDate] = useState(date);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (open) {
      setSelectedDate(date);
      setNow(new Date());
    }
  }, [open, date]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [open]);

  if (!open) return null;

  const showHe = lang === 'he' || lang === 'both';
  const showEn = lang === 'en' || lang === 'both';

  const moon = getMoonPhase(selectedDate);
  const moonTimes = location ? getMoonTimes(selectedDate, location.lat, location.lng, locationTz) : null;

  // Night window: sunset today → sunrise tomorrow
  const nextDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1);
  const sunToday = location ? getSunTimes(selectedDate, location.lat, location.lng) : null;
  const sunTomorrow = location ? getSunTimes(nextDay, location.lat, location.lng) : null;
  const nightTimes = (sunToday?.shkiah && sunTomorrow?.netz)
    ? { sunset: sunToday.shkiah, sunrise: sunTomorrow.netz }
    : null;

  // Astronomical position at selected date + current clock time
  const astroTime = new Date(selectedDate);
  astroTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
  const moonPos = location ? getMoonPosition(astroTime, location.lat, location.lng) : null;

  const phaseLabel = lang === 'he' ? moon.phaseName.he
    : lang === 'en' ? moon.phaseName.en
    : `${moon.phaseName.he} · ${moon.phaseName.en}`;

  // "now" for Kiddush status = selected day at current clock time
  const kiddushNow = new Date(selectedDate);
  kiddushNow.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);

  const hd = toHebrewDate(selectedDate);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-md" onClick={onClose}>
      <section ref={dialogRef} className="w-full max-w-lg rounded-t-3xl md:rounded-3xl bg-card border border-border flex flex-col max-h-[90vh] shadow-2xl" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="today-moon-title">
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-4 md:hidden" />
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-400/25 flex items-center justify-center shrink-0"><Moon className="w-5 h-5 text-blue-300" /></div>
            <div className="min-w-0">
              <h2 id="today-moon-title" className="text-lg font-bold text-foreground">{lang === 'he' ? 'הירח היום' : "Today's Moon"}</h2>
              <p className="text-xs text-muted-foreground truncate">{location?.name} · {selectedDate.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label={lang === 'he' ? 'סגור' : 'Close moon sheet'} className="p-2 rounded-xl bg-muted hover:bg-muted/80"><X className="w-5 h-5 text-muted-foreground" /></button>
        </header>
        <div className="overflow-y-auto px-5 py-5 space-y-4">
          <div className="flex items-center gap-5 rounded-2xl bg-blue-500/10 border border-blue-400/20 p-5">
            <MoonDisc phase={moon.phase} illumination={moon.illumination} size={82} />
            <div className="min-w-0"><p className="text-xl font-bold text-foreground">{phaseLabel}</p><p className="mt-1 text-sm text-blue-200">{moon.illumination}% {lang === 'he' ? 'מואר' : 'illuminated'}</p><p className="text-xs text-muted-foreground mt-1">{lang === 'he' ? `גיל הירח: ${moon.age} ימים` : `Moon age: ${moon.age} days`}</p>{hd && <p className="text-xs text-muted-foreground mt-2" dir="rtl">{hd.day} {hd.monthName} {hd.yearStr}</p>}</div>
          </div>
          {moonPos && moonTimes && <MoonAstronomyGrid moonPos={moonPos} moonTimes={moonTimes} nightTimes={nightTimes} illumination={moon.illumination} lang={lang} hour12={hour12} locationTz={locationTz} />}
          {moonTimes && <MoonVisibilityInfo moonTimes={moonTimes} date={selectedDate} lang={lang} hour12={hour12} locationTz={locationTz} />}
          <div><div className="flex items-center gap-2 mb-3 px-1"><Moon className="w-4 h-4 text-primary" /><h3 className="text-sm font-bold text-foreground">{lang === 'he' ? 'קידוש לבנה' : 'Kiddush Levana'}</h3></div><KiddushLevanahInfo date={selectedDate} now={kiddushNow} lang={lang} hour12={hour12} /></div>
        </div>
      </section>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { defaultOpinionsForTimezone } from '@/lib/regionDefaults';
import { getDateInTz, getTimezoneFromCoords } from '@/lib/timezone';

export default function useLocationClock({ location, setDate, followLocationDefaults, setZmanimOpinions }) {
  const [locationTz, setLocationTz] = useState(() => {
    try {
      const saved = localStorage.getItem('lastLocation');
      if (saved) {
        const loc = JSON.parse(saved);
        if (loc.lat === 31.7767 && loc.lng === 35.2345) return 'Asia/Jerusalem';
      }
    } catch {}
    return 'Asia/Jerusalem';
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customTimeVal, setCustomTimeVal] = useState('');

  useEffect(() => {
    if (useCustomTime) return;
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, [useCustomTime]);

  useEffect(() => {
    if (!location?.lat || !location?.lng) return;
    const applyTz = (tz) => {
      if (!tz) return;
      setLocationTz(tz);
      if (followLocationDefaults) {
        setZmanimOpinions(prev => {
          const next = defaultOpinionsForTimezone(tz);
          if (prev.alot === next.alot && prev.tzait === next.tzait && prev.shabbatEnds === next.shabbatEnds) return prev;
          return { ...prev, alot: next.alot, tzait: next.tzait, shabbatEnds: next.shabbatEnds };
        });
      }
      if (!useCustomTime) {
        setDate(getDateInTz(tz));
        setCurrentTime(new Date());
      }
    };
    if (location.timezone) { applyTz(location.timezone); return; }
    let cancelled = false;
    getTimezoneFromCoords(location.lat, location.lng).then(tz => { if (!cancelled && tz) applyTz(tz); });
    return () => { cancelled = true; };
  }, [location?.lat, location?.lng, location?.timezone, useCustomTime, followLocationDefaults]);

  return { locationTz, setLocationTz, currentTime, setCurrentTime, useCustomTime, setUseCustomTime, customTimeVal, setCustomTimeVal };
}
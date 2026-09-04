import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchHebcalZmanim, normalizeTimes } from '@/lib/hebcalApi';
import { getSunTimes } from '@/lib/sunCalc';
import { addDays, getDateInTz, toDateOnly } from '@/lib/timezone';

export default function useZmanim({ date, location, locationTz, setLocationTz, hebcalElevation, effectiveHorizonOffset, zmanimOpinions, opinionsKey, refreshKey, effectiveTime }) {
  const cacheRef = useRef({});
  const [sunTimes, setSunTimes] = useState(() => {
    try { return getSunTimes(getDateInTz('Asia/Jerusalem'), 31.7767, 35.2345, '90min', '8.5', 0); } catch { return null; }
  });
  const [loadingZmanim, setLoadingZmanim] = useState(false);
  const [zmanimSource, setZmanimSource] = useState('hebcal');
  const [tomorrowSunTimes, setTomorrowSunTimes] = useState(null);
  const clearCache = useCallback(() => { cacheRef.current = {}; }, []);

  useEffect(() => {
    if (!location) return;
    const dateStr = toDateOnly(date, locationTz);
    if (!dateStr) return;
    const key = `${dateStr}_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}_${locationTz}_${hebcalElevation}_${JSON.stringify(effectiveHorizonOffset)}_${opinionsKey}`;
    if (cacheRef.current[key]) { setSunTimes(cacheRef.current[key]); setZmanimSource('hebcal'); return; }
    setLoadingZmanim(true);
    const controller = new AbortController();
    fetchHebcalZmanim(dateStr, location.lat, location.lng, hebcalElevation, locationTz, controller.signal)
      .then(({ times, tzid }) => {
        if (controller.signal.aborted) return;
        if (tzid) setLocationTz(tzid);
        const normalized = normalizeTimes(times, zmanimOpinions, location, effectiveHorizonOffset, dateStr);
        cacheRef.current[key] = normalized;
        const keys = Object.keys(cacheRef.current);
        keys.slice(0, Math.max(0, keys.length - 40)).forEach(oldKey => delete cacheRef.current[oldKey]);
        setSunTimes(normalized);
        setZmanimSource('hebcal');
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        const [y, m, d] = dateStr.split('-').map(Number);
        setSunTimes(getSunTimes(new Date(y, m - 1, d, 12), location.lat, location.lng, zmanimOpinions.alot, zmanimOpinions.tzait, effectiveHorizonOffset));
        setZmanimSource('local-fallback');
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingZmanim(false); });
    return () => controller.abort();
  }, [date, location, locationTz, hebcalElevation, effectiveHorizonOffset, zmanimOpinions, opinionsKey, refreshKey]);

  const afterSunset = Boolean(sunTimes?.shkiah && effectiveTime > sunTimes.shkiah);
  useEffect(() => {
    if (!location || !afterSunset) { setTomorrowSunTimes(null); return; }
    const tomorrow = addDays(toDateOnly(date, locationTz), 1);
    if (!tomorrow) return;
    const key = `${tomorrow}_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}_${locationTz}_${hebcalElevation}_${JSON.stringify(effectiveHorizonOffset)}_${opinionsKey}`;
    if (cacheRef.current[key]) { setTomorrowSunTimes(cacheRef.current[key]); return; }
    const controller = new AbortController();
    fetchHebcalZmanim(tomorrow, location.lat, location.lng, hebcalElevation, locationTz, controller.signal)
      .then(({ times }) => {
        if (controller.signal.aborted) return;
        const normalized = normalizeTimes(times, zmanimOpinions, location, effectiveHorizonOffset, tomorrow);
        cacheRef.current[key] = normalized;
        setTomorrowSunTimes(normalized);
      })
      .catch(() => { if (!controller.signal.aborted) setTomorrowSunTimes(null); });
    return () => controller.abort();
  }, [afterSunset, location, date, locationTz, hebcalElevation, effectiveHorizonOffset, zmanimOpinions, refreshKey, opinionsKey]);

  return { sunTimes, loadingZmanim, zmanimSource, tomorrowSunTimes, clearCache };
}
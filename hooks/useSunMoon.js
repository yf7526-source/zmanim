import { useEffect, useState } from 'react';
import { getMoonPhase, getMoonPosition, getMoonTimes, getSunPosition } from '@/lib/sunCalc';

export default function useSunMoon({ currentTime, date, location, useCustomTime, customTimeVal }) {
  const [sunPos, setSunPos] = useState(null);
  const [moonTimes, setMoonTimes] = useState(null);
  const [moonPhase, setMoonPhase] = useState(null);
  const [moonPos, setMoonPos] = useState(null);

  useEffect(() => {
    if (!location) return;
    const effective = useCustomTime && customTimeVal
      ? (() => { const [hh, mm] = customTimeVal.split(':').map(Number); const d = new Date(date); d.setHours(hh, mm, 0, 0); return d; })()
      : currentTime;
    setSunPos(getSunPosition(effective, location.lat, location.lng));
    setMoonPos(getMoonPosition(effective, location.lat, location.lng));
    setMoonPhase(getMoonPhase(effective));
  }, [currentTime, location, date, useCustomTime, customTimeVal]);

  useEffect(() => {
    if (!location) return;
    setMoonTimes(getMoonTimes(date, location.lat, location.lng));
  }, [date, location]);

  return { sunPos, moonTimes, moonPhase, moonPos };
}
import { useEffect, useState } from 'react';
import { fetchHebcalEvents } from '@/lib/hebcalApi';
import { addDays, toDateOnly } from '@/lib/timezone';
import { isIsraelTimezone } from '@/lib/regionDefaults';

export default function useCalendarEvents({ date, location, locationTz }) {
  const [calendarEvents, setCalendarEvents] = useState([]);

  useEffect(() => {
    if (!location) return;
    const dateStr = toDateOnly(date, locationTz);
    if (!dateStr) return;
    const startStr = addDays(dateStr, -1);
    const endStr = addDays(dateStr, 7);
    if (!startStr || !endStr) return;
    const controller = new AbortController();
    fetchHebcalEvents(startStr, endStr, location.lat, location.lng, isIsraelTimezone(locationTz), locationTz, controller.signal)
      .then(events => { if (!controller.signal.aborted) setCalendarEvents(events); })
      .catch(() => { if (!controller.signal.aborted) setCalendarEvents([]); });
    return () => controller.abort();
  }, [date, location, locationTz]);

  return calendarEvents;
}
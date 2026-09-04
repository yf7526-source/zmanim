import React, { useState, useEffect } from 'react';
import { Bell, Clock, Repeat, MapPin } from 'lucide-react';
import { getCustomEventsForDate, RECURRENCE_LABELS } from '../lib/customEvents';

function tr(text, lang) {
  return typeof text === 'string' ? text : (lang === 'he' ? text.he : text.en);
}

export default function CustomEventCard({ date, lang, locationTz }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const load = () => setEvents(getCustomEventsForDate(date, locationTz));
    load();
    window.addEventListener('storage', load);
    const interval = setInterval(load, 5000);
    return () => { window.removeEventListener('storage', load); clearInterval(interval); };
  }, [date]);

  if (events.length === 0) return null;

  return (
    <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 backdrop-blur-sm p-4 space-y-2">
      <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
        <Bell className="w-4 h-4" />
        {lang === 'he' ? 'אירועים היום' : "Today's Events"}
      </h3>
      {events.map(e => (
        <div key={e.id} className="flex items-start gap-2 text-sm text-blue-200" style={{ borderLeft: `3px solid ${e.color || '#dbeafe'}`, paddingLeft: '8px' }}>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              {e.time && <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
              <span className="font-semibold">{e.title}</span>
              {e.time && <span className="text-blue-400 text-xs">{e.time}</span>}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {e.reminder && <Bell className="w-3 h-3 text-yellow-400" />}
              {e.recurrence && e.recurrence !== 'none' && (
                <span className="flex items-center gap-0.5 text-[10px] text-indigo-300">
                  <Repeat className="w-2.5 h-2.5" />
                  {tr(RECURRENCE_LABELS[e.recurrence], lang)}
                </span>
              )}
              {e.location && (
                <span className="flex items-center gap-0.5 text-[10px] text-red-300">
                  <MapPin className="w-2.5 h-2.5" />
                  {e.location}
                </span>
              )}
            </div>
            {e.description && <p className="text-[11px] text-blue-300/70 mt-0.5">{e.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
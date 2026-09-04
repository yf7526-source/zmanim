import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { getSunPosition, formatTimeDiff } from '../lib/sunCalc';

export default function TimeQuery({ lat, lng, date, sunTimes, posek }) {
  const [open, setOpen] = useState(false);
  const [queryTime, setQueryTime] = useState('12:00');

  if (!lat || !lng) return null;

  const [h, m] = queryTime.split(':').map(Number);
  const qt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0);
  const pos = getSunPosition(qt, lat, lng);

  const toNetz = sunTimes?.netz ? qt.getTime() - sunTimes.netz.getTime() : null;
  const toShkiah = sunTimes?.shkiah ? qt.getTime() - sunTimes.shkiah.getTime() : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
      <button
        className="w-full flex items-center justify-between text-xs text-muted-foreground font-medium tracking-wide uppercase"
        onClick={() => setOpen(o => !o)}
      >
        <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Query a specific time</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <input
            type="time"
            value={queryTime}
            onChange={e => setQueryTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:border-amber-400/40 [color-scheme:dark]"
          />
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-amber-500/10 border border-amber-400/20 p-2">
              <p className="text-xs text-muted-foreground">Elevation</p>
              <p className="text-base font-bold text-amber-300">{pos.altitude >= 0 ? '+' : ''}{pos.altitude.toFixed(2)}°</p>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-2">
              <p className="text-xs text-muted-foreground">From Netz</p>
              <p className="text-base font-bold text-sky-300">{toNetz !== null ? formatTimeDiff(toNetz) : '--'}</p>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-2">
              <p className="text-xs text-muted-foreground">From Shkiah</p>
              <p className="text-base font-bold text-purple-300">{toShkiah !== null ? formatTimeDiff(toShkiah) : '--'}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">Azimuth: {pos.azimuth.toFixed(1)}°</p>
        </div>
      )}
    </div>
  );
}
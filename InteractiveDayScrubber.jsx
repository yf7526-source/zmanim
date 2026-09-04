import React, { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';

function getMinutesInZone(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(date);
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return Number(map.hour || 0) * 60 + Number(map.minute || 0);
  } catch {
    return date.getHours() * 60 + date.getMinutes();
  }
}

function labelForMinutes(minutes, hour12) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  if (!hour12) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function InteractiveDayScrubber({ currentTime, locationTz, hour12 = true, onChange, onNow }) {
  const minutes = useMemo(() => getMinutesInZone(currentTime, locationTz), [currentTime, locationTz]);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm" aria-label="Day time explorer">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/45 font-semibold">Explore the day</p>
          <p className="text-sm font-mono font-bold text-yellow-300 tabular-nums">{labelForMinutes(minutes, hour12)}</p>
        </div>
        <button type="button" onClick={onNow} className="min-h-[44px] px-3 rounded-xl bg-white/8 border border-white/10 hover:bg-white/15 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold text-white/75" aria-label="Return to current time">
          <RotateCcw className="w-3.5 h-3.5" /> Now
        </button>
      </div>
      <input
        type="range"
        aria-label="Explore time of day"
        min="0"
        max="1439"
        step="5"
        value={minutes}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className="w-full accent-yellow-400 min-h-[44px] cursor-pointer"
        aria-valuetext={labelForMinutes(minutes, hour12)}
      />
      <div className="flex justify-between text-[10px] text-white/35 font-mono px-0.5">
        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
      </div>
    </div>
  );
}
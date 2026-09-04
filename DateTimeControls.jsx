import React from 'react';
import { Calendar, Clock, RotateCcw } from 'lucide-react';

export default function DateTimeControls({ selectedDate, selectedTimeStr, onDateChange, onTimeChange, onReset }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">תאריך ושעה / Date & Time</span>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Now
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400/60 pointer-events-none" />
          <input
            type="date"
            aria-label="Select date"
            value={selectedDate}
            onChange={e => onDateChange(e.target.value)}
            className="w-full pl-8 pr-2 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:border-amber-400/40 transition-all [color-scheme:dark]"
          />
        </div>

        <div className="relative">
          <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400/60 pointer-events-none" />
          <input
            type="time"
            aria-label="Select time"
            value={selectedTimeStr}
            onChange={e => onTimeChange(e.target.value)}
            className="w-full pl-8 pr-2 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:border-amber-400/40 transition-all [color-scheme:dark]"
          />
        </div>
      </div>
    </div>
  );
}
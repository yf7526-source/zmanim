import React from 'react';
import { formatTime, minutesUntil } from '@/lib/sunCalc';

export default function SunInfoBar({ zmanim, now, altitude }) {
  if (!zmanim) return null;

  const { netz, shkiah } = zmanim;
  const minsToNetz = netz ? minutesUntil(netz, now) : null;
  const minsToShkiah = shkiah ? minutesUntil(shkiah, now) : null;

  const sunPhase = () => {
    if (!netz || !shkiah) return { label: 'Unknown', color: 'text-muted-foreground' };
    if (now < netz) {
      const mins = Math.abs(minsToNetz);
      if (mins > 120) return { label: 'Night', color: 'text-indigo-300' };
      if (mins > 18) return { label: 'Pre-Dawn', color: 'text-purple-400' };
      return { label: 'Dawn Twilight', color: 'text-orange-300' };
    }
    if (now > shkiah) {
      const mins = Math.abs(minsToShkiah);
      if (mins > 72) return { label: 'Night', color: 'text-indigo-300' };
      return { label: 'Dusk Twilight', color: 'text-orange-300' };
    }
    const dayPct = (now - netz) / (shkiah - netz);
    if (dayPct < 0.1) return { label: 'Golden Hour ↑', color: 'text-amber-400' };
    if (dayPct > 0.9) return { label: 'Golden Hour ↓', color: 'text-amber-400' };
    return { label: 'Daytime', color: 'text-sky-300' };
  };

  const phase = sunPhase();

  return (
    <div className="grid grid-cols-3 gap-3 text-center">
      {/* Netz */}
      <div className="bg-secondary/60 rounded-xl p-3 border border-border/50">
        <div className="text-xs text-muted-foreground mb-1 font-hebrew">נץ החמה</div>
        <div className="text-lg font-bold text-gold font-mono">{formatTime(netz)}</div>
        <div className="text-xs mt-1">
          {minsToNetz !== null && minsToNetz > 0
            ? <span className="text-primary">in {minsToNetz}m</span>
            : <span className="text-muted-foreground">{Math.abs(minsToNetz)}m ago</span>}
        </div>
      </div>

      {/* Current phase */}
      <div className="bg-secondary/60 rounded-xl p-3 border border-border/50">
        <div className="text-xs text-muted-foreground mb-1">Phase</div>
        <div className={`text-base font-bold ${phase.color}`}>{phase.label}</div>
        <div className="text-xs mt-1 font-mono text-foreground/70">
          {altitude >= 0 ? '+' : ''}{altitude.toFixed(1)}°
        </div>
      </div>

      {/* Shkiah */}
      <div className="bg-secondary/60 rounded-xl p-3 border border-border/50">
        <div className="text-xs text-muted-foreground mb-1 font-hebrew">שקיעה</div>
        <div className="text-lg font-bold text-gold font-mono">{formatTime(shkiah)}</div>
        <div className="text-xs mt-1">
          {minsToShkiah !== null && minsToShkiah > 0
            ? <span className="text-primary">in {minsToShkiah}m</span>
            : <span className="text-muted-foreground">{Math.abs(minsToShkiah)}m ago</span>}
        </div>
      </div>
    </div>
  );
}
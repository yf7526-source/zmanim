import React from 'react';
import { Activity, Compass, MapPin, Mountain, Clock3 } from 'lucide-react';

function value(v, suffix = '') {
  return Number.isFinite(Number(v)) ? `${Number(v).toFixed(2)}${suffix}` : '—';
}

export default function TechnicalDetailsCard({ sunPos, location, locationTz, horizonConfig, currentTime }) {
  const rows = [
    { icon: Activity, label: 'Sun altitude', value: value(sunPos?.altitude, '°') },
    { icon: Compass, label: 'Sun azimuth', value: value(sunPos?.azimuth, '°') },
    { icon: MapPin, label: 'Coordinates', value: `${value(location?.lat, '°')}, ${value(location?.lng, '°')}` },
    { icon: Mountain, label: 'Elevation', value: `${Math.round(Number(location?.elevation) || 0)} m` },
    { icon: Clock3, label: 'Timezone', value: locationTz || '—' },
  ];
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-cyan-200/80">Technical details</p>
          <p className="text-[11px] text-white/35 mt-0.5">Live calculation inputs and sky position</p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-lg bg-cyan-400/10 text-cyan-200/70 border border-cyan-300/10">{horizonConfig?.mode || 'none'} horizon</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {rows.map(({ icon: Icon, label, value: rowValue }) => (
          <div key={label} className="rounded-xl bg-white/5 border border-white/5 p-3 min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] text-white/40"><Icon className="w-3 h-3" />{label}</div>
            <div className="text-xs sm:text-sm font-mono font-semibold text-white/80 mt-1 truncate" title={rowValue}>{rowValue}</div>
          </div>
        ))}
      </div>
      {currentTime && <div className="text-[10px] text-white/30 mt-3 font-mono">Selected instant: {currentTime.toISOString()}</div>}
    </div>
  );
}

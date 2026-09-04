import React, { useMemo, useState } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getSunPosition } from '@/lib/sunCalc';
import { Sun } from 'lucide-react';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_LABELS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

// Curated seasonal months to avoid clutter — solstices, equinoxes, and mid-season
const SEASONAL_MONTHS = [11, 1, 5, 7]; // Dec, Feb, Jun, Aug — representative of each season
const SEASONAL_MONTHS_FULL = [11, 2, 5, 8]; // Dec, Mar, Jun, Sep — solstice/equinox months

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#a855f7', '#ec4899'];

function CustomTooltip({ active, payload, label, lang }) {
  if (!active || !payload || payload.length === 0) return null;
  const hour = Math.floor(label);
  const min = Math.round((label - hour) * 60);
  const timeStr = `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
  return (
    <div className="rounded-xl bg-[#0a111c] border border-white/15 px-3 py-2 shadow-xl">
      <div className="text-xs font-bold text-yellow-300 mb-1.5">{timeStr}</div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px] mb-0.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
          <span className="text-white/70">{entry.name}</span>
          <span className="font-mono font-bold text-white/90">{entry.value?.toFixed(1)}°</span>
        </div>
      ))}
    </div>
  );
}

export default function SeasonalSunOverlay({ location, date, lang = 'en', locationTz }) {
  const [mode, setMode] = useState('seasonal'); // 'seasonal' | 'all'

  const data = useMemo(() => {
    if (!location?.lat || !location?.lng) return [];
    const year = date?.getFullYear() || new Date().getFullYear();
    const months = mode === 'all' ? Array.from({ length: 12 }, (_, i) => i) : SEASONAL_MONTHS;

    // Sample every 30 minutes (48 points)
    const points = [];
    for (let h = 0; h <= 24; h += 0.5) {
      const point = { hour: h };
      for (const m of months) {
        // Use 15th of each month as representative day
        const d = new Date(year, m, 15, Math.floor(h), (h % 1) * 60, 0, 0);
        const pos = getSunPosition(d, location.lat, location.lng);
        point[`m${m}`] = parseFloat(pos.altitude.toFixed(2));
      }
      points.push(point);
    }
    return { points, months };
  }, [location?.lat, location?.lng, date, mode]);

  if (!data?.points) return null;

  const { points, months } = data;
  const he = lang === 'he';
  const monthLabels = he ? MONTH_LABELS_HE : MONTH_LABELS;

  return (
    <div className="rounded-3xl border border-white/8 bg-white/4 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
          <Sun className="w-4 h-4 text-yellow-400" />
          {he ? 'מסלולי שמש עונתיים' : 'Seasonal Sun Paths'}
        </h3>
        <div className="flex gap-1.5">
          <button
            onClick={() => setMode('seasonal')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
              mode === 'seasonal' ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300' : 'bg-white/5 border-white/10 text-white/40'
            }`}
          >
            {he ? 'עונתי' : 'Seasonal'}
          </button>
          <button
            onClick={() => setMode('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
              mode === 'all' ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300' : 'bg-white/5 border-white/10 text-white/40'
            }`}
          >
            {he ? 'כל החודשים' : 'All Months'}
          </button>
        </div>
      </div>
      <p className="text-[11px] text-white/35 mb-3">
        {he
          ? 'גובה השמש לאורך היום בחודשים שונים — השוואת שינוי עונתי'
          : 'Sun altitude throughout the day across different months — compare seasonal shifts'}
      </p>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={points} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
          <defs>
            {months.map((m, i) => (
              <linearGradient key={m} id={`grad-m${m}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="hour"
            type="number"
            domain={[0, 24]}
            ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
            tickFormatter={(h) => `${String(Math.floor(h)).padStart(2,'0')}:00`}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            stroke="rgba(255,255,255,0.1)"
          />
          <YAxis
            domain={[-90, 90]}
            ticks={[-60, -30, 0, 30, 60, 90]}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            tickFormatter={(v) => `${v}°`}
            stroke="rgba(255,255,255,0.1)"
            label={{ value: he ? 'גובה (°)' : 'Altitude (°)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip lang={lang} />} />
          <ReferenceLine y={0} stroke="rgba(255,200,80,0.4)" strokeDasharray="4 4" label={{ value: he ? 'אופק' : 'Horizon', fill: 'rgba(255,200,80,0.6)', fontSize: 10 }} />
          {months.map((m, i) => (
            <Line
              key={m}
              type="monotone"
              dataKey={`m${m}`}
              name={monthLabels[m]}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
        {months.map((m, i) => (
          <div key={m} className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-[10px] text-white/50 font-medium">{monthLabels[m]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
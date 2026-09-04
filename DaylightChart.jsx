import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { getSunTimes } from '../lib/sunCalc';
import { Sun } from 'lucide-react';

function buildWeeklyData(centerDate, lat, lng, horizonDeg = 0) {
  const data = [];
  for (let w = -26; w <= 26; w++) {
    const d = new Date(centerDate);
    d.setDate(d.getDate() + w * 7);
    d.setHours(0, 0, 0, 0);
    const st = getSunTimes(d, lat, lng, '16.1', '8.5', horizonDeg);
    if (!st || !st.netz || !st.shkiah) continue;
    const hours = (st.shkiah - st.netz) / 3600000;
    data.push({
      week: w,
      hours: parseFloat(hours.toFixed(2)),
      label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    });
  }
  return data;
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { label, hours } = payload[0].payload;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return (
    <div className="bg-[#0d1420] border border-yellow-500/30 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-white/50 mb-0.5">{label}</p>
      <p className="text-yellow-300 font-bold">{h}h {m}m daylight</p>
    </div>
  );
};

export default function DaylightChart({ location, date, elevation = 0 }) {
  const data = useMemo(() => {
    if (!location) return [];
    return buildWeeklyData(date, location.lat, location.lng, elevation || 0);
  }, [location?.lat, location?.lng, date?.toDateString(), elevation]);

  if (!data.length) return null;

  const todayIdx = data.findIndex(d => d.week === 0);
  const todayHours = todayIdx >= 0 ? data[todayIdx].hours : null;
  const maxH = Math.max(...data.map(d => d.hours));
  const minH = Math.min(...data.map(d => d.hours));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-yellow-400/15 border border-yellow-400/25 flex items-center justify-center">
            <Sun className="w-3.5 h-3.5 text-yellow-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white/80">Daylight Through the Year</h3>
            <p className="text-xs text-white/30 mt-0.5">Weekly sunrise→sunset duration</p>
          </div>
        </div>
        {todayHours && (
          <div className="text-right">
            <div className="text-base font-bold text-yellow-300 tabular-nums">
              {Math.floor(todayHours)}h {Math.round((todayHours % 1) * 60)}m
            </div>
            <div className="text-xs text-white/30">today</div>
          </div>
        )}
      </div>

      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="daylightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f0c060" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f0c060" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              interval={3}
              tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[Math.floor(minH - 0.5), Math.ceil(maxH + 0.5)]}
              tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}h`}
            />
            <Tooltip content={<CustomTooltip />} />
            {todayIdx >= 0 && (
              <ReferenceLine
                x={data[todayIdx].label}
                stroke="rgba(240,192,96,0.6)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                label={{ value: 'today', position: 'top', fill: 'rgba(240,192,96,0.5)', fontSize: 8 }}
              />
            )}
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#f0c060"
              strokeWidth={2}
              fill="url(#daylightGrad)"
              dot={false}
              activeDot={{ r: 3, fill: '#f0c060', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between text-xs text-white/20 mt-2 px-1">
        <span>↑ {Math.floor(maxH)}h {Math.round((maxH % 1) * 60)}m longest</span>
        <span>↓ {Math.floor(minH)}h {Math.round((minH % 1) * 60)}m shortest</span>
      </div>
    </div>
  );
}
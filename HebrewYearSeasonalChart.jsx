import React, { useMemo, useState } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer
} from 'recharts';
import { getSunTimes, toHebrewDate } from '../lib/sunCalc';
import { getHourInTz } from '../lib/timezone';

// Hebrew month names (1=Nisan … 7=Tishri … 13=Adar II)
const MONTHS_EN = ['','Nisan','Iyar','Sivan','Tammuz','Av','Elul','Tishri','Cheshvan','Kislev','Tevet','Shvat','Adar','Adar II'];
const MONTHS_HE = ['','ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשון','כסלו','טבת','שבט','אדר','אדר ב׳'];

function formatHour(h) {
  if (h == null || isNaN(h)) return '--';
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const ampm = hh < 12 ? 'AM' : 'PM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
}

/** Find the Gregorian date of 1 Tishri for a given Hebrew year by binary search */
function tishri1ToGregorian(hebrewYear) {
  // Approximate: Hebrew year 5784 ≈ Sep 15, 2023
  const approxYear = 2000 + (hebrewYear - 5760);
  let d = new Date(approxYear, 7, 1); // start around Aug 1
  for (let i = 0; i < 400; i++) {
    const hd = toHebrewDate(d);
    if (hd && hd.month === 7 && hd.day === 1) return d;
    if (hd && (hd.year > hebrewYear || (hd.year === hebrewYear && hd.month > 7))) {
      d.setDate(d.getDate() - 1);
    } else {
      d.setDate(d.getDate() + 1);
    }
  }
  return d;
}

function buildData(startDate, lat, lng, tz, horizonDeg = 0) {
  const data = [];
  let sawElul = false;
  // Sample every 3 days — 400 covers leap years (~384 days) with margin
  for (let offset = 0; offset <= 400; offset += 3) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + offset);
    d.setHours(12, 0, 0, 0);

    const hd = toHebrewDate(d);
    if (!hd) continue;

    // Stop once we've completed the full Hebrew year (Tishri → Elul → next Tishri)
    if (sawElul && hd.month === 7) break;
    if (hd.month === 6) sawElul = true;

    const st = getSunTimes(d, lat, lng, '16.1', '8.5', horizonDeg);
    if (!st?.netz || !st?.shkiah) continue;

    const daylight = (st.shkiah - st.netz) / 3600000;
    const sunrise = getHourInTz(st.netz, tz);
    const sunset  = getHourInTz(st.shkiah, tz);

    data.push({
      offset,
      daylight: parseFloat(daylight.toFixed(2)),
      sunrise:  parseFloat(sunrise.toFixed(2)),
      sunset:   parseFloat(sunset.toFixed(2)),
      gregorianLabel: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      hebrewDay: hd.day,
      hebrewMonth: hd.month,
      monthLabelEn: MONTHS_EN[hd.month] || '',
      monthLabelHe: MONTHS_HE[hd.month] || '',
    });
  }
  return data;
}

function getMonthTicks(data) {
  if (!data.length) return [];
  const ticks = [data[0]];
  const seen = new Set([data[0].hebrewMonth]);
  for (let i = 1; i < data.length; i++) {
    if (data[i].hebrewMonth !== data[i - 1].hebrewMonth && !seen.has(data[i].hebrewMonth)) {
      ticks.push(data[i]);
      seen.add(data[i].hebrewMonth);
    }
  }
  return ticks;
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const dh = Math.floor(d.daylight);
  const dm = Math.round((d.daylight - dh) * 60);
  return (
    <div className="bg-[#0d1420] border border-white/15 rounded-xl px-3 py-2.5 text-xs shadow-xl space-y-1">
      <p className="text-white/50">{d.gregorianLabel}</p>
      <p className="text-yellow-400/80 font-semibold" dir="rtl">{d.hebrewDay} {d.monthLabelHe}</p>
      <div className="border-t border-white/8 pt-1 mt-1 space-y-0.5">
        <p className="text-yellow-300 font-bold">☀ {dh}h {dm}m daylight</p>
        <p className="text-sky-300 font-semibold">🌅 Sunrise {formatHour(d.sunrise)}</p>
        <p className="text-orange-300 font-semibold">🌇 Sunset {formatHour(d.sunset)}</p>
      </div>
    </div>
  );
};

export default function HebrewYearSeasonalChart({ location, date, lang = 'both', locationTz, elevation = 0 }) {
  const [mode, setMode] = useState('both'); // 'both' | 'daylight' | 'sunrise' | 'sunset'

  const { data, todayOffset, heYear } = useMemo(() => {
    if (!location) return { data: [], todayOffset: 0, heYear: 5786 };

    const hd = toHebrewDate(date);
    if (!hd) return { data: [], todayOffset: 0, heYear: 5786 };

    const heYear = hd.year;
    const startDate = tishri1ToGregorian(heYear);
    startDate._heYear = heYear;

    const rows = buildData(startDate, location.lat, location.lng, locationTz, elevation || 0);

    // Find today's offset
    const todayMs = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12).getTime();
    const startMs = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 12).getTime();
    const todayOffset = Math.round((todayMs - startMs) / 86400000);

    return { data: rows, todayOffset, heYear };
  }, [location?.lat, location?.lng, date?.toDateString(), elevation]);

  const monthTicks = useMemo(() => getMonthTicks(data), [data]);

  // Compute actual current-day values (not the nearest 3-day sample)
  const todayActual = useMemo(() => {
    if (!location || !date) return null;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
    const st = getSunTimes(d, location.lat, location.lng, '16.1', '8.5', elevation || 0);
    if (!st?.netz || !st?.shkiah) return null;
    const daylight = (st.shkiah - st.netz) / 3600000;
    return {
      daylight: parseFloat(daylight.toFixed(2)),
      sunrise: parseFloat((getHourInTz(st.netz, locationTz) ?? 0).toFixed(2)),
      sunset: parseFloat((getHourInTz(st.shkiah, locationTz) ?? 0).toFixed(2)),
    };
  }, [location?.lat, location?.lng, date?.toDateString(), elevation]);

  if (!data.length) return null;

  const todayPt = data.reduce((best, d) => Math.abs(d.offset - todayOffset) < Math.abs(best.offset - todayOffset) ? d : best, data[0]);

  const maxDaylight = Math.max(...data.map(d => d.daylight));
  const minDaylight = Math.min(...data.map(d => d.daylight));
  const maxSunrise  = Math.max(...data.map(d => d.sunrise));
  const minSunrise  = Math.min(...data.map(d => d.sunrise));
  const maxSunset   = Math.max(...data.map(d => d.sunset));
  const minSunset   = Math.min(...data.map(d => d.sunset));

  const daylightDomain = [Math.floor(minDaylight - 0.3), Math.ceil(maxDaylight + 0.3)];
  // Sunrise and sunset share the same time-of-day Y axis
  const timeDomain = [Math.floor(Math.min(minSunrise, minSunset) - 0.2), Math.ceil(Math.max(maxSunrise, maxSunset) + 0.2)];
  const sunriseDomain = timeDomain;

  const lastOffset = data.length ? data[data.length - 1].offset : 0;
  const xTicks = monthTicks.map(t => t.offset);
  const isLeap = (7 * heYear + 1) % 19 < 7;
  const tickFormatter = (v) => {
    const m = monthTicks.find(t => t.offset === v);
    if (!m) return '';
    if (lang === 'he') {
      if (m.hebrewMonth === 13) return 'אדר ב׳';
      if (m.hebrewMonth === 12 && isLeap) return 'אדר א׳';
      return m.monthLabelHe;
    }
    if (m.hebrewMonth === 13) return 'Ad II';
    if (m.hebrewMonth === 12 && isLeap) return 'Ad I';
    return m.monthLabelEn.slice(0, 3);
  };

  // Hebrew year string (e.g. תשפ״ו)
  const yearStr = (() => {
    const ones = ['','א','ב','ג','ד','ה','ו','ז','ח','ט'];
    const tens = ['','י','כ','ל','מ','נ','ס','ע','פ','צ'];
    const toHNum = n => { const m = n % 100; if (m === 15) return 'טו'; if (m === 16) return 'טז'; return tens[Math.floor(m/10)] + ones[m%10]; };
    const hundreds = ['','ק','ר','ש','ת','תק','תר','תש','תת','תתק'];
    const mod = heYear % 1000;
    return hundreds[Math.floor(mod/100)] + toHNum(mod % 100);
  })();

  return (
    <div className="rounded-3xl border border-white/8 bg-white/4 backdrop-blur-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-white/80">
            🗓 {lang === 'he' ? `שנת ${yearStr} — אורך יום וזריחה` : `Hebrew Year ${yearStr} — Seasonal Chart`}
          </h3>
          <p className="text-xs text-white/30 mt-0.5">
            {lang === 'he' ? 'מתשרי עד אלול — כל יום מסומן כל 3 ימים' : 'Tishri → Elul · sampled every 3 days'}
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: 'both',    label: '☀+🌅+🌇' },
            { key: 'daylight', label: '☀' },
            { key: 'sunrise',  label: '🌅' },
            { key: 'sunset',   label: '🌇' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setMode(opt.key)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === opt.key
                  ? 'bg-yellow-500/25 border border-yellow-400/40 text-yellow-300'
                  : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats — clickable toggle buttons, always visible */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setMode(mode === 'daylight' ? 'both' : 'daylight')}
          className={`text-left rounded-xl px-2.5 py-2 space-y-0.5 transition-all ${
            mode === 'daylight' || mode === 'both'
              ? 'bg-yellow-500/15 border border-yellow-400/40'
              : 'bg-white/4 border border-white/8 opacity-50 hover:opacity-80'
          }`}>
          <p className="text-[9px] text-white/40 uppercase tracking-wider">☀ Daylight</p>
          <p className="text-sm font-bold text-yellow-300 tabular-nums">
            {todayActual ? `${Math.floor(todayActual.daylight)}h ${Math.round((todayActual.daylight % 1) * 60)}m` : '--'}
          </p>
          <p className="text-[9px] text-white/30">
            Max {Math.floor(maxDaylight)}h{Math.round((maxDaylight%1)*60)}m
          </p>
        </button>
        <button
          onClick={() => setMode(mode === 'sunrise' ? 'both' : 'sunrise')}
          className={`text-left rounded-xl px-2.5 py-2 space-y-0.5 transition-all ${
            mode === 'sunrise' || mode === 'both'
              ? 'bg-sky-500/15 border border-sky-400/40'
              : 'bg-white/4 border border-white/8 opacity-50 hover:opacity-80'
          }`}>
          <p className="text-[9px] text-white/40 uppercase tracking-wider">🌅 Sunrise</p>
          <p className="text-sm font-bold text-sky-300 tabular-nums">{todayActual ? formatHour(todayActual.sunrise) : '--'}</p>
          <p className="text-[9px] text-white/30">
            Early {formatHour(minSunrise)}
          </p>
        </button>
        <button
          onClick={() => setMode(mode === 'sunset' ? 'both' : 'sunset')}
          className={`text-left rounded-xl px-2.5 py-2 space-y-0.5 transition-all ${
            mode === 'sunset' || mode === 'both'
              ? 'bg-orange-500/15 border border-orange-400/40'
              : 'bg-white/4 border border-white/8 opacity-50 hover:opacity-80'
          }`}>
          <p className="text-[9px] text-white/40 uppercase tracking-wider">🌇 Sunset</p>
          <p className="text-sm font-bold text-orange-300 tabular-nums">{todayActual ? formatHour(todayActual.sunset) : '--'}</p>
          <p className="text-[9px] text-white/30">
            Late {formatHour(maxSunset)}
          </p>
        </button>
      </div>

      {/* Chart */}
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="hycDaylightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f0c060" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f0c060" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="hycSunriseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#7dd3fc" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#7dd3fc" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="hycSunsetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#fb923c" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#fb923c" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="offset"
              type="number"
              domain={[0, lastOffset]}
              ticks={xTicks}
              tickFormatter={tickFormatter}
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              yAxisId="daylight"
              domain={daylightDomain}
              tick={mode === 'daylight' || mode === 'both' ? { fill: 'rgba(240,192,96,0.55)', fontSize: 9 } : false}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}h`}
              width={mode === 'daylight' || mode === 'both' ? 28 : 0}
              hide={mode !== 'daylight' && mode !== 'both'}
            />
            <YAxis
              yAxisId="sunrise"
              orientation="right"
              domain={timeDomain}
              tick={mode !== 'daylight' ? { fill: 'rgba(125,211,252,0.55)', fontSize: 9 } : false}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => formatHour(v).replace(' AM','a').replace(' PM','p')}
              width={mode !== 'daylight' ? 34 : 0}
              hide={mode === 'daylight'}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Month grid lines */}
            {monthTicks.map(t => (
              <ReferenceLine
                key={t.offset}
                yAxisId="daylight"
                x={t.offset}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            ))}

            {/* Today marker */}
            <ReferenceLine
              yAxisId="daylight"
              x={todayPt.offset}
              stroke="rgba(240,192,96,0.6)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              label={{ value: lang === 'he' ? 'היום' : 'today', position: 'top', fill: 'rgba(240,192,96,0.5)', fontSize: 8 }}
            />

            {(mode === 'both' || mode === 'daylight') && (
              <Area
                yAxisId="daylight"
                type="monotone"
                dataKey="daylight"
                stroke="#f0c060"
                strokeWidth={2}
                fill="url(#hycDaylightGrad)"
                dot={false}
                activeDot={{ r: 3, fill: '#f0c060', strokeWidth: 0 }}
              />
            )}

            {(mode === 'both' || mode === 'sunrise') && (
              <Line
                yAxisId="sunrise"
                type="monotone"
                dataKey="sunrise"
                stroke="#7dd3fc"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: '#7dd3fc', strokeWidth: 0 }}
              />
            )}
            {(mode === 'both' || mode === 'sunset') && (
              <Line
                yAxisId="sunrise"
                type="monotone"
                dataKey="sunset"
                stroke="#fb923c"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: '#fb923c', strokeWidth: 0 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-1 text-xs text-white/35 flex-wrap">
        {(mode === 'both' || mode === 'daylight') && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-yellow-400 inline-block rounded" />
            {lang === 'he' ? 'אורך יום' : 'Daylight'}
          </span>
        )}
        {(mode === 'both' || mode === 'sunrise') && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-sky-300 inline-block rounded" />
            {lang === 'he' ? 'זריחה' : 'Sunrise'}
          </span>
        )}
        {(mode === 'both' || mode === 'sunset') && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-orange-400 inline-block rounded" />
            {lang === 'he' ? 'שקיעה' : 'Sunset'}
          </span>
        )}
      </div>
    </div>
  );
}
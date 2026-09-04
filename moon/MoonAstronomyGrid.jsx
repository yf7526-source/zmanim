import React from 'react';
import { Compass, ArrowUp, Sunrise, Sunset, Lightbulb, Eye } from 'lucide-react';
import { formatTimeInTz } from '../../lib/timezone';

function fmtTime(date, hour12, tz) {
  return formatTimeInTz(date, tz, hour12);
}

function fmtDuration(ms) {
  if (!ms || isNaN(ms) || ms <= 0) return '--';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function azimuthToCompass(az) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(az / 22.5) % 16];
}

export default function MoonAstronomyGrid({ moonPos, moonTimes, nightTimes, illumination, lang = 'both', hour12 = true, locationTz }) {
  const showHe = lang === 'he' || lang === 'both';
  const showEn = lang === 'en' || lang === 'both';

  // Compute total time the moon is above the horizon during the night window (sunset→sunrise)
  function intervalOverlap(a1, a2, b1, b2) {
    const start = Math.max(a1, b1);
    const end = Math.min(a2, b2);
    return end > start ? end - start : 0;
  }

  let visibilityMs = null;
  if (nightTimes?.sunset && nightTimes?.sunrise) {
    const nightStart = nightTimes.sunset.getTime();
    const nightEnd = nightTimes.sunrise.getTime();
    const dayStart = new Date(nightTimes.sunset.getFullYear(), nightTimes.sunset.getMonth(), nightTimes.sunset.getDate(), 0, 0, 0).getTime();
    const windowEnd = dayStart + 48 * 3600000;

    // Build moon above-horizon intervals within the 48h scan window
    const moonIntervals = [];
    if (moonTimes?.moonUpAtStart) {
      if (moonTimes.moonset) moonIntervals.push([dayStart, moonTimes.moonset.getTime()]);
      if (moonTimes.moonrise) moonIntervals.push([moonTimes.moonrise.getTime(), windowEnd]);
    } else if (moonTimes?.moonrise && moonTimes?.moonset) {
      moonIntervals.push([moonTimes.moonrise.getTime(), moonTimes.moonset.getTime()]);
    }

    visibilityMs = moonIntervals.reduce(
      (sum, [s, e]) => sum + intervalOverlap(s, e, nightStart, nightEnd),
      0
    );
    if (visibilityMs <= 0) visibilityMs = null;
  }

  const bigCells = [
    { icon: Sunrise, labelEn: 'Moonrise', labelHe: 'זריחת ירח', value: moonTimes?.moonrise ? fmtTime(moonTimes.moonrise, hour12, locationTz) : (moonTimes?.moonUpAtStart ? (showEn ? 'Already up' : 'מעלה') : '--:--'), color: 'text-indigo-300' },
    { icon: Sunset, labelEn: 'Moonset', labelHe: 'שקיעת ירח', value: moonTimes?.moonset ? fmtTime(moonTimes.moonset, hour12, locationTz) : '--:--', color: 'text-orange-300' },
  ];

  const cells = [
    { icon: Compass, labelEn: 'Azimuth', labelHe: 'אזימוט', value: `${Math.round(moonPos.azimuth)}° ${azimuthToCompass(moonPos.azimuth)}`, color: 'text-sky-300' },
    { icon: ArrowUp, labelEn: 'Altitude', labelHe: 'גובה', value: `${moonPos.altitude >= 0 ? '+' : ''}${moonPos.altitude.toFixed(1)}°`, color: 'text-emerald-300' },
    { icon: Lightbulb, labelEn: 'Illumination', labelHe: 'הארה', value: `${illumination}%`, color: 'text-yellow-300' },
    { icon: Eye, labelEn: 'Visibility', labelHe: 'ראות', value: visibilityMs ? fmtDuration(visibilityMs) : '--', color: 'text-purple-300' },
  ];

  return (
    <div className="rounded-2xl bg-white/4 border border-white/8 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base">🌡</span>
        <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">
          {showHe && <span dir="rtl">נתונים אסטרונומיים</span>}
          {lang === 'both' && ' · '}
          {showEn && <span>Astronomical Data</span>}
        </h3>
      </div>

      {/* Moonrise & Moonset — large side-by-side */}
      <div className="grid grid-cols-2 gap-2.5">
        {bigCells.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="rounded-xl bg-white/5 border border-white/8 px-3 py-3.5 text-center">
              <Icon className="w-4 h-4 mx-auto mb-1.5 opacity-70" />
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1 truncate">
                {showHe && <span dir="rtl">{c.labelHe}</span>}
                {lang === 'both' && ' · '}
                {showEn && <span>{c.labelEn}</span>}
              </div>
              <div className={`text-sm font-bold font-mono ${c.color} truncate`}>{c.value}</div>
            </div>
          );
        })}
      </div>

      {/* Remaining data — compact grid */}
      <div className="grid grid-cols-4 gap-2">
        {cells.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="rounded-xl bg-white/5 border border-white/8 px-2 py-2 text-center">
              <Icon className="w-3.5 h-3.5 mx-auto mb-1 opacity-60" />
              <div className="text-[9px] text-white/35 uppercase tracking-wider mb-0.5 truncate">
                {showHe && <span dir="rtl">{c.labelHe}</span>}
                {lang === 'both' && ' · '}
                {showEn && <span>{c.labelEn}</span>}
              </div>
              <div className={`text-xs font-bold font-mono ${c.color} truncate`}>{c.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
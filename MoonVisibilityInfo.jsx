import React from 'react';
import { Sunrise, Sunset, Clock, Eye } from 'lucide-react';
import { formatTimeInTz } from '../lib/timezone';

function fmtTime(date, hour12, tz) {
  return formatTimeInTz(date, tz, hour12);
}

function fmtDuration(ms) {
  if (!ms || isNaN(ms) || ms <= 0) return '--';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function MoonVisibilityInfo({ moonTimes, date, lang = 'both', hour12 = true, locationTz }) {
  const showHe = lang === 'he' || lang === 'both';
  const showEn = lang === 'en' || lang === 'both';

  const { moonrise, moonset, moonUpAtStart } = moonTimes;

  let durationMs = null;
  if (moonrise && moonset && moonset > moonrise) {
    durationMs = moonset.getTime() - moonrise.getTime();
  } else if (moonUpAtStart && moonset) {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    durationMs = moonset.getTime() - dayStart.getTime();
  }

  const now = new Date();
  let currentlyVisible = false;
  if (moonUpAtStart && moonset && now < moonset) {
    currentlyVisible = true;
  } else if (moonrise && moonset && now >= moonrise && now < moonset) {
    currentlyVisible = true;
  } else if (moonrise && !moonset && now >= moonrise) {
    currentlyVisible = true;
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-400/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base">🔭</span>
        <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">
          {showHe && <span dir="rtl">ראות הירח</span>}
          {lang === 'both' && ' · '}
          {showEn && <span>Moon Visibility</span>}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-white/5 border border-white/8 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Sunrise className="w-3.5 h-3.5 text-indigo-300" />
            <div className="text-[10px] text-white/40 font-semibold">
              {showHe && <span dir="rtl">זריחת ירח</span>}
              {lang === 'both' && ' · '}
              {showEn && <span>Moonrise</span>}
            </div>
          </div>
          <div className="text-sm font-bold text-indigo-200 font-mono">
            {moonUpAtStart && !moonrise ? (showEn ? 'Already up' : 'מעלה') : fmtTime(moonrise, hour12, locationTz)}
          </div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/8 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Sunset className="w-3.5 h-3.5 text-indigo-300" />
            <div className="text-[10px] text-white/40 font-semibold">
              {showHe && <span dir="rtl">שקיעת ירח</span>}
              {lang === 'both' && ' · '}
              {showEn && <span>Moonset</span>}
            </div>
          </div>
          <div className="text-sm font-bold text-indigo-200 font-mono">
            {moonset ? fmtTime(moonset, hour12, locationTz) : '--:--'}
          </div>
        </div>
      </div>

      {durationMs != null && (
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Clock className="w-3.5 h-3.5 text-white/30" />
          <span>
            {showEn && `Visible for ${fmtDuration(durationMs)}`}
            {lang === 'both' && ' · '}
            {showHe && <span dir="rtl">גלוי למשך {fmtDuration(durationMs)}</span>}
          </span>
        </div>
      )}

      <div className={`flex items-center gap-2 text-xs font-bold ${currentlyVisible ? 'text-emerald-300' : 'text-white/40'}`}>
        <Eye className="w-3.5 h-3.5" />
        <span>
          {currentlyVisible
            ? (showEn && '✅ Moon is currently visible')
            : (showEn && '🔴 Moon is below horizon')}
          {lang === 'both' && ' · '}
          {currentlyVisible
            ? (showHe && <span dir="rtl">✅ הירח גלוי כעת</span>)
            : (showHe && <span dir="rtl">🔴 הירח מתחת לאופק</span>)}
        </span>
      </div>
    </div>
  );
}
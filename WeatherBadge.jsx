import React, { useState, useEffect } from 'react';
import { WMO_CODES } from '../lib/weatherCodes';
import { getWeatherBundle } from '@/lib/weatherService';

export default function WeatherBadge({ location, lang = 'en', onClick }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!location?.lat || !location?.lng) { setLoading(false); setError(true); return; }
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    getWeatherBundle(location, { signal: controller.signal, timeoutMs: 10000 })
      .then((data) => {
        if (cancelled) return;
        if (data?.current) { setWeather(data.current); }
        else { throw new Error('No data'); }
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return;
        setError(true);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; controller.abort(); };
  }, [location?.lat, location?.lng]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-sm animate-pulse">
        <span className="text-2xl shrink-0">⏳</span>
        <div className="flex-1 min-w-0">
          <div className="h-4 w-20 rounded bg-white/10" />
          <div className="h-3 w-28 rounded bg-white/5 mt-1.5" />
        </div>
      </div>
    );
  }

  // On failure/unavailable: render nothing so the zmanim section moves up naturally.
  // The full weather feature remains accessible via the More menu / forecast sheet.
  if (error || !weather) {
    return null;
  }

  const code = weather.weather_code ?? 0;
  const info = WMO_CODES[code] || WMO_CODES[0];
  const temp = Math.round(weather.temperature_2m ?? 0);
  const cloud = weather.cloud_cover ?? 0;
  const wind = Math.round(weather.wind_speed_10m ?? 0);
  const vis = weather.visibility ? Math.round(weather.visibility / 1000) : null;

  const sunBlocked = cloud >= 75 || info.label.includes('Rain') || info.label.includes('Snow') || info.label.includes('Thunder');

  const he = lang === 'he';
  const both = lang === 'both';
  const BadgeTag = onClick ? 'button' : 'div';

  return (
    <BadgeTag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 rounded-2xl border px-4 py-2.5 backdrop-blur-sm transition-all ${onClick ? 'cursor-pointer hover:bg-yellow-500/15 active:scale-[0.98]' : ''} ${
      sunBlocked
        ? 'bg-gray-500/20 border-gray-400/40'
        : 'bg-yellow-500/10 border-yellow-400/30'
    }`}>
      <span className="text-2xl shrink-0">{info.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-white/90">{temp}°C</span>
          <span className="text-xs text-white/60">{info.label}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/40">
          <span>☁ {cloud}%</span>
          {vis && <span>👁 {vis}km</span>}
          <span>💨 {wind}km/h</span>
        </div>
      </div>
      <div className="text-right shrink-0 max-w-[100px]">
        <div className={`text-xs font-bold ${sunBlocked ? 'text-gray-300' : 'text-yellow-300'}`}>
          {sunBlocked
            ? (he ? 'עננים' : both ? 'Clouds · עננים' : 'Clouds')
            : (he ? 'שמש גלויה' : both ? 'Sun Visible · שמש גלויה' : 'Sun Visible')}
        </div>
      </div>
    </BadgeTag>
  );
}
import React, { useState, useEffect } from 'react';
import { Cloud, Wind, Droplets, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

const WMO_CODES = {
  0: { label: 'Clear', emoji: '☀️' },
  1: { label: 'Mostly Clear', emoji: '🌤️' },
  2: { label: 'Partly Cloudy', emoji: '⛅' },
  3: { label: 'Overcast', emoji: '☁️' },
  45: { label: 'Fog', emoji: '🌫️' },
  48: { label: 'Rime Fog', emoji: '🌫️' },
  51: { label: 'Light Drizzle', emoji: '🌦️' },
  53: { label: 'Drizzle', emoji: '🌦️' },
  55: { label: 'Heavy Drizzle', emoji: '🌧️' },
  61: { label: 'Light Rain', emoji: '🌦️' },
  63: { label: 'Rain', emoji: '🌧️' },
  65: { label: 'Heavy Rain', emoji: '🌧️' },
  71: { label: 'Light Snow', emoji: '🌨️' },
  73: { label: 'Snow', emoji: '❄️' },
  75: { label: 'Heavy Snow', emoji: '❄️' },
  80: { label: 'Light Showers', emoji: '🌦️' },
  81: { label: 'Showers', emoji: '🌧️' },
  82: { label: 'Violent Showers', emoji: '⛈️' },
  95: { label: 'Thunderstorm', emoji: '⛈️' },
  96: { label: 'Thunderstorm + Hail', emoji: '⛈️' },
  99: { label: 'Thunderstorm + Hail', emoji: '⛈️' },
};

function labelToCode(label) {
  const l = (label || '').toLowerCase();
  if (l.includes('partly')) return 2;
  if (l.includes('overcast') || l.includes('cloud')) return 3;
  if (l.includes('fog') || l.includes('mist')) return 45;
  if (l.includes('drizzle')) return 51;
  if (l.includes('rain') && l.includes('light')) return 61;
  if (l.includes('rain')) return 63;
  if (l.includes('snow') && l.includes('light')) return 71;
  if (l.includes('snow')) return 73;
  if (l.includes('thunder')) return 95;
  if (l.includes('shower')) return 81;
  if (l.includes('clear') || l.includes('sunny')) return 0;
  return 1;
}

export default function WeatherCard({ location, lang = 'en', onClick }) {
  const [weather, setWeather] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!location?.lat || !location?.lng) { setError(true); setLoading(false); return; }
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(false);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,weather_code,cloud_cover,relative_humidity_2m,wind_speed_10m&hourly=temperature_2m,weather_code&forecast_days=2&timezone=auto`;

    // Try direct fetch first; fall back to InvokeLLM with web search on failure
    fetchWithTimeout(url, { signal: controller.signal, timeoutMs: 10000 })
      .then(r => { if (!r.ok) throw new Error(`Weather HTTP ${r.status}`); return r.json(); })
      .then(data => {
        if (cancelled) return;
        if (data?.current) {
          setWeather(data.current);
          if (data?.hourly?.time) {
            const now = Date.now();
            const upcoming = data.hourly.time
              .map((t, i) => ({
                time: new Date(t),
                temp: data.hourly.temperature_2m?.[i],
                code: data.hourly.weather_code?.[i],
              }))
              .filter(h => h.time.getTime() > now)
              .slice(0, 6);
            setHourly(upcoming);
          }
          setLoading(false);
        } else { throw new Error('No current data'); }
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return;
        // Fallback: use InvokeLLM with web search (bypasses CORS)
        base44.integrations.Core.InvokeLLM({
          prompt: `Get the current weather at latitude ${location.lat}, longitude ${location.lng} (near ${location.name || 'this location'}). Return the current temperature in Celsius, weather condition, cloud cover percentage, humidity percentage, wind speed in km/h, and a 6-hour hourly forecast with temperatures and conditions.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: {
            type: 'object',
            properties: {
              temperature: { type: 'number', description: 'Current temperature in Celsius' },
              weather_label: { type: 'string', description: 'Weather condition: clear, mostly clear, partly cloudy, overcast, fog, drizzle, rain, snow, thunderstorm, showers' },
              cloud_cover: { type: 'number', description: 'Cloud cover 0-100' },
              humidity: { type: 'number', description: 'Humidity 0-100' },
              wind_speed: { type: 'number', description: 'Wind speed km/h' },
              hourly_forecast: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    temp: { type: 'number' },
                    weather_label: { type: 'string' }
                  }
                }
              }
            }
          }
        })
        .then(data => {
          if (cancelled) return;
          setWeather({
            temperature_2m: data.temperature,
            weather_code: labelToCode(data.weather_label),
            cloud_cover: data.cloud_cover || 0,
            relative_humidity_2m: data.humidity || 0,
            wind_speed_10m: data.wind_speed || 0,
          });
          if (data.hourly_forecast) {
            setHourly(data.hourly_forecast.slice(0, 6).map((h, i) => ({
              time: new Date(Date.now() + (i + 1) * 3600000),
              temp: h.temp,
              code: labelToCode(h.weather_label),
            })));
          }
          setLoading(false);
        })
        .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
      });

    return () => { cancelled = true; controller.abort(); };
  }, [location?.lat, location?.lng, retryCount]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/8 bg-white/4 backdrop-blur-sm p-5 animate-pulse">
        <div className="h-20 rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div
        onClick={onClick}
        className={`rounded-3xl border border-white/8 bg-white/4 backdrop-blur-sm p-5 ${onClick ? 'cursor-pointer hover:bg-white/8 active:scale-[0.99] transition-all' : ''}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">
            {lang === 'he' ? 'מזג אוויר' : 'Weather'}
          </h3>
          {onClick && <ChevronRight className="w-4 h-4 text-white/30" />}
        </div>
        <div className="flex items-center gap-3 text-white/50">
          <span className="text-3xl">🌤️</span>
          <span className="text-sm flex-1">
            {lang === 'he' ? 'לא ניתן לטעון מזג אוויר' : 'Weather unavailable'}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setRetryCount(c => c + 1); }}
            className="px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold hover:bg-blue-500/30 transition-all"
          >
            {lang === 'he' ? 'נסה שוב' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  const code = weather.weather_code ?? 0;
  const info = WMO_CODES[code] || WMO_CODES[0];
  const tempC = Math.round(weather.temperature_2m ?? 0);
  const tempF = Math.round(tempC * 9 / 5 + 32);
  const cloud = weather.cloud_cover ?? 0;
  const wind = Math.round(weather.wind_speed_10m ?? 0);
  const humidity = weather.relative_humidity_2m ?? null;
  const he = lang === 'he';

  return (
    <div
      onClick={onClick}
      className={`rounded-3xl border border-white/8 bg-white/4 backdrop-blur-sm p-5 transition-all ${onClick ? 'cursor-pointer hover:bg-white/8 active:scale-[0.99]' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">
          {he ? 'מזג אוויר' : 'Weather'}
        </h3>
        {onClick && <ChevronRight className="w-4 h-4 text-white/30" />}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <span className={`text-5xl shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl ${code <= 1 ? 'bg-yellow-400/15' : code === 2 ? 'bg-blue-400/10' : 'bg-gray-400/10'}`}>{info.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white/90 tabular-nums">{tempC}°C</span>
            <span className="text-lg font-semibold text-white/50 tabular-nums">/ {tempF}°F</span>
          </div>
          <div className="text-sm text-white/60 mt-0.5">{info.label}</div>
          <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
            {humidity != null && (
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3" /> {humidity}%
              </span>
            )}
            <span className="flex items-center gap-1">
              <Cloud className="w-3 h-3" /> {cloud}%
            </span>
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3" /> {wind}km/h
            </span>
          </div>
        </div>
      </div>

      {hourly.length > 0 && (
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
          {hourly.map((h, i) => {
            const hInfo = WMO_CODES[h.code] || WMO_CODES[0];
            return (
              <div key={i} className="flex flex-col items-center gap-1 min-w-[44px]">
                <span className="text-[10px] text-white/40 tabular-nums">
                  {h.time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
                </span>
                <span className="text-lg">{hInfo.emoji}</span>
                <span className="text-xs font-semibold text-white/70 tabular-nums">{Math.round(h.temp)}°</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

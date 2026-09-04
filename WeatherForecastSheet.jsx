import React, { useState, useEffect } from 'react';
import { X, Wind, Eye, Cloud } from 'lucide-react';
import { formatTimeInTz } from '../lib/timezone';
import { base44 } from '@/api/base44Client';
import { getWeatherInfo, labelToCode } from '../lib/weatherCodes';
import { getWeatherBundle } from '@/lib/weatherService';

export default function WeatherForecastSheet({ open, onClose, location, lang = 'en', locationTz }) {
  const [current, setCurrent] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('hourly');

  useEffect(() => {
    if (!location?.lat || !location?.lng) return;
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    getWeatherBundle(location, { signal: controller.signal, timeoutMs: 12000 })
      .then(data => {
        if (cancelled) return;
        if (!data?.current) throw new Error('No data');
        if (data?.current) {
          setCurrent(data.current);
          // Build hourly: next 24 hours
          const now = new Date();
          const hours = [];
          if (data.hourly?.time) {
            for (let i = 0; i < data.hourly.time.length; i++) {
              const dt = new Date(data.hourly.time[i]);
              if (dt < now) continue;
              hours.push({
                time: dt,
                temp: data.hourly.temperature_2m[i],
                code: data.hourly.weather_code[i],
                cloud: data.hourly.cloud_cover[i],
                wind: data.hourly.wind_speed_10m[i],
                precip: data.hourly.precipitation_probability?.[i] ?? 0,
              });
              if (hours.length >= 24) break;
            }
          }
          setHourly(hours);
          // Build all 7-day hourly grouped by day
          const allHours = [];
          if (data.hourly?.time) {
            for (let i = 0; i < data.hourly.time.length; i++) {
              allHours.push({
                time: new Date(data.hourly.time[i]),
                temp: data.hourly.temperature_2m[i],
                code: data.hourly.weather_code[i],
                cloud: data.hourly.cloud_cover[i],
                wind: data.hourly.wind_speed_10m[i],
                precip: data.hourly.precipitation_probability?.[i] ?? 0,
              });
            }
          }
          setWeekly(allHours);
          // Build daily
          const days = [];
          if (data.daily?.time) {
            for (let i = 0; i < data.daily.time.length; i++) {
              days.push({
                date: new Date(data.daily.time[i]),
                code: data.daily.weather_code[i],
                max: data.daily.temperature_2m_max[i],
                min: data.daily.temperature_2m_min[i],
                precip: data.daily.precipitation_sum?.[i] ?? 0,
                precipProb: data.daily.precipitation_probability_max?.[i] ?? 0,
                sunrise: data.daily.sunrise?.[i] ? new Date(data.daily.sunrise[i]) : null,
                sunset: data.daily.sunset?.[i] ? new Date(data.daily.sunset[i]) : null,
                windMax: data.daily.wind_speed_10m_max?.[i] ?? 0,
              });
            }
          }
          setDaily(days);
          setLoading(false);
        } else {
          setError(true);
        }
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return;
        // Fallback: InvokeLLM with web search (bypasses CORS)
        base44.integrations.Core.InvokeLLM({
          prompt: `Get the weather forecast for latitude ${location.lat}, longitude ${location.lng} (near ${location.name || 'this location'}). Return: current temperature in Celsius, weather condition, cloud cover %, wind speed km/h, humidity %, apparent/feels-like temperature. Also return a 7-day daily forecast with max/min temperatures and weather conditions, and a 24-hour hourly forecast with temperatures and conditions.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: {
            type: 'object',
            properties: {
              current_temp: { type: 'number' },
              current_label: { type: 'string' },
              cloud_cover: { type: 'number' },
              wind_speed: { type: 'number' },
              humidity: { type: 'number' },
              apparent_temp: { type: 'number' },
              daily_forecast: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    max: { type: 'number' },
                    min: { type: 'number' },
                    label: { type: 'string' }
                  }
                }
              },
              hourly_forecast: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    temp: { type: 'number' },
                    label: { type: 'string' },
                    rain_chance: { type: 'number', description: 'Chance of rain 0-100' }
                  }
                }
              }
            }
          }
        })
        .then(d => {
          if (cancelled) return;
          const code = labelToCode(d.current_label);
          setCurrent({
            temperature_2m: d.current_temp,
            weather_code: code,
            cloud_cover: d.cloud_cover || 0,
            wind_speed_10m: d.wind_speed || 0,
            relative_humidity_2m: d.humidity || 0,
            apparent_temperature: d.apparent_temp || d.current_temp,
            visibility: 10000,
            wind_direction_10m: 0,
          });
          const now = Date.now();
          setHourly((d.hourly_forecast || []).slice(0, 24).map((h, i) => ({
            time: new Date(now + (i + 1) * 3600000),
            temp: h.temp,
            code: labelToCode(h.label),
            cloud: 0, wind: 0, precip: h.rain_chance || 0,
          })));
          setWeekly((d.hourly_forecast || []).map((h, i) => ({
            time: new Date(now + (i + 1) * 3600000),
            temp: h.temp,
            code: labelToCode(h.label),
            cloud: 0, wind: 0, precip: h.rain_chance || 0,
          })));
          setDaily((d.daily_forecast || []).slice(0, 7).map((day, i) => {
            const dt = new Date(now + i * 86400000);
            dt.setHours(12, 0, 0, 0);
            return {
              date: dt,
              code: labelToCode(day.label),
              max: day.max,
              min: day.min,
              precip: 0, precipProb: 0,
              sunrise: null, sunset: null, windMax: 0,
            };
          }));
        })
        .catch(() => { if (!cancelled) setError(true); })
        .finally(() => { if (!cancelled) setLoading(false); });
      });
    return () => { cancelled = true; controller.abort(); };
  }, [location?.lat, location?.lng]);

  if (!open) return null;

  const he = lang === 'he';

  const sunBlocked = current && (current.cloud_cover >= 75 ||
    [51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99].includes(current.weather_code));

  const dayNames = he
    ? ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת']
    : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-t-3xl bg-[#0d1420] border border-white/10 flex flex-col max-h-[90vh] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 shrink-0 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">
              {he ? 'תחזית מזג אוויר' : 'Weather Forecast'}
            </h2>
            <p className="text-xs text-white/40 mt-0.5">{location?.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close weather forecast" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {loading && (
          <div className="py-20 text-center text-white/40 text-sm">{he ? 'טוען...' : 'Loading...'}</div>
        )}

        {error && (
          <div className="py-20 text-center text-white/40 text-sm">{he ? 'שגיאה בטעינת נתונים' : 'Failed to load data'}</div>
        )}

        {!loading && !error && current && (
          <>
            {/* Current conditions card */}
            <div className={`mx-4 mt-4 rounded-2xl border px-5 py-4 shrink-0 ${
              sunBlocked ? 'bg-gray-500/15 border-gray-400/30' : 'bg-yellow-500/10 border-yellow-400/30'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold ${sunBlocked ? 'text-gray-300' : 'text-yellow-300'}`}>
                    {sunBlocked ? (he ? 'עננים' : 'Clouds') : (he ? 'שמש גלויה' : 'Sun Visible')}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-white/60">
                    {getWeatherInfo(current.weather_code)[he ? 'labelHe' : 'label']}
                  </span>
                  <span className="text-2xl font-bold text-white">{Math.round(current.temperature_2m)}°C</span>
                  {React.createElement(getWeatherInfo(current.weather_code).Icon, { className: 'w-7 h-7 text-yellow-300', strokeWidth: 1.5 })}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5" /> {Math.round(current.wind_speed_10m)}km/h
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {current.visibility ? Math.round(current.visibility / 1000) : '--'}km
                </span>
                <span className="flex items-center gap-1">
                  <Cloud className="w-3.5 h-3.5" /> {current.cloud_cover ?? 0}%
                </span>
                {current.relative_humidity_2m != null && (
                  <span className="flex items-center gap-1">
                    💧 {current.relative_humidity_2m}%
                  </span>
                )}
                {hourly[0]?.precip != null && hourly[0].precip > 0 && (
                  <span className="flex items-center gap-1 text-blue-300">
                    🌧 {hourly[0].precip}%
                  </span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 px-4 mt-4 shrink-0">
              <button
                onClick={() => setTab('hourly')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  tab === 'hourly' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40' : 'bg-white/5 text-white/40 border border-white/10'
                }`}
              >
                {he ? 'לפי שעה' : 'Hourly'}
              </button>
              <button
                onClick={() => setTab('daily')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  tab === 'daily' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40' : 'bg-white/5 text-white/40 border border-white/10'
                }`}
              >
                {he ? 'לפי יום' : 'Daily'}
              </button>
            </div>

            {/* Forecast content */}
            <div className="overflow-y-auto flex-1 px-4 py-4">
              {tab === 'hourly' && (
                <div className="space-y-4">
                  {weekly.length === 0 && (
                    <div className="text-center text-white/30 text-sm py-8">{he ? 'אין נתונים' : 'No data'}</div>
                  )}
                  {Object.entries(
                    weekly.reduce((acc, h) => {
                      const key = h.time.toDateString();
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(h);
                      return acc;
                    }, {})
                  ).map(([dayKey, hours]) => {
                    const dayDate = new Date(dayKey);
                    const isToday = dayDate.toDateString() === new Date().toDateString();
                    const dayLabel = isToday
                      ? (he ? 'היום' : 'Today')
                      : `${dayNames[dayDate.getDay()]} ${dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                    return (
                      <div key={dayKey}>
                        <div className="flex items-center gap-2 mb-1.5 px-1">
                          <span className="text-xs font-bold text-white/80">{dayLabel}</span>
                          <div className="flex-1 h-px bg-white/8" />
                        </div>
                        <div className="space-y-1">
                          {hours.map((h, i) => {
                            const info = getWeatherInfo(h.code);
                            const Icon = info.Icon;
                            return (
                              <div key={i} className="flex items-center gap-3 rounded-xl bg-white/3 px-3 py-2 hover:bg-white/5 transition-all">
                                <span className="text-[11px] text-white/50 w-12 shrink-0 tabular-nums">
                                  {formatTimeInTz(h.time, locationTz, true)}
                                </span>
                                <Icon className="w-4 h-4 text-yellow-300/80 shrink-0" strokeWidth={1.5} />
                                <span className="text-[11px] text-white/70 flex-1 truncate">{he ? info.labelHe : info.label}</span>
                                {h.precip > 0 && (
                                  <span className="text-[10px] text-blue-300 shrink-0">💧{h.precip}%</span>
                                )}
                                <span className="text-sm font-bold text-white w-10 text-right tabular-nums">{Math.round(h.temp)}°</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === 'daily' && (
                <div className="space-y-2">
                  {daily.map((d, i) => {
                    const info = getWeatherInfo(d.code);
                    const Icon = info.Icon;
                    const isToday = d.date.toDateString() === new Date().toDateString();
                    return (
                      <div key={i} className={`rounded-xl px-4 py-3 transition-all ${
                        isToday ? 'bg-yellow-500/10 border border-yellow-400/30' : 'bg-white/3'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-white/80 w-10 shrink-0">
                            {isToday ? (he ? 'היום' : 'Today') : dayNames[d.date.getDay()]}
                          </span>
                          <Icon className="w-5 h-5 text-yellow-300/80 shrink-0" strokeWidth={1.5} />
                          <span className="text-xs text-white/60 flex-1 truncate">{he ? info.labelHe : info.label}</span>
                          {d.precipProb > 0 && (
                            <span className="text-[10px] text-blue-300 shrink-0">💧{d.precipProb}%</span>
                          )}
                          <div className="flex items-baseline gap-1.5 shrink-0">
                            <span className="text-sm font-bold text-white tabular-nums">{Math.round(d.max)}°</span>
                            <span className="text-xs text-white/40 tabular-nums">{Math.round(d.min)}°</span>
                          </div>
                        </div>
                        {d.sunrise && d.sunset && (
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-white/35">
                            <span>🌅 {formatTimeInTz(d.sunrise, locationTz, true)}</span>
                            <span>🌇 {formatTimeInTz(d.sunset, locationTz, true)}</span>
                            <span className="flex items-center gap-0.5"><Wind className="w-2.5 h-2.5" /> {Math.round(d.windMax)}km/h</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

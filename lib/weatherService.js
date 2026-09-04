import { fetchWithTimeout } from './fetchWithTimeout';

const CACHE_MS = 2 * 60 * 1000;
const cache = new Map();
const inflight = new Map();

function keyFor(location) {
  return `${Number(location.lat).toFixed(3)},${Number(location.lng).toFixed(3)}`;
}

function buildUrl(location) {
  return `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}` +
    `&current=temperature_2m,weather_code,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,relative_humidity_2m,apparent_temperature` +
    `&hourly=temperature_2m,weather_code,cloud_cover,wind_speed_10m,precipitation_probability` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,wind_speed_10m_max` +
    `&timezone=auto&forecast_days=7`;
}

export async function getWeatherBundle(location, { signal, timeoutMs = 12000, force = false } = {}) {
  if (!Number.isFinite(Number(location?.lat)) || !Number.isFinite(Number(location?.lng))) throw new Error('Invalid weather coordinates');
  const key = keyFor(location);
  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.at < CACHE_MS) return hit.data;
  if (!force && inflight.has(key)) return inflight.get(key);
  const task = (async () => {
    const response = await fetchWithTimeout(buildUrl(location), { signal, timeoutMs });
    if (!response.ok) throw new Error(`Weather HTTP ${response.status}`);
    const data = await response.json();
    if (!data?.current) throw new Error('Weather response missing current conditions');
    cache.set(key, { at: Date.now(), data });
    return data;
  })().finally(() => inflight.delete(key));
  inflight.set(key, task);
  return task;
}

export function clearWeatherCache() { cache.clear(); }

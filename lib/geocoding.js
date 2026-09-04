import { fetchWithTimeout } from './fetchWithTimeout.js';

/**
 * Geocoding using the Nominatim (OpenStreetMap) free API
 */

export async function searchLocation(query, signal = null) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
  const res = await fetchWithTimeout(url, {
    signal,
    timeoutMs: 10000,
    headers: { 'Accept-Language': 'en,he', 'User-Agent': 'SolarZmanim/1.0' }
  });
  if (!res.ok) throw new Error('Geocoding request failed');
  const data = await res.json();
  return data.map(item => ({
    name: item.display_name,
    shortName: [item.address?.city || item.address?.town || item.address?.village, item.address?.country].filter(Boolean).join(', '),
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}

// Lightweight forward geocoder (consolidated from geocode.js).
// Kept for callers that only need name + coordinates.
export async function geocodeCity(query, signal = null) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
  const res = await fetchWithTimeout(url, {
    signal,
    timeoutMs: 10000,
    headers: { 'Accept-Language': 'en', 'User-Agent': 'SolarZmanim/1.0' }
  });
  const data = await res.json();
  return data.map(item => ({
    name: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    shortName: item.name || item.display_name.split(',')[0]
  }));
}

export async function reverseGeocode(lat, lng, signal = null) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
  const res = await fetchWithTimeout(url, {
    signal,
    timeoutMs: 10000,
    headers: { 'Accept-Language': 'en', 'User-Agent': 'SolarZmanim/1.0' }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    name: data.display_name,
    shortName: [data.address?.city || data.address?.town || data.address?.village, data.address?.country].filter(Boolean).join(', '),
    lat,
    lng,
  };
}
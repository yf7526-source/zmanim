import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, LocateFixed, Loader2 } from 'lucide-react';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

async function geocodeCity(query, signal) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`;
  const res = await fetchWithTimeout(url, { signal, timeoutMs: 10000, headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
  const data = await res.json();
  return data.map(d => ({
    name: d.display_name.split(',').slice(0, 3).join(', '),
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
  }));
}

export default function LocationSearch({ location, onLocationChange, onGps }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const searchAbortRef = useRef(null);
  const reverseAbortRef = useRef(null);


  useEffect(() => () => {
    searchAbortRef.current?.abort();
    reverseAbortRef.current?.abort();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const r = await geocodeCity(q, controller.signal);
      if (controller.signal.aborted) return;
      setResults(r);
      if (r.length === 0) setError('No places found — try a different name');
    } catch (err) {
      if (err?.name !== 'AbortError') setError('Search failed. Check your connection.');
    } finally {
      if (searchAbortRef.current === controller) {
        searchAbortRef.current = null;
        setLoading(false);
      }
    }
  };

  const handleGPS = async () => {
    setGpsLoading(true);
    setError('');
    setResults([]);
    if (onGps) {
      await onGps();
      setGpsLoading(false);
      return;
    }
    // Fallback inline GPS
    if (!navigator.geolocation) {
      setError('GPS not supported on this device');
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        reverseAbortRef.current?.abort();
        const controller = new AbortController();
        reverseAbortRef.current = controller;
        try {
          const res = await fetchWithTimeout(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, { signal: controller.signal, timeoutMs: 10000 });
          if (!res.ok) throw new Error(`Reverse geocoding HTTP ${res.status}`);
          const data = await res.json();
          const name = data.address?.city || data.address?.town || data.address?.village || '📍 My Location';
          onLocationChange({ lat, lng, name });
        } catch (err) {
          if (err?.name !== 'AbortError') onLocationChange({ lat, lng, name: '📍 My Location' });
        } finally {
          if (reverseAbortRef.current === controller) reverseAbortRef.current = null;
          setGpsLoading(false);
        }
      },
      err => {
        setError('GPS unavailable: ' + (err.code === 1 ? 'permission denied' : 'try again'));
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const selectResult = (r) => {
    onLocationChange(r);
    setResults([]);
    setQuery('');
    setError('');
  };

  return (
    <div className="space-y-3" ref={containerRef}>

      {/* Search row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            type="text"
            aria-label="Search city or address"
            value={query}
            onChange={e => { setQuery(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search city or address…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-yellow-400/50 transition-all"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-4 py-3 rounded-xl bg-yellow-500/15 border border-yellow-400/30 text-sm font-semibold text-yellow-300 hover:bg-yellow-500/25 disabled:opacity-40 transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </div>

      {/* Results dropdown */}
      {results.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#0a111c] shadow-2xl overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => selectResult(r)}
              className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors border-b border-white/8 last:border-0 flex items-start gap-3"
            >
              <MapPin className="w-4 h-4 text-yellow-400/70 mt-0.5 shrink-0" />
              <span className="text-white/80 leading-tight">{r.name}</span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400/80 px-1">{error}</p>
      )}

      {/* GPS button */}
      <button
        onClick={handleGPS}
        disabled={gpsLoading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/50 hover:text-white hover:bg-white/8 disabled:opacity-40 transition-all"
      >
        {gpsLoading
          ? <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
          : <LocateFixed className="w-4 h-4 text-yellow-400/70" />
        }
        {gpsLoading ? 'Getting location…' : '📍 Use my GPS location'}
      </button>

      {/* Current location */}
      {location && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/4 border border-white/8">
          <MapPin className="w-4 h-4 text-yellow-400/70 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/80 truncate font-medium">{location.name}</p>
            <p className="text-xs text-white/30 font-mono mt-0.5">{location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°</p>
          </div>
        </div>
      )}
    </div>
  );
}

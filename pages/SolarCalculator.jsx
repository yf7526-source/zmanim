import React, { useState, useMemo } from 'react';
import { Sun, Compass, Mountain, Loader2, LocateFixed } from 'lucide-react';
import { getSunPosition, getSunTimes, formatTime } from '@/lib/sunCalc';
import PageShell from '@/components/PageShell';

function azimuthToCompass(az) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(az / 22.5) % 16];
}

export default function SolarCalculator() {
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(nowTime);
  const [lat, setLat] = useState(40.7128);
  const [lng, setLng] = useState(-74.006);
  const [geoLoading, setGeoLoading] = useState(false);

  const result = useMemo(() => {
    if (!date || !time || isNaN(lat) || isNaN(lng)) return null;
    const dt = new Date(`${date}T${time}:00`);
    const pos = getSunPosition(dt, parseFloat(lat), parseFloat(lng));
    if (!pos || isNaN(pos.altitude)) return null;
    return { altitude: pos.altitude, azimuth: pos.azimuth };
  }, [date, time, lat, lng]);

  const sunTimes = useMemo(() => {
    if (!date || isNaN(lat) || isNaN(lng)) return null;
    const d = new Date(`${date}T12:00:00`);
    return getSunTimes(d, parseFloat(lat), parseFloat(lng));
  }, [date, lat, lng]);

  function useGeolocation() {
    setGeoLoading(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => { setLat(+pos.coords.latitude.toFixed(4)); setLng(+pos.coords.longitude.toFixed(4)); setGeoLoading(false); },
      () => setGeoLoading(false),
      { enableHighAccuracy: true }
    );
  }

  return (
    <PageShell title="Sun Position Calculator" subtitle="Calculate solar elevation and azimuth for any date, time, and location" icon={Sun} accent="yellow">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="rounded-2xl border border-white/10 bg-white/4 p-5 space-y-3">
          <h3 className="text-sm font-bold text-white/90 mb-2">Inputs</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-white/40 block mb-1">Date</label>
              <input aria-label="Date" value={date} onChange={e => setDate(e.target.value)} type="date" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-yellow-400/50" />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Time</label>
              <input aria-label="Time" value={time} onChange={e => setTime(e.target.value)} type="time" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-yellow-400/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-white/40 block mb-1">Latitude</label>
              <input aria-label="Latitude" value={lat} onChange={e => setLat(e.target.value)} type="number" step="0.0001" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-yellow-400/50" />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Longitude</label>
              <input aria-label="Longitude" value={lng} onChange={e => setLng(e.target.value)} type="number" step="0.0001" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-yellow-400/50" />
            </div>
          </div>
          <button onClick={useGeolocation} disabled={geoLoading} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-200 text-xs font-bold hover:bg-blue-500/25 transition-all disabled:opacity-40">
            {geoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />} Use Current Location
          </button>
        </div>

        {/* Results */}
        <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
          <h3 className="text-sm font-bold text-white/90 mb-4">Solar Position</h3>
          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/4 p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Mountain className="w-4 h-4 text-yellow-300" />
                    <span className="text-xs text-white/40">Elevation</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{result.altitude.toFixed(2)}°</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{result.altitude > 0 ? 'Above horizon' : 'Below horizon'}</p>
                </div>
                <div className="rounded-xl bg-white/4 p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Compass className="w-4 h-4 text-yellow-300" />
                    <span className="text-xs text-white/40">Azimuth</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{result.azimuth.toFixed(1)}°</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{azimuthToCompass(result.azimuth)}</p>
                </div>
              </div>
              {sunTimes && (
                <div className="rounded-xl bg-white/4 p-4">
                  <p className="text-xs text-white/40 mb-2">Key Sun Times (local)</p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-white/50">Sunrise</span><span className="text-white/80 font-mono">{formatTime(sunTimes.netz)}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">Sunset</span><span className="text-white/80 font-mono">{formatTime(sunTimes.shkiah)}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">Chatzot</span><span className="text-white/80 font-mono">{formatTime(sunTimes.chatzot)}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">Alot 16.1°</span><span className="text-white/80 font-mono">{formatTime(sunTimes.alot_16_1)}</span></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-white/40 text-center py-8">Enter valid inputs to see results</p>
          )}
        </div>
      </div>
    </PageShell>
  );
}
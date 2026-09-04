import React, { useState, useEffect, useCallback } from 'react';
import { Star, MapPin, Check, Loader2, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageShell from '@/components/PageShell';

export default function SavedLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(() => {
    try { return JSON.parse(localStorage.getItem('activeLocation') || 'null')?.id; } catch { return null; }
  });

  const load = useCallback(() => {
    setLoading(true);
    base44.entities.SavedLocation.list('-created_date', 100)
      .then(setLocations)
      .catch(() => setError('Could not load locations.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function setActive(loc) {
    localStorage.setItem('activeLocation', JSON.stringify({ id: loc.id, label: loc.label, lat: loc.lat, lng: loc.lng, elevation: loc.elevation, timezone: loc.timezone, name: loc.label }));
    setActiveId(loc.id);
  }

  return (
    <PageShell title="Saved Locations" subtitle="Quickly switch between your favorite cities" icon={Star} accent="yellow">
      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-white/30 animate-spin" /></div>
      ) : locations.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40 mb-4">No saved locations yet</p>
          <Link to="/locations" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-yellow-500/20 border border-yellow-400/40 text-yellow-200 text-sm font-bold hover:bg-yellow-500/30 transition-all">
            <Star className="w-4 h-4" /> Add Locations
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {locations.map(loc => {
            const isActive = activeId === loc.id;
            return (
              <button
                key={loc.id}
                onClick={() => setActive(loc)}
                className={`text-left rounded-2xl border p-4 transition-all card-hover ${isActive ? 'border-yellow-400/50 bg-yellow-500/10 ring-2 ring-yellow-400/30' : 'border-white/10 bg-white/4 hover:bg-white/8'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-yellow-300" />
                  </div>
                  {isActive && <Check className="w-5 h-5 text-yellow-300" />}
                </div>
                <p className="text-base font-bold text-white/90">{loc.label}</p>
                <p className="text-xs text-white/40 mt-0.5">{loc.lat?.toFixed(3)}, {loc.lng?.toFixed(3)}</p>
                {loc.country && <p className="text-xs text-white/30 mt-0.5">{loc.country}</p>}
                {isActive && (
                  <Link to="/" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-yellow-300 hover:text-yellow-200">
                    <Navigation className="w-3 h-3" /> Go to tracker
                  </Link>
                )}
              </button>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
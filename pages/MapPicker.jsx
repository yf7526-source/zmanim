import React, { useState } from 'react';
import { Search, MapPin, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MapPicker() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      setResults(data.map(d => ({
        name: d.display_name,
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lon),
      })));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background p-4 safe-area-top safe-area-bottom">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-xl bg-white/5 hover:bg-white/10" aria-label="Back to home">
            <ArrowLeft className="w-5 h-5 text-foreground/70" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Map Picker</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            type="text"
            aria-label="Search map location"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search a location on the map…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-sm text-foreground min-h-[44px]"
          />
        </div>
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => setPicked(r)}
                className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all flex items-center gap-3 min-h-[44px]"
              >
                <MapPin className="w-4 h-4 text-yellow-400/70 shrink-0" />
                <span className="text-sm text-foreground/80">{r.name}</span>
              </button>
            ))}
          </div>
        )}
        {picked && (
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center gap-3">
            <MapPin className="w-4 h-4 text-yellow-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{picked.name}</p>
              <p className="text-xs text-foreground/50 font-mono">{picked.lat.toFixed(4)}°, {picked.lng.toFixed(4)}°</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
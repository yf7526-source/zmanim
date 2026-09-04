import React, { useState, useEffect } from 'react';
import { Star, Trash2, MapPin, Navigation, Loader2 } from 'lucide-react';
import { VALID_CITIES as ORTHODOX_CITIES } from '../lib/cityValidator';
import { getCandleOffset } from '../lib/candleOffsets';
import { searchCities } from '../lib/citySearchIndex';

const COUNTRY_FLAGS = {
  IL: '🇮🇱', US: '🇺🇸', CA: '🇨🇦', GB: '🇬🇧', BE: '🇧🇪', NL: '🇳🇱', FR: '🇫🇷',
  CH: '🇨🇭', DE: '🇩🇪', AT: '🇦🇹', HU: '🇭🇺', PL: '🇵🇱', RU: '🇷🇺', UA: '🇺🇦',
  AR: '🇦🇷', BR: '🇧🇷', MX: '🇲🇽', CL: '🇨🇱', UY: '🇺🇾', ZA: '🇿🇦', AU: '🇦🇺',
  NZ: '🇳🇿', SG: '🇸🇬', IN: '🇮🇳', TH: '🇹🇭', JP: '🇯🇵', CN: '🇨🇳', HK: '🇭🇰',
  ES: '🇪🇸', IT: '🇮🇹', PT: '🇵🇹', SE: '🇸🇪', DK: '🇩🇰', NO: '🇳🇴', FI: '🇫🇮',
  IE: '🇮🇪', TR: '🇹🇷', GR: '🇬🇷', MA: '🇲🇦', TN: '🇹🇳', PA: '🇵🇦', CR: '🇨🇷',
  CO: '🇨🇴', PE: '🇵🇪', VE: '🇻🇪',
};

function flagFor(country) {
  if (!country) return '🏳️';
  if (country.length <= 2) return COUNTRY_FLAGS[country] || '🏳️';
  return country;
}

export const CITIES = ORTHODOX_CITIES;

export default function CityPicker({ onSelect, onClose, currentLocation, lang = 'both' }) {
  const [search, setSearch] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('favoriteLocations') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem('favoriteLocations', JSON.stringify(favorites)); } catch {}
  }, [favorites]);

  const isFav = (city) => favorites.some(f => f.lat === city.lat && f.lng === city.lng);
  const toggleFav = (city, e) => {
    e.stopPropagation();
    if (isFav(city)) {
      setFavorites(f => f.filter(x => !(x.lat === city.lat && x.lng === city.lng)));
    } else {
      setFavorites(f => [...f, { ...city, id: Date.now() }]);
    }
  };

  const handleGps = () => {
    if (!navigator.geolocation) { setGpsError(lang === 'he' ? 'GPS לא נתמך' : 'GPS not supported'); return; }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        onSelect({ lat: pos.coords.latitude, lng: pos.coords.longitude, name: lang === 'he' ? 'מיקום נוכחי' : 'Current Location', elevation: pos.coords.altitude || 0, candleOffset: getCandleOffset('', pos.coords.latitude, pos.coords.longitude) });
      },
      () => {
        setGpsLoading(false);
        setGpsError(lang === 'he' ? 'לא ניתן לאתר מיקום' : 'Could not get location');
      },
      { timeout: 10000 }
    );
  };

  const filtered = search.trim() ? searchCities(search, 60) : CITIES;

  const hasSaved = !!currentLocation;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-md">
      <div
        className="w-full max-w-md rounded-t-3xl bg-[#0a111c] border-t border-white/10 p-5 pb-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto mb-5" />
        <h2 className="text-lg font-bold text-white mb-1 text-center">📍 {lang === 'he' ? 'בחר עיר' : 'Choose Your City'}</h2>
        <p className="text-xs text-center text-white/40 mb-4">
          {hasSaved ? `${currentLocation.name} · ${lang === 'he' ? 'בחר עיר חדשה או השאר' : 'pick a new city or keep it'}` : lang === 'he' ? 'בחר עיר לזמנים מדויקים' : "Pick your city for accurate times"}
        </p>

        {/* GPS button */}
        <button
          onClick={handleGps}
          disabled={gpsLoading}
          className="w-full flex items-center justify-center gap-2 py-3 mb-3 rounded-2xl bg-blue-500/15 border border-blue-400/30 text-blue-300 font-semibold hover:bg-blue-500/25 transition-all disabled:opacity-50"
        >
          {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
          {lang === 'he' ? 'השתמש במיקום הנוכחי (GPS)' : 'Use My Current Location (GPS)'}
        </button>
        {gpsError && <p className="text-xs text-red-400 text-center mb-2">{gpsError}</p>}

        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="mb-3 rounded-2xl bg-yellow-500/8 border border-yellow-400/20 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/50" />
              <span className="text-xs font-bold text-yellow-300/80">{lang === 'he' ? 'מיקומים שמורים' : 'Saved Locations'}</span>
            </div>
            <div className="space-y-1">
              {favorites.map(fav => (
                <div key={fav.id} className="flex items-center gap-2">
                  <button
                    onClick={() => onSelect(fav)}
                    className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-yellow-500/15 border border-white/8 hover:border-yellow-400/30 transition-all text-left"
                  >
                    <MapPin className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                    <span className="text-sm text-white/90 font-medium">{fav.name}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFavorites(f => f.filter(x => x.id !== fav.id)); }}
                    className="p-2 rounded-xl hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white/30 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <input
          type="text"
          placeholder={lang === 'he' ? '🔍 חפש עיר...' : '🔍 Search city...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400/50 transition-all mb-3"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
          {filtered.map(city => (
            <button
              key={city.name}
              onClick={() => onSelect({ lat: city.lat, lng: city.lng, name: city.name, elevation: city.elevation, candleOffset: city.candleOffset, timezone: city.timezone })}
              className="flex items-center gap-2 px-3 py-3 rounded-2xl bg-white/4 border border-white/8 hover:bg-yellow-500/15 hover:border-yellow-400/40 transition-all card-hover text-left"
            >
              <span className="text-xl">{flagFor(city.country)}</span>
              <span className="text-sm text-white font-medium leading-tight flex-1">{city.name}</span>
              <button
                onClick={(e) => toggleFav({ lat: city.lat, lng: city.lng, name: city.name, country: city.country, elevation: city.elevation, candleOffset: city.candleOffset, timezone: city.timezone }, e)}
                className="shrink-0 p-0.5"
              >
                <Star className={`w-3.5 h-3.5 transition-all ${isFav(city) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20 hover:text-yellow-300'}`} />
              </button>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-2 text-center text-white/30 py-6 text-sm">{lang === 'he' ? 'לא נמצאו ערים' : 'No cities found'}</p>
          )}
        </div>
        {hasSaved && (
          <button
            onClick={onClose}
            className="mt-4 w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/50 hover:text-white hover:bg-white/8 transition-all"
          >
            {lang === 'he' ? `השאר "${currentLocation.name}"` : `Keep "${currentLocation.name}"`}
          </button>
        )}
      </div>
    </div>
  );
}
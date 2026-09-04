import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Clock, Search, Star, Trash2 } from 'lucide-react';
import LocationSearch from './LocationSearch';
import { hebrewToGregorian } from '../lib/sunCalc';

const HE_MONTH_NAMES = ['','ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשון','כסלו','טבת','שבט','אדר','אדר ב׳'];
const EN_MONTH_NAMES = ['','Nisan','Iyar','Sivan','Tammuz','Av','Elul','Tishri','Cheshvan','Kislev','Tevet','Shvat','Adar','Adar II'];

// Build month options for a given Hebrew year (handles leap year)
function getMonthOptions(year) {
  const isLeap = (7 * year + 1) % 19 < 7;
  const months = [7,8,9,10,11,12,1,2,3,4,5,6];
  if (isLeap) months.splice(6, 0, 13); // insert Adar II after Adar
  return months.map(m => ({ value: m, he: HE_MONTH_NAMES[m], en: EN_MONTH_NAMES[m] }));
}

export default function SearchSheet({
  open,
  onClose,
  searchLocation,
  setSearchLocation,
  searchDate,
  setSearchDate,
  searchTime,
  setSearchTime,
  onApply,
  lang = 'both',
}) {
  const [dateTab, setDateTab] = useState('greg'); // 'greg' | 'heb'
  const [searchApplied, setSearchApplied] = useState(false);
  const [hebYear, setHebYear]   = useState(5786);
  const [hebMonth, setHebMonth] = useState(4); // Tammuz
  const [hebDay, setHebDay]     = useState(1);

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('favoriteLocations');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem('favoriteLocations', JSON.stringify(favorites)); } catch {}
  }, [favorites]);

  const addToFavorites = () => {
    if (!searchLocation) return;
    const exists = favorites.some(f => f.lat === searchLocation.lat && f.lng === searchLocation.lng);
    if (!exists) setFavorites([...favorites, { ...searchLocation, id: Date.now() }]);
  };

  const removeFromFavorites = (id) => setFavorites(favorites.filter(f => f.id !== id));
  const isCurrentFavorite = searchLocation && favorites.some(f => f.lat === searchLocation.lat && f.lng === searchLocation.lng);

  const handleHebApply = () => {
    const greg = hebrewToGregorian(hebYear, hebMonth, hebDay);
    if (!greg || isNaN(greg.getTime())) return;
    // Normalize to noon local time so downstream T12:00:00 parsing works correctly
    const normalized = new Date(greg.getFullYear(), greg.getMonth(), greg.getDate(), 12, 0, 0);
    setSearchDate(normalized);
    setSearchApplied(true);
    // Small delay so state settles before apply fires
    setTimeout(onApply, 0);
  };

  const monthOptions = getMonthOptions(hebYear);
  const maxDay = (() => {
    function isLeap(y) { return (7*y+1)%19<7; }
    function elapsed(y) {
      const m=235*Math.floor((y-1)/19)+12*((y-1)%19)+Math.floor((7*((y-1)%19)+1)/19);
      const p=204+793*(m%1080); const h=5+12*m+793*Math.floor(m/1080)+Math.floor(p/1080);
      const cD=1+29*m+Math.floor(h/24); const cP=1080*(h%24)+p%1080;
      let d=cD;
      if(cP>=19440||(cD%7===2&&cP>=9924&&!isLeap(y))||(cD%7===1&&cP>=16789&&isLeap(y-1)))d=cD+1;
      if([0,3,5].includes(d%7))d++;
      return d;
    }
    function daysY(y){return elapsed(y+1)-elapsed(y);}
    if([2,4,6,10,13].includes(hebMonth))return 29;
    if(hebMonth===12&&!isLeap(hebYear))return 29;
    if(hebMonth===8&&daysY(hebYear)%10!==5)return 29;
    if(hebMonth===9&&daysY(hebYear)%10===3)return 29;
    return 30;
  })();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-[#0a111c] border-t border-white/10 flex flex-col max-h-[90vh] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto mt-4 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-5 shrink-0 border-b border-white/8">
          <div>
            <h2 className="text-xl font-bold text-white">🔍 {lang === 'he' ? 'חיפוש' : 'Search'}</h2>
            <p className="text-xs text-white/40 mt-0.5">{lang === 'he' ? 'חפש לפי מיקום, תאריך ושעה' : 'Search by location, date & time'}</p>
          </div>
          <button onClick={onClose} aria-label="Close search" className="p-2 rounded-xl bg-white/8 hover:bg-white/15 transition-all">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 pb-8 pt-5 space-y-6">

          {/* Favorites */}
          {favorites.length > 0 && (
            <section className="rounded-2xl bg-blue-500/10 border border-blue-400/20 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
                <label className="text-sm font-bold text-white/80">{lang === 'he' ? 'מיקומים שמורים' : 'Saved Locations'}</label>
              </div>
              <div className="space-y-2">
                {favorites.map(fav => (
                  <button
                    key={fav.id}
                    onClick={() => setSearchLocation(fav)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      searchLocation?.lat === fav.lat && searchLocation?.lng === fav.lng
                        ? 'bg-blue-500/20 border-blue-400/40'
                        : 'bg-white/5 border-white/8 hover:bg-white/8'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-blue-300" />
                      <div className="text-left">
                        <div className="text-sm font-semibold text-white/90">{fav.name}</div>
                        <div className="text-xs text-white/40">{fav.lat.toFixed(4)}, {fav.lng.toFixed(4)}</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFromFavorites(fav.id); }}
                      className="p-2 rounded-lg hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-white/30 hover:text-red-400" />
                    </button>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Location */}
          <section className="rounded-2xl bg-white/4 border border-white/8 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-yellow-400/70" />
              <label className="text-sm font-bold text-white/80">{lang === 'he' ? 'מיקום' : 'Location'}</label>
            </div>
            <LocationSearch location={searchLocation} onLocationChange={setSearchLocation} onGps={() => {}} />
            {searchLocation && (
              <button
                onClick={addToFavorites}
                disabled={isCurrentFavorite}
                className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                  isCurrentFavorite
                    ? 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300 cursor-default'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-yellow-500/10 hover:border-yellow-400/30 hover:text-yellow-300'
                }`}
              >
                <Star className={`w-4 h-4 ${isCurrentFavorite ? 'fill-yellow-400' : ''}`} />
                <span className="text-sm font-semibold">
                  {isCurrentFavorite ? (lang === 'he' ? 'שמור במיקומים' : 'Saved') : (lang === 'he' ? 'הוסף למועדפים' : 'Add to Favorites')}
                </span>
              </button>
            )}
          </section>

          {/* Date — tabs: Gregorian / Hebrew */}
          <section className="rounded-2xl bg-white/4 border border-white/8 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-yellow-400/70" />
              <label className="text-sm font-bold text-white/80">{lang === 'he' ? 'תאריך' : 'Date'}</label>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDateTab('greg')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  dateTab === 'greg'
                    ? 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                }`}
              >
                {lang === 'he' ? 'לועזי' : 'Gregorian'}
              </button>
              <button
                onClick={() => setDateTab('heb')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  dateTab === 'heb'
                    ? 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                }`}
              >
                {lang === 'he' ? 'עברי ✡' : 'Hebrew ✡'}
              </button>
            </div>

            {dateTab === 'greg' ? (
              <input
                type="date"
                min="1900-01-01"
                max="2200-12-31"
                value={searchDate && !isNaN(searchDate.getTime()) ? `${searchDate.getFullYear()}-${String(searchDate.getMonth()+1).padStart(2,'0')}-${String(searchDate.getDate()).padStart(2,'0')}` : ''}
                onChange={e => {
                  const val = e.target.value;
                  // Only commit a complete YYYY-MM-DD with a sane 4-digit year (input fires
                  // mid-typing with values like "0002-06-18" which would break calculations)
                  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return;
                  const [y, m, day] = val.split('-').map(Number);
                  if (y < 1900 || y > 2200) return;
                  const d = new Date(y, m - 1, day, 12, 0, 0);
                  if (!isNaN(d.getTime())) setSearchDate(d);
                }}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-yellow-400/50 transition-all [color-scheme:dark]"
              />
            ) : (
              <div className="space-y-3">
                {/* Hebrew Year */}
                <div>
                  <label className="text-xs text-white/40 mb-1 block">{lang === 'he' ? 'שנה עברית' : 'Hebrew Year'}</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setHebYear(y => y - 1)} className="px-3 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-white/60 font-bold text-sm transition-all">−</button>
                    <input
                      type="number"
                      value={hebYear}
                      onChange={e => setHebYear(Number(e.target.value))}
                      className="flex-1 text-center px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-yellow-400/50 [color-scheme:dark]"
                    />
                    <button onClick={() => setHebYear(y => y + 1)} className="px-3 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-white/60 font-bold text-sm transition-all">+</button>
                  </div>
                </div>

                {/* Hebrew Month */}
                <div>
                  <label className="text-xs text-white/40 mb-1 block">{lang === 'he' ? 'חודש' : 'Month'}</label>
                  <select
                    value={hebMonth}
                    onChange={e => { setHebMonth(Number(e.target.value)); setHebDay(1); }}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-yellow-400/50 [color-scheme:dark]"
                  >
                    {monthOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {lang === 'he' ? opt.he : `${opt.en} (${opt.he})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hebrew Day */}
                <div>
                  <label className="text-xs text-white/40 mb-1 block">{lang === 'he' ? 'יום' : 'Day'}</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => (
                      <button
                        key={d}
                        onClick={() => setHebDay(d)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          hebDay === d
                            ? 'bg-yellow-500/30 border border-yellow-400/50 text-yellow-300'
                            : 'bg-white/5 border border-white/8 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {(() => {
                  const greg = hebrewToGregorian(hebYear, hebMonth, hebDay);
                  return greg ? (
                    <div className="mt-1 px-3 py-2 rounded-lg bg-yellow-500/8 border border-yellow-400/15 text-center">
                      <span className="text-xs text-yellow-300/80">
                        {lang === 'he' ? 'תואם ל־' : '= '}
                        {greg.toLocaleDateString('en-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </section>

          {/* Time */}
          <section className="rounded-2xl bg-white/4 border border-white/8 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-yellow-400/70" />
              <label className="text-sm font-bold text-white/80">{lang === 'he' ? 'שעה' : 'Time'}</label>
            </div>
            <input
              type="time"
              value={searchTime}
              onChange={e => setSearchTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-yellow-400/50 transition-all [color-scheme:dark]"
            />
          </section>

          {/* Apply button */}
          <button
            onClick={() => { setSearchApplied(true); if (dateTab === 'heb') handleHebApply(); else onApply(); }}
            className="w-full py-3.5 rounded-xl bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 font-semibold hover:bg-yellow-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            {lang === 'he' ? 'החל חיפוש' : 'Apply Search'}
          </button>



        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Trash2, Plus, Sun, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { findSunTime } from '../lib/sunCalc';

// Calculate a custom zman time from a base time + offset, or from a solar degree
export function calcCustomZman(cz, st) {
  if (!st || !cz) return null;

  // ── Degree-based: find when sun is at N degrees below horizon ──
  if (cz.definitionType === 'degree') {
    const degree = Number(cz.degree);
    if (isNaN(degree) || degree <= 0) return null;
    const lat = st._lat;
    const lng = st._lng;
    if (lat == null || lng == null) return null;
    const refDate = st.netz || st.shkiah || st.chatzot;
    if (!refDate) return null;
    const d = new Date(Date.UTC(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 12, 0, 0));
    const morningTypes = ['alot', 'misheyakir', 'netz', 'shema', 'tefilla', 'chatzot', 'minchaGedola'];
    const rising = morningTypes.includes(cz.zmanType);
    return findSunTime(d, lat, lng, -Math.abs(degree), rising);
  }

  // ── Offset-based: base time ± N minutes ──
  let baseDate;
  switch (cz.baseTime) {
    case 'sunrise': baseDate = st.netz; break;
    case 'sunset': baseDate = st.shkiah; break;
    case 'noon': baseDate = st.chatzot; break;
    case 'chatzotNight': baseDate = st.chatzotNight; break;
    default: return null;
  }
  if (!baseDate || isNaN(baseDate?.getTime?.())) return null;
  return new Date(baseDate.getTime() + cz.offsetMinutes * 60000);
}

const ZMAN_TYPES = [
  { key: 'alot', label: 'Alot HaShachar' },
  { key: 'misheyakir', label: 'Misheyakir' },
  { key: 'netz', label: 'Netz HaChamah' },
  { key: 'shema', label: 'Sof Zman Shema' },
  { key: 'tefilla', label: 'Sof Zman Tefilla' },
  { key: 'chatzot', label: 'Chatzot' },
  { key: 'minchaGedola', label: 'Mincha Gedola' },
  { key: 'minchaKetana', label: 'Mincha Ketana' },
  { key: 'plagHaMincha', label: 'Plag HaMincha' },
  { key: 'beinHaShmashos', label: 'Bein HaShmashos' },
  { key: 'candleLighting', label: 'Candle Lighting' },
  { key: 'motzeiShabbat', label: 'Motzei Shabbat' },
  { key: 'shkiah', label: 'Shkiah' },
  { key: 'tzait', label: 'Tzait Kochavim' },
  { key: 'chatzotNight', label: 'Chatzot HaLayla' },
];

const BASE_TIMES = [
  { key: 'sunrise', label: 'Sunrise (Netz)' },
  { key: 'sunset', label: 'Sunset (Shkiah)' },
  { key: 'noon', label: 'Chatzot (noon)' },
  { key: 'chatzotNight', label: 'Chatzot Night' },
];

// Quick offset presets (in minutes)
const QUICK_OFFSETS = [5, 10, 18, 20, 30, 40, 60, 72, 90, 120];

export default function CustomZmanManager({ customZmanim, onAdd, onRemove, lang = 'both' }) {
  const [zmanType, setZmanType] = useState('alot');
  const [posekName, setPosekName] = useState('');
  const [definitionType, setDefinitionType] = useState('offset'); // 'offset' | 'degree'
  const [baseTime, setBaseTime] = useState('sunrise');
  const [direction, setDirection] = useState('before'); // 'before' | 'after'
  const [offsetMinutes, setOffsetMinutes] = useState(18);
  const [degree, setDegree] = useState(16.1);

  const handleAdd = () => {
    if (!posekName.trim()) return;
    const finalOffset = direction === 'before' ? -Math.abs(Number(offsetMinutes) || 0) : Math.abs(Number(offsetMinutes) || 0);
    onAdd({
      id: Date.now(),
      zmanType,
      posekName: posekName.trim(),
      definitionType,
      baseTime: definitionType === 'offset' ? baseTime : undefined,
      offsetMinutes: definitionType === 'offset' ? finalOffset : undefined,
      degree: definitionType === 'degree' ? Number(degree) : undefined,
    });
    setPosekName('');
    setOffsetMinutes(18);
    setDegree(16.1);
    setDirection('before');
  };

  const selectClass = "w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-yellow-400/50 [color-scheme:dark]";
  const inputClass = "w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-yellow-400/50 [color-scheme:dark]";
  const labelClass = "text-xs text-white/40 mb-1.5 block font-semibold";

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="rounded-xl bg-white/4 border border-white/8 p-4 space-y-3.5">
        {/* Zman type */}
        <div>
          <label className={labelClass}>{lang === 'he' ? 'זמן' : 'Zman'}</label>
          <select value={zmanType} onChange={e => setZmanType(e.target.value)} className={selectClass}>
            {ZMAN_TYPES.map(z => <option key={z.key} value={z.key}>{z.label}</option>)}
          </select>
        </div>

        {/* Posek name */}
        <div>
          <label className={labelClass}>{lang === 'he' ? 'שם הפוסק' : 'Posek Name'}</label>
          <input
            type="text"
            value={posekName}
            onChange={e => setPosekName(e.target.value)}
            placeholder={lang === 'he' ? 'לדוגמה: רש״י' : "e.g. R' Shlomo Zalman"}
            className={inputClass}
          />
        </div>

        {/* Definition type toggle */}
        <div>
          <label className={labelClass}>{lang === 'he' ? 'סוג הגדרה' : 'Definition Type'}</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDefinitionType('offset')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                definitionType === 'offset'
                  ? 'bg-yellow-500/20 border-yellow-400/60 text-yellow-300'
                  : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {lang === 'he' ? 'הפרש דקות' : 'Offset'}
            </button>
            <button
              onClick={() => setDefinitionType('degree')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                definitionType === 'degree'
                  ? 'bg-yellow-500/20 border-yellow-400/60 text-yellow-300'
                  : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              {lang === 'he' ? 'מעלות' : 'Degree'}
            </button>
          </div>
        </div>

        {/* Offset-based config */}
        {definitionType === 'offset' && (
          <div className="space-y-3">
            <div>
              <label className={labelClass}>{lang === 'he' ? 'זמן בסיס' : 'Base Time'}</label>
              <select value={baseTime} onChange={e => setBaseTime(e.target.value)} className={selectClass}>
                {BASE_TIMES.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
              </select>
            </div>

            {/* Before / After toggle */}
            <div>
              <label className={labelClass}>{lang === 'he' ? 'כיוון' : 'Direction'}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDirection('before')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    direction === 'before'
                      ? 'bg-sky-500/20 border-sky-400/60 text-sky-300'
                      : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25'
                  }`}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  {lang === 'he' ? 'לפני' : 'Before'}
                </button>
                <button
                  onClick={() => setDirection('after')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    direction === 'after'
                      ? 'bg-orange-500/20 border-orange-400/60 text-orange-300'
                      : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  {lang === 'he' ? 'אחרי' : 'After'}
                </button>
              </div>
            </div>

            {/* Minutes input */}
            <div>
              <label className={labelClass}>{lang === 'he' ? 'דקות' : 'Minutes'}</label>
              <input
                type="number"
                min="0"
                value={offsetMinutes}
                onChange={e => setOffsetMinutes(e.target.value)}
                className={inputClass}
              />
              {/* Quick presets */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_OFFSETS.map(m => (
                  <button
                    key={m}
                    onClick={() => setOffsetMinutes(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                      Number(offsetMinutes) === m
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40'
                        : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Degree-based config */}
        {definitionType === 'degree' && (
          <div className="space-y-3">
            <div>
              <label className={labelClass}>{lang === 'he' ? 'מעלות מתחת לאופק' : 'Degrees Below Horizon'}</label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.1"
                value={degree}
                onChange={e => setDegree(e.target.value)}
                className={inputClass}
              />
              <p className="text-[10px] text-white/30 mt-1.5">
                {lang === 'he'
                  ? 'השמש תחושב במעלות מתחת לאופק. לדוגמה: 16.1° = עלות, 8.5° = צאת כוכבים'
                  : 'Sun position in degrees below horizon. e.g. 16.1° = Alot, 8.5° = Tzait'}
              </p>
              {/* Quick degree presets */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[6, 7.083, 8.5, 10.2, 11.5, 13, 16.1, 18, 19.8].map(d => (
                  <button
                    key={d}
                    onClick={() => setDegree(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                      Number(degree) === d
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40'
                        : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {d}°
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={!posekName.trim()}
          className="w-full py-2.5 rounded-xl bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 font-semibold hover:bg-yellow-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          {lang === 'he' ? 'הוסף' : 'Add'}
        </button>
      </div>

      {/* List */}
      {customZmanim.length > 0 && (
        <div className="space-y-2">
          {customZmanim.map(cz => (
            <div key={cz.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/8">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white/90 truncate">{cz.posekName}</div>
                <div className="text-xs text-white/40 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>{ZMAN_TYPES.find(z => z.key === cz.zmanType)?.label || cz.zmanType}</span>
                  <span className="text-white/20">·</span>
                  {cz.definitionType === 'degree' ? (
                    <span className="flex items-center gap-1">
                      <Sun className="w-3 h-3" />
                      {cz.degree}°
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {BASE_TIMES.find(b => b.key === cz.baseTime)?.label || cz.baseTime}
                      {' '}
                      {cz.offsetMinutes >= 0 ? '+' : '−'}{Math.abs(cz.offsetMinutes)}m
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onRemove(cz.id)}
                className="p-2 rounded-lg hover:bg-red-500/20 transition-all shrink-0 ml-2"
              >
                <Trash2 className="w-4 h-4 text-white/30 hover:text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
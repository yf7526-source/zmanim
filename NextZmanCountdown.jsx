import React, { useState, useEffect } from 'react';
import { Timer, ArrowRight } from 'lucide-react';
import { formatTimeInTz } from '../lib/timezone';

const ZMANIM_LIST = [
  { key: 'alot', label: 'Alot HaShachar', labelHe: 'עלות השחר', fallback: 'alot_16_1' },
  { key: 'misheyakir', label: 'Misheyakir', labelHe: 'משיכיר', fallback: 'misheyakir_11_5' },
  { key: 'netz', label: 'Netz HaChamah', labelHe: 'נץ החמה', fallback: 'netz' },
  { key: 'shema', label: 'Sof Zman Shema', labelHe: 'סוף זמן קריאת שמע', fallback: 'shema_gra' },
  { key: 'tefilla', label: 'Sof Zman Tefilla', labelHe: 'סוף זמן תפילה', fallback: 'tefilla_gra' },
  { key: 'chatzot', label: 'Chatzot', labelHe: 'חצות', fallback: 'chatzot' },
  { key: 'minchaGedola', label: 'Mincha Gedola', labelHe: 'מנחה גדולה', fallback: 'minchaGedola_gra' },
  { key: 'minchaKetana', label: 'Mincha Ketana', labelHe: 'מנחה קטנה', fallback: 'minchaKetana_gra' },
  { key: 'plagHaMincha', label: 'Plag HaMincha', labelHe: 'פלג המנחה', fallback: 'plagHaMincha_gra' },
  { key: 'shkiah', label: 'Shkiah', labelHe: 'שקיעה', fallback: 'shkiah' },
  { key: 'shabbatEnds', label: 'Motzei Shabbat', labelHe: 'מוצאי שבת', fallback: 'tzait_8_5' },
  { key: 'tzait', label: 'Tzait Kochavim', labelHe: 'צאת הכוכבים', fallback: 'tzait_8_5' },
  { key: 'chatzotNight', label: 'Chatzot HaLayla', labelHe: 'חצות הלילה', fallback: 'chatzotNight' },
];

const SELECTED_FIELDS = {
  alot: { '16.1': 'alot_16_1', '18': 'alot_18', '19.8': 'alot_19_8', '72min': 'alot_72min', '90min': 'alot_90min', '96min': 'alot_96min', '120min': 'alot_120min' },
  misheyakir: { '10.2': 'misheyakir_10_2', '11': 'misheyakir_11', '11.5': 'misheyakir_11_5', '60min': 'misheyakir_60min' },
  shema: { gra: 'shema_gra', mga: 'shema_mga', bht: 'shema_bht' },
  tefilla: { gra: 'tefilla_gra', mga: 'tefilla_mga', bht: 'tefilla_bht' },
  minchaGedola: { gra: 'minchaGedola_gra', mga: 'minchaGedola_mga', bht: 'minchaGedola_bht' },
  minchaKetana: { gra: 'minchaKetana_gra', mga: 'minchaKetana_mga', bht: 'minchaKetana_bht' },
  plagHaMincha: { gra: 'plagHaMincha_gra', mga: 'plagHaMincha_mga', bht: 'plagHaMincha_bht' },
  shabbatEnds: { '72min': 'rabbeinuTam_fixed', '8.5': 'tzait_8_5', '7.083': 'tzait_7_083', '16.1': 'tzait_16_1' },
  tzait: { '7.083': 'tzait_7_083', '8.5': 'tzait_8_5', '16.1': 'tzait_16_1', '72min': 'rabbeinuTam_fixed' },
};

function fmtTime(date, hour12 = true, tz) {
  return formatTimeInTz(date, tz, hour12);
}

function fmtCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function NextZmanCountdown({ sunTimes, currentTime, hour12 = true, lang = 'both', locationTz, zmanimOpinions = {} }) {
  const [now, setNow] = useState(currentTime || new Date());

  useEffect(() => {
    if (currentTime) { setNow(currentTime); return; }
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [currentTime]);

  if (!sunTimes) return null;

  const showHe = lang === 'he' || lang === 'both';
  const showEn = lang === 'en' || lang === 'both';

  const allTimes = ZMANIM_LIST
    .map((z) => {
      const field = SELECTED_FIELDS[z.key]?.[zmanimOpinions[z.key]] || z.fallback;
      return { ...z, _time: sunTimes[field] };
    })
    .filter((z) => z._time)
    .sort((a, b) => a._time - b._time);

  const upcoming = allTimes.filter((z) => z._time > now);

  if (allTimes.length === 0) return null;

  // If all zmanim passed, show first zman of tomorrow (+24h)
  const next = upcoming.length > 0
    ? upcoming[0]
    : { ...allTimes[0], _time: new Date(allTimes[0]._time.getTime() + 24 * 60 * 60 * 1000) };
  const diff = next._time - now;
  const isSoon = diff <= 10 * 60000; // within 10 min

  return (
    <div className={`rounded-3xl border p-5 card-hover transition-all ${
      isSoon
        ? 'border-primary bg-primary/20 animate-pulse-gold'
        : 'border-primary/30 bg-card'
    }`} role="timer" aria-live="off">
      <div className="flex items-center justify-between gap-3">
        {/* Left: label */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isSoon ? 'bg-primary/20 border border-primary/50' : 'bg-primary/10 border border-primary/30'
          }`}>
            <Timer className="w-5 h-5 text-foreground" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-foreground font-semibold mb-0.5">
              {showEn && 'Next Zman'}
              {lang === 'both' && ' · '}
              {showHe && <span dir="rtl">זמן הבא</span>}
            </div>
            <div className="font-bold text-sm leading-snug truncate">
              {showHe && <span dir="rtl" className="text-foreground">{next.labelHe}</span>}
              {lang === 'both' && next.labelHe && <span className="text-foreground/40 mx-1.5">·</span>}
              {showEn && <span className="text-foreground">{next.label}</span>}
            </div>
            <div className="text-xs text-foreground font-mono tabular-nums mt-0.5">
              {fmtTime(next._time, hour12, locationTz)}
            </div>
          </div>
        </div>

        {/* Right: countdown */}
        <div className="text-right shrink-0">
          <div className={`font-mono font-bold tabular-nums leading-none text-foreground ${
            isSoon ? 'text-2xl' : 'text-xl'
          }`}>
            {fmtCountdown(diff)}
          </div>
          <div className="flex items-center justify-end gap-1 mt-1.5">
            <span className="text-[10px] text-foreground">
              {showEn && 'in'}
              {lang === 'both' && ' · '}
              {showHe && <span dir="rtl">בעוד</span>}
            </span>
            <ArrowRight className="w-3 h-3 text-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
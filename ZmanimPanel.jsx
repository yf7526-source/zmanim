import React from 'react';
import { formatTime } from '@/lib/sunCalc';

function minutesUntil(time, now) {
  if (!time || !now) return null;
  return Math.round((time - now) / 60000);
}

const ZMAN_LABELS = {
  alot: { he: 'עלות השחר', en: 'Alot HaShachar', icon: '🌑' },
  misheyakir: { he: 'משיכיר', en: "Misheyakir", icon: '🌒' },
  netz: { he: 'נץ החמה', en: 'Netz HaChamah', icon: '🌅', highlight: true },
  sofShma: { he: 'סוף זמן ק"ש', en: 'Sof Zman Kriat Shema', icon: '📖' },
  minchaGedola: { he: 'מנחה גדולה', en: 'Mincha Gedola', icon: '🕌' },
  minchaKtana: { he: 'מנחה קטנה', en: 'Mincha Ktana', icon: '🕌' },
  plag: { he: 'פלג המנחה', en: 'Plag HaMincha', icon: '⏳' },
  shkiah: { he: 'שקיעה', en: 'Shkiah', icon: '🌇', highlight: true },
  tzait: { he: 'צאת הכוכבים', en: 'Tzait HaKochavim', icon: '✨' },
};

const POSEK_LABELS = {
  gra: "גר\"א / GRA",
  rt: "ר\"ת / Rabbeinu Tam (72 min)",
  deg6: "-6° Civil Twilight",
  deg85: "-8.5°",
  deg161: "-16.1° Astronomical",
};

export default function ZmanimPanel({ sunTimes, selectedOpinion, onOpinionChange, altitude, selectedTime }) {
  const posek = selectedOpinion;
  const onPosekChange = onOpinionChange;
  const now = selectedTime;

  // Map sunTimes to the zmanim keys this component expects
  const zmanim = sunTimes ? {
    alot: sunTimes.alot16 || sunTimes.alot18,
    netz: sunTimes.netz,
    shkiah: sunTimes.shkiah,
    tzait: sunTimes.tzait6 || sunTimes.tzait8_5 || sunTimes.tzait16,
  } : null;

  if (!zmanim) return (
    <div className="text-center text-muted-foreground py-8">Calculating...</div>
  );

  const nextKey = Object.keys(ZMAN_LABELS).find(k => {
    if (!zmanim[k]) return false;
    return zmanim[k] > now;
  });

  return (
    <div className="space-y-3">
      {/* Posek selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground font-hebrew">שיטה / Opinion</label>
        <select
          value={posek}
          onChange={e => onPosekChange(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {Object.entries(POSEK_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Zmanim list */}
      <div className="space-y-1.5">
        {Object.entries(ZMAN_LABELS).map(([key, meta]) => {
          if (!zmanim[key]) return null;
          const time = zmanim[key];
          const isNext = key === nextKey;
          const isPast = time < now;
          const mins = minutesUntil(time, now);
          const isHighlight = meta.highlight;

          return (
            <div
              key={key}
              className={`flex items-center justify-between rounded-lg px-3 py-2 transition-all ${
                isNext
                  ? 'bg-primary/15 border border-primary/50 shadow-lg'
                  : isHighlight
                  ? 'bg-secondary/80 border border-border/60'
                  : 'bg-secondary/40 border border-transparent'
              } ${isPast ? 'opacity-50' : ''}`}
            >
              <div className="flex flex-col">
                <span className={`font-hebrew text-sm font-semibold ${isHighlight ? 'text-gold' : 'text-foreground'}`}>
                  {meta.he}
                </span>
                <span className="text-xs text-muted-foreground">{meta.en}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`font-mono text-base font-bold ${isNext ? 'text-gold' : isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {formatTime(time)}
                </span>
                {isNext && (
                  <span className="text-xs text-primary font-medium">
                    {mins > 0 ? `in ${mins} min` : 'now'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
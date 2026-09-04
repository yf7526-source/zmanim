import React from 'react';
import { hexToRgba } from '@/lib/holidayColors';
import { hebrewDayLetter } from '@/lib/monthlyZmanimHelpers';

// A single day cell in the Jewish Calendar grid.
// `mainEvents` items carry a `_color` (resolved per-event accent) set by the parent.
export default function CalendarDayCell({ day, hebrewDay, mainEvents, parasha, category, colors, isToday, lang, onSelect }) {
  if (!day) return <div className="aspect-square rounded-xl bg-white/[0.02]" />;

  const isShabbat = day.getDay() === 6;
  const color = colors[category] || colors.plain;
  const isTodayRing = isToday;
  const isPlain = category === 'plain';
  const style = {
    backgroundColor: isPlain ? 'rgba(255,255,255,0.03)' : hexToRgba(color, 0.14),
    boxShadow: isTodayRing
      ? `inset 0 0 0 2px ${color}`
      : isPlain
        ? `inset 0 0 0 1px ${hexToRgba(color, 0.10)}`
        : `inset 0 0 0 1px ${hexToRgba(color, 0.28)}`,
  };

  const priority = (event) => {
    const title = `${event?.title || ''} ${event?.hebrew || ''}`.toLowerCase();
    if (event?.category === 'holiday' || /rosh hashana|yom kippur|pesach|shavuot|sukkot|שמחת תורה/.test(title)) return 100;
    if (event?.category === 'custom') return 90;
    if (event?.category === 'fast' || /fast|ta'anit|tzom|צום|תענית/.test(title)) return 80;
    if (/rosh chodesh|ראש חודש/.test(title)) return 70;
    return 40;
  };
  const prioritizedEvents = [...mainEvents].sort((a, b) => priority(b) - priority(a));
  const visibleEvents = prioritizedEvents.slice(0, 1);
  const extraCount = prioritizedEvents.length - visibleEvents.length;
  const labelOf = (e) => {
    const he = e.hebrew || '';
    const en = e.title || '';
    return lang === 'he' ? (he || en) : lang === 'en' ? (en || he) : (he || en);
  };
  const ariaLabel = `${day.toLocaleDateString()}${mainEvents.length ? ' — ' + mainEvents.map(e => e.hebrew || e.title).join(', ') : ''}${parasha ? ' — ' + (parasha.hebrew || parasha.title) : ''}`;

  return (
    <button
      onClick={() => onSelect(day)}
      style={style}
      aria-label={ariaLabel}
      className="aspect-square rounded-xl p-1 flex flex-col items-center justify-start transition-all hover:brightness-125 active:scale-95"
    >
      <div className="flex items-baseline gap-1 leading-none w-full justify-center">
        {hebrewDay != null && (
          <span className="text-[11px] font-bold text-foreground/80" dir="rtl">{hebrewDayLetter(hebrewDay)}</span>
        )}
        <span className={`text-[11px] ${isShabbat ? 'font-bold text-foreground' : 'text-foreground/65'}`}>
          {day.getDate()}
        </span>
      </div>
      <div className="flex-1 w-full overflow-hidden mt-0.5 space-y-0.5">
        {visibleEvents.map((e, i) => (
          <div
            key={i}
            className="text-[8px] leading-tight truncate px-1 rounded text-center"
            style={{
              backgroundColor: hexToRgba(e._color || color, 0.20),
              border: `1px solid ${hexToRgba(e._color || color, 0.45)}`,
              color: e._color || color,
            }}
            dir="rtl"
            title={e.title}
          >
            {labelOf(e)}
          </div>
        ))}
        {extraCount > 0 && (
          <div className="text-[7px] text-foreground/60 text-center">+{extraCount}</div>
        )}
        {parasha && (
          <div
            className="text-[7px] truncate text-center"
            style={{ color: hexToRgba(color, 0.9) }}
            dir="rtl"
            title={parasha.title}
          >
            {parasha.hebrew || parasha.title}
          </div>
        )}
      </div>
    </button>
  );
}
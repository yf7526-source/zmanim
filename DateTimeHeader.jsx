import React from 'react';
import { formatDateInTz, formatClockInTz, getStableDateForHebrew, getWeekdayInTz } from '@/lib/timezone';
import { toHebrewDate } from '@/lib/sunCalc';

const DAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

/**
 * Compact three-line date/time block for the sticky Home header.
 * Line 1: Hebrew date (gold) · English date (light)
 * Line 2: Day of week + parasha (gold, RTL)
 * Line 3: Live clock (gold, tabular)
 */
export default function DateTimeHeader({ date, currentTime, locationTz, hour12, clockLocale, parashaEvent, lang }) {
  if (!date) return null;
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 pb-1.5 text-center" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      {/* Line 1 — Hebrew date + English date */}
      <div className="flex items-baseline justify-center gap-2 flex-wrap leading-tight">
        <span className="text-xs font-bold text-yellow-400/90" dir="rtl">
          {toHebrewDate(getStableDateForHebrew(date, locationTz))?.formatted || ''}
        </span>
        <span className="text-[11px] font-semibold text-white/70">
          {formatDateInTz(date, locationTz, { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
      {/* Line 2 — Day of week + parasha */}
      <div className="text-[11px] font-medium text-yellow-300/70 leading-tight" dir="rtl">
        יום {DAY_NAMES_HE[getWeekdayInTz(date, locationTz)]}{parashaEvent?.hebrew ? <> · {parashaEvent.hebrew}</> : null}
      </div>
      {/* Line 3 — Live clock */}
      <span className="font-bold tabular-nums tracking-tight text-[11px] text-[#e3cc59] leading-tight">
        {formatClockInTz(currentTime, locationTz, hour12, clockLocale)}
      </span>
    </div>
  );
}
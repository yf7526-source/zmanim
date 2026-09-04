import React from 'react';
import { getBadgeStyle, getOmerDay, getOmerText, isRoshChodesh, getRoshChodeshName } from '../lib/jewishCalendar';
import { categorizeHebcalEvent } from '../lib/holidayDetection';
import { toHebrewDate } from '../lib/sunCalc';
import { toDateOnly, getStableDateForHebrew, formatDateInTz } from '../lib/timezone';
import { Calendar, Star, BookOpen } from 'lucide-react';

export default function JewishDayBanner({ date, calendarEvents = [], lang = 'both', locationTz }) {
  const stableDate = getStableDateForHebrew(date, locationTz);
  const hd = toHebrewDate(stableDate);
  const omerDay = getOmerDay(stableDate);
  const omerInfo = omerDay ? getOmerText(omerDay, 'both') : null;

  const todayStr = toDateOnly(date, locationTz) || '';

  // Hebcal event data is authoritative for holidays because it handles postponed
  // fasts and Israel/diaspora differences. We intentionally do not fall back to
  // the fixed holiday table for major holidays when live event data is missing.
  const hebcalBadgeEvent = (() => {
    const evs = calendarEvents.filter(e => {
      const evDate = e.date?.split('T')[0];
      return evDate === todayStr && (e.category === 'holiday' || e.category === 'fast' || e.category === 'roshchodesh');
    });
    for (const type of ['yomtov', 'fast', 'cholhamoed', 'erev', 'roshchodesh', 'minor']) {
      const found = evs.find(e => categorizeHebcalEvent(e) === type);
      if (found) return found;
    }
    return null;
  })();
  const localRoshChodesh = isRoshChodesh(stableDate) ? getRoshChodeshName(stableDate) : null;
  const badge = hebcalBadgeEvent
    ? { he: hebcalBadgeEvent.hebrew || hebcalBadgeEvent.title, en: hebcalBadgeEvent.title, type: categorizeHebcalEvent(hebcalBadgeEvent) }
    : localRoshChodesh
      ? { he: localRoshChodesh.he, en: localRoshChodesh.en, type: 'roshchodesh' }
      : null;
  const parasha = calendarEvents.find(e => e.category === 'parashat' && e.date >= todayStr);
  const todayEvents = calendarEvents.filter(e => {
    const evDate = e.date?.split('T')[0];
    return evDate === todayStr && ['holiday', 'parashat', 'roshchodesh', 'omer'].includes(e.category);
  });

  const showBilingual = lang === 'both';
  const showHebrew = lang === 'he' || lang === 'both';
  const showEnglish = lang === 'en' || lang === 'both';

  if (!hd) return null;

  return (
    <div className="rounded-3xl border border-white/8 bg-white/4 backdrop-blur-sm p-5 card-hover">
      {/* Header with Hebrew date */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/15 border border-yellow-400/25 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-yellow-300" />
          </div>
          <div>
            {showHebrew && (
              <div className="text-lg font-bold text-yellow-200 leading-snug" dir="rtl">
                {hd.formatted}
              </div>
            )}
            {showEnglish && (
              <div className="text-xs text-white/40 mt-0.5">
                {formatDateInTz(date, locationTz, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>

        {badge && (
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${getBadgeStyle(badge.type)} card-hover`}>
            {showBilingual
              ? <><span dir="rtl">{badge.he}</span> · {badge.en}</>
              : showHebrew ? <span dir="rtl">{badge.he}</span> : badge.en
            }
          </div>
        )}
      </div>

      {/* Events grid */}
      {(parasha || omerInfo || todayEvents.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Parasha */}
          {parasha && (
            <div className="rounded-xl bg-white/5 border border-white/8 p-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                  <BookOpen className="w-3.5 h-3.5 text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/30 mb-0.5">{showHebrew ? 'פרשת השבוע' : 'Weekly Parasha'}</div>
                  <div className="text-sm font-semibold text-white/80 truncate">
                    {showHebrew && parasha.hebrew && <span dir="rtl">{parasha.hebrew}</span>}
                    {showBilingual && parasha.hebrew && parasha.title && <span className="text-white/30 mx-2">·</span>}
                    {showEnglish && parasha.title && <span>{parasha.title.replace('Parashat ', '').replace('Parsha ', '')}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Omer */}
          {omerInfo && (
            <div className="rounded-xl bg-white/5 border border-white/8 p-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                  <Star className="w-3.5 h-3.5 text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/30 mb-0.5">{showHebrew ? 'ספירת העומר' : 'Omer Count'}</div>
                  <div className="text-sm font-semibold text-white/80">
                    {showHebrew && omerInfo.he && <span dir="rtl">{omerInfo.he}</span>}
                    {showBilingual && omerInfo.he && omerInfo.en && <span className="text-white/30 mx-2">·</span>}
                    {showEnglish && omerInfo.en && <span>{omerInfo.en}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other events */}
          {todayEvents.filter(e => e.category === 'holiday' || e.category === 'roshchodesh').map((event, idx) => (
            <div key={idx} className="rounded-xl bg-white/5 border border-white/8 p-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                  <Star className="w-3.5 h-3.5 text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/30 mb-0.5">{event.category === 'roshchodesh' ? (showHebrew ? 'ראש חודש' : 'Rosh Chodesh') : (showHebrew ? 'חג' : 'Holiday')}</div>
                  <div className="text-sm font-semibold text-white/80">
                    {showHebrew && event.hebrew && <span dir="rtl">{event.hebrew}</span>}
                    {showBilingual && event.hebrew && event.title && <span className="text-white/30 mx-2">·</span>}
                    {showEnglish && event.title && <span>{event.title}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No special events */}
      {!parasha && !omerInfo && todayEvents.length === 0 && (
        <div className="text-center py-2">
          <p className="text-xs text-white/30">{lang === 'he' ? 'יום רגיל' : lang === 'en' ? 'Regular day' : 'יום רגיל · Regular day'}</p>
        </div>
      )}
    </div>
  );
}
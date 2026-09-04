import React, { useState, useEffect } from 'react';
import { Sparkles, Moon } from 'lucide-react';

/**
 * Detects whether the current time falls within a Shabbat or Yom Tov window
 * using Hebcal candle-lighting and havdalah events, then shows a calm banner.
 * Calls onActiveChange(isActive) so the parent can adjust the theme.
 */
export default function ShabbatModeBanner({ calendarEvents, currentTime, lang = 'both', onActiveChange }) {
  const [active, setActive] = useState(false);
  const [label, setLabel] = useState('');

  const showHe = lang === 'he' || lang === 'both';
  const showEn = lang === 'en' || lang === 'both';

  useEffect(() => {
    if (!calendarEvents?.length) { setActive(false); return; }

    const now = currentTime.getTime();

    // Collect candle-lighting and havdalah events as timestamps
    const candles = calendarEvents
      .filter(e => e.category === 'candles' && e.date)
      .map(e => ({ time: new Date(e.date).getTime(), title: e.title, titleHeb: e.hebrew, memo: e.memo }));
    const havdalah = calendarEvents
      .filter(e => e.category === 'havdalah' && e.date)
      .map(e => ({ time: new Date(e.date).getTime(), title: e.title, titleHeb: e.hebrew }));

    // Find the most recent candle lighting at or before now
    const lastCandle = candles.filter(c => c.time <= now).sort((a, b) => b.time - a.time)[0];
    if (!lastCandle) { setActive(false); return; }

    // Find the first havdalah after that candle lighting
    const nextHavdalah = havdalah.filter(h => h.time > lastCandle.time).sort((a, b) => a.time - b.time)[0];
    if (!nextHavdalah) { setActive(false); return; }

    const isActive = now >= lastCandle.time && now < nextHavdalah.time;
    setActive(isActive);

    if (isActive) {
      // Determine if it's Shabbat or Yom Tov from the memo/title
      const isShabbat = lastCandle.memo?.toLowerCase().includes('shabbat') || lastCandle.title?.toLowerCase().includes('shabbat');
      const yomTovName = lastCandle.memo || lastCandle.title || '';
      const yomTovNameHe = lastCandle.titleHeb || '';
      setLabel(isShabbat ? 'Shabbat Shalom' : yomTovName);
    }
  }, [calendarEvents, currentTime]);

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  if (!active) return null;

  return (
    <div className="rounded-3xl border border-purple-400/20 bg-gradient-to-br from-indigo-500/10 via-purple-500/8 to-slate-500/10 backdrop-blur-md p-5 space-y-2 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-purple-300" />
        </div>
        <div>
          <h3 className="text-base font-bold text-purple-200">
            {showHe && <span dir="rtl">{label === 'Shabbat Shalom' ? 'שבת שלום' : label}</span>}
            {lang === 'both' && ' · '}
            {showEn && <span>{label}</span>}
          </h3>
          <p className="text-xs text-purple-300/50 mt-0.5 flex items-center gap-1.5">
            <Moon className="w-3 h-3" />
            {showEn && 'Shabbat / Yom Tov mode — calm UI active'}
            {lang === 'both' && ' · '}
            {showHe && <span dir="rtl">מצב שבת / יום טוב פעיל</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
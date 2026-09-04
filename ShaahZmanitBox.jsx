import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import ShaahZmanitClock from './ShaahZmanitClock';

function fmtMin(ms) {
  if (!ms || ms <= 0) return '--:--';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export default function ShaahZmanitBox({ sunTimes, currentTime, lang = 'both', locationTz }) {
  const [now, setNow] = useState(currentTime || new Date());

  useEffect(() => {
    if (currentTime) { setNow(currentTime); return; }
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [currentTime]);

  if (!sunTimes) return null;
  const { shaahGra, shaahMga, netz, shkiah, alot_16_1, tzait_8_5 } = sunTimes;

  const showHe = lang === 'he' || lang === 'both';
  const showEn = lang === 'en' || lang === 'both';

  // Current sha'a number (1-based) — kept as a small secondary indicator
  const graStart = netz;
  const mgaStart = alot_16_1;

  // Continuous halachic-hour sweep (day + night) so the clock hands always move.
  // Outside the halachic day the value exceeds 12 and is wrapped to 1–12 below.
  const graNum = (graStart && shaahGra) ? (now - graStart) / shaahGra + 1 : null;
  const mgaNum = (mgaStart && shaahMga) ? (now - mgaStart) / shaahMga + 1 : null;

  const to12 = (n) => (n == null) ? null : (((Math.floor(n) - 1) % 12) + 12) % 12 + 1;
  const graFloor = to12(graNum);
  const mgaFloor = to12(mgaNum);

  const hebrewOrdinals = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב'];

  return (
    <div className="rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 p-5 card-hover">
      {/* Header */}
      <div className="flex items-center justify-between gap-2.5 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-yellow-400/15 border border-yellow-400/25 flex items-center justify-center">
            <Clock className="w-4 h-4 text-yellow-300" />
          </div>
          <div>
            {showHe && <div className="text-sm font-bold text-yellow-200" dir="rtl">שעה זמנית</div>}
            {showEn && <div className="text-xs font-semibold text-yellow-400/80">
              {lang === 'he' ? '' : 'Halachic Hour'}
            </div>}
          </div>
        </div>
        <div className="text-right max-w-[60%]">
          <div className="text-[10px] text-white/40 leading-tight">
            {showEn && 'Length of proportional hour'}
            {lang === 'both' && ' · '}
            {showHe && <span dir="rtl">אורך שעה זמנית</span>}
          </div>
        </div>
      </div>

      {/* Two clock visuals — side by side, stack on very small screens */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* GRA clock */}
        <div className="rounded-2xl bg-white/5 border border-white/8 p-4 flex flex-col items-center card-hover">
          <ShaahZmanitClock
            label="GRA" labelHe="גר״א"
            durationMs={shaahGra}
            currentHour={graNum}
            theme="gold"
            lang={lang}
            size={148}
          />
          <div className="text-[10px] text-white/30 mt-2 text-center">netz → shkiah ÷ 12</div>
          {graFloor !== null && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-400/15 border border-yellow-400/30">
              <span className="text-[10px] text-white/50" dir="rtl">שעה</span>
              <span className="text-yellow-200 font-bold text-[11px]">{hebrewOrdinals[graFloor]}</span>
            </div>
          )}
          {graFloor === null && (
            <div className="mt-2 text-[10px] text-white/25">—</div>
          )}
        </div>

        {/* MGA clock */}
        <div className="rounded-2xl bg-white/5 border border-white/8 p-4 flex flex-col items-center card-hover">
          <ShaahZmanitClock
            label="MGA" labelHe="מג״א"
            durationMs={shaahMga}
            currentHour={mgaNum}
            theme="sky"
            lang={lang}
            size={148}
          />
          <div className="text-[10px] text-white/30 mt-2 text-center">alot → tzait ÷ 12</div>
          {mgaFloor !== null && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-400/15 border border-sky-400/30">
              <span className="text-[10px] text-white/50" dir="rtl">שעה</span>
              <span className="text-sky-200 font-bold text-[11px]">{hebrewOrdinals[mgaFloor]}</span>
            </div>
          )}
          {mgaFloor === null && (
            <div className="mt-2 text-[10px] text-white/25">—</div>
          )}
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-4 text-center">
        <p className="text-[10px] text-white/20">
          {showEn && 'Consult your rabbi for halachic decisions'}
          {lang === 'both' && ' · '}
          {showHe && <span dir="rtl">שאל רב לפסיקה הלכתית</span>}
        </p>
      </div>
    </div>
  );
}
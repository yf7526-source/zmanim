import React from 'react';
import { Printer } from 'lucide-react';
import { formatTimeInTz } from '@/lib/timezone';

const ROWS = [
  ['alot_16_1', 'Alot HaShachar', 'עלות השחר'],
  ['netz', 'Sunrise', 'נץ החמה'],
  ['shema_gra', 'Latest Shema', 'סוף זמן קריאת שמע'],
  ['tefilla_gra', 'Latest Tefilla', 'סוף זמן תפילה'],
  ['chatzot', 'Midday', 'חצות'],
  ['minchaGedola_gra', 'Mincha Gedola', 'מנחה גדולה'],
  ['minchaKetana_gra', 'Mincha Ketana', 'מנחה קטנה'],
  ['plagHaMincha_gra', 'Plag HaMincha', 'פלג המנחה'],
  ['shkiah', 'Sunset', 'שקיעה'],
  ['tzait_8_5', 'Nightfall', 'צאת הכוכבים'],
];

export default function ClassicDailyTable({ sunTimes, location, date, locationTz, hour12 = true, lang = 'both' }) {
  const print = () => window.print();
  const showHe = lang !== 'en';
  const showEn = lang !== 'he';
  return (
    <section className="classic-daily rounded-2xl bg-white text-slate-950 border border-slate-200 overflow-hidden shadow-xl">
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200 bg-slate-50">
        <div>
          <h2 className="text-lg font-black">{location?.name || 'Location'}</h2>
          <p className="text-xs text-slate-500">{date?.toLocaleDateString?.('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <button type="button" onClick={print} className="print:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-sm font-bold" aria-label="Print daily times">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>
      <table className="w-full border-collapse">
        <thead><tr className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500"><th className="text-left px-5 py-3">Time</th><th className="text-right px-5 py-3">Today</th></tr></thead>
        <tbody>
          {ROWS.map(([key, en, he]) => (
            <tr key={key} className="border-t border-slate-200 even:bg-slate-50/60">
              <td className="px-5 py-3">
                {showEn && <div className="font-semibold">{en}</div>}
                {showHe && <div dir="rtl" className="text-sm text-slate-600">{he}</div>}
              </td>
              <td className="px-5 py-3 text-right text-lg font-black tabular-nums">{formatTimeInTz(sunTimes?.[key], locationTz, hour12) || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-5 py-3 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between gap-4">
        <span>SolarZmanim</span><span>solarzmanim.app</span>
      </div>
    </section>
  );
}

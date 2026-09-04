import React, { useMemo, useState, useEffect } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer
} from 'recharts';
import { getMoonTimes, getMoonPhase, toHebrewDate, hebrewToGregorian } from '../lib/sunCalc';
import { getHourInTz } from '../lib/timezone';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS_EN = ['','Nisan','Iyar','Sivan','Tammuz','Av','Elul','Tishri','Cheshvan','Kislev','Tevet','Shvat','Adar','Adar II'];
const MONTHS_HE = ['','ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשון','כסלו','טבת','שבט','אדר','אדר ב׳'];

function formatHour(h) {
  if (h == null || isNaN(h)) return '--';
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const ampm = hh < 12 ? 'AM' : 'PM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
}

function getHebrewMonthDays(year, month) {
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
  if([2,4,6,10,13].includes(month))return 29;
  if(month===12&&!isLeap(year))return 29;
  if(month===8&&daysY(year)%10!==5)return 29;
  if(month===9&&daysY(year)%10===3)return 29;
  return 30;
}

function buildMoonDataMonth(hebYear, hebMonth, lat, lng, tz) {
  const data = [];
  const maxDay = getHebrewMonthDays(hebYear, hebMonth);

  for (let day = 1; day <= maxDay; day++) {
    const greg = hebrewToGregorian(hebYear, hebMonth, day);
    if (!greg || isNaN(greg.getTime())) continue;
    greg.setHours(12, 0, 0, 0);

    const moonTimes = getMoonTimes(greg, lat, lng);
    const moonPhase = getMoonPhase(greg);

    const moonrise = moonTimes?.moonrise ? getHourInTz(moonTimes.moonrise, tz) : null;
    const moonset = moonTimes?.moonset ? getHourInTz(moonTimes.moonset, tz) : null;

    data.push({
      day,
      illumination: moonPhase?.illumination ?? 0,
      moonrise,
      moonset,
      phase: moonPhase?.phase ?? 0,
      gregorianLabel: greg.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      dateObj: new Date(greg),
    });
  }
  return data;
}

const CustomTooltip = ({ active, payload, lang }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-[#0d1420] border border-white/15 rounded-xl px-3 py-2.5 text-xs shadow-xl space-y-1">
      <p className="text-white/50">{d.gregorianLabel}</p>
      <p className="text-blue-400/80 font-semibold" dir="rtl">{lang === 'he' ? `יום ${d.day}` : `Day ${d.day}`}</p>
      <div className="border-t border-white/8 pt-1 mt-1 space-y-0.5">
        <p className="text-blue-300 font-bold">🌕 {d.illumination}% {lang === 'he' ? 'מואר' : 'illuminated'}</p>
        {d.moonrise != null && <p className="text-sky-300 font-semibold">🌙 {lang === 'he' ? 'זריחה' : 'Rise'} {formatHour(d.moonrise)}</p>}
        {d.moonset != null && <p className="text-violet-300 font-semibold">🌙 {lang === 'he' ? 'שקיעה' : 'Set'} {formatHour(d.moonset)}</p>}
      </div>
    </div>
  );
};

export default function YearlyMoonChart({ location, date, lang = 'both', locationTz }) {
  const [mode, setMode] = useState('illumination');

  // Sync to current Hebrew month from selected date
  const initHd = date ? toHebrewDate(date) : null;
  const [hebYear, setHebYear] = useState(initHd?.year || 5786);
  const [hebMonth, setHebMonth] = useState(initHd?.month || 7);

  useEffect(() => {
    if (!date) return;
    const hd = toHebrewDate(date);
    if (hd) {
      setHebYear(hd.year);
      setHebMonth(hd.month);
    }
  }, [date?.toDateString()]);

  const data = useMemo(() => {
    if (!location) return [];
    return buildMoonDataMonth(hebYear, hebMonth, location.lat, location.lng, locationTz);
  }, [location?.lat, location?.lng, hebYear, hebMonth, locationTz]);

  function navigateMonth(dir) {
    const isLeap = (7 * hebYear + 1) % 19 < 7;
    const maxM = isLeap ? 13 : 12;
    let m = hebMonth + dir;
    let y = hebYear;
    if (m < 1) { m = maxM; y--; }
    if (m > maxM) { m = 1; y++; }
    setHebMonth(m);
    setHebYear(y);
  }

  if (!data.length) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDay = data.find(d => d.dateObj.getTime() === today.getTime())?.day;
  const lastDay = data[data.length - 1].day;
  const isLeap = (7 * hebYear + 1) % 19 < 7;

  const monthLabelHe = hebMonth === 13 ? 'אדר ב׳' : (hebMonth === 12 && isLeap) ? 'אדר א׳' : MONTHS_HE[hebMonth];
  const monthLabelEn = hebMonth === 13 ? 'Adar II' : (hebMonth === 12 && isLeap) ? 'Adar I' : MONTHS_EN[hebMonth];
  const monthLabel = lang === 'he' ? monthLabelHe : lang === 'en' ? monthLabelEn : `${monthLabelEn} · ${monthLabelHe}`;

  const yearStr = (() => {
    const ones = ['','א','ב','ג','ד','ה','ו','ז','ח','ט'];
    const tens = ['','י','כ','ל','מ','נ','ס','ע','פ','צ'];
    const toHNum = n => { const m = n % 100; if (m === 15) return 'טו'; if (m === 16) return 'טז'; return tens[Math.floor(m/10)] + ones[m%10]; };
    const hundreds = ['','ק','ר','ש','ת','תק','תר','תש','תת','תתק'];
    const mod = hebYear % 1000;
    return hundreds[Math.floor(mod/100)] + toHNum(mod % 100);
  })();

  const tickFormatter = (v) => {
    if (v % 5 === 0 || v === 1) return String(v);
    return '';
  };

  const showIllum = mode === 'illumination' || mode === 'all';
  const showRise = mode === 'moonrise' || mode === 'all';
  const showSet = mode === 'moonset' || mode === 'all';

  return (
    <div className="rounded-3xl border border-white/8 bg-white/4 backdrop-blur-sm p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <ChevronRight className="w-4 h-4 text-white/50" />
          </button>
          <div className="text-center">
            <h3 className="text-sm font-bold text-white/80" dir="rtl">
              🌕 {monthLabelHe} {yearStr}
            </h3>
            <p className="text-xs text-white/30 mt-0.5">
              {lang === 'he' ? `${monthLabelHe} ${yearStr} — מזל הלבנה` : `${monthLabelEn} ${yearStr} — Moon Chart`}
            </p>
          </div>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-white/50" />
          </button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: 'illumination', label: '🌕' },
            { key: 'moonrise', label: lang === 'he' ? '🌙 זריחה' : '🌙 Rise' },
            { key: 'moonset', label: lang === 'he' ? '🌙 שקיעה' : '🌙 Set' },
            { key: 'all', label: lang === 'he' ? 'הכל' : 'All' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setMode(opt.key)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === opt.key
                  ? 'bg-blue-500/25 border border-blue-400/40 text-blue-300'
                  : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="moonIllumGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              type="number"
              domain={[1, lastDay]}
              tickFormatter={tickFormatter}
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="illum"
              domain={[0, 100]}
              tick={{ fill: 'rgba(147,197,253,0.55)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}%`}
              width={32}
              hide={!showIllum}
            />
            <YAxis
              yAxisId="time"
              orientation="right"
              domain={[0, 24]}
              tick={{ fill: 'rgba(125,211,252,0.55)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => formatHour(v).replace(' AM','a').replace(' PM','p')}
              width={36}
              hide={showIllum && !showRise && !showSet}
            />
            <Tooltip content={<CustomTooltip lang={lang} />} />
            {todayDay != null && (
              <ReferenceLine
                yAxisId="illum"
                x={todayDay}
                stroke="rgba(147,197,253,0.6)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                label={{ value: lang === 'he' ? 'היום' : 'today', position: 'top', fill: 'rgba(147,197,253,0.5)', fontSize: 8 }}
              />
            )}
            {showIllum && (
              <Area
                yAxisId="illum"
                type="monotone"
                dataKey="illumination"
                stroke="#93c5fd"
                strokeWidth={2}
                fill="url(#moonIllumGrad)"
                dot={false}
                activeDot={{ r: 3, fill: '#93c5fd', strokeWidth: 0 }}
              />
            )}
            {showRise && (
              <Line
                yAxisId="time"
                type="monotone"
                dataKey="moonrise"
                stroke="#7dd3fc"
                strokeWidth={2}
                dot={false}
                connectNulls
                activeDot={{ r: 3, fill: '#7dd3fc', strokeWidth: 0 }}
              />
            )}
            {showSet && (
              <Line
                yAxisId="time"
                type="monotone"
                dataKey="moonset"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
                connectNulls
                activeDot={{ r: 3, fill: '#a78bfa', strokeWidth: 0 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 px-1 text-xs text-white/35 flex-wrap">
        {showIllum && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-blue-300 inline-block rounded" />
            {lang === 'he' ? 'אחוז זיווי' : 'Illumination'}
          </span>
        )}
        {showRise && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-sky-300 inline-block rounded" />
            {lang === 'he' ? 'זריחת הירח' : 'Moonrise'}
          </span>
        )}
        {showSet && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-violet-400 inline-block rounded" />
            {lang === 'he' ? 'שקיעת הירח' : 'Moonset'}
          </span>
        )}
      </div>
    </div>
  );
}
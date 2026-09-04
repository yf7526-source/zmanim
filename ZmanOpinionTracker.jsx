import React, { useMemo, useState } from 'react';
import { X, TrendingUp, ChevronDown } from 'lucide-react';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { getSunTimes, toHebrewDate } from '../lib/sunCalc';
import { getHourInTz } from '../lib/timezone';
import { calcCustomZman } from './CustomZmanManager';
import DayZmanimDetail from './DayZmanimDetail';

const MONTHS_EN = ['','Nisan','Iyar','Sivan','Tammuz','Av','Elul','Tishri','Cheshvan','Kislev','Tevet','Shvat','Adar','Adar II'];
const MONTHS_HE = ['','ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשון','כסלו','טבת','שבט','אדר','אדר ב׳'];

const ZMAN_GROUPS = [
  { group: 'Alot', groupHe: 'עלות השחר', options: [
    { key: 'alot_120min', label: '120 min', labelHe: '120 דק׳' },
    { key: 'alot_96min', label: '96 min', labelHe: '96 דק׳' },
    { key: 'alot_90min', label: '90 min', labelHe: '90 דק׳' },
    { key: 'alot_72min', label: '72 min (R. Tam)', labelHe: '72 דק׳ ר"ת' },
    { key: 'alot_19_8', label: '19.8°', labelHe: '19.8°' },
    { key: 'alot_18', label: '18°', labelHe: '18°' },
    { key: 'alot_16_1', label: '16.1°', labelHe: '16.1°' },
  ]},
  { group: 'Misheyakir', groupHe: 'משיכיר', options: [
    { key: 'misheyakir_60min', label: '60 min', labelHe: '60 דק׳' },
    { key: 'misheyakir_10_2', label: '10.2°', labelHe: '10.2°' },
    { key: 'misheyakir_11', label: '11°', labelHe: '11°' },
    { key: 'misheyakir_11_5', label: '11.5°', labelHe: '11.5°' },
  ]},
  { group: 'Netz', groupHe: 'נץ החמה', options: [
    { key: 'netz', label: 'Sunrise', labelHe: 'נץ' },
  ]},
  { group: 'Shema', groupHe: 'סוף זמן ק"ש', options: [
    { key: 'shema_mga', label: 'MGA', labelHe: 'מג"א' },
    { key: 'shema_gra', label: 'GRA', labelHe: 'גר"א' },
  ]},
  { group: 'Tefilla', groupHe: 'סוף זמן תפילה', options: [
    { key: 'tefilla_mga', label: 'MGA', labelHe: 'מג"א' },
    { key: 'tefilla_gra', label: 'GRA', labelHe: 'גר"א' },
  ]},
  { group: 'Chatzot', groupHe: 'חצות', options: [
    { key: 'chatzot', label: 'Solar Noon', labelHe: 'חצות היום' },
    { key: 'chatzotNight', label: 'Midnight', labelHe: 'חצות הלילה' },
  ]},
  { group: 'Mincha Gedola', groupHe: 'מנחה גדולה', options: [
    { key: 'minchaGedola_mga', label: 'MGA', labelHe: 'מג"א' },
    { key: 'minchaGedola_gra', label: 'GRA', labelHe: 'גר"א' },
  ]},
  { group: 'Mincha Ketana', groupHe: 'מנחה קטנה', options: [
    { key: 'minchaKetana_mga', label: 'MGA', labelHe: 'מג"א' },
    { key: 'minchaKetana_gra', label: 'GRA', labelHe: 'גר"א' },
  ]},
  { group: 'Plag HaMincha', groupHe: 'פלג המנחה', options: [
    { key: 'plagHaMincha_mga', label: 'MGA', labelHe: 'מג"א' },
    { key: 'plagHaMincha_gra', label: 'GRA', labelHe: 'גר"א' },
  ]},
  { group: 'Candle Lighting', groupHe: 'הדלקת נרות', options: [
    { key: 'candleLighting_40', label: '40 min', labelHe: '40 דק׳' },
    { key: 'candleLighting_30', label: '30 min', labelHe: '30 דק׳' },
    { key: 'candleLighting_20', label: '20 min', labelHe: '20 דק׳' },
    { key: 'candleLighting_18', label: '18 min', labelHe: '18 דק׳' },
  ]},
  { group: 'Shkiah', groupHe: 'שקיעת החמה', options: [
    { key: 'shkiah', label: 'Sunset', labelHe: 'שקיעה' },
  ]},
  { group: 'Bein HaShmashos', groupHe: 'בין השמשות', options: [
    { key: 'yereim_start', label: 'Yereim', labelHe: 'יראים' },
    { key: 'geonim_13_5', label: 'Geonim 13.5m', labelHe: 'גאונים' },
    { key: 'rabbeinuTam_58_5', label: 'R"T 58.5m', labelHe: 'ר"ת' },
  ]},
  { group: 'Tzait', groupHe: 'צאת כוכבים', options: [
    { key: 'tzait_7_083', label: '7.08°', labelHe: '7.08°' },
    { key: 'tzait_8_5', label: '8.5°', labelHe: '8.5°' },
    { key: 'tzait_13', label: '13°', labelHe: '13°' },
    { key: 'tzait_16_1', label: '16.1°', labelHe: '16.1°' },
    { key: 'rabbeinuTam_fixed', label: 'R"T 72 min', labelHe: 'ר"ת 72 דק׳' },
  ]},
];

const ALL_ZMAN_OPTIONS = ZMAN_GROUPS.flatMap(g => g.options.map(o => ({ ...o, group: g.group, groupHe: g.groupHe })));

function findZmanOption(key) {
  return ALL_ZMAN_OPTIONS.find(o => o.key === key);
}

function formatHour(h) {
  if (h == null || isNaN(h)) return '--';
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const ampm = hh < 12 ? 'AM' : 'PM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
}

function tishri1ToGregorian(hebrewYear) {
  const approxYear = 2000 + (hebrewYear - 5760);
  let d = new Date(approxYear, 7, 1);
  for (let i = 0; i < 400; i++) {
    const hd = toHebrewDate(d);
    if (hd && hd.month === 7 && hd.day === 1) return d;
    if (hd && (hd.year > hebrewYear || (hd.year === hebrewYear && hd.month > 7))) {
      d.setDate(d.getDate() - 1);
    } else {
      d.setDate(d.getDate() + 1);
    }
  }
  return d;
}

function buildZmanData(startDate, lat, lng, tz, primaryZman, secondaryZman, customZmanim, horizonOffsetDeg = 0) {
  const data = [];
  let sawElul = false;
  for (let offset = 0; offset <= 400; offset += 3) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + offset);
    d.setHours(12, 0, 0, 0);

    const hd = toHebrewDate(d);
    if (!hd) continue;
    if (sawElul && hd.month === 7) break;
    if (hd.month === 6) sawElul = true;

    const st = getSunTimes(d, lat, lng, '16.1', '8.5', horizonOffsetDeg);
    if (!st) continue;
    st._lat = lat;
    st._lng = lng;

    if (st.chatzot && !st.chatzotNight) {
      st.chatzotNight = new Date(st.chatzot.getTime() + 12 * 3600000);
    }

    // Compute custom zmanim from settings
    if (customZmanim && customZmanim.length > 0) {
      for (const cz of customZmanim) {
        const val = calcCustomZman(cz, st);
        if (val) st[`custom_${cz.id}`] = val;
      }
    }

    const pTime = st[primaryZman];
    const sTime = secondaryZman ? st[secondaryZman] : null;

    data.push({
      offset,
      primary: pTime ? getHourInTz(pTime, tz) : null,
      secondary: sTime ? getHourInTz(sTime, tz) : null,
      gregorianLabel: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      hebrewDay: hd.day,
      hebrewMonth: hd.month,
      monthLabelEn: MONTHS_EN[hd.month] || '',
      monthLabelHe: MONTHS_HE[hd.month] || '',
      dateObj: new Date(d),
    });
  }
  return data;
}

function getMonthTicks(data) {
  if (!data.length) return [];
  const ticks = [data[0]];
  const seen = new Set([data[0].hebrewMonth]);
  for (let i = 1; i < data.length; i++) {
    if (data[i].hebrewMonth !== data[i - 1].hebrewMonth && !seen.has(data[i].hebrewMonth)) {
      ticks.push(data[i]);
      seen.add(data[i].hebrewMonth);
    }
  }
  return ticks;
}

function ZmanPicker({ value, onChange, lang, accentClass, groups }) {
  const [open, setOpen] = useState(false);
  const allOpts = groups.flatMap(g => g.options.map(o => ({ ...o, groupName: g.group, groupNameHe: g.groupHe })));
  const selected = allOpts.find(o => o.key === value);

  // Build display label: "Group/Opinion" (e.g. "Shema/MGA", "Alot/120 min")
  const buildDisplayLabel = (opt) => {
    if (!opt) return '';
    const grp = lang === 'he' ? opt.groupNameHe : opt.groupName;
    const lbl = lang === 'he' ? (opt.labelHe || opt.label) : (opt.label || opt.labelHe);
    if (!grp) return lbl;
    return `${grp}/${lbl}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${accentClass}`}
      >
        {selected?.isCustom && <span className="text-purple-400 text-[9px]">★</span>}
        <span dir={lang === 'he' ? 'rtl' : 'ltr'}>{buildDisplayLabel(selected)}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 max-h-72 overflow-y-auto rounded-xl bg-[#0d1420] border border-white/15 shadow-2xl min-w-[180px] p-2">
            {groups.map(g => (
              <div key={g.group} className="mb-1">
                <div className="text-[10px] text-white/30 uppercase tracking-wider px-2 py-1" dir="rtl">{g.groupHe}</div>
                {g.options.map(o => (
                  <button
                    key={o.key}
                    onClick={() => { onChange(o.key); setOpen(false); }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      value === o.key ? 'bg-yellow-500/20 text-yellow-300' : 'text-white/60 hover:bg-white/8'
                    }`}
                  >
                    <span dir="rtl">{lang === 'he' ? o.labelHe : o.label}</span>
                    <span className="text-white/30 ml-2 text-[9px]">{lang === 'he' ? o.label : o.labelHe}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, primaryLabel, secondaryLabel, lang }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-[#0d1420] border border-white/15 rounded-xl px-3 py-2.5 text-xs shadow-xl space-y-1">
      <p className="text-white/50">{d.gregorianLabel}</p>
      <p className="text-yellow-400/80 font-semibold" dir="rtl">{d.hebrewDay} {d.monthLabelHe}</p>
      <div className="border-t border-white/8 pt-1 mt-1 space-y-0.5">
        {d.primary != null && <p className="text-yellow-300 font-bold">{primaryLabel}: {formatHour(d.primary)}</p>}
        {d.secondary != null && <p className="text-cyan-300 font-bold">{secondaryLabel}: {formatHour(d.secondary)}</p>}
      </div>
      <p className="text-white/25 text-[9px] mt-1">{lang === 'he' ? 'לחץ לפרטים →' : 'Click for details →'}</p>
    </div>
  );
};

export default function ZmanOpinionTracker({ location, date, lang = 'both', locationTz, hour12 = true, elevation = 0, zmanimOpinions = {}, customZmanim = [], showButton = true }) {
  const [open, setOpen] = useState(!showButton);
  const [primaryZman, setPrimaryZman] = useState('shema_gra');
  const [secondaryZman, setSecondaryZman] = useState('shema_mga');
  const [useComparison, setUseComparison] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  // Dynamic groups: built-in + custom zmanim from settings
  const allGroups = useMemo(() => {
    if (!customZmanim || customZmanim.length === 0) return ZMAN_GROUPS;
    const customGroup = {
      group: 'Custom',
      groupHe: 'מותאם אישית',
      options: customZmanim.map(cz => ({
        key: `custom_${cz.id}`,
        label: cz.posekName,
        labelHe: cz.posekName,
        isCustom: true,
      })),
    };
    return [...ZMAN_GROUPS, customGroup];
  }, [customZmanim]);

  const allOpts = allGroups.flatMap(g => g.options);
  const findOpt = (key) => allOpts.find(o => o.key === key);

  const { data, todayOffset, heYear } = useMemo(() => {
    if (!location) return { data: [], todayOffset: 0, heYear: 5786 };
    const hd = toHebrewDate(date);
    if (!hd) return { data: [], todayOffset: 0, heYear: 5786 };
    const heYear = hd.year;
    const startDate = tishri1ToGregorian(heYear);
    const rows = buildZmanData(startDate, location.lat, location.lng, locationTz, primaryZman, useComparison ? secondaryZman : null, customZmanim, elevation);
    const todayMs = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12).getTime();
    const startMs = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 12).getTime();
    const todayOffset = Math.round((todayMs - startMs) / 86400000);
    return { data: rows, todayOffset, heYear };
  }, [location?.lat, location?.lng, date?.toDateString(), primaryZman, secondaryZman, useComparison, customZmanim, elevation]);

  const monthTicks = useMemo(() => getMonthTicks(data), [data]);

  const pOpt = findOpt(primaryZman);
  const sOpt = findOpt(secondaryZman);
  const pLabel = pOpt ? (lang === 'he' ? pOpt.labelHe : pOpt.label) : '';
  const sLabel = sOpt ? (lang === 'he' ? sOpt.labelHe : sOpt.label) : '';

  const yearStr = (() => {
    const ones = ['','א','ב','ג','ד','ה','ו','ז','ח','ט'];
    const tens = ['','י','כ','ל','מ','נ','ס','ע','פ','צ'];
    const toHNum = n => { const m = n % 100; if (m === 15) return 'טו'; if (m === 16) return 'טז'; return tens[Math.floor(m/10)] + ones[m%10]; };
    const hundreds = ['','ק','ר','ש','ת','תק','תר','תש','תת','תתק'];
    const mod = heYear % 1000;
    return hundreds[Math.floor(mod/100)] + toHNum(mod % 100);
  })();

  const tickFormatter = (v) => {
    const m = monthTicks.find(t => t.offset === v);
    if (!m) return '';
    const isLeap = (7 * heYear + 1) % 19 < 7;
    if (lang === 'he') {
      if (m.hebrewMonth === 13) return 'אדר ב׳';
      if (m.hebrewMonth === 12 && isLeap) return 'אדר א׳';
      return m.monthLabelHe;
    }
    if (m.hebrewMonth === 13) return 'Ad II';
    if (m.hebrewMonth === 12 && isLeap) return 'Ad I';
    return m.monthLabelEn.slice(0, 3);
  };

  const lastOffset = data.length ? data[data.length - 1].offset : 0;
  const xTicks = monthTicks.map(t => t.offset);
  const todayPt = data.reduce((best, d) => Math.abs(d.offset - todayOffset) < Math.abs(best.offset - todayOffset) ? d : best, data[0] || { offset: 0 });

  const allTimes = data.flatMap(d => [d.primary, d.secondary]).filter(v => v != null && !isNaN(v));
  const minTime = allTimes.length ? Math.floor(Math.min(...allTimes) - 0.5) : 0;
  const maxTime = allTimes.length ? Math.ceil(Math.max(...allTimes) + 0.5) : 24;

  return (
    <>
      {/* Floating button */}
      {showButton && (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-500/80 to-purple-500/80 backdrop-blur-md border border-white/20 shadow-lg hover:scale-105 active:scale-95 transition-all"
      >
        <TrendingUp className="w-4 h-4 text-white" />
        <span className="text-xs font-bold text-white hidden sm:inline">{lang === 'he' ? 'מעקב זמנים' : 'Zman Tracker'}</span>
      </button>
      )}

      {/* Inline card trigger (when no floating button) */}
      {!showButton && (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-3xl bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-400/30 hover:from-indigo-500/25 hover:to-purple-500/25 transition-all card-hover"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30">
            <TrendingUp className="w-5 h-5 text-indigo-300" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-white">{lang === 'he' ? 'מעקב זמנים שנתי' : 'Yearly Zman Tracker'}</div>
            <div className="text-xs text-white/40">{lang === 'he' ? `שנת ${yearStr}` : `Hebrew Year ${yearStr}`} · {location?.name}</div>
          </div>
        </div>
        <span className="text-xs font-semibold text-indigo-300 shrink-0">{lang === 'he' ? 'פתח' : 'Open'}</span>
      </button>
      )}

      {/* Sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-md" onClick={() => setOpen(false)}>
          <div className="w-full max-w-3xl rounded-t-3xl bg-[#0d1420] border border-white/10 flex flex-col max-h-[90vh] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  {lang === 'he' ? 'מעקב זמנים שנתי' : 'Yearly Zman Tracker'}
                </h2>
                <p className="text-xs text-white/40 mt-0.5">
                  {lang === 'he' ? `שנת ${yearStr}` : `Hebrew Year ${yearStr}`} · {location?.name}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Controls */}
            <div className="px-6 py-3 shrink-0 border-b border-white/5 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 font-medium">{lang === 'he' ? 'זמן:' : 'Zman:'}</span>
                <ZmanPicker
                  value={primaryZman}
                  onChange={setPrimaryZman}
                  lang={lang}
                  accentClass="bg-yellow-500/20 border-yellow-400/40 text-yellow-300"
                  groups={allGroups}
                />
              </div>
              <button
                onClick={() => setUseComparison(c => !c)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  useComparison
                    ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-white/40'
                }`}
              >
                {lang === 'he' ? 'השוואה' : 'Compare'}
              </button>
              {useComparison && (
                <ZmanPicker
                  value={secondaryZman}
                  onChange={setSecondaryZman}
                  lang={lang}
                  accentClass="bg-cyan-500/20 border-cyan-400/40 text-cyan-300"
                  groups={allGroups}
                />
              )}
            </div>

            {/* Chart */}
            <div className="overflow-auto flex-1 p-4">
              {data.length === 0 ? (
                <div className="py-20 text-center text-white/30 text-sm">{lang === 'he' ? 'טוען...' : 'Loading...'}</div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={data}
                      margin={{ top: 6, right: 10, left: -16, bottom: 10 }}
                      onClick={(e) => {
                        if (e?.activePayload?.[0]?.payload?.dateObj) {
                          setSelectedDay(e.activePayload[0].payload.dateObj);
                        }
                      }}
                    >
                      <XAxis
                        dataKey="offset"
                        type="number"
                        domain={[0, lastOffset]}
                        ticks={xTicks}
                        tickFormatter={tickFormatter}
                        tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[minTime, maxTime]}
                        tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => formatHour(v).replace(' AM','a').replace(' PM','p')}
                        width={38}
                      />
                      <Tooltip content={<CustomTooltip primaryLabel={pLabel} secondaryLabel={sLabel} lang={lang} />} />
                      {monthTicks.map(t => (
                        <ReferenceLine key={t.offset} x={t.offset} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                      ))}
                      <ReferenceLine
                        x={todayPt.offset}
                        stroke="rgba(255,200,80,0.5)"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        label={{ value: lang === 'he' ? 'היום' : 'today', position: 'top', fill: 'rgba(255,200,80,0.4)', fontSize: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="primary"
                        stroke="#fbbf24"
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                        activeDot={{ r: 4, fill: '#fbbf24', strokeWidth: 0 }}
                        name={pLabel}
                      />
                      {useComparison && (
                        <Line
                          type="monotone"
                          dataKey="secondary"
                          stroke="#22d3ee"
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                          activeDot={{ r: 4, fill: '#22d3ee', strokeWidth: 0 }}
                          name={sLabel}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Legend + hint */}
              <div className="flex items-center gap-4 px-2 mt-2 text-xs text-white/40 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-yellow-400 inline-block rounded" />
                  {pOpt?.isCustom && <span className="text-purple-400 text-[9px]">★</span>}
                  {pLabel}
                </span>
                {useComparison && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 bg-cyan-400 inline-block rounded" />
                    {sOpt?.isCustom && <span className="text-purple-400 text-[9px]">★</span>}
                    {sLabel}
                  </span>
                )}
                <span className="text-white/25 text-[10px] ml-auto">
                  {lang === 'he' ? 'לחץ על נקודה לפרטי היום' : 'Click a point for day details'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day Detail */}
      {selectedDay && (
        <DayZmanimDetail
          open={!!selectedDay}
          onClose={() => setSelectedDay(null)}
          date={selectedDay}
          location={location}
          elevation={elevation}
          hour12={hour12}
          lang={lang}
          locationTz={locationTz}
          zmanimOpinions={zmanimOpinions}
          customZmanim={customZmanim}
        />
      )}
    </>
  );
}
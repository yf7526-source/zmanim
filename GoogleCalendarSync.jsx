import React, { useState } from 'react';
import { Calendar, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fetchHebcalZmanim, normalizeTimes } from '../lib/hebcalApi';
import { calcCustomZman } from './CustomZmanManager';

const CONNECTOR_ID = '6a31aadb4a0fc56d3ca295cc';

// Same row definitions as DayZmanimDetail (compact version for sync)
function buildZmanimList(st, zmanimOpinions, customZmanim, date) {
  if (!st) return [];
  const rows = [];

  const alotOp = zmanimOpinions?.alot || '16.1';
  const alotMap = { '16.1': st.alot_16_1, '72min': st.alot_72min, '90min': st.alot_90min, '96min': st.alot_96min, '120min': st.alot_120min };
  rows.push({ label: 'עלות השחר (Alot HaShachar)', time: alotMap[alotOp] || st.alot_16_1 });

  const misheyakirOp = zmanimOpinions?.misheyakir || '11.5';
  const mkMap = { '10.2': st.misheyakir_10_2, '11.5': st.misheyakir_11_5, '60min': st.misheyakir_60min };
  rows.push({ label: 'משיכיר (Misheyakir)', time: mkMap[misheyakirOp] || st.misheyakir_11_5 });

  rows.push({ label: 'נץ החמה (Sunrise)', time: st.netz });

  const shemaOp = zmanimOpinions?.shema || 'gra';
  const shemaMap = { gra: st.shema_gra, mga: st.shema_mga, bht: st.shema_bht };
  rows.push({ label: 'סוף זמן קריאת שמע (Sof Zman Shema)', time: shemaMap[shemaOp] || st.shema_gra });

  const tefillaOp = zmanimOpinions?.tefilla || 'gra';
  const tefillaMap = { gra: st.tefilla_gra, mga: st.tefilla_mga, bht: st.tefilla_bht };
  rows.push({ label: 'סוף זמן תפילה (Sof Zman Tefilla)', time: tefillaMap[tefillaOp] || st.tefilla_gra });

  rows.push({ label: 'חצות היום (Chatzot)', time: st.chatzot });

  const mgOp = zmanimOpinions?.minchaGedola || 'gra';
  const mgMap = { gra: st.minchaGedola_gra, mga: st.minchaGedola_mga, bht: st.minchaGedola_bht };
  rows.push({ label: 'מנחה גדולה (Mincha Gedola)', time: mgMap[mgOp] || st.minchaGedola_gra });

  const mkOp = zmanimOpinions?.minchaKetana || 'gra';
  const mkMap2 = { gra: st.minchaKetana_gra, mga: st.minchaKetana_mga, bht: st.minchaKetana_bht };
  rows.push({ label: 'מנחה קטנה (Mincha Ketana)', time: mkMap2[mkOp] || st.minchaKetana_gra });

  const plagOp = zmanimOpinions?.plagHaMincha || 'gra';
  const plagMap = { gra: st.plagHaMincha_gra, mga: st.plagHaMincha_mga, bht: st.plagHaMincha_bht };
  rows.push({ label: 'פלג המנחה (Plag HaMincha)', time: plagMap[plagOp] || st.plagHaMincha_gra });

  rows.push({ label: 'שקיעת החמה (Sunset)', time: st.shkiah });

  const tzaitOp = zmanimOpinions?.tzait || '8.5';
  const tzaitMap = { '7.083': st.tzait_7_083, '8.5': st.tzait_8_5, '72min': st.rabbeinuTam_fixed };
  rows.push({ label: 'צאת הכוכבים (Tzait Kochavim)', time: tzaitMap[tzaitOp] || st.tzait_8_5 });

  // Shabbat Ends — only on Saturday, uses selected tzait opinion
  if (date && date.getDay() === 6) {
    rows.push({ label: 'צאת שבת (Shabbat Ends)', time: tzaitMap[tzaitOp] || st.tzait_8_5 });
  }

  rows.push({ label: 'חצות הלילה (Chatzot HaLayla)', time: st.chatzotNight });

  // Custom zmanim
  if (customZmanim) {
    for (const cz of customZmanim) {
      const val = calcCustomZman(cz, st);
      rows.push({ label: `${cz.posekName} — ${cz.zmanType}`, time: val });
    }
  }

  return rows.filter(r => r.time && !isNaN(r.time?.getTime?.()));
}

export default function GoogleCalendarSync({ date, location, elevation = 0, zmanimOpinions, customZmanim, lang = 'both' }) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);

  const handleSync = async () => {
    if (!date || !location) return;
    setSyncing(true);
    setResult(null);
    try {
      const { times } = await fetchHebcalZmanim(date, location.lat, location.lng, location?.elevation || 0);
      const st = normalizeTimes(times, zmanimOpinions, location, elevation);
      if (customZmanim && customZmanim.length > 0 && st) {
        for (const cz of customZmanim) {
          const val = calcCustomZman(cz, st);
          if (val) st[`custom_${cz.id}`] = val;
        }
      }
      const zmanim = buildZmanimList(st, zmanimOpinions, customZmanim, date);
      if (zmanim.length === 0) {
        setResult({ error: lang === 'he' ? 'אין זמנים לסנכרון' : 'No zmanim to sync' });
        setSyncing(false);
        return;
      }
      const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      const res = await base44.functions.invoke('exportZmanimToCalendar', {
        zmanim: zmanim.map(z => ({ label: z.label, time: z.time.toISOString() })),
        date: dateStr,
        locationName: location?.name || '',
      });
      const data = res.data;
      const successCount = data?.results?.filter(r => r.success)?.length || 0;
      const failCount = (data?.results?.length || 0) - successCount;
      setResult({ success: true, count: successCount, failCount });
    } catch (e) {
      if (e?.response?.status === 403 || e?.response?.status === 401) {
        setResult({ error: lang === 'he' ? 'יש לחבר את Google Calendar תחילה' : 'Connect Google Calendar first' });
      } else {
        setResult({ error: e?.response?.data?.error || (lang === 'he' ? 'שגיאת סנכרון' : 'Sync failed') });
      }
    }
    setSyncing(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 hover:bg-emerald-500/25 transition-all card-hover disabled:opacity-40"
        >
          {syncing ? <Loader2 className="w-4 h-4 text-emerald-300 animate-spin" /> : <Calendar className="w-4 h-4 text-emerald-300" />}
          <span className="text-sm font-semibold text-emerald-200">
            {syncing
              ? (lang === 'he' ? 'מסנכרן...' : 'Syncing...')
              : (lang === 'he' ? 'סנכרן זמנים ל-Google Calendar' : 'Sync Zmanim to Google Calendar')}
          </span>
        </button>
      </div>
      {result?.success && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 px-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {lang === 'he'
            ? `${result.count} זמנים סונכרנו בהצלחה ליומן Google שלך`
            : `${result.count} zmanim synced to your Google Calendar`}
        </div>
      )}
      {result?.error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 px-2">
          <AlertCircle className="w-3 h-3" /> {result.error}
        </div>
      )}
    </div>
  );
}
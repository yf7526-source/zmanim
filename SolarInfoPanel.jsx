import React from 'react';
import { X, Sun, Moon, Clock } from 'lucide-react';
import { formatTimeInTz } from '@/lib/timezone';
import useFocusTrap from '@/hooks/useFocusTrap';

const ALOT_RESOLVERS = {
  '16.1': st => st.alot_16_1, '18': st => st.alot_18, '19.8': st => st.alot_19_8,
  '72min': st => st.alot_72min, '90min': st => st.alot_90min, '96min': st => st.alot_96min, '120min': st => st.alot_120min,
};
const TZAIT_RESOLVERS = {
  '7.083': st => st.tzait_7_083, '8.5': st => st.tzait_8_5, '13': st => st.tzait_13,
  '16.1': st => st.tzait_16_1, '72min': st => st.rabbeinuTam_fixed,
};
const ALOT_LABELS = { '16.1': '16.1°', '18': '18°', '19.8': '19.8°', '72min': '72 min', '90min': '90 min', '96min': '96 min', '120min': '120 min' };
const TZAIT_LABELS = { '7.083': '7.083°', '8.5': '8.5°', '13': '13°', '16.1': '16.1°', '72min': '72 min' };

const fmt = (date, tz) => formatTimeInTz(date, tz, true);
function formatDuration(ms) {
  if (!ms || Number.isNaN(ms)) return '—';
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

export default function SolarInfoPanel({ open, onClose, sunTimes, location, date, currentTime, lang = 'both', locationTz, zmanimOpinions = {} }) {
  const dialogRef = useFocusTrap(open, onClose);
  if (!open) return null;
  const st = sunTimes;
  const now = currentTime || new Date();
  const daylightMs = st?.shkiah && st?.netz ? st.shkiah - st.netz : null;
  const alotSel = zmanimOpinions.alot || '16.1';
  const tzaitSel = zmanimOpinions.tzait || '8.5';
  const resolvedAlot = ALOT_RESOLVERS[alotSel]?.(st) || st?.alot_16_1;
  const resolvedTzait = TZAIT_RESOLVERS[tzaitSel]?.(st) || st?.tzait_8_5;

  let statusEn = 'Night', statusHe = 'לילה', statusClass = 'text-blue-300';
  if (resolvedAlot && now < resolvedAlot) { statusEn = 'Before dawn'; statusHe = 'לפני עלות'; }
  else if (resolvedAlot && st?.netz && now < st.netz) { statusEn = 'Dawn'; statusHe = 'עלות השחר'; statusClass = 'text-orange-300'; }
  else if (st?.netz && st?.chatzot && now < st.chatzot) { statusEn = 'Morning'; statusHe = 'בוקר'; statusClass = 'text-yellow-300'; }
  else if (st?.chatzot && st?.shkiah && now < st.shkiah) { statusEn = 'Afternoon'; statusHe = 'אחר הצהריים'; statusClass = 'text-amber-300'; }
  else if (st?.shkiah && resolvedTzait && now < resolvedTzait) { statusEn = 'Twilight'; statusHe = 'בין השמשות'; statusClass = 'text-rose-300'; }

  const progress = st?.netz && st?.shkiah && now >= st.netz && now <= st.shkiah
    ? Math.min(100, Math.max(0, ((now - st.netz) / (st.shkiah - st.netz)) * 100))
    : (st?.shkiah && now > st.shkiah ? 100 : 0);
  const facts = [
    { label: lang === 'he' ? 'זריחה' : 'Sunrise', value: fmt(st?.netz, locationTz) },
    { label: lang === 'he' ? 'חצות היום' : 'Solar noon', value: fmt(st?.chatzot, locationTz) },
    { label: lang === 'he' ? 'שקיעה' : 'Sunset', value: fmt(st?.shkiah, locationTz) },
    { label: lang === 'he' ? 'אורך היום' : 'Daylight', value: formatDuration(daylightMs) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-md" onClick={onClose}>
      <section ref={dialogRef} className="w-full max-w-lg rounded-t-3xl md:rounded-3xl bg-card border border-border flex flex-col max-h-[90vh] shadow-2xl" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="today-sun-title">
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-4 md:hidden" />
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0"><Sun className="w-5 h-5 text-primary" /></div>
            <div className="min-w-0">
              <h2 id="today-sun-title" className="text-lg font-bold text-foreground">{lang === 'he' ? 'השמש היום' : "Today's Sun"}</h2>
              <p className="text-xs text-muted-foreground truncate">{location?.name} · {date?.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label={lang === 'he' ? 'סגור' : 'Close sun sheet'} className="p-2 rounded-xl bg-muted hover:bg-muted/80"><X className="w-5 h-5 text-muted-foreground" /></button>
        </header>

        <div className="overflow-y-auto px-5 py-5 space-y-5">
          <div className="rounded-2xl bg-primary/10 border border-primary/20 p-5">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{lang === 'he' ? 'מצב נוכחי' : 'Right now'}</p><p className={`text-2xl font-bold mt-1 ${statusClass}`}>{lang === 'he' ? statusHe : statusEn}</p></div>
              <div className="text-right"><p className="font-mono text-xl font-bold text-foreground">{fmt(now, locationTz)}</p><p className="text-xs text-muted-foreground">{progress.toFixed(0)}% {lang === 'he' ? 'מהיום' : 'of daylight'}</p></div>
            </div>
            {st?.netz && st?.shkiah && <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {facts.map(f => <div key={f.label} className="rounded-2xl bg-muted/50 border border-border p-4"><p className="text-xs text-muted-foreground">{f.label}</p><p className="mt-1 font-mono text-lg font-bold text-foreground">{f.value}</p></div>)}
          </div>

          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /><h3 className="text-sm font-bold text-foreground">{lang === 'he' ? 'זמני גבול היום' : 'Day boundaries'}</h3></div>
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3"><div className="flex items-center gap-2"><Sun className="w-4 h-4 text-orange-300" /><span className="text-sm text-foreground">{lang === 'he' ? 'עלות השחר' : 'Dawn'}</span></div><div className="text-right"><span className="font-mono font-bold text-foreground">{fmt(resolvedAlot, locationTz)}</span><span className="ml-2 text-xs text-muted-foreground">{ALOT_LABELS[alotSel] || '16.1°'}</span></div></div>
              <div className="flex items-center justify-between px-4 py-3"><div className="flex items-center gap-2"><Moon className="w-4 h-4 text-blue-300" /><span className="text-sm text-foreground">{lang === 'he' ? 'צאת הכוכבים' : 'Nightfall'}</span></div><div className="text-right"><span className="font-mono font-bold text-foreground">{fmt(resolvedTzait, locationTz)}</span><span className="ml-2 text-xs text-muted-foreground">{TZAIT_LABELS[tzaitSel] || '8.5°'}</span></div></div>
              {st?.shaahGra && <div className="flex items-center justify-between px-4 py-3"><span className="text-sm text-foreground">{lang === 'he' ? 'שעה זמנית (גר״א)' : 'Halachic hour (GRA)'}</span><span className="font-mono font-bold text-foreground">{Math.floor(st.shaahGra / 60000)}m {Math.floor((st.shaahGra % 60000) / 1000)}s</span></div>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
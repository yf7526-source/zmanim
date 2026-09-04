import React from 'react';
import { Clock, CheckCircle2, XCircle, Hourglass } from 'lucide-react';
import { getMoladForDate, formatMoladDisplay, kiddushStatus, fmtCountdown } from '../lib/molad';

function StatusBadge({ status, lang }) {
  const config = {
    available: { icon: CheckCircle2, color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-400/30', labelEn: 'Available', labelHe: 'אפשר' },
    too_early: { icon: Hourglass, color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-400/30', labelEn: 'Too Early', labelHe: 'מוקדם' },
    closed: { icon: XCircle, color: 'text-rose-300', bg: 'bg-rose-500/15 border-rose-400/30', labelEn: 'Window Closed', labelHe: 'עבר הזמן' },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${c.bg} ${c.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {lang === 'he' ? c.labelHe : lang === 'en' ? c.labelEn : `${c.labelHe} · ${c.labelEn}`}
    </span>
  );
}

export default function KiddushLevanahInfo({ date, now, lang = 'both', hour12 = true }) {
  const showHe = lang === 'he' || lang === 'both';
  const showEn = lang === 'en' || lang === 'both';

  const moladInfo = getMoladForDate(date);
  const molad = moladInfo?.molad;
  const moladDisplay = molad ? formatMoladDisplay(molad, hour12) : null;

  const status3 = molad ? kiddushStatus(now, molad, 3) : null;
  const status7 = molad ? kiddushStatus(now, molad, 7) : null;

  // Only show Kiddush Levanah when the Hebrew date is within the window
  // (upcoming or available). Hide once the window has closed.
  if (!molad || !status3 || !status7) return null;
  if (status3.status === 'closed' && status7.status === 'closed') return null;

  const s7Start = formatMoladDisplay(status7.startTime, hour12);
  const s7End = formatMoladDisplay(status7.endTime, hour12);
  const s3Start = formatMoladDisplay(status3.startTime, hour12);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-slate-500/10 border border-blue-400/20 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🌙</span>
        <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">
          {showHe && <span dir="rtl">קידוש לבנה</span>}
          {lang === 'both' && ' · '}
          {showEn && <span>Kiddush Levanah</span>}
        </h3>
      </div>

      {moladDisplay && (
        <div className="rounded-xl bg-blue-500/8 border border-blue-400/15 px-4 py-3">
          <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
            {showEn && 'Jerusalem Molad'}
            {lang === 'both' && ' · '}
            {showHe && <span dir="rtl">מולד ירושלים</span>}
          </div>
          <div className="text-sm font-bold text-blue-200 font-mono" dir="rtl">
            {moladDisplay.dayNameHe}, {moladDisplay.hebrewDateStr} · {moladDisplay.timeStr}
          </div>
        </div>
      )}

      {status7 && (
        <div className={`rounded-xl border p-4 space-y-2 transition-all ${
          status7.status === 'available'
            ? 'bg-emerald-500/10 border-emerald-400/30'
            : 'bg-white/5 border-white/8'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-white/90 flex items-center gap-2">
                <span className="text-base">✡️</span>
                {showHe && <span dir="rtl">דעת 7 ימים</span>}
                {lang === 'both' && ' · '}
                {showEn && <span>7-Day Opinion</span>}
              </div>
              <div className="text-[11px] text-white/35 mt-0.5">
                {showEn && 'Rema — 7 full days (168h) after molad'}
                {lang === 'both' && ' · '}
                {showHe && <span dir="rtl">רמ״א — 7 ימים מלאים אחרי המולד</span>}
              </div>
            </div>
            <StatusBadge status={status7.status} lang={lang} />
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Clock className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <span className="font-mono">
              {showEn && s7Start && <span dir="ltr">From <span dir="rtl">{s7Start.dayNameHe}, {s7Start.hebrewDateStr}</span> {s7Start.timeStr}</span>}
              {lang === 'both' && ' · '}
              {showHe && s7Start && <span dir="rtl">מ-{s7Start.dayNameHe} {s7Start.hebrewDateStr}</span>}
            </span>
          </div>
          {status7.status === 'too_early' && (
            <div className="text-xs text-amber-300/80 font-semibold">
              {showEn && `Available in ${fmtCountdown(status7.countdownMs)}`}
              {lang === 'both' && ' · '}
              {showHe && <span dir="rtl">אפשר בעוד {fmtCountdown(status7.countdownMs)}</span>}
            </div>
          )}
          {status7.status === 'available' && (
            <div className="text-xs text-emerald-300/80 font-semibold">
              {showEn && `Window closes in ${fmtCountdown(status7.countdownMs)}`}
              {lang === 'both' && ' · '}
              {showHe && <span dir="rtl">נסגר בעוד {fmtCountdown(status7.countdownMs)}</span>}
            </div>
          )}
        </div>
      )}

      {status3 && (
        <div className="rounded-xl bg-white/5 border border-white/8 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-white/90">
                {showHe && <span dir="rtl">דעת 3 ימים</span>}
                {lang === 'both' && ' · '}
                {showEn && <span>3-Day Opinion</span>}
              </div>
              <div className="text-[11px] text-white/35 mt-0.5">
                {showEn && 'Shulchan Aruch — 72 hours after molad'}
                {lang === 'both' && ' · '}
                {showHe && <span dir="rtl">שו״ע — 72 שעות אחרי המולד</span>}
              </div>
            </div>
            <StatusBadge status={status3.status} lang={lang} />
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Clock className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <span className="font-mono">
              {showEn && s3Start && <span dir="ltr">From <span dir="rtl">{s3Start.dayNameHe}, {s3Start.hebrewDateStr}</span> {s3Start.timeStr}</span>}
              {lang === 'both' && ' · '}
              {showHe && s3Start && <span dir="rtl">מ-{s3Start.dayNameHe} {s3Start.hebrewDateStr}</span>}
            </span>
          </div>
          {status3.status === 'too_early' && (
            <div className="text-xs text-amber-300/80 font-semibold">
              {showEn && `Available in ${fmtCountdown(status3.countdownMs)}`}
              {lang === 'both' && ' · '}
              {showHe && <span dir="rtl">אפשר בעוד {fmtCountdown(status3.countdownMs)}</span>}
            </div>
          )}
          {status3.status === 'available' && (
            <div className="text-xs text-emerald-300/80 font-semibold">
              {showEn && `Window closes in ${fmtCountdown(status3.countdownMs)}`}
              {lang === 'both' && ' · '}
              {showHe && <span dir="rtl">נסגר בעוד {fmtCountdown(status3.countdownMs)}</span>}
            </div>
          )}
        </div>
      )}

      {status7 && (
        <div className="flex items-center gap-2 text-xs text-white/40 pt-1">
          <Clock className="w-3.5 h-3.5 text-white/25 shrink-0" />
          <span className="font-mono">
            {showEn && s7End && <span dir="ltr">Latest: <span dir="rtl">{s7End.dayNameHe}, {s7End.hebrewDateStr}</span> {s7End.timeStr}</span>}
            {lang === 'both' && ' · '}
            {showHe && s7End && <span dir="rtl">עד {s7End.hebrewDateStr} {s7End.timeStr}</span>}
          </span>
        </div>
      )}
    </div>
  );
}
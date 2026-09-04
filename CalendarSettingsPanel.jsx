import React, { useState, useEffect } from 'react';
import { X, Palette, RotateCcw } from 'lucide-react';
import { DEFAULT_HOLIDAY_COLORS, COLOR_LABELS, getHolidayColors } from '@/lib/holidayColors';

// Backward-compat re-export for any code still importing from this module.
export { getHolidayColors as getCalendarColors } from '@/lib/holidayColors';

const ORDER = ['major', 'minor', 'fast', 'plain', 'custom'];

export default function CalendarSettingsPanel({ open, onClose, lang = 'both' }) {
  const [colors, setColors] = useState(DEFAULT_HOLIDAY_COLORS);

  useEffect(() => { if (open) setColors(getHolidayColors()); }, [open]);
  useEffect(() => { try { localStorage.setItem('calendarColors', JSON.stringify(colors)); } catch {} }, [colors]);
  useEffect(() => { window.dispatchEvent(new CustomEvent('calendarColorsChanged', { detail: colors })); }, [colors]);

  if (!open) return null;

  const updateColor = (key, value) => setColors(prev => ({ ...prev, [key]: value }));
  const resetColors = () => setColors(DEFAULT_HOLIDAY_COLORS);
  const tr = (en, he) => lang === 'he' ? he : lang === 'en' ? en : `${en} · ${he}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl md:rounded-3xl bg-card border border-white/10 flex flex-col max-h-[90vh] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 shrink-0" />
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0 border-b border-white/10">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            {tr('Calendar Colors', 'צבעי לוח השנה')}
          </h2>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <p className="text-xs text-foreground/50 rounded-xl bg-white/5 border border-white/10 p-3">
            {tr('Colors apply to the Calendar grid and the Monthly Zmanim table rows.', 'הצבעים חלים על לוח החודש ועל שורות טבלת הזמנים.')}
          </p>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground/60">{tr('Custom Colors', 'צבעים מותאמים')}</label>
            <button onClick={resetColors} className="flex items-center gap-1 text-[10px] text-foreground/40 hover:text-foreground/60 transition-colors">
              <RotateCcw className="w-3 h-3" /> {tr('Reset', 'איפוס')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ORDER.map(key => (
              <div key={key} className="flex items-center gap-2 p-2 rounded-xl border border-white/10 bg-white/[0.03]">
                <input type="color" value={colors[key]} onChange={e => updateColor(key, e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground/80 truncate">{tr(COLOR_LABELS[key].en, COLOR_LABELS[key].he)}</div>
                  <div className="text-[9px] text-foreground/40 font-mono">{colors[key]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { COLOR_LABELS } from '@/lib/holidayColors';

const ORDER = ['major', 'minor', 'fast', 'plain'];

export default function CalendarLegend({ colors, lang }) {
  const tr = (en, he) => lang === 'he' ? he : lang === 'en' ? en : `${en} · ${he}`;
  return (
    <div className="mt-4 flex items-center justify-center gap-2.5 flex-wrap text-[10px] text-foreground/50">
      {ORDER.map(k => (
        <div key={k} className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[k] }} />
          {tr(COLOR_LABELS[k].en, COLOR_LABELS[k].he)}
        </div>
      ))}
    </div>
  );
}
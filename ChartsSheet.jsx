import React, { useState, lazy, Suspense } from 'react';
import { X, BarChart3, Sun, Moon, TrendingUp, GitCompare } from 'lucide-react';
import useFocusTrap from '@/hooks/useFocusTrap';

// Heavy chart modules are lazy-loaded so opening the Charts sheet only costs
// the selected chart, not all of them at once.
const DaylightChart = lazy(() => import('./DaylightChart'));
const HebrewYearSeasonalChart = lazy(() => import('./HebrewYearSeasonalChart'));
const YearlyMoonChart = lazy(() => import('./YearlyMoonChart'));
const ZmanOpinionTracker = lazy(() => import('./ZmanOpinionTracker'));

const CHART_OPTIONS = [
  { key: 'daylight', icon: Sun, getLabel: (l) => l === 'he' ? 'אור יום' : 'Daylight', getColor: 'text-yellow-300' },
  { key: 'seasonal', icon: TrendingUp, getLabel: (l) => l === 'he' ? 'זמנים עונתיים' : 'Seasonal Zmanim', getColor: 'text-emerald-300' },
  { key: 'yearlyMoon', icon: Moon, getLabel: (l) => l === 'he' ? 'ירח שנתי' : 'Yearly Moon', getColor: 'text-blue-300' },
  { key: 'opinions', icon: GitCompare, getLabel: (l) => l === 'he' ? 'השוואת דעות' : 'Opinion Tracker', getColor: 'text-purple-300' },
];

function ChartLoading() {
  return (
    <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
      <div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-400 rounded-full animate-spin" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export default function ChartsSheet({
  open, onClose, location, date, lang = 'both', locationTz, elevation, hour12, zmanimOpinions, customZmanim,
}) {
  const [activeChart, setActiveChart] = useState('daylight');
  const dialogRef = useFocusTrap(open, onClose);
  if (!open) return null;

  const tr = (en, he) => lang === 'he' ? he : lang === 'en' ? en : `${en} · ${he}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="charts-title"
        dir={lang === 'he' ? 'rtl' : 'ltr'}
        className="w-full max-w-3xl rounded-t-3xl md:rounded-3xl bg-card border border-white/10 flex flex-col max-h-[92vh] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 id="charts-title" className="text-lg font-bold text-foreground">{tr('Charts', 'תרשימים')}</h2>
              <p className="text-[11px] text-foreground/40">{location?.name}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label={tr('Close charts', 'סגור תרשימים')} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        {/* Chart selector — scrollable horizontally on mobile, wraps on desktop */}
        <div className="flex gap-1.5 px-4 py-3 shrink-0 overflow-x-auto border-b border-white/10" role="tablist">
          {CHART_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = activeChart === opt.key;
            return (
              <button
                key={opt.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveChart(opt.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  isActive
                    ? 'bg-primary/20 border-primary/40 text-primary'
                    : 'bg-white/5 border-white/10 text-foreground/50 hover:bg-white/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? opt.getColor : ''}`} />
                <span>{opt.getLabel(lang)}</span>
              </button>
            );
          })}
        </div>

        {/* Active chart — only one rendered at a time */}
        <div className="overflow-y-auto flex-1 p-4">
          <Suspense fallback={<ChartLoading />}>
            {activeChart === 'daylight' && (
              <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
                <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest mb-4">📊 {tr('Daylight Through the Year', 'אור יום לאורך השנה')}</h3>
                <DaylightChart location={location} date={date} elevation={elevation} />
              </div>
            )}
            {activeChart === 'seasonal' && (
              <HebrewYearSeasonalChart location={location} date={date} lang={lang} locationTz={locationTz} elevation={elevation} />
            )}
            {activeChart === 'yearlyMoon' && (
              <YearlyMoonChart location={location} date={date} lang={lang} locationTz={locationTz} />
            )}
            {activeChart === 'opinions' && (
              <ZmanOpinionTracker
                location={location}
                date={date}
                lang={lang}
                locationTz={locationTz}
                hour12={hour12}
                elevation={elevation}
                zmanimOpinions={zmanimOpinions}
                customZmanim={customZmanim}
                showButton={false}
              />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { X, FileDown, Loader2, Calendar, MapPin } from 'lucide-react';
import { downloadCustomZmanimYearPDF } from '../lib/customZmanimPdf';
import { base44 } from '@/api/base44Client';

export default function CustomZmanimExportSheet({ open, onClose, location, locationTz, zmanimOpinions, customZmanim, elevation, horizonMode = 'none', hour12, lang = 'en' }) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [error, setError] = useState(null);

  if (!open) return null;

  const he = lang === 'he';
  const hasCustomZmanim = customZmanim && customZmanim.length > 0;

  const handleExport = async () => {
    if (!hasCustomZmanim) return;
    setGenerating(true);
    setError(null);
    setProgress(0);
    setPhase(he ? 'טוען נתוני זמנים...' : 'Fetching zmanim data...');

    try {
      await downloadCustomZmanimYearPDF(
        year,
        location,
        locationTz,
        zmanimOpinions,
        customZmanim,
        elevation,
        hour12,
        (pct) => {
          if (pct <= 100) {
            setProgress(pct);
            setPhase(he ? `טוען נתונים... ${pct}%` : `Fetching data... ${pct}%`);
          } else {
            const renderPct = pct - 100;
            setProgress(renderPct);
            setPhase(he ? `מרנדר PDF... ${renderPct}%` : `Rendering PDF... ${renderPct}%`);
          }
        },
        horizonMode
      );

      // Log to export history
      base44.functions.invoke('trackEvent', {
        event_type: 'visit',
        location_name: location?.name,
        description: `Exported custom zmanim PDF for ${year}`,
      }).catch(() => {});

      setPhase(he ? 'הושלם!' : 'Done!');
      setTimeout(() => {
        setGenerating(false);
        setProgress(0);
        setPhase('');
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || (he ? 'שגיאה ביצירת PDF' : 'Failed to generate PDF'));
      setGenerating(false);
      setProgress(0);
      setPhase('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-md" onClick={generating ? undefined : onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-[#0a111c] border-t border-white/10 flex flex-col max-h-[90vh] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto mt-4 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-4 shrink-0 border-b border-white/8">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileDown className="w-4 h-4 text-purple-300" />
              {he ? 'ייצוא זמנים שנתי' : 'Yearly Zmanim PDF'}
            </h2>
            <p className="text-xs text-white/40 mt-0.5">{he ? 'דוח PDF מלא לכל השנה' : 'Full-year printable PDF report'}</p>
          </div>
          {!generating && (
            <button onClick={onClose} aria-label="Close export settings" className="p-2 rounded-xl bg-white/8 hover:bg-white/15 transition-all">
              <X className="w-5 h-5 text-white/60" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 pb-6 pt-5 space-y-5">
          {/* Info cards */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/4 border border-white/8">
              <MapPin className="w-4 h-4 text-yellow-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-white/30 uppercase tracking-wider">{he ? 'מיקום' : 'Location'}</div>
                <div className="text-sm font-semibold text-white/90 truncate">{location?.name || 'Unknown'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/4 border border-white/8">
              <Calendar className="w-4 h-4 text-blue-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-white/30 uppercase tracking-wider">{he ? 'שנה' : 'Year'}</div>
                <div className="text-sm font-semibold text-white/90">{year}</div>
              </div>
            </div>
          </div>

          {/* Year selector */}
          <div>
            <label className="text-xs text-white/40 mb-2 block font-semibold">{he ? 'בחר שנה' : 'Select Year'}</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setYear(y => y - 1)}
                disabled={generating}
                className="px-3 py-2.5 rounded-xl bg-white/8 hover:bg-white/15 text-white/60 font-bold transition-all disabled:opacity-40"
              >−</button>
              <input
                type="number"
                value={year}
                onChange={e => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                disabled={generating}
                className="flex-1 text-center px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-lg font-bold text-white focus:outline-none focus:border-purple-400/50 [color-scheme:dark]"
              />
              <button
                onClick={() => setYear(y => y + 1)}
                disabled={generating}
                className="px-3 py-2.5 rounded-xl bg-white/8 hover:bg-white/15 text-white/60 font-bold transition-all disabled:opacity-40"
              >+</button>
            </div>
          </div>

          {/* Custom zmanim summary */}
          <div className="rounded-xl bg-purple-500/8 border border-purple-400/20 p-4">
            <div className="text-xs text-white/40 mb-2 font-semibold">{he ? 'זמנים מותאמים אישית' : 'Custom Zmanim Included'}</div>
            {hasCustomZmanim ? (
              <div className="space-y-1.5">
                {customZmanim.map(cz => (
                  <div key={cz.id} className="flex items-center justify-between text-xs">
                    <span className="text-purple-200 font-medium">{cz.posekName}</span>
                    <span className="text-white/40">{cz.zmanType}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/30">{he ? 'לא הוגדרו זמנים מותאמים' : 'No custom zmanim defined'}</p>
            )}
          </div>

          {/* Progress */}
          {generating && (
            <div className="rounded-xl bg-white/4 border border-white/8 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-4 h-4 text-purple-300 animate-spin" />
                <span className="text-xs text-white/60 font-medium">{phase}</span>
              </div>
              <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-yellow-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-right text-[10px] text-white/30 mt-1 tabular-nums">{progress}%</div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={generating || !hasCustomZmanim}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-200 font-bold text-sm hover:bg-purple-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {he ? 'מייצא...' : 'Generating...'}</>
            ) : (
              <><FileDown className="w-4 h-4" /> {he ? 'ייצא PDF שנתי' : 'Export Yearly PDF'}</>
            )}
          </button>

          {!hasCustomZmanim && (
            <p className="text-xs text-white/30 text-center">{he ? 'הוסף זמנים מותאמים אישית בהגדרות כדי לייצא' : 'Add custom zmanim in Settings to enable export'}</p>
          )}
        </div>
      </div>
    </div>
  );
}

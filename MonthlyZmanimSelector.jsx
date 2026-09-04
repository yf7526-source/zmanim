import React, { useState, useEffect, useMemo } from 'react';
import { X, Eye, EyeOff, Star } from 'lucide-react';
import { buildAllColumns, homeKeysWithSecondary, homeStandardKeys, flattenColumns } from '../lib/monthlyZmanimConfig';
import { getMonthlyFollowMain, setMonthlyFollowMain } from '../lib/preferences';
import useFocusTrap from '@/hooks/useFocusTrap';

export default function MonthlyZmanimSelector({
  open,
  onClose,
  onProceed,
  zmanimOpinions,
  customZmanim,
  secondaryZmanimDisplay = {},
  lang = 'both',
}) {
  const allColumns = useMemo(() => buildAllColumns(customZmanim || []), [customZmanim]);
  const allFlat = useMemo(() => flattenColumns(allColumns), [allColumns]);
  const allKeys = useMemo(() => new Set(allFlat.map(c => c.key)), [allFlat]);

  const homeKeys = useMemo(() => homeKeysWithSecondary(zmanimOpinions || {}, secondaryZmanimDisplay), [zmanimOpinions, secondaryZmanimDisplay]);
  const homeStdKeys = useMemo(() => homeStandardKeys(zmanimOpinions || {}), [zmanimOpinions]);

  const [visibleKeys, setVisibleKeys] = useState(null);
  const [standardKeys, setStandardKeys] = useState(null);
  const [followMain, setFollowMain] = useState(() => getMonthlyFollowMain());
  const dialogRef = useFocusTrap(open, onClose);

  // Initialize from localStorage or home defaults
  useEffect(() => {
    if (!open) return;
    let savedVis = null, savedStd = null;
    try {
      const v = localStorage.getItem('monthlyVisibleKeys');
      const s = localStorage.getItem('monthlyStandardKeys');
      if (v) savedVis = new Set(JSON.parse(v));
      if (s) savedStd = new Set(JSON.parse(s));
    } catch {}

    if (followMain) {
      setVisibleKeys(new Set(homeKeys));
      setStandardKeys(new Set(homeStdKeys));
      return;
    }
    // Custom table mode: filter saved keys to columns that still exist.
    if (savedVis) {
      const filtered = new Set([...savedVis].filter(k => allKeys.has(k)));
      setVisibleKeys(filtered.size > 0 ? filtered : new Set(homeKeys));
    } else {
      setVisibleKeys(new Set(homeKeys));
    }
    if (savedStd) {
      const filtered = new Set([...savedStd].filter(k => allKeys.has(k)));
      setStandardKeys(filtered.size > 0 ? filtered : new Set(homeStdKeys));
    } else {
      setStandardKeys(new Set(homeStdKeys));
    }
  }, [open, allKeys, homeKeys, homeStdKeys, followMain]);

  // Persist
  useEffect(() => {
    if (!followMain && visibleKeys) try { localStorage.setItem('monthlyVisibleKeys', JSON.stringify([...visibleKeys])); } catch {}
  }, [visibleKeys, followMain]);
  useEffect(() => {
    if (!followMain && standardKeys) try { localStorage.setItem('monthlyStandardKeys', JSON.stringify([...standardKeys])); } catch {}
  }, [standardKeys, followMain]);

  if (!open) return null;

  const toggleVisible = (key) => {
    setVisibleKeys(prev => {
      const next = new Set(prev || []);
      if (next.has(key)) {
        next.delete(key);
        setStandardKeys(s => { const ns = new Set(s || []); ns.delete(key); return ns; });
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleStandard = (key) => {
    setStandardKeys(prev => {
      const next = new Set(prev || []);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setVisibleKeys(new Set(allKeys));
  const selectNone = () => { setVisibleKeys(new Set()); setStandardKeys(new Set()); };
  const resetToHome = () => { setVisibleKeys(new Set(homeKeys)); setStandardKeys(new Set(homeStdKeys)); };

  const visibleCount = visibleKeys?.size || 0;
  const standardCount = standardKeys?.size || 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="monthly-selector-title" className="w-full max-w-2xl rounded-t-3xl bg-white flex flex-col max-h-[92vh] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-4 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0 border-b-2 border-gray-800">
          <div>
            <h2 id="monthly-selector-title" className="text-xl font-bold text-gray-900">📋 {lang === 'he' ? 'זמנים חודשיים' : 'Monthly Zmanim'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {lang === 'he'
                ? followMain ? 'לפי הגדרות הזמנים היומיות' : `👁 ${visibleCount} מופיעות · ⭐ ${standardCount} מודגשות`
                : followMain ? 'Following Daily Zmanim settings' : `👁 ${visibleCount} shown · ⭐ ${standardCount} highlighted`}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close column selector" className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 bg-indigo-50/60">
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <div className="text-sm font-bold text-gray-800">{lang === 'he' ? 'עקוב אחר הגדרות הזמנים היומיות' : 'Follow my Daily Zmanim settings'}</div>
              <div className="text-xs text-gray-500 mt-0.5">{lang === 'he' ? 'הזמנים החודשיים יעקבו אחר שיטות הזמנים הראשיות שנבחרו בהגדרות.' : 'Monthly Zmanim will follow the main zmanim methods selected in Settings.'}</div>
            </div>
            <input type="checkbox" checked={followMain} onChange={e => { const next=e.target.checked; setFollowMain(next); setMonthlyFollowMain(next); if (next) { setVisibleKeys(new Set(homeKeys)); setStandardKeys(new Set(homeStdKeys)); } }} className="w-5 h-5 accent-indigo-600" />
          </label>
        </div>

        {!followMain && <>
        <div className="px-6 pt-3 pb-1 shrink-0">
          <div className="text-sm font-bold text-gray-800">{lang === 'he' ? 'התאם עמודות חודשיות' : 'Customize Monthly columns'}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{lang === 'he' ? 'עמודות מודגשות מופיעות בצורה בולטת יותר בטבלה החודשית ובייצוא.' : 'Highlighted columns appear more prominently in the Monthly table and exports.'}</div>
        </div>
        {/* Custom table actions */}
        <div className="px-6 py-2.5 shrink-0 flex gap-2 border-b border-gray-100">
          <button onClick={selectAll} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-all">
            {lang === 'he' ? 'הכל' : 'All'}
          </button>
          <button onClick={selectNone} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 transition-all">
            {lang === 'he' ? 'כלום' : 'None'}
          </button>
          <button onClick={resetToHome} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-50 text-yellow-600 border border-yellow-200 hover:bg-yellow-100 transition-all">
            {lang === 'he' ? 'ברירת מחדל (מהגדרות)' : 'Reset to Daily Settings'}
          </button>
        </div>

        {/* Legend */}
        <div className="px-6 py-2 shrink-0 flex items-center gap-4 text-[10px] text-gray-400 border-b border-gray-100">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-indigo-500" /> {lang === 'he' ? 'מופיע בטבלה' : 'Shown in table'}</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-400" /> {lang === 'he' ? 'מודגש' : 'Highlight column'}</span>
        </div>

        {/* Custom column list */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {allColumns.map(col => (
            <div key={col.group} className="rounded-xl border border-gray-200 p-3">
              <div className="text-sm font-bold text-gray-800 mb-2" dir="rtl">
                {col.groupHe} <span className="text-gray-400 font-normal text-xs">({col.group})</span>
              </div>
              <div className="space-y-1.5">
                {col.sub.map(sub => {
                  const isVisible = visibleKeys?.has(sub.key);
                  const isStandard = standardKeys?.has(sub.key);
                  return (
                    <div key={sub.key} className="flex items-center gap-2">
                      <button
                        onClick={() => toggleVisible(sub.key)}
                        aria-label={isVisible ? (lang === 'he' ? 'הסתר עמודה' : 'Hide column') : (lang === 'he' ? 'הצג עמודה' : 'Show column')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all flex-1 min-h-[36px] ${
                          isVisible
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}
                      >
                        {isVisible
                          ? <Eye className="w-3.5 h-3.5 shrink-0" />
                          : <EyeOff className="w-3.5 h-3.5 shrink-0 opacity-40" />}
                        <span className="truncate">{sub.label || '—'}</span>
                        {sub.isCustom && (
                          <span className="text-[8px] bg-purple-100 text-purple-600 px-1 py-0.5 rounded font-bold shrink-0">CUSTOM</span>
                        )}
                      </button>
                      {isVisible && (
                        <button
                          onClick={() => toggleStandard(sub.key)}
                          aria-label={isStandard ? (lang === 'he' ? 'בטל הדגשה' : 'Remove highlight') : (lang === 'he' ? 'הדגש עמודה' : 'Highlight column')}
                          title={isStandard ? (lang === 'he' ? 'בטל הדגשה' : 'Remove highlight') : (lang === 'he' ? 'הדגש עמודה' : 'Highlight column')}
                          className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium border transition-all min-h-[36px] ${
                            isStandard
                              ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
                              : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 shrink-0 ${isStandard ? 'fill-yellow-500 text-yellow-600' : ''}`} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        </>}
        {followMain && <div className="flex-1 px-6 py-8 text-center text-sm text-gray-500">{lang === 'he' ? 'הזמנים החודשיים עוקבים אחר הגדרות היומיות. כבה אפשרות זו להתאמת עמודות.' : 'Monthly Zmanim follows your Daily settings. Turn this off to customize columns.'}</div>}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 shrink-0 flex gap-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-all">
            {lang === 'he' ? 'ביטול' : 'Cancel'}
          </button>
          <button
            onClick={() => onProceed(followMain ? new Set(homeKeys) : visibleKeys, followMain ? new Set(homeStdKeys) : standardKeys)}
            disabled={visibleCount === 0}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {lang === 'he' ? 'פתח זמנים חודשיים' : 'Open Monthly Zmanim'} →
          </button>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useMemo } from 'react';
import { X, FileText, Check, ChevronDown, ChevronUp, Star } from 'lucide-react';

const FORMATS = [
  { id: 'clean', icon: '📄', name: { en: 'Clean', he: 'נקי' }, desc: { en: 'Minimal black & white', he: 'שחור לבן מינימלי' } },
  { id: 'earth', icon: '🌿', name: { en: 'Nature Earth', he: 'אדמה טבעית' }, desc: { en: 'Warm earth tones', he: 'גווני אדמה חמים' } },
  { id: 'compact', icon: '📋', name: { en: 'Compact', he: 'קומפקטי' }, desc: { en: 'Smaller fonts, more per page', he: 'פונטים קטנים, יותר בעמוד' } },
];

function tr(text, lang) {
  return typeof text === 'string' ? text : (lang === 'he' ? text.he : text.en);
}

export default function PdfDownloadOptionsModal({ open, onClose, onConfirm, allColumns, defaultSelectedKeys, defaultStandardKeys, lang = 'both', rowCount = 30, pageEstimateFn = null, showCalMode = false, showOneSheetPerMonth = false }) {
  const [format, setFormat] = useState('clean');
  const [selectedKeys, setSelectedKeys] = useState(() => new Set(defaultSelectedKeys || []));
  const [standardKeys, setStandardKeys] = useState(() => new Set(defaultStandardKeys || []));
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [calMode, setCalMode] = useState('heb');
  const [oneSheetPerMonth, setOneSheetPerMonth] = useState(false);
  const [orientation, setOrientation] = useState('landscape');

  useEffect(() => {
    if (open) {
      setSelectedKeys(new Set(defaultSelectedKeys || []));
      setStandardKeys(new Set(defaultStandardKeys || []));
    }
  }, [open, defaultSelectedKeys, defaultStandardKeys]);

  const totalSubCols = useMemo(() => {
    return allColumns.reduce((s, c) => s + c.sub.length, 0);
  }, [allColumns]);

  const selectedCount = selectedKeys.size;

  // Estimate pages: compact fits ~40 zmanim-days per page, clean ~25, earth ~20
  // "zmanim-days" = rowCount * selectedCount ratio
  const perPageFactor = format === 'compact' ? 42 : format === 'earth' ? 22 : 30;
  const basePages = pageEstimateFn
    ? pageEstimateFn(selectedCount)
    : Math.max(1, Math.ceil((rowCount * selectedCount) / perPageFactor));
  const estimatedPages = oneSheetPerMonth ? (showCalMode ? (calMode === 'heb' ? 13 : 12) : 12) : basePages;

  if (!open) return null;

  function toggleKey(key) {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleGroup(groupKey, subKeys) {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      const allSelected = subKeys.every(k => next.has(k));
      if (allSelected) subKeys.forEach(k => next.delete(k));
      else subKeys.forEach(k => next.add(k));
      return next;
    });
  }

  function resetToDefault() {
    setSelectedKeys(new Set(defaultSelectedKeys || []));
    setStandardKeys(new Set(defaultStandardKeys || []));
  }

  function toggleStandard(key) {
    setStandardKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleCollapse(groupKey) {
    setCollapsedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  }

  function handleConfirm() {
    onConfirm(format, selectedKeys, { calMode, oneSheetPerMonth, orientation, standardKeys });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            {lang === 'he' ? 'סטודיו PDF' : 'PDF Studio'}
          </h3>
          <button onClick={onClose} aria-label="Close PDF options" className="p-1.5 rounded-lg bg-white/60 hover:bg-white"><X className="w-4 h-4 text-gray-600" /></button>
        </div>

        <div className="overflow-auto flex-1 p-5 space-y-5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-700">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>{lang === 'he' ? 'משתמש בעמודות הזמנים החודשיים הנוכחיים. שינויים למטה ישפיעו על PDF זה בלבד.' : 'Using your current Monthly Zmanim columns. Changes below affect this PDF only.'}</span>
          </div>
          {/* Format selection */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-2">{lang === 'he' ? 'פורמט' : 'Format'}</label>
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${format === f.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <div className="text-xs font-bold text-gray-900">{tr(f.name, lang)}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{tr(f.desc, lang)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Calendar mode toggle */}
          {showCalMode && (
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">{lang === 'he' ? 'סוג לוח' : 'Calendar Type'}</label>
              <div className="flex gap-2">
                <button onClick={() => setCalMode('heb')} className={`flex-1 px-3 py-2 rounded-xl border-2 text-center text-xs font-bold transition-all ${calMode === 'heb' ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-gray-200 bg-white text-gray-500'}`}>
                  {lang === 'he' ? 'עברי' : 'Hebrew'}
                </button>
                <button onClick={() => setCalMode('greg')} className={`flex-1 px-3 py-2 rounded-xl border-2 text-center text-xs font-bold transition-all ${calMode === 'greg' ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-gray-200 bg-white text-gray-500'}`}>
                  {lang === 'he' ? 'לועזי' : 'Gregorian'}
                </button>
              </div>
            </div>
          )}

          {/* Orientation toggle */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-2">{lang === 'he' ? 'כיוון עמוד' : 'Page Orientation'}</label>
            <div className="flex gap-2">
              <button onClick={() => setOrientation('auto')} className={`flex-1 px-3 py-2 rounded-xl border-2 text-center text-xs font-bold transition-all ${orientation === 'auto' ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-gray-200 bg-white text-gray-500'}`}>
                {lang === 'he' ? 'אוטומטי' : 'Auto'}
              </button>
              <button onClick={() => setOrientation('landscape')} className={`flex-1 px-3 py-2 rounded-xl border-2 text-center text-xs font-bold transition-all ${orientation === 'landscape' ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-gray-200 bg-white text-gray-500'}`}>
                {lang === 'he' ? 'אופקי' : 'Landscape'}
              </button>
              <button onClick={() => setOrientation('portrait')} className={`flex-1 px-3 py-2 rounded-xl border-2 text-center text-xs font-bold transition-all ${orientation === 'portrait' ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-gray-200 bg-white text-gray-500'}`}>
                {lang === 'he' ? 'אנכי' : 'Portrait'}
              </button>
            </div>
          </div>

          {/* One sheet per month toggle */}
          {showOneSheetPerMonth && (
            <label className="flex items-center gap-2 cursor-pointer px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
              <input type="checkbox" checked={oneSheetPerMonth} onChange={e => setOneSheetPerMonth(e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
              <span className="text-xs font-bold text-gray-700">{lang === 'he' ? 'חודש אחד בכל עמוד' : 'One month per page'}</span>
            </label>
          )}

          {/* Zmanim selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700">{lang === 'he' ? 'בחר זמנים' : 'Select Zmanim'} <span className="text-gray-400">({selectedCount}/{totalSubCols})</span></label>
              <div className="flex gap-1.5">
                <button onClick={resetToDefault} className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[10px] font-bold text-gray-600">{lang === 'he' ? 'ברירת מחדל' : 'Default'}</button>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-64 overflow-auto">
              {allColumns.map(col => {
                const subKeys = col.sub.map(s => s.key);
                const allSelected = subKeys.every(k => selectedKeys.has(k));
                const someSelected = subKeys.some(k => selectedKeys.has(k));
                const isCollapsed = collapsedGroups[col.group];
                return (
                  <div key={col.group}>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
                      <button
                        onClick={() => toggleGroup(col.group, subKeys)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${allSelected ? 'bg-indigo-600 border-indigo-600' : someSelected ? 'bg-indigo-200 border-indigo-400' : 'bg-white border-gray-300'}`}
                      >
                        {allSelected && <Check className="w-3 h-3 text-white" />}
                        {someSelected && !allSelected && <div className="w-2 h-0.5 bg-indigo-600 rounded" />}
                      </button>
                      <span className="text-xs font-bold text-gray-800 flex-1" dir="rtl">{col.groupHe}</span>
                      <span className="text-[10px] text-gray-400">{col.group}</span>
                      {col.sub.length > 1 && (
                        <button onClick={() => toggleCollapse(col.group)} className="p-0.5 rounded hover:bg-gray-200">
                          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronUp className="w-3.5 h-3.5 text-gray-400" />}
                        </button>
                      )}
                    </div>
                    {!isCollapsed && col.sub.length > 1 && (
                      <div className="px-3 py-1.5 flex flex-wrap gap-1.5 bg-white">
                        {col.sub.map(sub => (
                          <div key={sub.key} className="flex items-center gap-0.5">
                            <button
                              onClick={() => toggleKey(sub.key)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${selectedKeys.has(sub.key) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                            >
                              {sub.label || '—'}
                              {sub.isCustom && <span className="ml-0.5 text-purple-300">★</span>}
                            </button>
                            {selectedKeys.has(sub.key) && (
                              <button
                                onClick={() => toggleStandard(sub.key)}
                                title={standardKeys.has(sub.key) ? (lang === 'he' ? 'בטל הדגשה' : 'Remove highlight') : (lang === 'he' ? 'הדגש עמודה' : 'Highlight column')}
                                aria-label={standardKeys.has(sub.key) ? (lang === 'he' ? 'בטל הדגשה' : 'Remove highlight') : (lang === 'he' ? 'הדגש עמודה' : 'Highlight column')}
                                className={`p-1 rounded-lg border transition-all ${standardKeys.has(sub.key) ? 'bg-yellow-100 border-yellow-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                              >
                                <Star className={`w-3 h-3 ${standardKeys.has(sub.key) ? 'fill-yellow-500 text-yellow-600' : 'text-gray-300'}`} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Page estimate */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
            <FileText className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <div className="text-xs font-bold text-blue-900">
                {lang === 'he' ? `הערכת עמודים: ${estimatedPages}` : `Estimated pages: ${estimatedPages}`}
              </div>
              <div className="text-[10px] text-blue-600">
                {selectedCount === 0
                  ? (lang === 'he' ? 'בחר לפחות זמן אחד' : 'Select at least one zman')
                  : (lang === 'he' ? 'מספר העמודים בפועל עשוי להשתנות.' : 'Actual page count may vary.')}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-100">
            {lang === 'he' ? 'ביטול' : 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-40 transition-all flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            {lang === 'he' ? 'צור PDF' : 'Generate PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
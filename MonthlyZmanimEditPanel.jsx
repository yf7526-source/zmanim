import React from 'react';
import { X, Check } from 'lucide-react';

export default function MonthlyZmanimEditPanel({ open, onClose, columns, standardOpinionKeys, onToggle, lang = 'both' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-t-3xl bg-white flex flex-col max-h-[80vh] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-4 shrink-0" />
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-gray-200 shrink-0">
          <h3 className="text-lg font-bold text-gray-900">{lang === 'he' ? 'בחר דעות רגילות' : 'Select Standard Opinions'}</h3>
          <button onClick={onClose} aria-label="Close edit panel" className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {columns.map(col => (
            <div key={col.group}>
              <div className="text-sm font-bold text-gray-700 mb-2" dir="rtl">
                {col.groupHe} <span className="text-gray-400 font-normal text-xs">({col.group})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {col.sub.map(sub => {
                  const isSelected = standardOpinionKeys.has(sub.key);
                  return (
                    <button
                      key={sub.key}
                      onClick={() => onToggle(sub.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {sub.label || '—'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gray-800 text-white font-bold text-sm hover:bg-gray-700 transition-all">
            {lang === 'he' ? 'סיום' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
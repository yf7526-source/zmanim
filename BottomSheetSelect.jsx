import React from 'react';
import { X, Check } from 'lucide-react';
import useFocusTrap from '@/hooks/useFocusTrap';

export default function BottomSheetSelect({ open, onClose, value, options, onChange, title, lang = 'both' }) {
  const dialogRef = useFocusTrap(open, onClose);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || (lang === 'he' ? 'בחירה' : 'Select')}
        className="w-full max-w-md rounded-t-3xl bg-[#0a111c] border-t border-white/10 flex flex-col max-h-[70vh] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto mt-4 shrink-0" />
        <div className="flex items-center justify-between px-6 pt-4 pb-3 shrink-0 border-b border-white/8">
          <h3 className="text-base font-bold text-white">{title || 'Select'}</h3>
          <button
            onClick={onClose}
            aria-label="Close selection"
            className="p-2 rounded-xl bg-white/8 hover:bg-white/15 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center select-none"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-2" style={{ overscrollBehavior: 'contain' }}>
          {options.map(opt => (
            <button
              key={opt.key}
              onClick={() => { onChange(opt.key); onClose(); }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-all min-h-[44px] select-none mb-1 ${
                value === opt.key
                  ? 'bg-yellow-500/15 text-yellow-100'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <div>
                <div className="text-sm font-semibold">{opt.label}</div>
                {opt.sub && <div className="text-xs text-white/35 mt-0.5">{opt.sub}</div>}
              </div>
              {value === opt.key && <Check className="w-4 h-4 text-yellow-400 shrink-0" />}
            </button>
          ))}
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </div>
    </div>
  );
}
import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function LanguageToggle({ compact = false }) {
  const { lang, toggleLang, setLang } = useLanguage();

  const label = lang === 'both' ? 'EN · עב' : lang === 'en' ? 'EN' : 'עב';

  if (compact) {
    return (
      <button
        onClick={toggleLang}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-2xl glass border border-indigo-400/20 hover:bg-indigo-500/15 active:scale-95 transition-all"
        title="Toggle language"
      >
        <Languages className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
        <span className="text-xs font-semibold text-indigo-200">{label}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
      {['en', 'he', 'both'].map(mode => {
        const isActive = lang === mode;
        const lbl = mode === 'both' ? 'EN·עב' : mode === 'en' ? 'EN' : 'עב';
        return (
          <button
            key={mode}
            onClick={() => setLang(mode)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
              isActive ? 'bg-indigo-500/30 text-indigo-200' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {lbl}
          </button>
        );
      })}
    </div>
  );
}
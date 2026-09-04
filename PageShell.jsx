import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { translate } from '@/lib/i18n';

const ACCENTS = {
  yellow: 'bg-yellow-500/15 border-yellow-400/30 text-yellow-300',
  blue: 'bg-blue-500/15 border-blue-400/30 text-blue-300',
  emerald: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
  purple: 'bg-purple-500/15 border-purple-400/30 text-purple-300',
  cyan: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300',
  rose: 'bg-rose-500/15 border-rose-400/30 text-rose-300',
};

export default function PageShell({ title, subtitle, icon: Icon, accent = 'yellow', children }) {
  const { lang } = useLanguage();
  return (
    <main id="main-content" dir={lang === 'he' ? 'rtl' : 'ltr'} className="min-h-screen px-5 py-8 max-w-5xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-yellow-300/70 hover:text-yellow-300 mb-6 transition-colors">
        <ArrowLeft className={`w-4 h-4 ${lang === 'he' ? 'rotate-180' : ''}`} /> {translate(lang, 'backToZmanim')}
      </Link>
      <div className="flex items-center gap-3 mb-8">
        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${ACCENTS[accent]}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white glow-text">{title}</h1>
          {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
        </div>
      </div>
      {children}
    </main>
  );
}
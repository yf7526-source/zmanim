import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BookOpen, Search, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageShell from '@/components/PageShell';
import { useLanguage } from '@/lib/LanguageContext';

export default function Glossary() {
  const { lang } = useLanguage();
  const he = lang === 'he';
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState(false);

  const CATEGORIES = [
    { v: 'all', l: he ? 'הכל' : 'All' },
    { v: 'morning', l: he ? 'בוקר' : 'Morning' },
    { v: 'afternoon', l: he ? 'צהריים' : 'Afternoon' },
    { v: 'evening', l: he ? 'ערב' : 'Evening' },
    { v: 'night', l: he ? 'לילה' : 'Night' },
    { v: 'general', l: he ? 'כללי' : 'General' },
  ];

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    base44.entities.HalachicTerm.list('order', 200)
      .then(setTerms)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return terms.filter(t => {
      if (filter !== 'all' && t.category !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (t.term || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [terms, filter, search]);

  return (
    <PageShell title={he ? 'מילון מונחים הלכתיים' : 'Halachic Glossary'} subtitle={he ? 'מונחים אסטרונומיים והלכתיים בשימוש באפליקציה' : 'Astronomical and halachic terms used in the app'} icon={BookOpen} accent="purple">
      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input aria-label={he ? 'חיפוש מונחים' : 'Search glossary'} value={search} onChange={e => setSearch(e.target.value)} placeholder={he ? 'חיפוש מונחים...' : 'Search terms...'} className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400/50" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c.v} onClick={() => setFilter(c.v)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filter === c.v ? 'bg-purple-500/20 border-purple-400/40 text-purple-200' : 'bg-white/5 border-white/10 text-white/50'}`}>
              {c.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16" role="status" aria-label={he ? 'טוען' : 'Loading'}><Loader2 className="w-8 h-8 text-white/60 animate-spin" /></div>
      ) : loadError ? (
        <div role="alert" className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-center text-sm text-red-200">
          {he ? 'לא ניתן לטעון את המונחים. נסו שוב.' : 'Could not load glossary terms. Please try again.'}
          <button onClick={load} className="mt-3 block w-full rounded-xl border border-red-300/30 px-4 py-2 font-bold">{he ? 'נסה שוב' : 'Try again'}</button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-white/40 text-center py-16">{he ? 'לא נמצאו מונחים' : 'No terms found'}</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map(t => (
            <div key={t.id} className="rounded-2xl border border-white/10 bg-white/4 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-base font-bold text-white/90" dir="auto">{t.term}</h3>
                {t.category && t.category !== 'general' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 capitalize shrink-0">{t.category}</span>}
              </div>
              <p className="text-sm text-white/60 leading-relaxed" dir="auto">{t.description}</p>
              {t.source && <p className="text-xs text-white/30 mt-2">{he ? 'מקור:' : 'Source:'} {t.source}</p>}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
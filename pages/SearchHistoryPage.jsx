import React, { useState, useEffect, useCallback } from 'react';
import { History, Trash2, MapPin, Loader2, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageShell from '@/components/PageShell';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/lib/LanguageContext';

export default function SearchHistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const { lang } = useLanguage();

  const load = useCallback(() => {
    setLoading(true);
    base44.entities.SearchHistory.list('-created_date', 200)
      .then(setRecords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleClearAll() {
    try {
      await base44.entities.SearchHistory.deleteMany({});
      setRecords([]);
    } catch {}
    setConfirmClear(false);
  }

  function fmtDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  return (
    <PageShell title="Search History" subtitle="Dates and locations you've previously checked" icon={History} accent="blue">
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-white/30 animate-spin" /></div>
      ) : records.length === 0 ? (
        <div className="text-center py-16">
          <History className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">No search history yet</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setConfirmClear(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-400/30 text-red-200 text-xs font-bold hover:bg-red-500/20 transition-all">
              <Trash2 className="w-3.5 h-3.5" /> {lang === 'he' ? 'נקה הכל' : 'Clear All'}
            </button>
          </div>
          <div className="space-y-2">
            {records.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/4">
                <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-blue-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/90 truncate">{r.location_name}</p>
                  {r.search_date && <p className="text-xs text-white/40 flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(r.search_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
                </div>
                <p className="text-[10px] text-white/30 shrink-0">{fmtDate(r.created_date)}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang === 'he' ? 'נקה את כל היסטוריית החיפוש?' : 'Clear all search history?'}</AlertDialogTitle>
            <AlertDialogDescription>{lang === 'he' ? 'פעולה זו תמחק את כל הרשומות לצמיתות.' : 'This will permanently delete all records.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmClear(false)}>{lang === 'he' ? 'ביטול' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll}>{lang === 'he' ? 'נקה' : 'Clear'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
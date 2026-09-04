import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Trash2, FileText, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageShell from '@/components/PageShell';
import { useLanguage } from '@/lib/LanguageContext';

export default function ExportHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { lang } = useLanguage();

  const load = useCallback(() => {
    setLoading(true);
    base44.entities.PdfExportHistory.list('-created_date', 100)
      .then(setRecords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id) {
    try {
      await base44.entities.PdfExportHistory.delete(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch { setError(lang === 'he' ? 'המחיקה נכשלה.' : 'Could not delete.'); }
  }

  function fmtDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <PageShell title="Export History" subtitle="Previously generated PDF zmanim sheets" icon={FileText} accent="purple">
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-white/30 animate-spin" /></div>
      ) : records.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">No PDF exports yet</p>
          <p className="text-xs text-white/30 mt-1">Generated zmanim sheets will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
          {records.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-purple-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white/90 truncate">{r.title}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {r.view_mode && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/50 capitalize">{r.view_mode}</span>}
                  {r.format && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/50 capitalize">{r.format}</span>}
                  {r.zman_count != null && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/50">{r.zman_count} zmanim</span>}
                  {r.location_name && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/50">{r.location_name}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-white/30">{fmtDate(r.created_date)}</p>
                {r.start_date && r.end_date && <p className="text-[10px] text-white/40 mt-0.5">{fmtDate(r.start_date)} – {fmtDate(r.end_date)}</p>}
              </div>
              <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 shrink-0">
                <Trash2 className="w-4 h-4 text-red-300" />
              </button>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
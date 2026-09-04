import React, { useState } from 'react';
import { Bug, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageShell from '@/components/PageShell';
import { useLanguage } from '@/lib/LanguageContext';

export default function ReportIssue() {
  const { lang } = useLanguage();
  const he = lang === 'he';
  const [form, setForm] = useState({ subject: '', description: '', type: 'bug' });
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!form.subject || !form.description) return;
    setSaving(true);
    setError('');
    try {
      await base44.entities.BugReport.create(form);
      setSubmitted(true);
      setForm({ subject: '', description: '', type: 'bug' });
    } catch { setError(he ? 'השליחה נכשלה. נסה שוב.' : 'Could not submit. Please try again.'); } finally { setSaving(false); }
  }

  return (
    <PageShell title={he ? 'דיווח על באג' : 'Report a Bug'} subtitle={he ? 'עזרו לנו להשתפר — דווחו על באגים או בקשו תכונות' : 'Help us improve — report bugs or request features'} icon={Bug} accent="rose">
      <div className="max-w-lg">
        {submitted ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">{he ? 'תודה!' : 'Thank you!'}</h3>
            <p className="text-sm text-white/50">{he ? 'הדוח הוגש. נסקור אותו בקרוב.' : 'Your report has been submitted. We\'ll review it shortly.'}</p>
            <button onClick={() => setSubmitted(false)} className="mt-4 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-sm font-bold hover:bg-emerald-500/30 transition-all">
              {he ? 'שלח נוסף' : 'Submit Another'}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/4 p-5 space-y-4">
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div>
              <label className="text-xs font-bold text-white/50 block mb-1.5">{he ? 'סוג' : 'Type'}</label>
              <div className="flex gap-2">
                {[
                  { v: 'bug', l: he ? '🐛 דיווח באג' : '🐛 Bug Report' },
                  { v: 'feature_request', l: he ? '💡 בקשת תכונה' : '💡 Feature Request' },
                ].map(opt => (
                  <button key={opt.v} onClick={() => setForm(f => ({ ...f, type: opt.v }))} className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${form.type === opt.v ? 'bg-rose-500/20 border-rose-400/40 text-rose-200' : 'bg-white/5 border-white/10 text-white/50'}`}>
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-white/50 block mb-1.5">{he ? 'נושא' : 'Subject'}</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder={he ? 'כותרת קצרה' : 'Brief title'} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-rose-400/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-white/50 block mb-1.5">{he ? 'תיאור' : 'Description'}</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={he ? 'תאר את הבאג או התכונה בפירוט...' : 'Describe the bug or feature in detail...'} rows={6} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-rose-400/50 resize-none" />
            </div>
            <button onClick={handleSubmit} disabled={saving || !form.subject || !form.description} className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-sm font-bold hover:bg-rose-500/30 transition-all disabled:opacity-40">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {he ? 'שלח דוח' : 'Submit Report'}
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
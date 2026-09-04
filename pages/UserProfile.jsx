import React, { useState, useEffect } from 'react';
import { User, Loader2, Check, Mail, Globe } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageShell from '@/components/PageShell';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ full_name: '', preferred_language: 'both', default_opinion: 'gra' });

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setUser(u);
        setForm({
          full_name: u?.full_name || '',
          preferred_language: u?.preferred_language || 'both',
          default_opinion: u?.default_opinion || 'gra',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await base44.auth.updateMe({
        full_name: form.full_name,
        preferred_language: form.preferred_language,
        default_opinion: form.default_opinion,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError('Could not save. Please try again.'); } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <PageShell title="User Profile" icon={User} accent="blue">
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-white/30 animate-spin" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell title="User Profile" subtitle="Update your personal information and preferences" icon={User} accent="blue">
      <div className="max-w-lg space-y-5">
        {/* Account info */}
        <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
          <h3 className="text-sm font-bold text-white/90 mb-3">Account</h3>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/4">
            <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase">Email</p>
              <p className="text-sm text-white/80">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Editable info */}
        <div className="rounded-2xl border border-white/10 bg-white/4 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white/90">Personal Info</h3>
          <div>
            <label className="text-xs font-bold text-white/50 block mb-1.5">Full Name</label>
            <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Your name" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-400/50" />
          </div>
          <div>
            <label className="text-xs font-bold text-white/50 block mb-1.5 flex items-center gap-1"><Globe className="w-3 h-3" /> Preferred Language</label>
            <div className="flex gap-2">
              {[
                { v: 'he', l: 'עברית' },
                { v: 'en', l: 'English' },
                { v: 'both', l: 'Both' },
              ].map(opt => (
                <button key={opt.v} onClick={() => setForm(f => ({ ...f, preferred_language: opt.v }))} className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${form.preferred_language === opt.v ? 'bg-blue-500/20 border-blue-400/40 text-blue-200' : 'bg-white/5 border-white/10 text-white/50'}`}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-white/50 block mb-1.5">Default Halachic Opinion</label>
            <div className="flex gap-2">
              {[
                { v: 'gra', l: 'GRA' },
                { v: 'mga', l: 'MGA' },
                { v: 'bht', l: 'Rabbeinu Tam' },
              ].map(opt => (
                <button key={opt.v} onClick={() => setForm(f => ({ ...f, default_opinion: opt.v }))} className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${form.default_opinion === opt.v ? 'bg-blue-500/20 border-blue-400/40 text-blue-200' : 'bg-white/5 border-white/10 text-white/50'}`}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-200 text-sm font-bold hover:bg-blue-500/30 transition-all disabled:opacity-40">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
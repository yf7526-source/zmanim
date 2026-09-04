import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus, Trash2, Edit3, LocateFixed, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageShell from '@/components/PageShell';
import CityImportService from '@/components/CityImportService';
import { useLanguage } from '@/lib/LanguageContext';

export default function LocationManager() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ label: '', lat: '', lng: '', elevation: 0, timezone: '', country: '' });
  const [saving, setSaving] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState('');
  const { lang } = useLanguage();

  const load = useCallback(() => {
    setLoading(true);
    base44.entities.SavedLocation.list('-created_date', 100)
      .then(setLocations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() { setForm({ label: '', lat: '', lng: '', elevation: 0, timezone: '', country: '' }); setEditing(null); }

  function startEdit(loc) { setEditing(loc); setForm({ label: loc.label, lat: loc.lat, lng: loc.lng, elevation: loc.elevation || 0, timezone: loc.timezone || '', country: loc.country || '' }); }

  function useGeolocation() {
    setGeoLoading(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, lat: pos.coords.latitude.toFixed(4), lng: pos.coords.longitude.toFixed(4), elevation: Math.round(pos.coords.altitude || 0) }));
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true }
    );
  }

  async function handleSave() {
    if (!form.label || !form.lat || !form.lng) return;
    setSaving(true);
    const data = { ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng), elevation: parseFloat(form.elevation) || 0 };
    try {
      if (editing) { await base44.entities.SavedLocation.update(editing.id, data); }
      else { await base44.entities.SavedLocation.create(data); }
      resetForm(); load();
    } catch { setError(lang === 'he' ? 'השמירה נכשלה. נסה שוב.' : 'Could not save. Please try again.'); } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try {
      await base44.entities.SavedLocation.delete(id);
      setLocations(prev => prev.filter(l => l.id !== id));
    } catch { setError(lang === 'he' ? 'המחיקה נכשלה. נסה שוב.' : 'Could not delete. Please try again.'); }
  }

  return (
    <PageShell title="Location Manager" subtitle="Save and manage your favorite locations" icon={MapPin} accent="emerald">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white/90">{editing ? 'Edit Location' : 'Add Location'}</h3>
            {editing && <button onClick={resetForm} aria-label="Close location form" className="p-1.5 rounded-lg bg-white/8 hover:bg-white/15"><X className="w-3.5 h-3.5 text-white/50" /></button>}
          </div>
          <div className="space-y-3">
            {error && <p className="text-xs text-red-400">{error}</p>}
            <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Location name (e.g. Home, Shul)" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/50" />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="Latitude" type="number" step="0.0001" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/50" />
              <input value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} placeholder="Longitude" type="number" step="0.0001" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/50" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={form.elevation} onChange={e => setForm(f => ({ ...f, elevation: e.target.value }))} placeholder="Elevation (m)" type="number" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/50" />
              <input value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} placeholder="Timezone (e.g. America/New_York)" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/50" />
            </div>
            <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="Country" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/50" />
            <button onClick={useGeolocation} disabled={geoLoading} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-200 text-xs font-bold hover:bg-blue-500/25 transition-all disabled:opacity-40">
              {geoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />} Use Current Location
            </button>
            <button onClick={handleSave} disabled={saving || !form.label || !form.lat || !form.lng} className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-sm font-bold hover:bg-emerald-500/30 transition-all disabled:opacity-40">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {editing ? 'Update' : 'Add'} Location
            </button>
          </div>
        </div>

        {/* List */}
        <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
          <h3 className="text-sm font-bold text-white/90 mb-4">Saved Locations ({locations.length})</h3>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-white/30 animate-spin" /></div>
          ) : locations.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-8">No saved locations yet</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {locations.map(loc => (
                <div key={loc.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/4">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/90 truncate">{loc.label}</p>
                    <p className="text-xs text-white/40">{loc.lat?.toFixed(3)}, {loc.lng?.toFixed(3)}{loc.country ? ` · ${loc.country}` : ''}</p>
                  </div>
                  <button onClick={() => startEdit(loc)} className="p-2 rounded-lg bg-white/8 hover:bg-white/15"><Edit3 className="w-3.5 h-3.5 text-white/50" /></button>
                  <button onClick={() => handleDelete(loc.id)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <CityImportService />
      </div>
    </PageShell>
  );
}
import React, { useState } from 'react';
import { Download, CheckCircle2, AlertTriangle, Loader2, Database, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { ORTHODOX_CITIES } from '@/lib/orthodoxCities';

export default function CityImportService() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleImport = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await base44.functions.invoke('importCities', {
        cities: ORTHODOX_CITIES,
      });
      setResult(response.data);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center shrink-0">
          <Database className="w-5 h-5 text-blue-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white">City Import Service</h3>
          <p className="text-xs text-white/50 mt-0.5">
            Import {ORTHODOX_CITIES.length} verified cities from the trusted dataset into the database.
            Only missing cities are added — existing records and custom candle-lighting settings are never overwritten.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-white/40">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Admin-only · Preserves custom settings · Logs all changes</span>
      </div>

      <button
        onClick={handleImport}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-200 font-semibold text-sm hover:bg-blue-500/30 transition-all disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
        ) : (
          <><Download className="w-4 h-4" /> Import Verified Cities</>
        )}
      </button>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-400/30">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-200">{result.details}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <p className="text-xl font-bold text-emerald-300">{result.imported}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wide">Added</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <p className="text-xl font-bold text-white/70">{result.skipped}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wide">Skipped</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <p className="text-xl font-bold text-amber-300">{result.preserved_custom}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wide">Preserved</p>
            </div>
          </div>

          {result.preserved_custom_details?.length > 0 && (
            <div className="rounded-xl bg-amber-500/8 border border-amber-400/20 p-3">
              <p className="text-xs font-semibold text-amber-300 mb-2">Custom candle-lighting preserved:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {result.preserved_custom_details.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-white/70">{c.city}</span>
                    <span className="text-amber-300/80 font-mono">
                      DB: {c.existing_offset}min → Dataset: {c.dataset_offset}min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-white/30 text-center">
            Log ID: {result.log_id}
          </p>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export default function PwaUpdatePrompt() {
  const [registration, setRegistration] = useState(null);
  useEffect(() => {
    const onReady = (event) => setRegistration(event.detail?.registration || null);
    window.addEventListener('solarzmanim:update-ready', onReady);
    return () => window.removeEventListener('solarzmanim:update-ready', onReady);
  }, []);
  if (!registration) return null;
  const update = () => {
    const worker = registration.waiting;
    if (!worker) return window.location.reload();
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
    worker.postMessage({ type: 'SKIP_WAITING' });
  };
  return (
    <aside className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[110] mx-auto max-w-md rounded-2xl border border-cyan-400/35 bg-slate-950/95 p-3 shadow-2xl backdrop-blur" aria-live="polite">
      <div className="flex items-center gap-3">
        <RefreshCw className="h-5 w-5 text-cyan-300 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">SolarZmanim update ready</p>
          <p className="text-xs text-white/55">Reload to use the newest version.</p>
        </div>
        <button type="button" onClick={update} className="min-h-11 rounded-xl bg-cyan-300 px-3 text-sm font-bold text-slate-950">Update</button>
        <button type="button" onClick={() => setRegistration(null)} aria-label="Dismiss update" className="grid min-h-11 min-w-11 place-items-center rounded-xl text-white/50 hover:bg-white/10"><X className="h-5 w-5" /></button>
      </div>
    </aside>
  );
}

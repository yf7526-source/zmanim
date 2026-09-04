import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const DISMISSED_KEY = 'solarzmanimInstallPromptDismissedAt';
const DISMISS_FOR_MS = 30 * 24 * 60 * 60 * 1000;

export default function PwaInstallPrompt() {
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return undefined;
    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || 0);
    if (Date.now() - dismissedAt < DISMISS_FOR_MS) return undefined;

    const onPrompt = (event) => {
      event.preventDefault();
      setPrompt(event);
    };
    const onInstalled = () => setPrompt(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!prompt) return null;

  const install = async () => {
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setPrompt(null);
  };

  return (
    <aside className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[100] mx-auto max-w-md rounded-2xl border border-yellow-400/35 bg-slate-950/95 p-3 shadow-2xl backdrop-blur" aria-label="Install SolarZmanim">
      <div className="flex items-center gap-3">
        <img src="/icon-192.png" alt="" className="h-11 w-11 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">Install SolarZmanim</p>
          <p className="text-xs text-white/55">Faster access and an offline fallback.</p>
        </div>
        <button type="button" onClick={install} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-yellow-400 px-3 text-sm font-bold text-slate-950">
          <Download className="h-4 w-4" /> Install
        </button>
        <button type="button" onClick={dismiss} aria-label="Dismiss install suggestion" className="grid min-h-11 min-w-11 place-items-center rounded-xl text-white/50 hover:bg-white/10 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}

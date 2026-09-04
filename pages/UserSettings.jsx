import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, ArrowLeft, Info } from 'lucide-react';
import PageShell from '@/components/PageShell';
import { useLanguage } from '@/lib/LanguageContext';
import { translate } from '@/lib/i18n';

export default function UserSettings() {
  const { lang } = useLanguage();
  return (
    <PageShell title={translate(lang, 'settings')} subtitle={translate(lang, 'settingsSubtitle')} icon={Settings} accent="blue">
      <div className="max-w-lg space-y-4">
        <div className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 text-blue-300 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-white/90">{translate(lang, 'settingsSystem')}</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/70">{translate(lang, 'settingsBody')}</p>
            </div>
          </div>
        </div>
        <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-200 hover:bg-yellow-400/15">
          <ArrowLeft className={`h-4 w-4 ${lang === 'he' ? 'rotate-180' : ''}`} /> {translate(lang, 'backToZmanim')}
        </Link>
      </div>
    </PageShell>
  );
}
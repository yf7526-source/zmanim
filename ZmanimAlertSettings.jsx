import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Clock, Volume2, VolumeX, Zap } from 'lucide-react';
import { NOTIFIABLE_ZMANIM, LEAD_TIME_OPTIONS, loadNotifierPrefs, saveNotifierPrefs } from '../lib/notifierConfig';
import { useLanguage } from '../lib/LanguageContext';
import { showAppNotification } from '@/lib/pwa';

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

export default function ZmanimAlertSettings({ sunTimes }) {
  const [prefs, setPrefs] = useState(loadNotifierPrefs);
  const [permStatus, setPermStatus] = useState('default');
  const { lang, showHe, showEn } = useLanguage();

  useEffect(() => {
    if (!('Notification' in window)) { setPermStatus('unsupported'); return; }
    setPermStatus(Notification.permission);
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const res = await Notification.requestPermission();
    setPermStatus(res);
    if (res === 'granted') {
      setPrefs(p => { const np = { ...p, enabled: true }; saveNotifierPrefs(np); return np; });
      await showAppNotification('🔔 ' + (showEn ? 'Zmanim Alerts Enabled' : 'התראות זמנים הופעלו'), {
        body: showEn ? 'You will be notified before selected times.' : 'תקבל התראות לפני הזמנים שנבחרו.',
        icon: '/icon-192.png',
      });
    }
  };

  const toggleEnabled = () => {
    if (!prefs.enabled && permStatus !== 'granted') { requestPermission(); return; }
    setPrefs(p => { const np = { ...p, enabled: !p.enabled }; saveNotifierPrefs(np); return np; });
  };

  const toggleZman = (key) => {
    setPrefs(p => {
      const sel = p.selected.includes(key) ? p.selected.filter(k => k !== key) : [...p.selected, key];
      const np = { ...p, selected: sel }; saveNotifierPrefs(np); return np;
    });
  };

  const setLead = (min) => {
    setPrefs(p => { const np = { ...p, leadMinutes: min }; saveNotifierPrefs(np); return np; });
  };

  const toggleSound = () => {
    setPrefs(p => { const np = { ...p, sound: !p.sound }; saveNotifierPrefs(np); return np; });
    if (!prefs.sound) playBeep();
  };

  const sendTest = async () => {
    if (permStatus !== 'granted') return;
    await showAppNotification('🔔 ' + (showEn ? 'Test Alert' : 'התראת בדיקה'), {
      body: showEn ? 'This is how your zmanim alerts will look.' : 'כך ייראו ההתראות שלך.',
      icon: '/icon-192.png',
    });
    if (prefs.sound) playBeep();
  };

  return (
    <section className="rounded-2xl bg-white/4 border border-white/8 p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Bell className="w-4 h-4 text-amber-400/70" />
        </div>
        <div>
          <p className="text-sm font-bold text-white/80">
            {showHe && <span dir="rtl">התראות זמנים</span>}
            {lang === 'both' && ' · '}
            {showEn && <span>Zmanim Alerts</span>}
          </p>
          <p className="text-xs text-white/30 mt-0.5">
            {showEn ? 'Get notified before key times' : 'קבל התראה לפני זמנים חשובים'}
          </p>
        </div>
      </div>

      {permStatus === 'unsupported' && (
        <div className="rounded-2xl bg-red-500/10 border border-red-400/20 p-3 text-sm text-red-300/70 mb-4">
          {showEn ? 'Notifications are not supported in this browser.' : 'התראות לא נתמכות בדפדפן זה.'}
        </div>
      )}

      {/* Master toggle + sound + test */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={toggleEnabled}
          disabled={permStatus === 'unsupported'}
          className={`flex-1 flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all ${
            prefs.enabled
              ? 'bg-amber-500/15 border-amber-400/40'
              : 'bg-white/5 border-white/10'
          } ${permStatus === 'unsupported' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-3">
            {prefs.enabled ? <BellRing className="w-5 h-5 text-amber-300" /> : <Bell className="w-5 h-5 text-white/40" />}
            <div className="text-left">
              <div className="text-sm font-bold text-white/90">
                {prefs.enabled ? (showEn ? 'Alerts Active' : 'התראות פעילות') : (showEn ? 'Enable Alerts' : 'הפעל התראות')}
              </div>
              <div className="text-xs text-white/40 mt-0.5">
                {permStatus === 'denied'
                  ? (showEn ? 'Permission denied' : 'הרשאה נדחתה')
                  : prefs.enabled
                    ? (showEn ? 'Tap to pause' : 'הקש להשהות')
                    : (showEn ? 'Allow browser notifications' : 'אפשר התראות דפדפן')}
              </div>
            </div>
          </div>
          <div className={`w-11 h-6 rounded-full transition-all relative ${prefs.enabled ? 'bg-amber-400/60' : 'bg-white/15'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${prefs.enabled ? 'left-5' : 'left-0.5'}`} />
          </div>
        </button>

        <button
          onClick={toggleSound}
          disabled={!prefs.enabled}
          title={showEn ? 'Toggle sound' : 'הפעל/כבה צליל'}
          className={`p-3.5 rounded-2xl border transition-all disabled:opacity-40 ${
            prefs.sound ? 'bg-amber-500/15 border-amber-400/40 text-amber-300' : 'bg-white/5 border-white/10 text-white/40'
          }`}
        >
          {prefs.sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        <button
          onClick={sendTest}
          disabled={!prefs.enabled || permStatus !== 'granted'}
          title={showEn ? 'Send test alert' : 'שלח התראת בדיקה'}
          className="p-3.5 rounded-2xl border bg-white/5 border-white/10 text-white/40 hover:text-amber-300 hover:border-amber-400/30 transition-all disabled:opacity-40"
        >
          <Zap className="w-5 h-5" />
        </button>
      </div>

      {/* Lead time */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> {showEn ? 'Notify before' : 'התראה לפני'}
        </label>
        <div className="grid grid-cols-6 gap-1.5">
          {LEAD_TIME_OPTIONS.map(m => (
            <button
              key={m}
              onClick={() => setLead(m)}
              disabled={!prefs.enabled}
              className={`py-2 rounded-xl border-2 text-center transition-all active:scale-95 disabled:opacity-40 ${
                prefs.leadMinutes === m
                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                  : 'bg-white/5 border-white/10 text-white/50'
              }`}
            >
              <div className="font-bold text-sm">{m}</div>
              <div className="text-[9px] opacity-50">min</div>
            </button>
          ))}
        </div>
      </div>

      {/* Zmanim selection */}
      <div>
        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2.5">
          {showEn ? 'Which times?' : 'אילו זמנים?'}
        </label>
        <div className="space-y-1.5">
          {NOTIFIABLE_ZMANIM.map(zman => {
            const t = sunTimes?.[zman.key];
            const selected = prefs.selected.includes(zman.key);
            return (
              <button
                key={zman.key}
                onClick={() => toggleZman(zman.key)}
                disabled={!prefs.enabled}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all disabled:opacity-40 ${
                  selected
                    ? 'bg-amber-500/12 border-amber-400/30'
                    : 'bg-white/4 border-white/8'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{zman.emoji}</span>
                  <span className="text-sm font-semibold text-white/80">
                    {showHe && <span dir="rtl">{zman.labelHe}</span>}
                    {lang === 'both' && <span className="text-white/20 mx-1">·</span>}
                    {showEn && zman.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {t && <span className="text-xs font-mono text-white/40">{t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selected ? 'bg-amber-400/80 border-amber-400' : 'border-white/20'}`}>
                    {selected && <span className="text-[10px] text-black font-bold">✓</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-white/25 text-center mt-4">
        {showEn
          ? 'Alerts work while the app is open in your browser.'
          : 'ההתראות פועלות כשהאפליקציה פתוחה בדפדפן.'}
      </p>
    </section>
  );
}

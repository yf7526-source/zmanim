import { useState, useEffect, useRef } from 'react';
import { NOTIFIABLE_ZMANIM, loadNotifierPrefs } from '../lib/notifierConfig';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { showAppNotification } from '@/lib/pwa';

// Web Audio API beep — no external file needed
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

export default function ZmanimNotifier({ sunTimes, currentTime }) {
  const [prefs, setPrefs] = useState(loadNotifierPrefs);
  const [permStatus, setPermStatus] = useState('default');
  const firedRef = useRef({});
  const { lang, showHe, showEn } = useLanguage();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!('Notification' in window)) { setPermStatus('unsupported'); return; }
    setPermStatus(Notification.permission);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !prefs.enabled || !sunTimes || permStatus !== 'granted') return;

    const check = async () => {
      const now = currentTime.getTime();
      const todayKey = new Date().toDateString();

      for (const zman of NOTIFIABLE_ZMANIM) {
        if (!prefs.selected.includes(zman.key)) continue;
        const t = sunTimes[zman.key];
        if (!t || isNaN(t.getTime())) continue;

        const fireKey = `${todayKey}_${zman.key}`;
        if (firedRef.current[fireKey]) continue;

        const leadMs = prefs.leadMinutes * 60000;
        const target = t.getTime() - leadMs;

        if (now >= target && now < t.getTime()) {
          const minsLeft = Math.max(0, Math.round((t.getTime() - now) / 60000));
          const label = showHe ? zman.labelHe : zman.label;
          const timeStr = t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          const bodyText = showHe
            ? (minsLeft > 0 ? `בעוד ${minsLeft} דק׳ · ${timeStr}` : `עכשיו · ${timeStr}`)
            : (minsLeft > 0 ? `In ${minsLeft} min · ${timeStr}` : `Now · ${timeStr}`);

          await showAppNotification(`${zman.emoji} ${label}`, {
            body: bodyText,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: fireKey,
            data: { url: '/' },
          });

          if (prefs.sound) playBeep();
          firedRef.current[fireKey] = true;
        }
      }
    };

    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [prefs, sunTimes, currentTime, permStatus, showHe, isAuthenticated]);

  return null;
}

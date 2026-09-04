import React, { useState, useEffect } from 'react';
import { Activity, MapPin, Calculator, Calendar, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getSunPosition } from '@/lib/sunCalc';
import { base44 } from '@/api/base44Client';
import PageShell from '@/components/PageShell';

export default function SystemStatus() {
  const [statuses, setStatuses] = useState({
    location: 'checking',
    calc: 'checking',
    calendar: 'checking',
  });

  useEffect(() => {
    // Check geolocation
    setStatuses(s => ({ ...s, location: navigator.geolocation ? 'ok' : 'down' }));

    // Check calculation engine
    try {
      const pos = getSunPosition(new Date(), 40, -74);
      setStatuses(s => ({ ...s, calc: pos && !isNaN(pos.altitude) ? 'ok' : 'down' }));
    } catch {
      setStatuses(s => ({ ...s, calc: 'down' }));
    }

    // Check Google Calendar connector
    base44.functions.invoke('exportZmanimToCalendar', { zmanim: [], date: '2000-01-01', locationName: 'test' })
      .then(() => setStatuses(s => ({ ...s, calendar: 'ok' })))
      .catch((e) => {
        const err = e?.response?.data;
        setStatuses(s => ({ ...s, calendar: err?.notConnected ? 'not_connected' : 'down' }));
      });
  }, []);

  const cards = [
    { key: 'location', label: 'Location Services', desc: 'GPS & geolocation API', icon: MapPin, accent: 'emerald' },
    { key: 'calc', label: 'Calculation Engine', desc: 'Solar position & zmanim calculations', icon: Calculator, accent: 'blue' },
    { key: 'calendar', label: 'Google Calendar', desc: 'Calendar sync integration', icon: Calendar, accent: 'rose' },
  ];

  const accentMap = {
    emerald: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
    blue: 'bg-blue-500/15 border-blue-400/30 text-blue-300',
    rose: 'bg-rose-500/15 border-rose-400/30 text-rose-300',
  };

  function statusUI(s) {
    if (s === 'checking') return { icon: Loader2, text: 'Checking...', color: 'text-white/40', spin: true };
    if (s === 'ok') return { icon: CheckCircle2, text: 'Operational', color: 'text-emerald-300', spin: false };
    if (s === 'not_connected') return { icon: XCircle, text: 'Not Connected', color: 'text-yellow-300', spin: false };
    return { icon: XCircle, text: 'Offline', color: 'text-red-300', spin: false };
  }

  return (
    <PageShell title="System Status" subtitle="Real-time service availability" icon={Activity} accent="cyan">
      <div className="grid sm:grid-cols-3 gap-4">
        {cards.map(card => {
          const sui = statusUI(statuses[card.key]);
          return (
            <div key={card.key} className={`rounded-2xl border p-5 ${accentMap[card.accent]}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center">
                  <card.icon className="w-5 h-5" />
                </div>
                <sui.icon className={`w-5 h-5 ${sui.color} ${sui.spin ? 'animate-spin' : ''}`} />
              </div>
              <p className="text-sm font-bold text-white/90">{card.label}</p>
              <p className="text-xs text-white/40 mt-0.5">{card.desc}</p>
              <p className={`text-xs font-bold mt-3 ${sui.color}`}>{sui.text}</p>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
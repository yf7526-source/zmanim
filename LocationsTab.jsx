import React, { useState, useEffect } from 'react';
import { MapPin, Globe, Users, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function fmtDate(d, he) {
  if (!d) return '';
  return new Date(d).toLocaleString(he ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function distance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LocationsTab({ lang = 'both' }) {
  const he = lang === 'he';
  const tr = (en, heb) => he ? heb : en;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    base44.entities.AnalyticsEvent.filter({ event_type: 'gps_signin' }, '-created_date', 200)
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Group nearby locations
  const grouped = [];
  const used = new Set();
  events.forEach((e, i) => {
    if (used.has(i)) return;
    if (e.lat == null || e.lng == null) return;
    const cluster = [e];
    used.add(i);
    events.forEach((e2, j) => {
      if (used.has(j) || e2.lat == null || e2.lng == null) return;
      if (distance(e.lat, e.lng, e2.lat, e2.lng) < 5) {
        cluster.push(e2);
        used.add(j);
      }
    });
    grouped.push(cluster);
  });
  grouped.sort((a, b) => b.length - a.length);

  const uniqueUsers = new Set(events.map(e => e.user_email).filter(Boolean));
  const uniqueLocations = new Set(events.map(e => e.location_name).filter(Boolean));

  const stats = [
    { label: tr('GPS Sign-ins', 'כניסות GPS'), value: events.length, icon: MapPin, color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-400/30' },
    { label: tr('Unique Users', 'משתמשים ייחודיים'), value: uniqueUsers.size, icon: Users, color: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-400/30' },
    { label: tr('Unique Locations', 'מיקומים ייחודיים'), value: uniqueLocations.size, icon: Globe, color: 'text-yellow-300', bg: 'bg-yellow-500/15', border: 'border-yellow-400/30' },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.border} ${s.bg}`}>
            <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
            <p className="text-xl font-bold text-white">{loading ? '–' : s.value}</p>
            <p className="text-[10px] text-white/50 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Refresh */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white/80">{tr('GPS Sign-in Locations', 'מיקומי כניסות GPS')}</h3>
        <button onClick={load} aria-label={tr('Refresh locations', 'רענן מיקומים')} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
          <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-8">{tr('No GPS sign-ins recorded yet', 'אין כניסות GPS עדיין')}</p>
        ) : (
          <div className="space-y-2">
            {events.map((e, i) => (
              <div key={e.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-white/4 hover:bg-white/8 transition-all">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/90 truncate">{e.location_name || `${e.lat?.toFixed(3)}, ${e.lng?.toFixed(3)}`}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {e.user_email && <span className="text-[10px] text-white/40">{e.user_email}</span>}
                    <span className="text-[10px] text-white/30">{fmtDate(e.created_date, he)}</span>
                  </div>
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${e.lat}&mlon=${e.lng}#map=14/${e.lat}/${e.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-yellow-300/70 hover:text-yellow-300 font-bold shrink-0"
                >
                  {tr('View Map', 'צפה במפה')}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Location clusters */}
      {!loading && grouped.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-white/80 mb-4">{tr('Location Clusters', 'אשכולות מיקומים')}</h3>
          <div className="space-y-2">
            {grouped.slice(0, 10).map((cluster, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-yellow-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/90 truncate">{cluster[0].location_name || `${cluster[0].lat?.toFixed(2)}, ${cluster[0].lng?.toFixed(2)}`}</p>
                  <p className="text-[10px] text-white/40">{cluster.length} {tr('sign-in' + (cluster.length > 1 ? 's' : ''), 'כניסות')}</p>
                </div>
                <span className="text-xs font-bold text-yellow-300/70">{cluster.length}×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
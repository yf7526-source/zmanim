import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, MapPin, TrendingUp, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AnalyticsTab({ lang = 'both' }) {
  const he = lang === 'he';
  const tr = (en, heb) => he ? heb : en;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.AnalyticsEvent.list('-created_date', 500)
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const dailyVisits = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        date: d,
        label: d.toLocaleDateString(he ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric' }),
        count: 0,
      });
    }
    const dayMap = new Map(days.map(d => [d.date.toDateString(), d]));
    for (const ev of events) {
      if (ev.event_type !== 'visit' || !ev.created_date) continue;
      const key = new Date(ev.created_date).toDateString();
      const day = dayMap.get(key);
      if (day) day.count++;
    }
    return days;
  }, [events, he]);

  const monthlyVisits = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        date: d,
        label: d.toLocaleDateString(he ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric' }),
        count: 0,
      });
    }
    const dayMap = new Map(days.map(d => [d.date.toDateString(), d]));
    for (const ev of events) {
      if (ev.event_type !== 'visit' || !ev.created_date) continue;
      const key = new Date(ev.created_date).toDateString();
      const day = dayMap.get(key);
      if (day) day.count++;
    }
    return days;
  }, [events, he]);

  const topLocations = useMemo(() => {
    const counts = {};
    for (const ev of events) {
      if (ev.event_type !== 'location_search' || !ev.location_name) continue;
      counts[ev.location_name] = (counts[ev.location_name] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [events]);

  const totalVisits = dailyVisits.reduce((sum, d) => sum + d.count, 0);
  const totalSearches = topLocations.reduce((sum, l) => sum + l.count, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-blue-400/30 bg-blue-500/10 p-4">
          <Activity className="w-5 h-5 text-blue-300 mb-2" />
          <p className="text-2xl font-bold text-white">{loading ? '–' : totalVisits}</p>
          <p className="text-xs text-white/50 mt-0.5">{tr('Visits (14 days)', 'ביקורים (14 ימים)')}</p>
        </div>
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <MapPin className="w-5 h-5 text-emerald-300 mb-2" />
          <p className="text-2xl font-bold text-white">{loading ? '–' : totalSearches}</p>
          <p className="text-xs text-white/50 mt-0.5">{tr('Location Searches', 'חיפושי מיקומים')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
        </div>
      ) : (
        <>
          {/* Daily visits chart */}
          <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-300" />
              <h3 className="text-sm font-bold text-white/90">{tr('Daily Visits', 'ביקורים יומיים')}</h3>
            </div>
            {totalVisits === 0 ? (
              <p className="text-sm text-white/40 text-center py-8">{tr('No visit data yet', 'אין נתוני ביקורים עדיין')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyVisits}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f2035', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                    itemStyle={{ color: '#93c5fd' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 30-day visits line chart */}
          <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-300" />
              <h3 className="text-sm font-bold text-white/90">{tr('Visits — Past 30 Days', 'ביקורים — 30 ימים אחרונים')}</h3>
            </div>
            {monthlyVisits.every(d => d.count === 0) ? (
              <p className="text-sm text-white/40 text-center py-8">{tr('No visit data yet', 'אין נתוני ביקורים עדיין')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyVisits} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} interval={3} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f2035', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                    itemStyle={{ color: '#93c5fd' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top locations chart */}
          <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-emerald-300" />
              <h3 className="text-sm font-bold text-white/90">{tr('Popular Search Locations', 'מיקומי חיפוש פופולריים')}</h3>
            </div>
            {topLocations.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-8">{tr('No location search data yet', 'אין נתוני חיפוש מיקומים עדיין')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, topLocations.length * 36)}>
                <BarChart data={topLocations} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip
                    contentStyle={{ background: '#0f2035', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                    itemStyle={{ color: '#6ee7b7' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top 10 cities table */}
          <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-emerald-300" />
              <h3 className="text-sm font-bold text-white/90">{tr('Top 10 Searched Cities', '10 ערים מחופשות')}</h3>
            </div>
            {topLocations.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-8">{tr('No location search data yet', 'אין נתוני חיפוש מיקומים עדיין')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-2 text-xs font-bold text-white/40 uppercase tracking-wider">#</th>
                    <th className="text-left py-2 px-2 text-xs font-bold text-white/40 uppercase tracking-wider">{tr('City', 'עיר')}</th>
                    <th className="text-right py-2 px-2 text-xs font-bold text-white/40 uppercase tracking-wider">{tr('Searches', 'חיפושים')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topLocations.slice(0, 10).map((loc, i) => (
                    <tr key={loc.name} className="border-b border-white/5 hover:bg-white/4 transition-colors">
                      <td className="py-2.5 px-2 text-white/40 font-mono">{i + 1}</td>
                      <td className="py-2.5 px-2 text-white/80 font-medium">{loc.name}</td>
                      <td className="py-2.5 px-2 text-right text-emerald-300 font-bold tabular-nums">{loc.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
import React, { useMemo } from 'react';
import { getSunPosition, getSkyColor } from '@/lib/sunCalc';

/**
 * Horizontal timeline showing sun elevation across the day.
 * Color-coded by sky color at each point.
 */
export default function SunTimeline({ date, lat, lng, selectedTime }) {
  const WIDTH = 340;
  const HEIGHT = 80;
  const PADDING = { top: 10, bottom: 20, left: 8, right: 8 };
  const chartW = WIDTH - PADDING.left - PADDING.right;
  const chartH = HEIGHT - PADDING.top - PADDING.bottom;

  const points = useMemo(() => {
    if (!lat || !lng) return [];
    const pts = [];
    const baseDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    for (let min = 0; min <= 1440; min += 6) {
      const t = new Date(baseDate.getTime() + min * 60000);
      const pos = getSunPosition(t, lat, lng);
      pts.push({ min, alt: pos.altitude, time: t });
    }
    return pts;
  }, [date, lat, lng]);

  const minAlt = useMemo(() => Math.min(...points.map(p => p.alt), -20), [points]);
  const maxAlt = useMemo(() => Math.max(...points.map(p => p.alt), 5), [points]);
  const range = maxAlt - minAlt;

  const toX = (min) => PADDING.left + (min / 1440) * chartW;
  const toY = (alt) => PADDING.top + chartH - ((alt - minAlt) / range) * chartH;

  // Horizon Y
  const horizonY = toY(-0.833);

  // Current time marker
  const nowMin = useMemo(() => {
    const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return (selectedTime.getTime() - base.getTime()) / 60000;
  }, [selectedTime, date]);

  const nowX = toX(Math.max(0, Math.min(1440, nowMin)));
  const nowPos = getSunPosition(selectedTime, lat || 0, lng || 0);

  // Build colored path segments
  const segments = useMemo(() => {
    if (points.length < 2) return [];
    return points.slice(0, -1).map((p, i) => {
      const n = points[i + 1];
      return {
        x1: toX(p.min), y1: toY(p.alt),
        x2: toX(n.min), y2: toY(n.alt),
        color: getSkyColor(p.alt),
      };
    });
  }, [points]);

  // Hour labels
  const hours = [0, 6, 12, 18, 24].map(h => ({
    min: h * 60,
    label: h === 24 ? '' : `${h.toString().padStart(2, '0')}:00`,
  }));

  if (points.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
      <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mb-3">Sun Elevation Today</p>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {/* Horizon line */}
        <line x1={PADDING.left} y1={horizonY} x2={WIDTH - PADDING.right} y2={horizonY}
          stroke="rgba(212,168,67,0.3)" strokeWidth="1" strokeDasharray="4 3" />

        {/* Colored path */}
        {segments.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke={s.color} strokeWidth="2.5" strokeLinecap="round" />
        ))}

        {/* Current time vertical line */}
        <line x1={nowX} y1={PADDING.top} x2={nowX} y2={HEIGHT - PADDING.bottom}
          stroke="rgba(212,168,67,0.7)" strokeWidth="1.5" />
        <circle cx={nowX} cy={toY(nowPos.altitude)} r={4}
          fill="#D4A843" filter="drop-shadow(0 0 4px #D4A84388)" />

        {/* Hour labels */}
        {hours.map(h => (
          <text key={h.min} x={toX(h.min)} y={HEIGHT - 4}
            textAnchor="middle" fill="rgba(245,240,232,0.4)"
            fontSize="9" fontFamily="Inter, sans-serif">
            {h.label}
          </text>
        ))}

        {/* Horizon label */}
        <text x={PADDING.left + 2} y={horizonY - 3} fill="rgba(212,168,67,0.5)"
          fontSize="8" fontFamily="Inter, sans-serif">horizon</text>
      </svg>
    </div>
  );
}
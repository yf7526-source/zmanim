import React, { useMemo } from 'react';
import { getSunPosition } from '@/lib/sunCalc';

export default function ElevationTimeline({ date, lat, lng, now, zmanim }) {
  const points = useMemo(() => {
    if (!lat || !lng) return [];
    const pts = [];
    const base = new Date(date);
    base.setHours(0, 0, 0, 0);
    for (let min = 0; min <= 1440; min += 15) {
      const t = new Date(base.getTime() + min * 60000);
      const { elevation } = getSunPosition(t, lat, lng);
      pts.push({ min, elevation, time: t });
    }
    return pts;
  }, [date, lat, lng]);

  if (!points.length) return null;

  const W = 320, H = 100;
  const padL = 30, padR = 10, padT = 10, padB = 20;
  const w = W - padL - padR;
  const h = H - padT - padB;

  const minElev = Math.min(-20, ...points.map(p => p.elevation));
  const maxElev = Math.max(10, ...points.map(p => p.elevation));
  const range = maxElev - minElev;

  const toX = (min) => padL + (min / 1440) * w;
  const toY = (elev) => padT + h - ((elev - minElev) / range) * h;

  const pathD = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${toX(p.min).toFixed(1)} ${toY(p.elevation).toFixed(1)}`
  ).join(' ');

  const zeroY = toY(0);
  const nowMin = (now.getHours() * 60 + now.getMinutes());
  const nowX = toX(nowMin);

  const zmLines = [];
  if (zmanim?.sunrise) {
    const sm = zmanim.sunrise.getHours() * 60 + zmanim.sunrise.getMinutes();
    zmLines.push({ x: toX(sm), color: '#FFD23F', label: 'נץ' });
  }
  if (zmanim?.sunset) {
    const sm = zmanim.sunset.getHours() * 60 + zmanim.sunset.getMinutes();
    zmLines.push({ x: toX(sm), color: '#FF8C00', label: 'שק' });
  }
  if (zmanim?.alotHashachar) {
    const sm = zmanim.alotHashachar.getHours() * 60 + zmanim.alotHashachar.getMinutes();
    zmLines.push({ x: toX(sm), color: '#6B8CFF', label: 'עלות' });
  }
  if (zmanim?.tzaitHakochavim) {
    const sm = zmanim.tzaitHakochavim.getHours() * 60 + zmanim.tzaitHakochavim.getMinutes();
    zmLines.push({ x: toX(sm), color: '#A78BFA', label: 'צאת' });
  }

  return (
    <div className="card-glass rounded-2xl p-4">
      <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">Elevation Timeline</p>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="overflow-visible">
        {/* Sky gradient background under curve */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A90D9" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#D4A843" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1a0533" stopOpacity="0.1" />
          </linearGradient>
          <clipPath id="aboveHorizon">
            <rect x={padL} y={padT} width={w} height={zeroY - padT} />
          </clipPath>
          <clipPath id="belowHorizon">
            <rect x={padL} y={zeroY} width={w} height={h - (zeroY - padT)} />
          </clipPath>
        </defs>

        {/* Zero line */}
        <line x1={padL} y1={zeroY} x2={padL + w} y2={zeroY} stroke="rgba(212,168,67,0.2)" strokeWidth="1" strokeDasharray="4,4" />

        {/* Zmanim vertical lines */}
        {zmLines.map((z, i) => (
          <g key={i}>
            <line x1={z.x} y1={padT} x2={z.x} y2={padT + h} stroke={z.color} strokeWidth="1" strokeOpacity="0.5" />
            <text x={z.x + 2} y={padT + 8} fill={z.color} fontSize="7" opacity="0.8">{z.label}</text>
          </g>
        ))}

        {/* Sun path — above horizon (gold) */}
        <path d={pathD} fill="none" stroke="#D4A843" strokeWidth="2" strokeOpacity="0.9" clipPath="url(#aboveHorizon)" />
        {/* Sun path — below horizon (muted) */}
        <path d={pathD} fill="none" stroke="#4A5568" strokeWidth="1.5" strokeOpacity="0.6" clipPath="url(#belowHorizon)" />

        {/* Fill under curve above horizon */}
        <path
          d={`${pathD} L ${toX(1440)} ${zeroY} L ${padL} ${zeroY} Z`}
          fill="url(#skyGrad)"
          clipPath="url(#aboveHorizon)"
        />

        {/* Now line */}
        <line x1={nowX} y1={padT} x2={nowX} y2={padT + h} stroke="#60A5FA" strokeWidth="1.5" strokeOpacity="0.8" />
        <circle cx={nowX} cy={toY(getSunPosition(now, lat, lng)?.elevation || 0)} r="3" fill="#60A5FA" />

        {/* Y axis labels */}
        {[-10, 0, 20, 45].map(deg => {
          const y = toY(deg);
          if (y < padT || y > padT + h) return null;
          return (
            <text key={deg} x={padL - 3} y={y + 3} textAnchor="end" fill="rgba(245,240,232,0.4)" fontSize="7">
              {deg}°
            </text>
          );
        })}

        {/* X axis hour labels */}
        {[6, 12, 18].map(hr => {
          const x = toX(hr * 60);
          return (
            <text key={hr} x={x} y={H - 4} textAnchor="middle" fill="rgba(245,240,232,0.4)" fontSize="7">
              {hr}:00
            </text>
          );
        })}
      </svg>
    </div>
  );
}
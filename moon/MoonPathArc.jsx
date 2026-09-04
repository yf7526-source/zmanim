import React from 'react';

export default function MoonPathArc({ moonPos, moonTimes, now, lang = 'both' }) {
  const showHe = lang === 'he' || lang === 'both';
  const showEn = lang === 'en' || lang === 'both';

  const W = 300, H = 120;
  const horizonY = 70;
  const arcHeight = 50;

  const isUp = moonPos?.altitude > 0;

  // Compute fraction of the visible arc traversed (rise → set)
  let fraction = null;
  if (moonTimes?.moonrise && moonTimes?.moonset) {
    const rise = moonTimes.moonrise.getTime();
    const set = moonTimes.moonset.getTime();
    if (set > rise) {
      const elapsed = now.getTime() - rise;
      fraction = elapsed / (set - rise);
    }
  }

  // If moon is up but no rise/set pair (e.g. up all day), place by altitude
  let x, arcY;
  if (fraction != null && fraction >= 0 && fraction <= 1) {
    x = 20 + fraction * (W - 40);
    arcY = horizonY - arcHeight * (1 - Math.pow(2 * fraction - 1, 2));
  } else if (isUp) {
    // Up but outside rise/set window — place by altitude
    const altFrac = Math.max(0, Math.min(1, moonPos.altitude / 90));
    x = W / 2;
    arcY = horizonY - arcHeight * altFrac;
  } else {
    // Below horizon — place along the lower arc
    x = W / 2;
    arcY = horizonY + 18;
  }

  // Upper arc (visible path)
  const arcPath = `M 20 ${horizonY} Q ${W / 2} ${horizonY - arcHeight * 2} ${W - 20} ${horizonY}`;
  // Lower arc (below horizon, dimmed)
  const lowerPath = `M 20 ${horizonY} Q ${W / 2} ${horizonY + arcHeight} ${W - 20} ${horizonY}`;

  return (
    <div className="rounded-2xl bg-white/4 border border-white/8 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-base">📐</span>
        <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">
          {showHe && <span dir="rtl">מסלול הירח</span>}
          {lang === 'both' && ' · '}
          {showEn && <span>Moon Path</span>}
        </h3>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 120 }}>
        <defs>
          <linearGradient id="moonArcGradUp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(125,211,252,0.3)" />
            <stop offset="100%" stopColor="rgba(125,211,252,0.03)" />
          </linearGradient>
          <linearGradient id="moonArcGradDown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(60,80,110,0.15)" />
            <stop offset="100%" stopColor="rgba(40,55,80,0.02)" />
          </linearGradient>
        </defs>

        {/* Horizon line */}
        <line x1="10" y1={horizonY} x2={W - 10} y2={horizonY} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
        <text x="10" y={horizonY - 4} fill="rgba(255,255,255,0.25)" fontSize="8">
          {showEn ? 'horizon' : 'אופק'}
        </text>

        {/* Upper arc — visible path */}
        <path d={`${arcPath} L ${W - 20} ${horizonY} L 20 ${horizonY} Z`} fill="url(#moonArcGradUp)" />
        <path d={arcPath} fill="none" stroke="rgba(125,211,252,0.45)" strokeWidth="1.5" />

        {/* Lower arc — below horizon, dimmed */}
        <path d={`${lowerPath} L ${W - 20} ${horizonY} L 20 ${horizonY} Z`} fill="url(#moonArcGradDown)" />
        <path d={lowerPath} fill="none" stroke="rgba(80,100,140,0.25)" strokeWidth="1" strokeDasharray="2 3" />

        {/* Moonrise / Moonset labels */}
        <text x="20" y={horizonY + 12} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="middle">rise</text>
        <text x={W - 20} y={horizonY + 12} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="middle">set</text>

        {/* Moon dot — brighter when up, dark when below horizon */}
        <circle
          cx={x}
          cy={arcY}
          r="6"
          fill={isUp ? '#e0e8ff' : '#2a3550'}
          opacity={isUp ? 1 : 0.35}
          style={{ filter: isUp ? 'drop-shadow(0 0 6px rgba(200,220,255,0.6))' : 'none' }}
        />
        <circle cx={x} cy={arcY} r="6" fill="none" stroke={isUp ? 'rgba(200,220,255,0.4)' : 'rgba(80,100,140,0.3)'} strokeWidth="1" />
      </svg>

      <div className={`text-center text-xs font-semibold ${isUp ? 'text-emerald-300' : 'text-white/40'}`}>
        {isUp
          ? (showEn && '✅ Moon above horizon')
          : (showEn && '🔴 Moon below horizon')}
        {lang === 'both' && ' · '}
        {isUp
          ? (showHe && <span dir="rtl">✅ הירח מעל האופק</span>)
          : (showHe && <span dir="rtl">🔴 הירח מתחת לאופק</span>)}
      </div>
    </div>
  );
}
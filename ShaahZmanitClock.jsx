import React from 'react';

// A 12-hour halachic clock face, laid out like a real analog clock.
//   • themed ring      → shows the length of one sha'ah zmanit today
//   • 1–12 numerals     → clock face
//   • hour stick       → current halachic hour (sweeps day & night)
//   • thin red stick   → current halachic second within the hour
// The duration (e.g. "1:18") is shown under the clock.

function fmtDuration(ms) {
  if (!ms || ms <= 0) return '--:--';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

// angle in degrees, 0 = top, clockwise
function point(cx, cy, len, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + len * Math.cos(rad), y: cy + len * Math.sin(rad) };
}

const RED = '#ef4444';

export default function ShaahZmanitClock({ label, labelHe, durationMs, currentHour, theme = 'gold', lang = 'both', size = 148 }) {
  const showHe = lang === 'he' || lang === 'both';
  const showEn = lang === 'en' || lang === 'both';

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;

  const colors = theme === 'sky'
    ? { stroke: '#7dd3fc', text: '#bae6fd', label: '#bae6fd', track: 'rgba(125,211,252,0.16)', fill: 'rgba(125,211,252,0.06)', hand: '#7dd3fc' }
    : { stroke: '#fbbf24', text: '#fde68a', label: '#fde68a', track: 'rgba(251,191,36,0.16)', fill: 'rgba(251,191,36,0.06)', hand: '#fbbf24' };

  const hasCurrent = currentHour != null && isFinite(currentHour);
  const hourAngle = hasCurrent ? ((currentHour % 12) / 12) * 360 : 0;
  const frac = hasCurrent ? currentHour - Math.floor(currentHour) : 0;
  const halachicSeconds = ((frac * 3600) % 60 + 60) % 60;
  const secondsAngle = (halachicSeconds / 60) * 360;

  // Themed progress ring (hour length vs 90-min reference)
  const circumference = 2 * Math.PI * r;
  const ratio = Math.max(0, Math.min(1, (durationMs || 0) / (90 * 60000)));
  const dash = circumference * ratio;

  const hourTip = point(cx, cy, r * 0.5, hourAngle);
  const secTip = point(cx, cy, r * 0.82, secondsAngle);
  const secTail = point(cx, cy, r * 0.16, secondsAngle + 180);

  const numerals = Array.from({ length: 12 }, (_, i) => {
    const num = i + 1;
    const p = point(cx, cy, r - 14, (num / 12) * 360);
    return { num, x: p.x, y: p.y };
  });

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} aria-hidden="true">
          <circle cx={cx} cy={cy} r={r} fill={colors.fill} stroke="none" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.track} strokeWidth="4" />
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={colors.stroke} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
          {numerals.map((n) => (
            <text key={n.num} x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
              fontSize={size * 0.085} fontWeight="700" fill={colors.label} style={{ fontFamily: 'ui-sans-serif, system-ui' }}>
              {n.num}
            </text>
          ))}
          {hasCurrent && (
            <>
              <line x1={cx} y1={cy} x2={hourTip.x} y2={hourTip.y} stroke={colors.hand} strokeWidth="4" strokeLinecap="round" />
              <line x1={secTail.x} y1={secTail.y} x2={secTip.x} y2={secTip.y} stroke={RED} strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}
          <circle cx={cx} cy={cy} r="3.5" fill={colors.hand} />
        </svg>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono font-bold tabular-nums leading-none" style={{ color: colors.text, fontSize: size * 0.15 }}>
          {fmtDuration(durationMs)}
        </span>
        <span className="text-[9px]" style={{ color: colors.label, opacity: 0.6 }}>
          {showHe && <span dir="rtl">דק׳</span>}{lang === 'both' && ' · '}{showEn && 'min'}
        </span>
      </div>
      <div className="text-sm font-bold" style={{ color: colors.label }}>
        {showHe && <span dir="rtl">{labelHe}</span>}{lang === 'both' && <span className="mx-1 opacity-30">·</span>}{showEn && <span>{label}</span>}
      </div>
    </div>
  );
}
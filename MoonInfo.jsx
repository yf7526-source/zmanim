import React, { useEffect, useRef } from 'react';
import { Moon } from 'lucide-react';
import { getMoonPhase } from '../lib/sunCalc';

export function MoonDisc({ phase, illumination, size = 80 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2, r = size * 0.4;
    ctx.clearRect(0, 0, size, size);

    const synodicMonth = 29.53058867;
    const phaseFraction = (((phase % synodicMonth) + synodicMonth) % synodicMonth) / synodicMonth;
    const illum = illumination / 100;

    // Dark base (unlit side)
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    // Moon surface gradient for lit portion (gold/yellow)
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(255,230,100,1)');
    grad.addColorStop(0.7, 'rgba(230,200,50,0.95)');
    grad.addColorStop(1, 'rgba(180,150,20,0.9)');

    if (illum <= 0.005) {
      // New moon — just outline
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(200,200,255,0.15)'; ctx.lineWidth = 0.5; ctx.stroke();
      return;
    }

    if (illum >= 0.995) {
      // Full moon
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(200,200,255,0.2)'; ctx.lineWidth = 0.5; ctx.stroke();
      return;
    }

    // Draw illuminated portion using accurate terminator ellipse
    // Waxing = first half of synodic month (light on right), Waning = second half (light on left)
    const waxing = phase < 14.76;
    const termX = Math.max(0.01, r * Math.abs(1 - 2 * illum));

    ctx.fillStyle = grad;
    ctx.beginPath();
    if (waxing) {
      ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false);
      if (illum < 0.5) {
        ctx.ellipse(cx, cy, termX, r, 0, Math.PI / 2, -Math.PI / 2, true);
      } else {
        ctx.ellipse(cx, cy, termX, r, 0, Math.PI / 2, -Math.PI / 2, false);
      }
    } else {
      ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, true);
      if (illum < 0.5) {
        ctx.ellipse(cx, cy, termX, r, 0, Math.PI / 2, -Math.PI / 2, false);
      } else {
        ctx.ellipse(cx, cy, termX, r, 0, Math.PI / 2, -Math.PI / 2, true);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Subtle outline
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200,200,255,0.15)'; ctx.lineWidth = 0.5; ctx.stroke();
  }, [phase, illumination, size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} className="rounded-full shrink-0" />;
}

export default function MoonInfo({ date, lang = 'both' }) {
  const moon = getMoonPhase(date);
  
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-500/15 to-blue-500/10 border border-blue-400/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-400/25 flex items-center justify-center">
            <Moon className="w-4 h-4 text-blue-300" />
          </div>
          <div>
            <div className="text-xs text-blue-300/80 font-semibold uppercase tracking-wider">
              {lang === 'he' ? 'שלב הירח' : 'Moon Phase'}
            </div>
            <div className="text-sm font-bold text-white/90">
              {lang === 'he' ? moon.phaseName.he : lang === 'en' ? moon.phaseName.en : `${moon.phaseName.he} · ${moon.phaseName.en}`}
            </div>
          </div>
        </div>
        <MoonDisc phase={moon.phase} illumination={moon.illumination} size={56} />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/5 border border-white/8 px-3 py-2">
          <div className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">
            {lang === 'he' ? 'הארה' : 'Illumination'}
          </div>
          <div className="text-lg font-mono font-bold text-blue-200">{moon.illumination}%</div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/8 px-3 py-2">
          <div className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">
            {lang === 'he' ? 'גיל הירח' : 'Moon Age'}
          </div>
          <div className="text-lg font-mono font-bold text-blue-200">{moon.age} <span className="text-xs text-white/40">days</span></div>
        </div>
      </div>
    </div>
  );
}
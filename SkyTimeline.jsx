import React, { useRef, useEffect } from 'react';
import { getSunPosition } from '../lib/sunCalc';

function getSkyColorForElev(e) {
  const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mix(c1, c2, t) {
    const [r1, g1, b1] = hexToRgb(c1);
    const [r2, g2, b2] = hexToRgb(c2);
    return `rgb(${Math.round(lerp(r1,r2,t))},${Math.round(lerp(g1,g2,t))},${Math.round(lerp(b1,b2,t))})`;
  }

  if (e <= -18) return '#010306';
  if (e <= -12) return mix('#010306', '#1B0A4F', (e + 18) / 6);
  if (e <= -6) return mix('#1B0A4F', '#3B2D8C', (e + 12) / 6);
  if (e <= -0.833) return mix('#3B2D8C', '#E8936A', (e + 6) / 5.167);
  if (e <= 3) return mix('#FF8C35', '#FFB347', (e + 0.833) / 3.833);
  if (e <= 8) return mix('#FFB347', '#87CEEB', (e - 3) / 5);
  if (e <= 20) return mix('#87CEEB', '#4A90D9', (e - 8) / 12);
  return '#4A90D9';
}

export default function SkyTimeline({ date, lat, lng, currentTime, sunTimes }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !date || !lat || !lng) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth * dpr;
    const H = 64 * dpr;
    canvas.width = W;
    canvas.height = H;
    ctx.scale(dpr, dpr);
    const w = canvas.offsetWidth;
    const h = 64;

    // Draw sky gradient timeline (24 hours)
    const steps = w;
    for (let i = 0; i < steps; i++) {
      const fraction = i / steps;
      const dayMs = fraction * 24 * 3600 * 1000;
      const midnight = new Date(date);
      midnight.setHours(0, 0, 0, 0);
      const t = new Date(midnight.getTime() + dayMs);
      const pos = getSunPosition(t, lat, lng);
      const color = getSkyColorForElev(pos.altitude);
      ctx.fillStyle = color;
      ctx.fillRect(i, 0, 1, h);
    }

    // Time grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let hr = 0; hr <= 24; hr += 6) {
      const x = (hr / 24) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Hour labels
    ctx.font = `10px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    for (const hr of [0, 6, 12, 18]) {
      const x = (hr / 24) * w;
      ctx.fillText(`${hr}:00`, x, h - 4);
    }

    // Sunrise/sunset markers
    const drawTimeMarker = (t, color, label) => {
      if (!t) return;
      const midnight = new Date(date);
      midnight.setHours(0, 0, 0, 0);
      const fraction = (t - midnight) / (24 * 3600 * 1000);
      const x = fraction * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h - 16);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, 10);
    };

    if (sunTimes) {
      drawTimeMarker(sunTimes.sunrise, '#FFD040', 'נץ');
      drawTimeMarker(sunTimes.sunset, '#FF8040', 'שקיעה');
      drawTimeMarker(sunTimes.astronomicalDawn, 'rgba(200,160,255,0.8)', 'עלות');
      drawTimeMarker(sunTimes.astronomicalDusk, 'rgba(160,120,220,0.8)', 'צאת');
    }

    // Current time marker
    if (currentTime) {
      const midnight = new Date(date);
      midnight.setHours(0, 0, 0, 0);
      const fraction = (currentTime - midnight) / (24 * 3600 * 1000);
      if (fraction >= 0 && fraction <= 1) {
        const x = fraction * w;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Triangle marker at top
        ctx.beginPath();
        ctx.moveTo(x - 5, 0);
        ctx.lineTo(x + 5, 0);
        ctx.lineTo(x, 7);
        ctx.closePath();
        ctx.fillStyle = 'white';
        ctx.fill();
      }
    }

  }, [date, lat, lng, currentTime, sunTimes]);

  return (
    <div className="w-full rounded-xl overflow-hidden border border-border/30" style={{ height: 64 }}>
      <canvas ref={canvasRef} className="w-full" style={{ height: 64, display: 'block' }} />
    </div>
  );
}
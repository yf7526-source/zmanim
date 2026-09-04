import React, { useEffect, useRef } from 'react';
import { getSkyColor } from '@/lib/sunCalc';

/**
 * CompassDial — the hero element
 * Shows sun azimuth needle, sky color arcs for East and West horizons,
 * and elevation arc.
 */
export default function CompassDial({ azimuth, sunAzimuth, elevation, sunAltitude, eastElevation, eastElev, westElevation, westElev, size = 300 }) {
  // Accept both old and new prop names
  azimuth = azimuth ?? sunAzimuth ?? 90;
  elevation = elevation ?? sunAltitude ?? 0;
  eastElevation = eastElevation ?? eastElev ?? 0;
  westElevation = westElevation ?? westElev ?? 0;
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size <= 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    draw(ctx, size);
  }, [azimuth, elevation, eastElevation, westElevation, size]);

  function draw(ctx, s) {
    if (s < 10) return;
    ctx.clearRect(0, 0, s, s);
    const cx = s / 2, cy = s / 2;
    const outerR = s * 0.46;
    const innerR = s * 0.36;
    const arcWidth = outerR - innerR; // always positive since 0.46 > 0.36

    // === Background dark circle ===
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0, outerR + 4), 0, Math.PI * 2);
    ctx.fillStyle = '#0D1B2A';
    ctx.fill();

    // === Draw sky color arcs ===
    // East arc: right side (azimuth ~90°), top-right to bottom-right
    // West arc: left side (azimuth ~270°)
    drawSkyArc(ctx, cx, cy, innerR, arcWidth, eastElevation, 'east');
    drawSkyArc(ctx, cx, cy, innerR, arcWidth, westElevation, 'west');

    // === Compass ring ===
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212,168,67,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212,168,67,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // === Compass cardinal labels ===
    const cardinals = [
      { label: 'N', angle: -90, heb: 'צ' },
      { label: 'E', angle: 0, heb: 'מ' },
      { label: 'S', angle: 90, heb: 'ד' },
      { label: 'W', angle: 180, heb: 'מ' },
    ];

    cardinals.forEach(({ label, angle, heb }) => {
      const rad = (angle * Math.PI) / 180;
      const lx = cx + (outerR + 14) * Math.cos(rad);
      const ly = cy + (outerR + 14) * Math.sin(rad);
      ctx.font = `bold ${s * 0.05}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = label === 'E' || label === 'W' ? '#D4A843' : 'rgba(245,240,232,0.7)';
      ctx.fillText(label, lx, ly);
    });

    // === Tick marks ===
    for (let deg = 0; deg < 360; deg += 10) {
      const rad = ((deg - 90) * Math.PI) / 180;
      const isMajor = deg % 90 === 0;
      const r1 = isMajor ? innerR - 4 : innerR;
      const r2 = outerR + (isMajor ? 4 : 0);
      ctx.beginPath();
      ctx.moveTo(cx + r1 * Math.cos(rad), cy + r1 * Math.sin(rad));
      ctx.lineTo(cx + (innerR + (isMajor ? 6 : 3)) * Math.cos(rad), cy + (innerR + (isMajor ? 6 : 3)) * Math.sin(rad));
      ctx.strokeStyle = isMajor ? 'rgba(212,168,67,0.5)' : 'rgba(212,168,67,0.2)';
      ctx.lineWidth = isMajor ? 1.5 : 0.8;
      ctx.stroke();
    }

    // === Horizon line (E-W) ===
    ctx.beginPath();
    ctx.moveTo(cx - outerR - 8, cy);
    ctx.lineTo(cx + outerR + 8, cy);
    ctx.strokeStyle = 'rgba(212,168,67,0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // === Sun needle / azimuth indicator ===
    drawSunNeedle(ctx, cx, cy, innerR, outerR, azimuth, elevation, s);

    // === Center hub ===
    const hubGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, s * 0.06));
    hubGrad.addColorStop(0, '#FFD23F');
    hubGrad.addColorStop(0.5, '#D4A843');
    hubGrad.addColorStop(1, '#8B6914');
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0, s * 0.04), 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0, s * 0.04), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,210,63,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawSkyArc(ctx, cx, cy, innerR, arcWidth, elev, side) {
    // East: angles from -60° to +60° on the right (azimuth 90° ± 90°)
    // West: angles from -60° to +60° on the left (azimuth 270° ± 90°)
    const baseAngle = side === 'east' ? 0 : Math.PI; // 0=right, π=left

    const startAngle = baseAngle - (Math.PI / 2.2);
    const endAngle = baseAngle + (Math.PI / 2.2);

    // Build gradient along the arc using multiple segments
    const steps = 60;
    const baseColor = getSkyColor(elev);
    const aboveColor = getSkyColor(elev + 10);
    const belowColor = getSkyColor(elev - 10);

    // Sweep from start to end
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const angleStart = startAngle + t * (endAngle - startAngle);
      const angleEnd = startAngle + (t + 1 / steps) * (endAngle - startAngle);

      // Near horizon (t ~ 0.5 for east/west centers) → base color
      // Edges → darker/night
      const dist = Math.abs(t - 0.5) * 2; // 0 at center, 1 at edges
      const r1 = Math.max(0, innerR);
      const r2 = Math.max(0, innerR + arcWidth);

      ctx.beginPath();
      ctx.arc(cx, cy, r2, angleStart, angleEnd);
      ctx.arc(cx, cy, r1, angleEnd, angleStart, true);
      ctx.closePath();

      // Mix base color toward edges with night color
      const nightColor = [5, 5, 20];
      const baseRGB = parseRGB(baseColor);

      const mixR = Math.round(baseRGB[0] * (1 - dist * 0.7) + nightColor[0] * dist * 0.7);
      const mixG = Math.round(baseRGB[1] * (1 - dist * 0.7) + nightColor[1] * dist * 0.7);
      const mixB = Math.round(baseRGB[2] * (1 - dist * 0.7) + nightColor[2] * dist * 0.7);

      const alpha = 0.85 - dist * 0.2;
      ctx.fillStyle = `rgba(${mixR},${mixG},${mixB},${alpha})`;
      ctx.fill();
    }

    // Radial glow at the center of the arc (horizon point)
    const glowX = cx + (innerR + arcWidth / 2) * Math.cos(baseAngle);
    const glowY = cy + (innerR + arcWidth / 2) * Math.sin(baseAngle);
    const glowR = Math.max(0, arcWidth * 1.2);
    const glowGrad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowR);
    const glowColor = parseRGB(baseColor);
    glowGrad.addColorStop(0, `rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},0.5)`);
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(glowX, glowY, Math.max(0, glowR), 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();
  }

  function parseRGB(rgbStr) {
    const m = rgbStr.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return [0, 0, 0];
    return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
  }

  function drawSunNeedle(ctx, cx, cy, innerR, outerR, az, elev, s) {
    // Convert azimuth to canvas angle (0=N → -90° in canvas coords)
    const rad = ((az - 90) * Math.PI) / 180;

    // Sun disc position — on the arc if above horizon, inside if below
    const sunR = Math.max(5, elev > 0 ? outerR - 5 : innerR + 10);
    const sx = cx + sunR * Math.cos(rad);
    const sy = cy + sunR * Math.sin(rad);

    // Needle line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(sx, sy);
    ctx.strokeStyle = 'rgba(212,168,67,0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sun glow outer bloom
    const bloomR = Math.max(1, s * 0.055);
    const bloom = ctx.createRadialGradient(sx, sy, 0, sx, sy, bloomR);
    bloom.addColorStop(0, 'rgba(255,200,80,0.35)');
    bloom.addColorStop(0.5, 'rgba(255,140,40,0.15)');
    bloom.addColorStop(1, 'rgba(255,100,20,0)');
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(0, bloomR), 0, Math.PI * 2);
    ctx.fillStyle = bloom;
    ctx.fill();

    // Sun disc
    const discR = Math.max(1, s * 0.035);
    const sunGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, discR);
    if (elev > 0) {
      sunGrad.addColorStop(0, '#FFFDE0');
      sunGrad.addColorStop(0.4, '#FFD23F');
      sunGrad.addColorStop(1, '#D4A843');
    } else {
      sunGrad.addColorStop(0, '#E8936A');
      sunGrad.addColorStop(0.4, '#C85A1A');
      sunGrad.addColorStop(1, '#6B2D0A');
    }
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(0, discR), 0, Math.PI * 2);
    ctx.fillStyle = sunGrad;
    ctx.fill();

    // Sun disc ring
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(0, discR), 0, Math.PI * 2);
    ctx.strokeStyle = elev > 0 ? 'rgba(255,210,63,0.8)' : 'rgba(255,120,60,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Elevation label near sun
    ctx.font = `bold ${s * 0.038}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = elev > 0 ? '#FFD23F' : '#E8936A';
    const labelDist = s * 0.07;
    const lx = sx + labelDist * Math.cos(rad + Math.PI / 6);
    const ly = sy + labelDist * Math.sin(rad + Math.PI / 6);
    ctx.fillText(`${elev >= 0 ? '+' : ''}${elev.toFixed(1)}°`, lx, ly);
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="rounded-full"
    />
  );
}
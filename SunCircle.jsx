import React, { useEffect, useRef, useState } from 'react';

const SCENE_IMAGES = {
  stone: {
    day: 'https://media.base44.com/images/public/6a32ebc6dbc38e0f72b0cf59/c9530a46b_generated_image.png',
    night: 'https://media.base44.com/images/public/6a32ebc6dbc38e0f72b0cf59/38aaf7dbb_generated_image.png',
  },
  oldcity: {
    day: 'https://media.base44.com/images/public/6a32ebc6dbc38e0f72b0cf59/15de9ad46_generated_image.png',
    night: 'https://media.base44.com/images/public/6a32ebc6dbc38e0f72b0cf59/3e23b482e_generated_image.png',
  },
  tundra: {
    day: 'https://media.base44.com/images/public/6a32ebc6dbc38e0f72b0cf59/85962a8cb_generated_image.png',
    night: 'https://media.base44.com/images/public/6a32ebc6dbc38e0f72b0cf59/d5d99227f_generated_image.png',
  },
  desert: {
    day: 'https://media.base44.com/images/public/6a32ebc6dbc38e0f72b0cf59/51cd0fa3b_generated_image.png',
    night: 'https://media.base44.com/images/public/6a32ebc6dbc38e0f72b0cf59/52fa26492_generated_image.png',
  },
};

/**
 * SunCircle — dynamic landscape interior with orbiting sun/moon and zmanim ring.
 * Sun orbits on the thin border ring (gold day / blue night).
 * Tiny Hebrew zman labels hug the ring edge. Fine tick marks along inner rim.
 */
export default function SunCircle({ azimuth = 90, elevation = 0, sunTimes, currentTime, moonTimes, moonPhase, moonPos, size = 320, sceneStyle = 'mediterranean', showZmanimRing = true }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dayImgRef = useRef(null);
  const nightImgRef = useRef(null);
  const [imgLoadKey, setImgLoadKey] = useState(0);
  const [measuredSize, setMeasuredSize] = useState(size);

  // Measure the container so the circle reflows on rotation / resize instead
  // of reading window.innerWidth once during render.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setMeasuredSize(Math.max(220, Math.min(420, w)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const effectiveSize = measuredSize || size;

  useEffect(() => {
    const scene = SCENE_IMAGES[sceneStyle] || SCENE_IMAGES.stone;
    let loaded = 0;
    const onLoad = () => { loaded++; if (loaded >= 2) setImgLoadKey(k => k + 1); };
    const dayImg = new Image();
    dayImg.onload = onLoad;
    dayImg.src = scene.day;
    dayImgRef.current = dayImg;
    const nightImg = new Image();
    nightImg.onload = onLoad;
    nightImg.src = scene.night;
    nightImgRef.current = nightImg;
  }, [sceneStyle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || effectiveSize <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = effectiveSize * dpr;
    canvas.height = effectiveSize * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    draw(ctx, effectiveSize);
  }, [azimuth, elevation, sunTimes, currentTime, moonTimes, moonPhase, moonPos, effectiveSize, sceneStyle, showZmanimRing, imgLoadKey]);

  function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
  function lerpColor(c1, c2, t) {
    const cl = Math.max(0, Math.min(1, t));
    return [lerp(c1[0],c2[0],cl), lerp(c1[1],c2[1],cl), lerp(c1[2],c2[2],cl)];
  }
  function rgbStr(c) { return `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`; }

  function timeMs(d) {
    const t = d ? d.getTime() : (currentTime ? currentTime.getTime() : Date.now());
    return t;
  }

  function timeToOrbitAngle(t, riseMs, setMs) {
    if (riseMs !== null && setMs !== null && setMs > riseMs) {
      if (t >= riseMs && t <= setMs) {
        const p = (t - riseMs) / (setMs - riseMs);
        return (180 + p * 180) * Math.PI / 180;
      }
      const nightLen = (24 * 3600 * 1000) - (setMs - riseMs);
      let nt;
      if (t > setMs) nt = t - setMs;
      else nt = (24 * 3600 * 1000) + (t - setMs); // before sunrise → night from yesterday's sunset
      const p = nt / nightLen;
      return (p * 180) * Math.PI / 180;
    }
    const frac = ((t / 86400000) % 1 + 1) % 1;
    return -Math.PI / 2 + (frac - 0.5) * 2 * Math.PI;
  }

  function skyColorAt(elev, dist) {
    // Smooth interpolation across elevation thresholds (ascending sort)
    // Returns [r, g, b] at a given vertical distance (0=horizon, 1=zenith)
    const STOPS = [
      { e: -90, h: [4,5,15],       m: [3,3,10],       z: [2,2,6] },
      { e: -18, h: [6,8,22],       m: [4,5,16],       z: [3,3,10] },
      { e: -12, h: [12,15,38],     m: [7,9,25],       z: [4,5,16] },
      { e: -8,  h: [30,28,65],     m: [18,18,48],     z: [8,10,28] },
      { e: -6,  h: [55,42,88],     m: [35,28,68],     z: [12,15,42] },
      { e: -4,  h: [120,65,90],    m: [70,45,88],     z: [18,25,60] },
      { e: -2,  h: [200,95,65],    m: [120,60,95],    z: [25,40,80] },
      { e: -0.5,h: [245,130,55],   m: [160,80,105],   z: [35,55,110] },
      { e: 0.5, h: [255,170,90],   m: [190,120,140],  z: [45,75,140] },
      { e: 2,   h: [250,195,130],  m: [150,155,185],  z: [40,85,160] },
      { e: 4,   h: [245,215,175],  m: [130,165,200],  z: [35,85,165] },
      { e: 6,   h: [220,215,200],  m: [110,160,205],  z: [30,80,170] },
      { e: 10,  h: [185,205,228],  m: [100,150,205],  z: [28,72,165] },
      { e: 15,  h: [150,190,222],  m: [85,135,200],   z: [25,65,158] },
      { e: 25,  h: [115,170,218],  m: [65,120,195],   z: [20,55,150] },
      { e: 40,  h: [85,150,210],   m: [55,105,185],   z: [16,48,140] },
      { e: 60,  h: [72,138,205],   m: [50,100,180],   z: [14,42,130] },
      { e: 90,  h: [60,125,198],   m: [45,95,172],    z: [12,38,122] },
    ];
    // Find the two stops that bracket the current elevation
    let below = STOPS[0], above = STOPS[STOPS.length - 1];
    for (let i = 0; i < STOPS.length - 1; i++) {
      if (elev >= STOPS[i].e && elev <= STOPS[i + 1].e) {
        below = STOPS[i];
        above = STOPS[i + 1];
        break;
      }
    }
    if (elev < STOPS[0].e) { below = above = STOPS[0]; }
    if (elev > STOPS[STOPS.length - 1].e) { below = above = STOPS[STOPS.length - 1]; }

    let h, m, z;
    if (below.e === above.e) {
      h = below.h; m = below.m; z = below.z;
    } else {
      const tt = (elev - below.e) / (above.e - below.e);
      h = lerpColor(below.h, above.h, tt);
      m = lerpColor(below.m, above.m, tt);
      z = lerpColor(below.z, above.z, tt);
    }
    const d = Math.min(1, Math.max(0, dist));
    return d < 0.4
      ? lerpColor(h, m, d / 0.4)
      : lerpColor(m, z, (d - 0.4) / 0.6);
  }

  function draw(ctx, s) {
    if (s < 40) return;
    const cx = s / 2, cy = s / 2;
    const R  = s * 0.38;
    const orbitR = R * 0.96;

    const RISE_ANGLE = Math.PI;
    const SET_ANGLE  = 0;

    const riseMs = sunTimes?.netz   ? sunTimes.netz.getTime()   : null;
    const setMs  = sunTimes?.shkiah ? sunTimes.shkiah.getTime() : null;
    const tMs    = timeMs(currentTime);

    const sunAngle = timeToOrbitAngle(tMs, riseMs, setMs);
    const sx = cx + orbitR * Math.cos(sunAngle);
    const sy = cy + orbitR * Math.sin(sunAngle);

    let hasDayArc = riseMs !== null && setMs !== null && setMs > riseMs;

    // Background
    const bgGrad = ctx.createRadialGradient(cx, cy * 0.6, 0, cx, cy, s * 0.7);
    bgGrad.addColorStop(0, '#0a0e1a');
    bgGrad.addColorStop(0.5, '#060912');
    bgGrad.addColorStop(1, '#020408');
    ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, Math.PI * 2);
    ctx.fillStyle = bgGrad; ctx.fill();

    // Painterly sky + landscape clipped inside circle
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.98, 0, Math.PI * 2); ctx.clip();
    if (dayImgRef.current && nightImgRef.current) {
      // Smooth crossfade: starts at golden hour (elev ~4°), completes at astronomical twilight (elev ~-12°)
      // Uses ease-in-out S-curve for natural transition as the sun moves
      const cfRaw = elevation > 4 ? 0 : elevation < -12 ? 1 : (4 - elevation) / 16;
      const nightFactor = cfRaw * cfRaw * (3 - 2 * cfRaw); // smoothstep

      // Position image so the horizon (~58% from top) aligns with circle center (cy).
      // Ground fills the bottom half of the circle; sky fills the top half — aligned with sunset point.
      const HORIZON_RATIO = 0.58;
      const imgH = R / (1 - HORIZON_RATIO);
      const imgW = imgH;
      const imgX = cx - imgW / 2;
      const imgY = cy + R - imgH;

      // Draw day scene image — large sky area gets tinted by sky overlay
      ctx.drawImage(dayImgRef.current, imgX, imgY, imgW, imgH);
      // Dynamic sky tint colors the big sky portion per sun elevation
      drawDynamicSkyOverlay(ctx, cx, cy, R, elevation, sx, sy);

      // Crossfade to full night scene image (has stars, warm window glows, moonlight)
      if (nightFactor > 0.01) {
        ctx.globalAlpha = nightFactor;
        ctx.drawImage(nightImgRef.current, imgX, imgY, imgW, imgH);
        ctx.globalAlpha = 1;
      }

      // Unified night depth — gradual from sunset to ~100% darkness at midnight
      // Applied equally to sky, ground, and houses so darkness matches realistically
      const nightDepth = elevation > 0 ? 0
        : elevation > -6 ? ((-elevation) / 6) * 0.40
        : elevation > -18 ? 0.40 + ((-elevation - 6) / 12) * 0.40
        : 0.80 + Math.min(0.17, ((-elevation - 18) / 72) * 0.17);
      if (nightDepth > 0.01) {
        ctx.fillStyle = `rgba(0, 1, 4, ${nightDepth})`;
        ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      }

      // 5-6 stars — drawn after darkening so they stay bright in the night sky
      if (nightFactor > 0.3) {
        const sa = Math.min(1, (nightFactor - 0.3) / 0.4);
        const stars = [[-0.55,-0.6],[-0.2,-0.8],[0.15,-0.55],[0.45,-0.75],[0.65,-0.5],[-0.4,-0.4]];
        for (const [dx, dy] of stars) {
          ctx.beginPath();
          ctx.arc(cx + dx * R, cy + dy * R, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(230, 235, 255, ${sa})`;
          ctx.fill();
        }
      }
    } else {
      drawSkyHalf(ctx, cx, cy, R, elevation, sx, sy);
    }
    ctx.restore();

    // Border ring: thin gold (day) / blue (night)
    if (hasDayArc) {
      ctx.beginPath();
      ctx.arc(cx, cy, orbitR, RISE_ANGLE, SET_ANGLE + Math.PI * 2, false);
      ctx.strokeStyle = 'rgba(212,168,67,0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, orbitR, SET_ANGLE, RISE_ANGLE, false);
      ctx.strokeStyle = 'rgba(92,126,168,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,200,80,0.25)'; ctx.lineWidth = 2; ctx.stroke();
    }

    // Fine tick marks along inner rim
    drawTickMarks(ctx, cx, cy, orbitR, s);

    // All halachic zmanim — tick marks + labels on ring
    if (showZmanimRing) drawZmanimOnRing(ctx, cx, cy, orbitR, s, sunTimes, riseMs, setMs, tMs);

    // Sunrise/Sunset dot markers on ring
    ctx.beginPath(); ctx.arc(cx + orbitR * Math.cos(RISE_ANGLE), cy + orbitR * Math.sin(RISE_ANGLE), 3, 0, Math.PI * 2);
    ctx.fillStyle = '#f5a623'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx + orbitR * Math.cos(SET_ANGLE), cy + orbitR * Math.sin(SET_ANGLE), 3, 0, Math.PI * 2);
    ctx.fillStyle = '#c96b3a'; ctx.fill();

    // Sun ball on border
    drawSunBall(ctx, sx, sy, elevation, s);

    // Moon on border
    drawMoon(ctx, s, cx, cy, orbitR, tMs);

    // Outer thin ring border
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,200,100,0.15)'; ctx.lineWidth = 1; ctx.stroke();
  }

  function drawSkyHalf(ctx, cx, cy, R, elev, sx, sy) {
    // Multi-stop vertical gradient for smooth, realistic sky
    const stops = [
      { d: 0.0, c: skyColorAt(elev, 0.95) }, // zenith (top)
      { d: 0.25, c: skyColorAt(elev, 0.7) },
      { d: 0.5, c: skyColorAt(elev, 0.45) },
      { d: 0.72, c: skyColorAt(elev, 0.2) }, // near horizon
      { d: 0.85, c: skyColorAt(elev, 0.05) }, // horizon band
      { d: 1.0, c: skyColorAt(elev, 0.0) },  // ground horizon
    ];
    const grad = ctx.createLinearGradient(cx, cy - R, cx, cy + R * 0.35);
    for (const s of stops) {
      grad.addColorStop(s.d, rgbStr(s.c));
    }
    ctx.fillStyle = grad;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    // Atmospheric sun glow — radial gradient centered on sun position
    if (elev > -10 && elev < 30 && sx != null && sy != null) {
      const glowRadius = R * (elev > 8 ? 0.55 : elev > 2 ? 0.7 : elev > -2 ? 0.85 : 0.95);
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(1, glowRadius));
      if (elev > 8) {
        glow.addColorStop(0, 'rgba(255,240,190,0.15)');
        glow.addColorStop(0.3, 'rgba(255,220,140,0.07)');
        glow.addColorStop(1, 'rgba(255,200,100,0)');
      } else if (elev > 2) {
        glow.addColorStop(0, 'rgba(255,210,130,0.22)');
        glow.addColorStop(0.3, 'rgba(255,190,100,0.1)');
        glow.addColorStop(1, 'rgba(255,170,70,0)');
      } else if (elev > -1) {
        glow.addColorStop(0, 'rgba(255,170,80,0.3)');
        glow.addColorStop(0.25, 'rgba(255,140,60,0.16)');
        glow.addColorStop(0.6, 'rgba(230,100,50,0.05)');
        glow.addColorStop(1, 'rgba(200,70,40,0)');
      } else if (elev > -5) {
        glow.addColorStop(0, 'rgba(220,110,70,0.2)');
        glow.addColorStop(0.3, 'rgba(180,80,70,0.08)');
        glow.addColorStop(1, 'rgba(120,50,60,0)');
      } else {
        glow.addColorStop(0, 'rgba(120,90,180,0.08)');
        glow.addColorStop(1, 'rgba(50,50,130,0)');
      }
      ctx.fillStyle = glow;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    }
  }

  function drawDynamicSkyOverlay(ctx, cx, cy, R, elev, sx, sy) {
    const topY = cy - R;
    const fullSize = R * 2;

    // Ground ambient — how the landscape is lit at this sun elevation.
    // White = no multiply effect (natural); dark = night darkening.
    function groundAmbient(e) {
      if (e > 25) return [255, 255, 255];
      if (e > 10) return [255, 253, 248];
      if (e > 5)  return [255, 248, 228];
      if (e > 2)  return [255, 240, 205];
      if (e > 0)  return [255, 225, 175];
      if (e > -1) return [245, 200, 150];
      if (e > -2) return [220, 170, 130];
      if (e > -3) return [185, 140, 115];
      if (e > -4) return [150, 110, 100];
      if (e > -5) return [105, 80, 78];
      if (e > -6) return [70, 58, 68];
      if (e > -8) return [45, 38, 55];
      if (e > -12) return [16, 14, 32];
      if (e > -18) return [6, 6, 16];
      return [1, 1, 5];
    }

    // Sky colors at different altitudes (zenith → horizon)
    const zenC = skyColorAt(elev, 0.9);
    const midC = skyColorAt(elev, 0.45);
    const horC = skyColorAt(elev, 0.05);
    const grdC = groundAmbient(elev);

    // Minimal lightening — only enough to preserve image texture in daylight.
    // At night the ground must actually darken to look real.
    const lightAmt = elev > 5 ? 0.12 : elev > 0 ? 0.08 : elev > -4 ? 0.04 : 0.01;
    const lighten = (c) => [
      Math.round(c[0] + (255 - c[0]) * lightAmt),
      Math.round(c[1] + (255 - c[1]) * lightAmt),
      Math.round(c[2] + (255 - c[2]) * lightAmt),
    ];

    // One continuous vertical gradient: sky (zenith→horizon) → ground ambient.
    // Multiply blend shifts the entire scene's color by time of day while
    // preserving the image's clouds, textures & detail. No hard cutoff.
    const grad = ctx.createLinearGradient(cx, topY, cx, topY + fullSize);
    grad.addColorStop(0.00, rgbStr(lighten(zenC)));
    grad.addColorStop(0.15, rgbStr(lighten(zenC)));
    grad.addColorStop(0.30, rgbStr(lighten(midC)));
    grad.addColorStop(0.45, rgbStr(lighten(horC)));
    grad.addColorStop(0.50, rgbStr(lighten(horC)));
    grad.addColorStop(0.55, rgbStr(grdC));
    grad.addColorStop(1.00, rgbStr(grdC));

    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = grad;
    ctx.fillRect(cx - R, topY, fullSize, fullSize);
    ctx.globalCompositeOperation = 'source-over';

    // Atmospheric sun glow — additive (lighter) blend; stops before night so sky stays clean & dark
    if (elev > -4 && elev < 30 && sx != null && sy != null) {
      const glowRadius = R * (elev > 8 ? 0.55 : elev > 2 ? 0.7 : elev > -2 ? 0.85 : 0.95);
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(1, glowRadius));
      if (elev > 8) {
        glow.addColorStop(0, 'rgba(255,240,190,0.20)');
        glow.addColorStop(0.3, 'rgba(255,220,140,0.10)');
        glow.addColorStop(1, 'rgba(255,200,100,0)');
      } else if (elev > 2) {
        glow.addColorStop(0, 'rgba(255,210,130,0.30)');
        glow.addColorStop(0.3, 'rgba(255,190,100,0.15)');
        glow.addColorStop(1, 'rgba(255,170,70,0)');
      } else if (elev > -1) {
        glow.addColorStop(0, 'rgba(255,170,80,0.40)');
        glow.addColorStop(0.25, 'rgba(255,140,60,0.22)');
        glow.addColorStop(0.6, 'rgba(230,100,50,0.08)');
        glow.addColorStop(1, 'rgba(200,70,40,0)');
      } else if (elev > -5) {
        glow.addColorStop(0, 'rgba(220,110,70,0.25)');
        glow.addColorStop(0.3, 'rgba(180,80,70,0.12)');
        glow.addColorStop(1, 'rgba(120,50,60,0)');
      } else {
        glow.addColorStop(0, 'rgba(120,90,180,0.12)');
        glow.addColorStop(1, 'rgba(50,50,130,0)');
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = glow;
      ctx.fillRect(cx - R, topY, fullSize, fullSize);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Night lights are now handled by the AI-generated night scene image (crossfaded in draw)
  }



  function drawTickMarks(ctx, cx, cy, orbitR, s) {
    for (let i = 0; i < 72; i++) {
      const ang = (i / 72) * Math.PI * 2;
      const isMajor = i % 6 === 0;
      const inner = orbitR - (isMajor ? 5 : 2.5);
      const outer = orbitR - 1;
      ctx.beginPath();
      ctx.moveTo(cx + inner * Math.cos(ang), cy + inner * Math.sin(ang));
      ctx.lineTo(cx + outer * Math.cos(ang), cy + outer * Math.sin(ang));
      ctx.strokeStyle = isMajor ? 'rgba(212,168,67,0.4)' : 'rgba(255,255,255,0.08)';
      ctx.lineWidth = isMajor ? 0.8 : 0.4;
      ctx.stroke();
    }
  }

  function drawZmanimOnRing(ctx, cx, cy, orbitR, s, sunTimes, riseMs, setMs, tMs) {
    // All halachic zmanim — no candle lighting, no bein hashmashos
    // Ordered starting from chatzot (noon/top) going clockwise to match the sun's orbit
    const ZMANIM = [
      { key: 'chatzot',        label: 'חצות',     color: '#D4A843' },
      { key: 'minchaGedola',   label: 'מ"ג',      color: '#6BA4D8' },
      { key: 'minchaKetana',   label: 'מ"ק',      color: '#D4A843' },
      { key: 'plagHaMincha',   label: 'פלג',      color: '#6BA4D8' },
      { key: 'shkiah',         label: 'שקיעה',    color: '#D4A843' },
      { key: 'tzait',          label: 'צאת',      color: '#6BA4D8' },
      { key: 'chatzotNight',   label: 'חצות ל',   color: '#D4A843' },
      { key: 'alot',           label: 'עלות',     color: '#6BA4D8' },
      { key: 'misheyakir',     label: 'משיכיר',   color: '#D4A843' },
      { key: 'netz',           label: 'נץ',       color: '#6BA4D8' },
      { key: 'shema',          label: 'ק"ש',      color: '#D4A843' },
      { key: 'tefilla',        label: 'תפילה',    color: '#6BA4D8' },
    ];

    const fontSize = Math.max(8, s * 0.026);
    ctx.font = `600 ${fontSize}px Heebo, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Each zman placed at its actual angular position; labels nudged apart to avoid overlap
    const placed = [];
    for (const zman of ZMANIM) {
      const time = sunTimes?.[zman.key];
      if (!time || isNaN(time?.getTime())) continue;
      const zMs = time.getTime();
      const ang = timeToOrbitAngle(zMs, riseMs, setMs);
      placed.push({ ...zman, ang, labelAng: ang });
    }
    if (placed.length === 0) return;

    const labelR = orbitR + fontSize * 2.2;

    // Resolve label overlaps — iteratively push nearby labels apart (preserves actual position)
    const minGap = (fontSize * 2.0) / labelR;
    let changed = true, iter = 0;
    while (changed && iter < 30) {
      changed = false; iter++;
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          let diff = placed[j].labelAng - placed[i].labelAng;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          if (Math.abs(diff) < minGap) {
            const push = (minGap - Math.abs(diff)) / 2;
            const dir = diff >= 0 ? 1 : -1;
            placed[i].labelAng -= push * dir;
            placed[j].labelAng += push * dir;
            changed = true;
          }
        }
      }
    }

    for (const z of placed) {
      const dotX = cx + orbitR * Math.cos(z.ang);
      const dotY = cy + orbitR * Math.sin(z.ang);

      // Short radial leader from dot outward to label
      const lx = cx + labelR * Math.cos(z.labelAng);
      const ly = cy + labelR * Math.sin(z.labelAng);
      ctx.beginPath();
      ctx.moveTo(dotX, dotY);
      ctx.lineTo(lx, ly);
      ctx.strokeStyle = 'rgba(197, 165, 102, 0.35)';
      ctx.lineWidth = 0.7;
      ctx.stroke();

      // Solid dot on ring at actual time position
      const dotR = Math.max(2.5, s * 0.008);
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = z.color;
      ctx.fill();

      // Label at its resolved position with subtle glow
      ctx.shadowColor = z.color;
      ctx.shadowBlur = 4;
      ctx.fillStyle = z.color;
      ctx.fillText(z.label, lx, ly);
      ctx.shadowBlur = 0;
    }
  }

  function drawSunBall(ctx, sx, sy, elev, s) {
    const discR = Math.max(4, s * 0.035);
    const glowR = discR * 3;
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(1, glowR));
    if (elev > 5) {
      glow.addColorStop(0, 'rgba(255,220,140,0.4)'); glow.addColorStop(0.5, 'rgba(255,180,60,0.15)'); glow.addColorStop(1, 'rgba(255,140,20,0)');
    } else if (elev > -1) {
      glow.addColorStop(0, 'rgba(255,140,60,0.55)'); glow.addColorStop(0.5, 'rgba(220,80,20,0.22)'); glow.addColorStop(1, 'rgba(180,40,10,0)');
    } else {
      glow.addColorStop(0, 'rgba(80,100,200,0.3)'); glow.addColorStop(1, 'rgba(40,50,150,0)');
    }
    ctx.beginPath(); ctx.arc(sx, sy, Math.max(1, glowR), 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill();

    const sphere = ctx.createRadialGradient(sx - discR * 0.25, sy - discR * 0.25, discR * 0.05, sx, sy, discR);
    if (elev > 5) {
      sphere.addColorStop(0, '#fff5d0'); sphere.addColorStop(0.45, '#f0c060'); sphere.addColorStop(0.8, '#d08020'); sphere.addColorStop(1, '#8a4a0a');
    } else if (elev > -1) {
      sphere.addColorStop(0, '#ffe0a0'); sphere.addColorStop(0.4, '#e07020'); sphere.addColorStop(0.75, '#b03010'); sphere.addColorStop(1, '#501008');
    } else {
      sphere.addColorStop(0, '#6080c0'); sphere.addColorStop(0.5, '#3050a0'); sphere.addColorStop(1, '#101830');
    }
    ctx.beginPath(); ctx.arc(sx, sy, Math.max(1, discR), 0, Math.PI * 2); ctx.fillStyle = sphere; ctx.fill();
    ctx.beginPath(); ctx.arc(sx, sy, Math.max(1, discR), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.6; ctx.stroke();
  }

  function drawMoon(ctx, s, cx, cy, orbitR, tMs) {
    if (!moonPhase || !moonTimes) return;
    if (moonPos && moonPos.altitude <= 0) return;
    if (sunTimes?.shkiah && tMs < sunTimes.shkiah.getTime()) return;

    const { moonrise, moonset, moonUpAtStart } = moonTimes;
    let riseMs = null, setMs = null;

    if (moonUpAtStart && moonset) {
      if (tMs < moonset.getTime()) {
        riseMs = moonset.getTime() - 12 * 3600000;
        setMs = moonset.getTime();
      } else if (moonrise && tMs >= moonrise.getTime()) {
        riseMs = moonrise.getTime();
        setMs = moonrise.getTime() + 12 * 3600000;
      }
    } else if (moonrise && moonset && tMs >= moonrise.getTime() && tMs < moonset.getTime()) {
      riseMs = moonrise.getTime();
      setMs = moonset.getTime();
    }

    if (riseMs === null || setMs === null) return;
    if (tMs < riseMs || tMs >= setMs) return;

    const progress = Math.max(0, Math.min(1, (tMs - riseMs) / (setMs - riseMs)));
    const moonAngle = (180 + progress * 180) * Math.PI / 180;
    const mx = cx + orbitR * Math.cos(moonAngle);
    const my = cy + orbitR * Math.sin(moonAngle);

    const moonR = Math.max(3, s * 0.026);
    drawMoonBall(ctx, mx, my, moonR, moonPhase);
  }

  function drawMoonBall(ctx, mx, my, r, moonPhaseData) {
    const synodicMonth = 29.53058867;
    const phaseFraction = (((moonPhaseData.phase % synodicMonth) + synodicMonth) % synodicMonth) / synodicMonth;
    const illum = moonPhaseData.illumination / 100;

    const glowR = r * 2;
    const glow = ctx.createRadialGradient(mx, my, 0, mx, my, Math.max(1, glowR));
    glow.addColorStop(0, 'rgba(200,210,255,0.18)');
    glow.addColorStop(0.5, 'rgba(180,190,230,0.06)');
    glow.addColorStop(1, 'rgba(150,160,200,0)');
    ctx.beginPath(); ctx.arc(mx, my, Math.max(1, glowR), 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();

    ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2a3e'; ctx.fill();

    if (illum <= 0.005) return;

    if (illum >= 0.995) {
      ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.fillStyle = '#e8e8d0'; ctx.fill();
      return;
    }

    const waxing = phaseFraction < 0.5;
    const termX = Math.max(0.01, r * Math.abs(1 - 2 * illum));

    ctx.fillStyle = '#e8e8d0';
    ctx.beginPath();
    if (waxing) {
      ctx.arc(mx, my, r, -Math.PI / 2, Math.PI / 2, false);
      if (illum < 0.5) ctx.ellipse(mx, my, termX, r, 0, Math.PI / 2, -Math.PI / 2, true);
      else ctx.ellipse(mx, my, termX, r, 0, Math.PI / 2, -Math.PI / 2, false);
    } else {
      ctx.arc(mx, my, r, -Math.PI / 2, Math.PI / 2, true);
      if (illum < 0.5) ctx.ellipse(mx, my, termX, r, 0, Math.PI / 2, -Math.PI / 2, false);
      else ctx.ellipse(mx, my, termX, r, 0, Math.PI / 2, -Math.PI / 2, true);
    }
    ctx.closePath();
    ctx.fill();

    ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200,200,255,0.12)'; ctx.lineWidth = 0.4; ctx.stroke();
  }

  const elevLabel = `${elevation >= 0 ? '+' : ''}${elevation.toFixed(1)}°`;

  return (
    <div className="relative flex flex-col items-center">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="text-4xl font-bold tabular-nums tracking-tight"
          style={{ color: elevation > 0 ? '#f0c060' : elevation > -6 ? '#e07030' : '#8080b0', textShadow: '0 2px 16px rgba(0,0,0,0.8)' }}
        >
          {elevLabel}
        </div>
        <div className="text-xs text-white/40 uppercase tracking-wider font-semibold">Sun Elevation</div>
      </div>
      <div ref={containerRef} className="w-full flex justify-center">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Sun position: elevation ${elevLabel}, azimuth ${azimuth.toFixed(1)} degrees`}
          style={{ width: effectiveSize, height: effectiveSize }}
          className="rounded-full shadow-2xl"
        />
      </div>
      <div className="mt-4 flex items-center gap-6 text-xs text-white/40 tabular-nums">
        <span>Azimuth <span className="text-yellow-300 font-bold">{azimuth.toFixed(1)}°</span></span>
      </div>
    </div>
  );
}
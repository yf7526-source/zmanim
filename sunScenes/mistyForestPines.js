// Misty Forest Pines — cool blue-green, tall pines, fog layers, stone cottage

function drawPine(ctx, x, baseY, h, lf, lerp) {
  const w = h * 0.3;
  const grad = ctx.createLinearGradient(x - w, baseY, x + w, baseY);
  grad.addColorStop(0, `rgb(${lerp(4,16,lf)},${lerp(10,32,lf)},${lerp(6,26,lf)})`);
  grad.addColorStop(0.5, `rgb(${lerp(8,28,lf)},${lerp(14,46,lf)},${lerp(10,36,lf)})`);
  grad.addColorStop(1, `rgb(${lerp(4,16,lf)},${lerp(10,32,lf)},${lerp(6,26,lf)})`);
  ctx.fillStyle = grad;

  // Layered triangular canopy
  const tiers = 3;
  for (let t = 0; t < tiers; t++) {
    const tY = baseY - h * (0.3 + t * 0.25);
    const tW = w * (1 - t * 0.2);
    const tH = h * 0.4;
    ctx.beginPath();
    ctx.moveTo(x, tY - tH);
    ctx.lineTo(x + tW, tY);
    ctx.lineTo(x - tW, tY);
    ctx.closePath();
    ctx.fill();
  }

  // Trunk
  ctx.fillStyle = `rgb(${lerp(8,35,lf)},${lerp(6,24,lf)},${lerp(4,16,lf)})`;
  ctx.fillRect(x - w * 0.06, baseY - h * 0.3, w * 0.12, h * 0.3);
}

function drawCottage(ctx, x, baseY, scale, lf, lerp) {
  const w = scale * 1.5, h = scale * 0.9;
  const bx = x - w / 2, by = baseY - h;

  // Stone walls — cool grey-brown
  const wallGrad = ctx.createLinearGradient(bx, by, bx, by + h);
  wallGrad.addColorStop(0, `rgb(${lerp(22,120,lf)},${lerp(24,118,lf)},${lerp(22,108,lf)})`);
  wallGrad.addColorStop(1, `rgb(${lerp(16,85,lf)},${lerp(16,82,lf)},${lerp(14,74,lf)})`);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(bx, by, w, h);

  // Roof — dark slate
  ctx.beginPath();
  ctx.moveTo(bx - w * 0.08, by + 1);
  ctx.lineTo(x, by - h * 0.45);
  ctx.lineTo(bx + w + w * 0.08, by + 1);
  ctx.closePath();
  ctx.fillStyle = `rgb(${lerp(10,55,lf)},${lerp(12,52,lf)},${lerp(15,58,lf)})`;
  ctx.fill();

  // Chimney
  ctx.fillStyle = `rgb(${lerp(15,75,lf)},${lerp(15,72,lf)},${lerp(14,66,lf)})`;
  ctx.fillRect(x + w * 0.15, by - h * 0.3, w * 0.12, h * 0.35);

  // Smoke
  ctx.fillStyle = `rgba(200,200,210,${0.15 * (1 - lf * 0.5)})`;
  ctx.beginPath();
  ctx.arc(x + w * 0.21, by - h * 0.45, w * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.25, by - h * 0.6, w * 0.06, 0, Math.PI * 2);
  ctx.fill();

  // Door
  const dw = w * 0.2, dh = h * 0.5;
  ctx.fillStyle = `rgb(${lerp(8,32,lf)},${lerp(6,22,lf)},${lerp(4,14,lf)})`;
  ctx.fillRect(x - dw / 2, baseY - dh, dw, dh);

  // Warm windows
  const winGlow = 1 - lf;
  ctx.fillStyle = `rgba(255,190,90,${0.2 + winGlow * 0.35})`;
  ctx.fillRect(bx + w * 0.12, by + h * 0.25, w * 0.16, h * 0.28);
  ctx.fillRect(bx + w * 0.72, by + h * 0.25, w * 0.16, h * 0.28);
}

function drawFogBand(ctx, cx, cy, R, yFrac, lf, lerp) {
  const grad = ctx.createLinearGradient(cx, cy + R * (yFrac - 0.04), cx, cy + R * (yFrac + 0.04));
  const alpha = 0.15 + (1 - lf) * 0.1;
  grad.addColorStop(0, `rgba(200,210,220,0)`);
  grad.addColorStop(0.5, `rgba(200,210,220,${alpha})`);
  grad.addColorStop(1, `rgba(200,210,220,0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(cx - R, cy + R * (yFrac - 0.04), R * 2, R * 0.08);
}

export function drawScene(ctx, cx, cy, R, elev, lerp) {
  let lf;
  if (elev > 10) lf = 1;
  else if (elev > 0) lf = 0.35 + (elev / 10) * 0.65;
  else if (elev > -6) lf = 0.08 + ((elev + 6) / 6) * 0.27;
  else lf = 0.03;

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.97, 0, Math.PI * 2); ctx.clip();

  // Distant ridge — hazy blue-green
  ctx.fillStyle = `rgb(${lerp(12,46,lf)},${lerp(20,74,lf)},${lerp(18,66,lf)})`;
  ctx.beginPath();
  ctx.moveTo(cx - R, cy + R * 0.06);
  for (let x = -R; x <= R; x += 4) {
    const h = Math.sin(x * 0.011) * R * 0.03 + Math.sin(x * 0.026) * R * 0.018;
    ctx.lineTo(cx + x, cy + h + R * 0.06);
  }
  ctx.lineTo(cx + R, cy + R); ctx.lineTo(cx - R, cy + R);
  ctx.closePath(); ctx.fill();

  drawFogBand(ctx, cx, cy, R, 0.1, lf, lerp);

  // Mid ridge — deeper
  ctx.fillStyle = `rgb(${lerp(10,38,lf)},${lerp(16,62,lf)},${lerp(14,54,lf)})`;
  ctx.beginPath();
  ctx.moveTo(cx - R, cy + R * 0.18);
  for (let x = -R; x <= R; x += 4) {
    const h = Math.sin(x * 0.017 + 1) * R * 0.045 + Math.sin(x * 0.04) * R * 0.02;
    ctx.lineTo(cx + x, cy + h + R * 0.18);
  }
  ctx.lineTo(cx + R, cy + R); ctx.lineTo(cx - R, cy + R);
  ctx.closePath(); ctx.fill();

  drawFogBand(ctx, cx, cy, R, 0.22, lf, lerp);

  // Foreground — deep forest
  const fgGrad = ctx.createLinearGradient(cx, cy, cx, cy + R);
  fgGrad.addColorStop(0, `rgb(${lerp(8,30,lf)},${lerp(14,50,lf)},${lerp(10,42,lf)})`);
  fgGrad.addColorStop(1, `rgb(${lerp(5,18,lf)},${lerp(8,32,lf)},${lerp(6,26,lf)})`);
  ctx.fillStyle = fgGrad;
  ctx.beginPath();
  ctx.moveTo(cx - R, cy + R * 0.32);
  for (let x = -R; x <= R; x += 4) {
    const h = Math.sin(x * 0.02 + 2.5) * R * 0.04 + Math.sin(x * 0.055) * R * 0.015;
    ctx.lineTo(cx + x, cy + h + R * 0.32);
  }
  ctx.lineTo(cx + R, cy + R); ctx.lineTo(cx - R, cy + R);
  ctx.closePath(); ctx.fill();

  // Pines
  drawPine(ctx, cx - R * 0.38, cy + R * 0.1, R * 0.3, lf, lerp);
  drawPine(ctx, cx + R * 0.4, cy + R * 0.06, R * 0.34, lf, lerp);
  drawPine(ctx, cx - R * 0.58, cy + R * 0.18, R * 0.22, lf, lerp);
  drawPine(ctx, cx + R * 0.6, cy + R * 0.2, R * 0.2, lf, lerp);
  drawPine(ctx, cx - R * 0.1, cy + R * 0.24, R * 0.18, lf, lerp);

  drawCottage(ctx, cx + R * 0.1, cy + R * 0.2, R * 0.13, lf, lerp);

  ctx.restore();
}
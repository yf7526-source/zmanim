// Cliffside Village — layered cliffs, whitewashed buildings, distant sea

function drawCypressTall(ctx, x, baseY, h, lf, lerp) {
  const w = h * 0.18;
  const grad = ctx.createLinearGradient(x - w, baseY, x + w, baseY);
  grad.addColorStop(0, `rgb(${lerp(4,18,lf)},${lerp(10,35,lf)},${lerp(8,30,lf)})`);
  grad.addColorStop(0.5, `rgb(${lerp(8,32,lf)},${lerp(14,50,lf)},${lerp(12,40,lf)})`);
  grad.addColorStop(1, `rgb(${lerp(4,18,lf)},${lerp(10,35,lf)},${lerp(8,30,lf)})`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, baseY - h);
  ctx.quadraticCurveTo(x + w * 0.8, baseY - h * 0.4, x + w * 0.25, baseY);
  ctx.lineTo(x - w * 0.25, baseY);
  ctx.quadraticCurveTo(x - w * 0.8, baseY - h * 0.4, x, baseY - h);
  ctx.closePath();
  ctx.fill();
}

function drawVillageBuilding(ctx, x, baseY, scale, lf, lerp, dome = false) {
  const w = scale * 1.4, h = scale * 1.0;
  const bx = x - w / 2, by = baseY - h;

  const wallGrad = ctx.createLinearGradient(bx, by, bx, by + h);
  wallGrad.addColorStop(0, `rgb(${lerp(22,225,lf)},${lerp(24,215,lf)},${lerp(20,195,lf)})`);
  wallGrad.addColorStop(1, `rgb(${lerp(16,160,lf)},${lerp(16,150,lf)},${lerp(14,135,lf)})`);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(bx, by, w, h);

  if (dome) {
    ctx.fillStyle = `rgb(${lerp(18,130,lf)},${lerp(16,110,lf)},${lerp(14,85,lf)})`;
    ctx.beginPath();
    ctx.arc(x, by, w * 0.35, Math.PI, 0);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(bx - w * 0.06, by + 1);
    ctx.lineTo(x, by - h * 0.4);
    ctx.lineTo(bx + w + w * 0.06, by + 1);
    ctx.closePath();
    ctx.fillStyle = `rgb(${lerp(18,140,lf)},${lerp(15,88,lf)},${lerp(10,55,lf)})`;
    ctx.fill();
  }

  // Windows
  const winGlow = 1 - lf;
  ctx.fillStyle = `rgba(255,190,90,${0.15 + winGlow * 0.3})`;
  ctx.fillRect(bx + w * 0.15, by + h * 0.25, w * 0.16, h * 0.3);
  ctx.fillRect(bx + w * 0.69, by + h * 0.25, w * 0.16, h * 0.3);
}

export function drawScene(ctx, cx, cy, R, elev, lerp) {
  let lf;
  if (elev > 10) lf = 1;
  else if (elev > 0) lf = 0.35 + (elev / 10) * 0.65;
  else if (elev > -6) lf = 0.08 + ((elev + 6) / 6) * 0.27;
  else lf = 0.03;

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.97, 0, Math.PI * 2); ctx.clip();

  // Distant sea hint — thin band
  ctx.fillStyle = `rgb(${lerp(12,45,lf)},${lerp(20,85,lf)},${lerp(28,94,lf)})`;
  ctx.fillRect(cx - R, cy + R * 0.02, R * 2, R * 0.06);

  // Distant cliff — hazy blue-green
  ctx.fillStyle = `rgb(${lerp(15,58,lf)},${lerp(25,94,lf)},${lerp(22,88,lf)})`;
  ctx.beginPath();
  ctx.moveTo(cx - R, cy + R * 0.08);
  for (let x = -R; x <= R; x += 4) {
    const h = Math.sin(x * 0.01) * R * 0.03 + Math.sin(x * 0.025) * R * 0.018;
    ctx.lineTo(cx + x, cy + h + R * 0.08);
  }
  ctx.lineTo(cx + R, cy + R); ctx.lineTo(cx - R, cy + R);
  ctx.closePath(); ctx.fill();

  // Mid cliff — deeper teal-green
  ctx.fillStyle = `rgb(${lerp(12,42,lf)},${lerp(20,77,lf)},${lerp(18,68,lf)})`;
  ctx.beginPath();
  ctx.moveTo(cx - R, cy + R * 0.2);
  for (let x = -R; x <= R; x += 4) {
    const h = Math.sin(x * 0.016 + 1.2) * R * 0.05 + Math.sin(x * 0.038) * R * 0.022;
    ctx.lineTo(cx + x, cy + h + R * 0.2);
  }
  ctx.lineTo(cx + R, cy + R); ctx.lineTo(cx - R, cy + R);
  ctx.closePath(); ctx.fill();

  // Foreground cliff — deep
  const fgGrad = ctx.createLinearGradient(cx, cy, cx, cy + R);
  fgGrad.addColorStop(0, `rgb(${lerp(10,35,lf)},${lerp(16,62,lf)},${lerp(14,55,lf)})`);
  fgGrad.addColorStop(1, `rgb(${lerp(6,22,lf)},${lerp(10,40,lf)},${lerp(8,35,lf)})`);
  ctx.fillStyle = fgGrad;
  ctx.beginPath();
  ctx.moveTo(cx - R, cy + R * 0.34);
  for (let x = -R; x <= R; x += 4) {
    const h = Math.sin(x * 0.02 + 2.8) * R * 0.04 + Math.sin(x * 0.05) * R * 0.015;
    ctx.lineTo(cx + x, cy + h + R * 0.34);
  }
  ctx.lineTo(cx + R, cy + R); ctx.lineTo(cx - R, cy + R);
  ctx.closePath(); ctx.fill();

  // Village buildings cascading
  drawVillageBuilding(ctx, cx - R * 0.25, cy + R * 0.18, R * 0.1, lf, lerp, true);
  drawVillageBuilding(ctx, cx + R * 0.05, cy + R * 0.22, R * 0.12, lf, lerp, false);
  drawVillageBuilding(ctx, cx + R * 0.28, cy + R * 0.16, R * 0.09, lf, lerp, false);
  drawVillageBuilding(ctx, cx - R * 0.48, cy + R * 0.24, R * 0.08, lf, lerp, false);

  // Tall cypresses
  drawCypressTall(ctx, cx + R * 0.45, cy + R * 0.14, R * 0.28, lf, lerp);
  drawCypressTall(ctx, cx - R * 0.15, cy + R * 0.2, R * 0.22, lf, lerp);
  drawCypressTall(ctx, cx + R * 0.62, cy + R * 0.22, R * 0.18, lf, lerp);

  ctx.restore();
}
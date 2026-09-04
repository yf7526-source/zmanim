// Desert Oasis Mesa — flat-topped mesas, warm dunes, date palm, mud-brick structure

function drawDatePalm(ctx, x, baseY, h, lf, lerp) {
  // Trunk
  ctx.strokeStyle = `rgb(${lerp(10,55,lf)},${lerp(8,38,lf)},${lerp(5,22,lf)})`;
  ctx.lineWidth = h * 0.04;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + h * 0.05, baseY - h * 0.5, x + h * 0.02, baseY - h);
  ctx.stroke();

  // Fronds
  const frondColor = `rgb(${lerp(12,65,lf)},${lerp(18,85,lf)},${lerp(10,42,lf)})`;
  ctx.strokeStyle = frondColor;
  ctx.lineWidth = h * 0.025;
  const topX = x + h * 0.02;
  const topY = baseY - h;
  for (let i = 0; i < 7; i++) {
    const ang = -Math.PI / 2 + (i - 3) * 0.5;
    const len = h * 0.4;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(ang) * len * 0.5,
      topY + Math.sin(ang) * len * 0.5 - len * 0.1,
      topX + Math.cos(ang) * len,
      topY + Math.sin(ang) * len + len * 0.15
    );
    ctx.stroke();
  }
}

function drawMudBrick(ctx, x, baseY, scale, lf, lerp) {
  const w = scale * 1.6, h = scale * 0.85;
  const bx = x - w / 2, by = baseY - h;

  // Mud-brick walls — warm sand
  const wallGrad = ctx.createLinearGradient(bx, by, bx, by + h);
  wallGrad.addColorStop(0, `rgb(${lerp(22,165,lf)},${lerp(20,140,lf)},${lerp(15,100,lf)})`);
  wallGrad.addColorStop(1, `rgb(${lerp(16,115,lf)},${lerp(14,96,lf)},${lerp(10,68,lf)})`);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(bx, by, w, h);

  // Flat roof
  ctx.fillStyle = `rgb(${lerp(18,120,lf)},${lerp(15,95,lf)},${lerp(10,65,lf)})`;
  ctx.fillRect(bx - w * 0.04, by - h * 0.08, w * 1.08, h * 0.1);

  // Door
  const dw = w * 0.2, dh = h * 0.6;
  ctx.fillStyle = `rgb(${lerp(8,35,lf)},${lerp(6,26,lf)},${lerp(4,16,lf)})`;
  ctx.fillRect(x - dw / 2, baseY - dh, dw, dh);

  // Window glow
  const winGlow = 1 - lf;
  ctx.fillStyle = `rgba(255,170,70,${0.15 + winGlow * 0.3})`;
  ctx.fillRect(bx + w * 0.65, by + h * 0.2, w * 0.16, h * 0.25);
}

function drawMesa(ctx, cx, baseY, w, h, lf, lerp) {
  const grad = ctx.createLinearGradient(cx - w / 2, baseY - h, cx + w / 2, baseY);
  grad.addColorStop(0, `rgb(${lerp(18,95,lf)},${lerp(15,72,lf)},${lerp(10,48,lf)})`);
  grad.addColorStop(0.5, `rgb(${lerp(22,120,lf)},${lerp(18,92,lf)},${lerp(12,62,lf)})`);
  grad.addColorStop(1, `rgb(${lerp(15,80,lf)},${lerp(12,60,lf)},${lerp(8,40,lf)})`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, baseY);
  ctx.lineTo(cx - w / 2, baseY - h);
  ctx.lineTo(cx - w / 2 + w * 0.1, baseY - h - h * 0.05);
  ctx.lineTo(cx + w / 2 - w * 0.1, baseY - h - h * 0.05);
  ctx.lineTo(cx + w / 2, baseY - h);
  ctx.lineTo(cx + w / 2, baseY);
  ctx.closePath();
  ctx.fill();
}

export function drawScene(ctx, cx, cy, R, elev, lerp) {
  let lf;
  if (elev > 10) lf = 1;
  else if (elev > 0) lf = 0.35 + (elev / 10) * 0.65;
  else if (elev > -6) lf = 0.08 + ((elev + 6) / 6) * 0.27;
  else lf = 0.03;

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.97, 0, Math.PI * 2); ctx.clip();

  // Distant mesa
  drawMesa(ctx, cx + R * 0.2, cy + R * 0.15, R * 0.9, R * 0.12, lf, lerp);

  // Mid dunes — warm sand
  ctx.fillStyle = `rgb(${lerp(20,108,lf)},${lerp(18,84,lf)},${lerp(12,56,lf)})`;
  ctx.beginPath();
  ctx.moveTo(cx - R, cy + R * 0.2);
  for (let x = -R; x <= R; x += 4) {
    const h = Math.sin(x * 0.014 + 0.5) * R * 0.04 + Math.sin(x * 0.03) * R * 0.02;
    ctx.lineTo(cx + x, cy + h + R * 0.2);
  }
  ctx.lineTo(cx + R, cy + R); ctx.lineTo(cx - R, cy + R);
  ctx.closePath(); ctx.fill();

  // Foreground dunes — deeper terracotta
  const fgGrad = ctx.createLinearGradient(cx, cy, cx, cy + R);
  fgGrad.addColorStop(0, `rgb(${lerp(15,85,lf)},${lerp(12,62,lf)},${lerp(8,42,lf)})`);
  fgGrad.addColorStop(1, `rgb(${lerp(8,52,lf)},${lerp(6,38,lf)},${lerp(4,24,lf)})`);
  ctx.fillStyle = fgGrad;
  ctx.beginPath();
  ctx.moveTo(cx - R, cy + R * 0.35);
  for (let x = -R; x <= R; x += 4) {
    const h = Math.sin(x * 0.02 + 2) * R * 0.035 + Math.sin(x * 0.045) * R * 0.015;
    ctx.lineTo(cx + x, cy + h + R * 0.35);
  }
  ctx.lineTo(cx + R, cy + R); ctx.lineTo(cx - R, cy + R);
  ctx.closePath(); ctx.fill();

  // Foreground mesa
  drawMesa(ctx, cx - R * 0.35, cy + R * 0.4, R * 0.5, R * 0.1, lf, lerp);

  // Date palms
  drawDatePalm(ctx, cx + R * 0.25, cy + R * 0.3, R * 0.28, lf, lerp);
  drawDatePalm(ctx, cx + R * 0.5, cy + R * 0.35, R * 0.2, lf, lerp);

  // Mud-brick structure
  drawMudBrick(ctx, cx - R * 0.15, cy + R * 0.3, R * 0.14, lf, lerp);

  ctx.restore();
}
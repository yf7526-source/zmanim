// Golden Olive Grove — warm Tuscan palette, rounded olive trees, stone farmhouse

function drawOliveTree(ctx, x, baseY, h, lf, lerp) {
  const w = h * 0.55;
  const grad = ctx.createRadialGradient(x - w * 0.2, baseY - h * 0.6, h * 0.1, x, baseY - h * 0.5, w);
  grad.addColorStop(0, `rgb(${lerp(20,120,lf)},${lerp(25,130,lf)},${lerp(18,85,lf)})`);
  grad.addColorStop(0.6, `rgb(${lerp(15,95,lf)},${lerp(20,108,lf)},${lerp(12,68,lf)})`);
  grad.addColorStop(1, `rgb(${lerp(10,65,lf)},${lerp(14,78,lf)},${lerp(8,48,lf)})`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, baseY - h * 0.55, w, h * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Trunk
  ctx.fillStyle = `rgb(${lerp(15,55,lf)},${lerp(12,38,lf)},${lerp(8,22,lf)})`;
  ctx.fillRect(x - w * 0.06, baseY - h * 0.2, w * 0.12, h * 0.2);
  // Silver highlight
  ctx.fillStyle = `rgba(${lerp(30,180,lf)},${lerp(35,190,lf)},${lerp(25,140,lf)},0.25)`;
  ctx.beginPath();
  ctx.ellipse(x - w * 0.15, baseY - h * 0.65, w * 0.3, h * 0.2, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawFarmhouse(ctx, x, baseY, scale, lf, lerp) {
  const w = scale * 1.7, h = scale * 1.0;
  const bx = x - w / 2, by = baseY - h;

  // Stone walls — warm sandstone
  const wallGrad = ctx.createLinearGradient(bx, by, bx, by + h);
  wallGrad.addColorStop(0, `rgb(${lerp(25,200,lf)},${lerp(22,175,lf)},${lerp(15,130,lf)})`);
  wallGrad.addColorStop(1, `rgb(${lerp(18,140,lf)},${lerp(15,120,lf)},${lerp(10,88,lf)})`);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(bx, by, w, h);

  // Roof — warm terracotta-brown
  ctx.beginPath();
  ctx.moveTo(bx - w * 0.08, by + 1);
  ctx.lineTo(x, by - h * 0.5);
  ctx.lineTo(bx + w + w * 0.08, by + 1);
  ctx.closePath();
  ctx.fillStyle = `rgb(${lerp(20,150,lf)},${lerp(15,88,lf)},${lerp(10,50,lf)})`;
  ctx.fill();

  // Door
  const dw = w * 0.2, dh = h * 0.55;
  ctx.fillStyle = `rgb(${lerp(12,48,lf)},${lerp(8,32,lf)},${lerp(5,18,lf)})`;
  ctx.fillRect(x - dw / 2, baseY - dh, dw, dh);

  // Amber-glowing windows
  const winGlow = 1 - lf;
  ctx.fillStyle = `rgba(255,180,80,${0.25 + winGlow * 0.4})`;
  ctx.fillRect(bx + w * 0.12, by + h * 0.2, w * 0.2, h * 0.35);
  ctx.fillRect(bx + w * 0.68, by + h * 0.2, w * 0.2, h * 0.35);
}

export function drawScene(ctx, cx, cy, R, elev, lerp) {
  let lf;
  if (elev > 10) lf = 1;
  else if (elev > 0) lf = 0.35 + (elev / 10) * 0.65;
  else if (elev > -6) lf = 0.08 + ((elev + 6) / 6) * 0.27;
  else lf = 0.03;

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.97, 0, Math.PI * 2); ctx.clip();

  // Distant hill — golden ochre haze
  ctx.fillStyle = `rgb(${lerp(25,107,lf)},${lerp(22,93,lf)},${lerp(15,66,lf)})`;
  ctx.beginPath();
  ctx.moveTo(cx - R, cy + R * 0.04);
  for (let x = -R; x <= R; x += 4) {
    const h = Math.sin(x * 0.012) * R * 0.035 + Math.sin(x * 0.028) * R * 0.02;
    ctx.lineTo(cx + x, cy + h + R * 0.04);
  }
  ctx.lineTo(cx + R, cy + R); ctx.lineTo(cx - R, cy + R);
  ctx.closePath(); ctx.fill();

  // Mid hill — olive green-gold
  ctx.fillStyle = `rgb(${lerp(18,66,lf)},${lerp(24,113,lf)},${lerp(14,66,lf)})`;
  ctx.beginPath();
  ctx.moveTo(cx - R, cy + R * 0.14);
  for (let x = -R; x <= R; x += 4) {
    const h = Math.sin(x * 0.018 + 0.8) * R * 0.05 + Math.sin(x * 0.04) * R * 0.025;
    ctx.lineTo(cx + x, cy + h + R * 0.14);
  }
  ctx.lineTo(cx + R, cy + R); ctx.lineTo(cx - R, cy + R);
  ctx.closePath(); ctx.fill();

  // Foreground — warm earth
  const fgGrad = ctx.createLinearGradient(cx, cy, cx, cy + R);
  fgGrad.addColorStop(0, `rgb(${lerp(14,74,lf)},${lerp(18,92,lf)},${lerp(10,52,lf)})`);
  fgGrad.addColorStop(1, `rgb(${lerp(8,48,lf)},${lerp(10,58,lf)},${lerp(6,32,lf)})`);
  ctx.fillStyle = fgGrad;
  ctx.beginPath();
  ctx.moveTo(cx - R, cy + R * 0.26);
  for (let x = -R; x <= R; x += 4) {
    const h = Math.sin(x * 0.022 + 2) * R * 0.045 + Math.sin(x * 0.055) * R * 0.018;
    ctx.lineTo(cx + x, cy + h + R * 0.26);
  }
  ctx.lineTo(cx + R, cy + R); ctx.lineTo(cx - R, cy + R);
  ctx.closePath(); ctx.fill();

  // Olive trees
  drawOliveTree(ctx, cx - R * 0.4, cy + R * 0.1, R * 0.2, lf, lerp);
  drawOliveTree(ctx, cx + R * 0.38, cy + R * 0.06, R * 0.24, lf, lerp);
  drawOliveTree(ctx, cx - R * 0.62, cy + R * 0.18, R * 0.16, lf, lerp);
  drawOliveTree(ctx, cx + R * 0.6, cy + R * 0.2, R * 0.14, lf, lerp);

  drawFarmhouse(ctx, cx + R * 0.08, cy + R * 0.16, R * 0.15, lf, lerp);

  ctx.restore();
}
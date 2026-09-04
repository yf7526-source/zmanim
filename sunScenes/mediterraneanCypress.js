// Mediterranean Cypress — the original scene (rolling green hills, cypress trees, whitewashed house)

function drawCypress(ctx, x, baseY, h, lf, lerp) {
  const w = h * 0.22;
  const grad = ctx.createLinearGradient(x - w, baseY, x + w, baseY);
  grad.addColorStop(0, `rgb(${lerp(5,20,lf)},${lerp(10,38,lf)},${lerp(5,25,lf)})`);
  grad.addColorStop(0.5, `rgb(${lerp(8,35,lf)},${lerp(14,55,lf)},${lerp(10,35,lf)})`);
  grad.addColorStop(1, `rgb(${lerp(5,20,lf)},${lerp(10,38,lf)},${lerp(5,25,lf)})`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, baseY - h);
  ctx.quadraticCurveTo(x + w * 0.7, baseY - h * 0.5, x + w * 0.3, baseY);
  ctx.lineTo(x - w * 0.3, baseY);
  ctx.quadraticCurveTo(x - w * 0.7, baseY - h * 0.5, x, baseY - h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(${lerp(12,60,lf)},${lerp(18,85,lf)},${lerp(12,50,lf)},0.3)`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.1, baseY - h * 0.9);
  ctx.quadraticCurveTo(x - w * 0.4, baseY - h * 0.4, x - w * 0.15, baseY);
  ctx.stroke();
}

function drawHouse(ctx, x, baseY, scale, lf, lerp) {
  const w = scale * 1.6, h = scale * 1.1;
  const bx = x - w / 2, by = baseY - h;

  const wallGrad = ctx.createLinearGradient(bx, by, bx, by + h);
  wallGrad.addColorStop(0, `rgb(${lerp(28,230,lf)},${lerp(26,218,lf)},${lerp(22,198,lf)})`);
  wallGrad.addColorStop(1, `rgb(${lerp(20,165,lf)},${lerp(18,155,lf)},${lerp(16,140,lf)})`);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(bx, by, w, h);

  ctx.beginPath();
  ctx.moveTo(bx - w * 0.1, by + 1);
  ctx.lineTo(x, by - h * 0.55);
  ctx.lineTo(bx + w + w * 0.1, by + 1);
  ctx.closePath();
  ctx.fillStyle = `rgb(${lerp(20,180,lf)},${lerp(12,95,lf)},${lerp(8,55,lf)})`;
  ctx.fill();

  const dw = w * 0.22, dh = h * 0.5;
  ctx.fillStyle = `rgb(${lerp(15,55,lf)},${lerp(10,38,lf)},${lerp(6,25,lf)})`;
  ctx.fillRect(x - dw / 2, baseY - dh, dw, dh);

  const winGlow = 1 - lf;
  ctx.fillStyle = `rgba(255,200,100,${0.2 + winGlow * 0.35})`;
  ctx.fillRect(bx + w * 0.12, by + h * 0.25, w * 0.18, h * 0.3);
  ctx.fillRect(bx + w * 0.7, by + h * 0.25, w * 0.18, h * 0.3);

  ctx.fillStyle = `rgb(${lerp(25,180,lf)},${lerp(23,168,lf)},${lerp(20,148,lf)})`;
  ctx.fillRect(x + w * 0.2, by - h * 0.35, w * 0.12, h * 0.4);
}

export function drawScene(ctx, cx, cy, R, elev, lerp) {
  let lf;
  if (elev > 10) lf = 1;
  else if (elev > 0) lf = 0.35 + (elev / 10) * 0.65;
  else if (elev > -6) lf = 0.08 + ((elev + 6) / 6) * 0.27;
  else lf = 0.03;

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.97, 0, Math.PI * 2); ctx.clip();

  // Distant hill — hazy sage
  ctx.fillStyle = `rgb(${lerp(20,90,lf)},${lerp(28,122,lf)},${lerp(20,93,lf)})`;
  ctx.beginPath();
  ctx.moveTo(cx - R, cy + R * 0.05);
  for (let x = -R; x <= R; x += 4) {
    const h = Math.sin(x * 0.015) * R * 0.04 + Math.sin(x * 0.03) * R * 0.025;
    ctx.lineTo(cx + x, cy + h + R * 0.05);
  }
  ctx.lineTo(cx + R, cy + R); ctx.lineTo(cx - R, cy + R);
  ctx.closePath(); ctx.fill();

  // Mid hill — forest green
  ctx.fillStyle = `rgb(${lerp(15,60,lf)},${lerp(22,100,lf)},${lerp(15,60,lf)})`;
  ctx.beginPath();
  ctx.moveTo(cx - R, cy + R * 0.15);
  for (let x = -R; x <= R; x += 4) {
    const h = Math.sin(x * 0.02 + 1) * R * 0.06 + Math.sin(x * 0.045) * R * 0.03;
    ctx.lineTo(cx + x, cy + h + R * 0.15);
  }
  ctx.lineTo(cx + R, cy + R); ctx.lineTo(cx - R, cy + R);
  ctx.closePath(); ctx.fill();

  // Foreground hill — deep olive
  const fgGrad = ctx.createLinearGradient(cx, cy, cx, cy + R);
  fgGrad.addColorStop(0, `rgb(${lerp(10,45,lf)},${lerp(16,74,lf)},${lerp(10,45,lf)})`);
  fgGrad.addColorStop(1, `rgb(${lerp(6,28,lf)},${lerp(10,48,lf)},${lerp(6,28,lf)})`);
  ctx.fillStyle = fgGrad;
  ctx.beginPath();
  ctx.moveTo(cx - R, cy + R * 0.28);
  for (let x = -R; x <= R; x += 4) {
    const h = Math.sin(x * 0.025 + 2.5) * R * 0.05 + Math.sin(x * 0.06) * R * 0.02;
    ctx.lineTo(cx + x, cy + h + R * 0.28);
  }
  ctx.lineTo(cx + R, cy + R); ctx.lineTo(cx - R, cy + R);
  ctx.closePath(); ctx.fill();

  drawCypress(ctx, cx - R * 0.35, cy + R * 0.12, R * 0.22, lf, lerp);
  drawCypress(ctx, cx + R * 0.42, cy + R * 0.08, R * 0.26, lf, lerp);
  drawCypress(ctx, cx - R * 0.6, cy + R * 0.2, R * 0.16, lf, lerp);
  drawCypress(ctx, cx + R * 0.65, cy + R * 0.22, R * 0.14, lf, lerp);
  drawCypress(ctx, cx - R * 0.08, cy + R * 0.25, R * 0.13, lf, lerp);

  drawHouse(ctx, cx + R * 0.12, cy + R * 0.18, R * 0.14, lf, lerp);

  ctx.restore();
}
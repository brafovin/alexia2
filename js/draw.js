// Rendering helpers — scene girls, evil tung tungs, HUD, background.

// ----- Background -----
const STARS = [];
for (let i = 0; i < 80; i++) {
  STARS.push({
    x: Math.random() * 960,
    y: Math.random() * 600,
    r: Math.random() * 1.4 + 0.3,
    twinkle: Math.random() * Math.PI * 2,
    speed: 0.7 + Math.random() * 1.5,
  });
}
const LAMPS = [
  { x: 120, y: 130 }, { x: 820, y: 170 }, { x: 200, y: 460 }, { x: 780, y: 480 },
];

export function drawBackground(ctx, W, H, t) {
  // gradient sky
  const g = ctx.createRadialGradient(W / 2, H * 0.4, 80, W / 2, H / 2, W * 0.8);
  g.addColorStop(0, "#1a0a2a");
  g.addColorStop(0.6, "#0c0618");
  g.addColorStop(1, "#02010a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // stars
  for (const s of STARS) {
    const a = 0.4 + 0.6 * Math.abs(Math.sin(t * s.speed + s.twinkle));
    ctx.fillStyle = `rgba(255, 230, 255, ${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // crescent moon
  ctx.save();
  ctx.translate(W - 100, 90);
  ctx.fillStyle = "#fff1b8";
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0c0618";
  ctx.beginPath();
  ctx.arc(-10, -4, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // flickering streetlamp cones
  for (const l of LAMPS) {
    const flick = 0.55 + 0.15 * Math.sin(t * 11 + l.x);
    const grad = ctx.createRadialGradient(l.x, l.y, 10, l.x, l.y, 140);
    grad.addColorStop(0, `rgba(255, 220, 130, ${(0.18 * flick).toFixed(3)})`);
    grad.addColorStop(1, "rgba(255, 220, 130, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(l.x, l.y, 140, 0, Math.PI * 2);
    ctx.fill();
  }

  // checkerboard floor tiles near bottom (retro)
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let x = 0; x < W; x += 40) {
    for (let y = 400; y < H; y += 40) {
      if (((x + y) / 40) % 2 === 0) {
        ctx.fillStyle = "#ff3ea5";
        ctx.fillRect(x, y, 40, 40);
      }
    }
  }
  ctx.restore();
}

// ----- Scene girl sprite -----
export function drawSceneGirl(ctx, x, y, girl, facing = 0, t = 0, opts = {}) {
  const flash = opts.flash || 0;
  const iframes = opts.iframes || 0;
  const bob = Math.sin(t * 6) * 1.4;
  const flipX = Math.cos(facing) < 0 ? -1 : 1;

  ctx.save();
  ctx.translate(x, y + bob);

  if (iframes > 0 && Math.floor(iframes * 20) % 2 === 0) ctx.globalAlpha = 0.4;

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 22, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.scale(flipX, 1);

  // fishnet legs (stripes)
  ctx.strokeStyle = "rgba(255, 142, 208, 0.6)";
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i += 2) {
    ctx.beginPath();
    ctx.moveTo(i * 4, 10);
    ctx.lineTo(i * 5, 22);
    ctx.stroke();
  }
  // boots
  ctx.fillStyle = "#1a0e1e";
  ctx.fillRect(-8, 20, 6, 6);
  ctx.fillRect(2, 20, 6, 6);
  ctx.strokeStyle = girl.stripe;
  ctx.lineWidth = 1;
  ctx.strokeRect(-8, 20, 6, 6);
  ctx.strokeRect(2, 20, 6, 6);

  // body (shirt with stripe)
  ctx.fillStyle = girl.shirt;
  ctx.beginPath();
  ctx.moveTo(-10, -2);
  ctx.lineTo(-9, 14);
  ctx.lineTo(9, 14);
  ctx.lineTo(10, -2);
  ctx.closePath();
  ctx.fill();
  // horizontal stripe
  ctx.fillStyle = girl.stripe;
  ctx.fillRect(-10, 2, 20, 3);

  // arm-warmers (striped)
  ctx.fillStyle = girl.stripe;
  ctx.fillRect(-13, 2, 3, 10);
  ctx.fillRect(10, 2, 3, 10);
  ctx.fillStyle = "#1a0e1e";
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(-13, 3 + i * 3, 3, 1);
    ctx.fillRect(10, 3 + i * 3, 3, 1);
  }

  // neck + head
  ctx.fillStyle = "#ffe0e8";
  ctx.fillRect(-3, -6, 6, 4);
  ctx.beginPath();
  ctx.arc(0, -12, 11, 0, Math.PI * 2);
  ctx.fill();

  // hair — big teased crown behind + side bangs over eyes
  ctx.fillStyle = girl.hairColor;
  // teased back hair (spiky polygon)
  ctx.beginPath();
  ctx.moveTo(-14, -8);
  ctx.lineTo(-18, -18);
  ctx.lineTo(-10, -16);
  ctx.lineTo(-14, -26);
  ctx.lineTo(-4, -20);
  ctx.lineTo(0, -28);
  ctx.lineTo(5, -20);
  ctx.lineTo(13, -26);
  ctx.lineTo(10, -16);
  ctx.lineTo(18, -18);
  ctx.lineTo(14, -8);
  ctx.closePath();
  ctx.fill();
  // side bang over eye
  ctx.beginPath();
  ctx.moveTo(-12, -12);
  ctx.lineTo(4, -6);
  ctx.lineTo(-6, -6);
  ctx.lineTo(-11, -4);
  ctx.closePath();
  ctx.fill();
  // streak
  ctx.fillStyle = girl.hairStreak;
  ctx.fillRect(-2, -22, 2, 8);
  ctx.fillRect(-9, -18, 2, 6);

  // eyes — big and shiny
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-4, -11, 3.2, 0, Math.PI * 2);
  ctx.arc(4, -11, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // pupils
  ctx.fillStyle = girl.pupilColor;
  drawPupil(ctx, -4, -11, girl.pupil);
  drawPupil(ctx, 4, -11, girl.pupil);

  // mouth
  ctx.fillStyle = "#8a1c4a";
  ctx.fillRect(-2, -6, 4, 1);

  // weapon icon over shoulder
  drawWeaponIcon(ctx, girl, t);

  if (flash > 0) {
    ctx.globalAlpha = flash;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-16, -28, 32, 52);
  }

  ctx.restore();
}

function drawPupil(ctx, x, y, kind) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === "x") {
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-1.6, -1.6); ctx.lineTo(1.6, 1.6);
    ctx.moveTo(1.6, -1.6); ctx.lineTo(-1.6, 1.6);
    ctx.stroke();
  } else if (kind === "heart") {
    ctx.beginPath();
    ctx.moveTo(0, 1.6);
    ctx.bezierCurveTo(2, 0, 2.2, -2, 0, -1.2);
    ctx.bezierCurveTo(-2.2, -2, -2, 0, 0, 1.6);
    ctx.fill();
  } else if (kind === "star") {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
      const ia = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a) * 2.4, Math.sin(a) * 2.4);
      ctx.lineTo(Math.cos(ia) * 1.0, Math.sin(ia) * 1.0);
    }
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWeaponIcon(ctx, girl, t) {
  // subtle weapon peek — optional
  if (girl.id === 0) {
    // bat over shoulder
    ctx.save();
    ctx.translate(10, -6);
    ctx.rotate(-0.4 + Math.sin(t * 4) * 0.05);
    ctx.fillStyle = "#c68a54";
    ctx.fillRect(-1, -2, 16, 4);
    ctx.fillStyle = "#2a1308";
    ctx.fillRect(-1, -2, 4, 4);
    // studs
    ctx.fillStyle = "#ccc";
    for (let i = 0; i < 3; i++) ctx.fillRect(5 + i * 3, -1, 1, 1);
    ctx.restore();
  } else if (girl.id === 1) {
    // scissors
    ctx.save();
    ctx.translate(11, -5);
    ctx.rotate(-0.4);
    ctx.strokeStyle = "#ff7ab6";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-2, 0); ctx.lineTo(8, -3);
    ctx.moveTo(-2, 0); ctx.lineTo(8, 3);
    ctx.stroke();
    ctx.fillStyle = "#ffe55c";
    ctx.beginPath(); ctx.arc(-3, -1, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-3, 1, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else {
    // glitter gun
    ctx.save();
    ctx.translate(10, -4);
    ctx.fillStyle = "#c89cff";
    ctx.fillRect(0, -2, 10, 4);
    ctx.fillStyle = "#ff8ed0";
    ctx.fillRect(8, -3, 3, 6);
    ctx.restore();
  }
}

// ----- Evil Tung Tung sprite -----
export function drawTungTung(ctx, e, t, opts = {}) {
  if (e.def && e.def.emo) { drawEmoTungTung(ctx, e, t, opts); return; }
  if (e.def && e.def.duo) { drawEvilDuo(ctx, e, t, opts); return; }
  const d = e.def || {};
  const r = e.radius || 16;
  const bob = Math.sin(t * 6 + e.wobble) * (d.bob || 4);
  const wobble = Math.sin(t * 6 + e.wobble) * 0.05;
  const flash = e.flash;
  ctx.save();
  ctx.translate(e.x, e.y + bob);
  ctx.rotate(wobble);

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(0, r + 6, r * 0.9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // log body (rounded rect)
  const w = r * 1.5, h = r * 1.9;
  ctx.fillStyle = d.color || "#8b5a2b";
  roundRect(ctx, -w, -h, w * 2, h * 2, 6);
  ctx.fill();
  // woodgrain
  ctx.strokeStyle = d.dark || "#4b2e13";
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-w + 4, i * 6);
    ctx.bezierCurveTo(-w / 2, i * 6 + 2, w / 2, i * 6 - 2, w - 4, i * 6);
    ctx.stroke();
  }
  // tree-ring ends
  ctx.fillStyle = d.dark || "#4b2e13";
  ctx.fillRect(-w, -h, w * 2, 3);
  ctx.fillRect(-w, h - 3, w * 2, 3);

  // stubby legs
  ctx.fillStyle = d.dark || "#4b2e13";
  ctx.fillRect(-w * 0.6, h, 4, 6);
  ctx.fillRect(w * 0.6 - 4, h, 4, 6);

  // angry face
  const fs = d.faceScale || 1;
  // eyebrows (angry wedges)
  ctx.fillStyle = "#1a0a0a";
  ctx.beginPath();
  ctx.moveTo(-8 * fs, -6 * fs);
  ctx.lineTo(-2 * fs, -4 * fs);
  ctx.lineTo(-2 * fs, -2 * fs);
  ctx.lineTo(-8 * fs, -3 * fs);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8 * fs, -6 * fs);
  ctx.lineTo(2 * fs, -4 * fs);
  ctx.lineTo(2 * fs, -2 * fs);
  ctx.lineTo(8 * fs, -3 * fs);
  ctx.closePath();
  ctx.fill();

  // glowing red eyes
  ctx.fillStyle = d.tint || "#ff3ea5";
  ctx.beginPath();
  ctx.arc(-5 * fs, -1, 1.8 * fs, 0, Math.PI * 2);
  ctx.arc(5 * fs, -1, 1.8 * fs, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-5 * fs + 0.4, -1 - 0.4, 0.6 * fs, 0, Math.PI * 2);
  ctx.arc(5 * fs + 0.4, -1 - 0.4, 0.6 * fs, 0, Math.PI * 2);
  ctx.fill();

  // mouth with jagged teeth
  ctx.fillStyle = "#0a0003";
  const mw = 12 * fs, mh = 5 * fs;
  ctx.fillRect(-mw / 2, 3, mw, mh);
  ctx.fillStyle = "#fff2d0";
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-mw / 2 + i * (mw / 4), 3);
    ctx.lineTo(-mw / 2 + i * (mw / 4) + mw / 8, 3 + mh * 0.9);
    ctx.lineTo(-mw / 2 + (i + 1) * (mw / 4), 3);
    ctx.closePath();
    ctx.fill();
  }

  // crown (mini-boss)
  if (d.crown) {
    ctx.fillStyle = "#ffe55c";
    ctx.beginPath();
    ctx.moveTo(-w * 0.8, -h - 4);
    ctx.lineTo(-w * 0.8, -h - 12);
    ctx.lineTo(-w * 0.4, -h - 8);
    ctx.lineTo(0, -h - 16);
    ctx.lineTo(w * 0.4, -h - 8);
    ctx.lineTo(w * 0.8, -h - 12);
    ctx.lineTo(w * 0.8, -h - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ff3ea5";
    ctx.beginPath(); ctx.arc(0, -h - 10, 2, 0, Math.PI * 2); ctx.fill();
  }

  if (flash > 0) {
    ctx.globalAlpha = Math.min(1, flash * 6);
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, -w, -h, w * 2, h * 2, 6);
    ctx.fill();
  }

  ctx.restore();

  // HP bar for bigger enemies
  if (e.maxHp > 60 && e.hp < e.maxHp) {
    const bw = 40, bh = 4;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(e.x - bw / 2, e.y - r - 14, bw, bh);
    ctx.fillStyle = "#ff4d6d";
    ctx.fillRect(e.x - bw / 2, e.y - r - 14, bw * (e.hp / e.maxHp), bh);
  }
}

// ----- Emo Tung Tung sprite -----
function drawEmoTungTung(ctx, e, t, opts = {}) {
  const d = e.def;
  const r = e.radius;
  const bob = Math.sin(t * 3.5 + e.wobble) * (d.bob || 4);
  const sway = Math.sin(t * 2 + e.wobble) * 0.04;

  ctx.save();
  ctx.translate(e.x, e.y + bob);
  ctx.rotate(sway);

  // long dark shadow (emo)
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.ellipse(0, r + 7, r * 1.1, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // aura — soft pink sigh pulse
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.5 + e.wobble);
  ctx.strokeStyle = `rgba(255, 62, 165, ${(0.12 + pulse * 0.15).toFixed(3)})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, r + 6 + pulse * 4, 0, Math.PI * 2);
  ctx.stroke();

  // body — dark charcoal / purple log
  const w = r * 1.5, h = r * 1.9;
  ctx.fillStyle = d.color;
  roundRect(ctx, -w, -h, w * 2, h * 2, 6);
  ctx.fill();
  // grain
  ctx.strokeStyle = d.dark;
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-w + 4, i * 6);
    ctx.bezierCurveTo(-w / 2, i * 6 + 2, w / 2, i * 6 - 2, w - 4, i * 6);
    ctx.stroke();
  }
  // ring ends
  ctx.fillStyle = d.dark;
  ctx.fillRect(-w, -h, w * 2, 3);
  ctx.fillRect(-w, h - 3, w * 2, 3);

  // stubby legs in striped stockings (scene/emo touch)
  ctx.fillStyle = "#0a0410";
  ctx.fillRect(-w * 0.6, h, 4, 7);
  ctx.fillRect(w * 0.6 - 4, h, 4, 7);
  ctx.strokeStyle = "#ff3ea5";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(-w * 0.6, h + 2 + i * 2); ctx.lineTo(-w * 0.6 + 4, h + 2 + i * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.6 - 4, h + 2 + i * 2); ctx.lineTo(w * 0.6, h + 2 + i * 2); ctx.stroke();
  }

  // chain choker
  ctx.strokeStyle = "#9fa3b0";
  ctx.lineWidth = 1.4;
  for (let i = -6; i <= 6; i += 3) {
    ctx.beginPath();
    ctx.arc(i, -h - 1, 1.6, 0, Math.PI * 2);
    ctx.stroke();
  }
  // pendant — broken heart
  ctx.fillStyle = "#ff3ea5";
  ctx.beginPath();
  ctx.moveTo(0, -h + 4);
  ctx.bezierCurveTo(5, -h - 2, 5, -h - 7, 0, -h - 3);
  ctx.bezierCurveTo(-5, -h - 7, -5, -h - 2, 0, -h + 4);
  ctx.fill();
  // crack through heart
  ctx.strokeStyle = "#0a0003";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-1, -h - 6);
  ctx.lineTo(1, -h - 4);
  ctx.lineTo(-1, -h - 2);
  ctx.lineTo(1, -h);
  ctx.lineTo(0, -h + 3);
  ctx.stroke();

  // face — one eye visible, other covered by swoopy bang
  // visible eye (glowing pink, with drippy eyeliner underneath)
  ctx.fillStyle = d.tint;
  ctx.beginPath();
  ctx.arc(5, -1, 2.2, 0, Math.PI * 2);
  ctx.fill();
  // small white glint
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(5.6, -1.6, 0.7, 0, Math.PI * 2); ctx.fill();
  // eyeliner drip
  ctx.strokeStyle = "#0a0003";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(4.5, 2);
  ctx.lineTo(4.2, 5);
  ctx.moveTo(6, 2);
  ctx.lineTo(6.3, 4.5);
  ctx.stroke();

  // swoopy side-bang covering left eye
  ctx.fillStyle = "#0a0410";
  ctx.beginPath();
  ctx.moveTo(-w * 0.9, -h + 2);
  ctx.bezierCurveTo(-w * 0.5, -h - 2, -2, -h + 8, 3, -h + 10);
  ctx.bezierCurveTo(0, -2, -6, 0, -12, 2);
  ctx.bezierCurveTo(-10, -4, -w * 0.9, -h + 6, -w * 0.9, -h + 2);
  ctx.closePath();
  ctx.fill();
  // magenta streak in bang
  ctx.fillStyle = "#ff3ea5";
  ctx.fillRect(-8, -h + 5, 2, 10);
  ctx.fillStyle = "#c89cff";
  ctx.fillRect(-4, -h + 7, 1.5, 9);

  // downturned mouth with one fang
  ctx.fillStyle = "#0a0003";
  ctx.fillRect(-5, 5, 10, 3);
  ctx.fillStyle = "#fff2d0";
  ctx.beginPath();
  ctx.moveTo(-2, 5);
  ctx.lineTo(-1, 9);
  ctx.lineTo(0, 5);
  ctx.closePath();
  ctx.fill();
  // frown corners
  ctx.strokeStyle = "#0a0003";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-6, 4);
  ctx.lineTo(-5, 6);
  ctx.moveTo(6, 4);
  ctx.lineTo(5, 6);
  ctx.stroke();

  // flash on damage
  if (e.flash > 0) {
    ctx.globalAlpha = Math.min(1, e.flash * 6);
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, -w, -h, w * 2, h * 2, 6);
    ctx.fill();
  }

  ctx.restore();

  // HP bar for bigger/wounded emo
  if (e.hp < e.maxHp) {
    const bw = 32, bh = 3;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(e.x - bw / 2, e.y - r - 12, bw, bh);
    ctx.fillStyle = "#ff3ea5";
    ctx.fillRect(e.x - bw / 2, e.y - r - 12, bw * (e.hp / e.maxHp), bh);
  }
}

// ----- Evil Duo sprite (menacing Duolingo owl) -----
function drawEvilDuo(ctx, e, t, opts = {}) {
  const r = e.radius;
  const d = e.def;

  // Telegraph alpha: fade out while charging teleport, fade in on arrival.
  let alpha = 1;
  if (e.tpCharge > 0) alpha = Math.max(0.1, e.tpCharge / 0.4);
  else if (e.tpArrive > 0) alpha = 1 - (e.tpArrive / 0.25);

  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.globalAlpha = alpha;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(0, r + 6, r * 0.9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Fiery aura
  const pulse = 0.5 + 0.5 * Math.sin(t * 5 + e.wobble);
  const auraGrad = ctx.createRadialGradient(0, 0, r, 0, 0, r + 18);
  auraGrad.addColorStop(0, "rgba(255, 77, 26, 0.45)");
  auraGrad.addColorStop(1, "rgba(255, 77, 26, 0)");
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r + 14 + pulse * 4, 0, Math.PI * 2);
  ctx.fill();

  // Little flames licking up from the sides
  ctx.fillStyle = "#ff9b3a";
  for (let i = 0; i < 5; i++) {
    const fx = -r + i * (r * 2 / 4);
    const fh = 6 + Math.sin(t * 10 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(fx, -r * 0.7);
    ctx.lineTo(fx + 3, -r * 0.7 - fh);
    ctx.lineTo(fx + 6, -r * 0.7);
    ctx.closePath();
    ctx.fill();
  }

  // Body: rounded oval, Duolingo green
  ctx.fillStyle = d.color;
  ctx.strokeStyle = d.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Belly lighter patch
  ctx.fillStyle = "#e7ffc2";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.35, r * 0.55, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wings folded on sides
  ctx.fillStyle = d.dark;
  ctx.beginPath();
  ctx.ellipse(-r * 0.85, r * 0.1, r * 0.3, r * 0.55, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(r * 0.85, r * 0.1, r * 0.3, r * 0.55, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Angry V brows
  ctx.fillStyle = "#1b0a00";
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, -r * 0.5);
  ctx.lineTo(-r * 0.1, -r * 0.1);
  ctx.lineTo(-r * 0.1, -r * 0.35);
  ctx.lineTo(-r * 0.7, -r * 0.65);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.9, -r * 0.5);
  ctx.lineTo(r * 0.1, -r * 0.1);
  ctx.lineTo(r * 0.1, -r * 0.35);
  ctx.lineTo(r * 0.7, -r * 0.65);
  ctx.closePath();
  ctx.fill();

  // Big googly eyes
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-r * 0.38, -r * 0.1, r * 0.32, 0, Math.PI * 2);
  ctx.arc(r * 0.38, -r * 0.1, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  // glowing red pupils
  ctx.shadowBlur = 8;
  ctx.shadowColor = d.tint;
  ctx.fillStyle = d.tint;
  ctx.beginPath();
  ctx.arc(-r * 0.38, -r * 0.05, r * 0.16, 0, Math.PI * 2);
  ctx.arc(r * 0.38, -r * 0.05, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(-r * 0.38, -r * 0.05, r * 0.08, 0, Math.PI * 2);
  ctx.arc(r * 0.38, -r * 0.05, r * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = "#ff8a1a";
  ctx.strokeStyle = "#8a3d00";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.22, r * 0.18);
  ctx.lineTo(r * 0.22, r * 0.18);
  ctx.lineTo(0, r * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Feet
  ctx.fillStyle = "#ff8a1a";
  for (let i = -1; i <= 1; i += 2) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.35, r);
    ctx.lineTo(i * r * 0.3, r + 6);
    ctx.lineTo(i * r * 0.5, r + 6);
    ctx.closePath();
    ctx.fill();
  }

  // Tiny red notification badge
  ctx.fillStyle = "#ff2b2b";
  ctx.beginPath();
  ctx.arc(r * 0.8, -r * 0.8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 7px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("!", r * 0.8, -r * 0.8 + 0.5);

  // Flash on damage
  if (e.flash > 0) {
    ctx.globalAlpha = Math.min(1, e.flash * 6) * alpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Telegraph ring during teleport-out phase
  if (e.tpCharge > 0) {
    const k = 1 - e.tpCharge / 0.4;
    ctx.save();
    ctx.globalAlpha = 0.7 * (1 - k);
    ctx.strokeStyle = "#ff4d1a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r + 6 + k * 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // HP bar (Duos are elite, always show)
  if (e.hp < e.maxHp) {
    const bw = 38, bh = 3;
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(e.x - bw / 2, e.y - r - 14, bw, bh);
    ctx.fillStyle = "#58cc02";
    ctx.fillRect(e.x - bw / 2, e.y - r - 14, bw * (e.hp / e.maxHp), bh);
  }
}

// ----- Boss sprite (Tung Tung Supreme) -----
export function drawBoss(ctx, boss, t) {
  ctx.save();
  const r = boss.radius;
  const bob = Math.sin(t * 3) * 3;
  ctx.translate(boss.x, boss.y + bob);

  // big shadow
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.ellipse(0, r + 10, r * 1.1, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // aura pulse
  const pulse = 0.5 + 0.5 * Math.sin(t * 4);
  ctx.strokeStyle = `rgba(255, 62, 165, ${0.2 + pulse * 0.3})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, r + 14 + pulse * 6, 0, Math.PI * 2);
  ctx.stroke();

  // body (scaled up log)
  const w = r * 1.1, h = r * 1.5;
  ctx.fillStyle = boss.def.color;
  roundRect(ctx, -w, -h, w * 2, h * 2, 12);
  ctx.fill();

  // spooky grain
  ctx.strokeStyle = boss.def.dark;
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-w + 10, i * 12);
    ctx.bezierCurveTo(-w / 2, i * 12 + 4, w / 2, i * 12 - 4, w - 10, i * 12);
    ctx.stroke();
  }

  // crown of thorns
  ctx.fillStyle = "#000";
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const sx = Math.cos(a) * w, sy = Math.sin(a) * h - 8;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(a) * 10, sy + Math.sin(a) * 10);
    ctx.lineTo(sx + Math.cos(a + 0.4) * 4, sy + Math.sin(a + 0.4) * 4);
    ctx.closePath();
    ctx.fill();
  }

  // huge angry face
  const fs = boss.def.faceScale || 2.4;
  ctx.fillStyle = "#200000";
  ctx.beginPath();
  ctx.moveTo(-14 * fs, -10 * fs);
  ctx.lineTo(-3 * fs, -6 * fs);
  ctx.lineTo(-3 * fs, -2 * fs);
  ctx.lineTo(-14 * fs, -5 * fs);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(14 * fs, -10 * fs);
  ctx.lineTo(3 * fs, -6 * fs);
  ctx.lineTo(3 * fs, -2 * fs);
  ctx.lineTo(14 * fs, -5 * fs);
  ctx.closePath();
  ctx.fill();

  // glowing eyes
  ctx.fillStyle = boss.def.tint;
  ctx.shadowBlur = 12;
  ctx.shadowColor = boss.def.tint;
  ctx.beginPath();
  ctx.arc(-8 * fs, -2, 3 * fs, 0, Math.PI * 2);
  ctx.arc(8 * fs, -2, 3 * fs, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(-8 * fs, -2, 1.4 * fs, 0, Math.PI * 2);
  ctx.arc(8 * fs, -2, 1.4 * fs, 0, Math.PI * 2);
  ctx.fill();

  // massive jagged grin
  ctx.fillStyle = "#0a0003";
  const mw = 28 * fs, mh = 10 * fs;
  ctx.fillRect(-mw / 2, 4, mw, mh);
  ctx.fillStyle = "#fff2d0";
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(-mw / 2 + i * (mw / 8), 4);
    ctx.lineTo(-mw / 2 + i * (mw / 8) + mw / 16, 4 + mh * 0.9);
    ctx.lineTo(-mw / 2 + (i + 1) * (mw / 8), 4);
    ctx.closePath();
    ctx.fill();
  }

  if (boss.flash > 0) {
    ctx.globalAlpha = Math.min(1, boss.flash * 8);
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, -w, -h, w * 2, h * 2, 12);
    ctx.fill();
  }

  ctx.restore();
}

// ----- Projectiles -----
export function drawProjectile(ctx, p, t) {
  ctx.save();
  ctx.translate(p.x, p.y);
  const alpha = Math.min(1, p.life / p.maxLife * 2);
  ctx.globalAlpha = alpha;
  if (p.kind === "scissor") {
    ctx.rotate(p.rot);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -3); ctx.lineTo(8, -3);
    ctx.moveTo(-8, 3); ctx.lineTo(8, 3);
    ctx.stroke();
    ctx.fillStyle = p.trailColor;
    ctx.beginPath(); ctx.arc(-8, -3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-8, 3, 2, 0, Math.PI * 2); ctx.fill();
  } else if (p.kind === "glitter") {
    ctx.rotate(p.rot + t * 8);
    ctx.fillStyle = p.color;
    // 4-point star
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.lineTo(Math.cos(a) * p.radius, Math.sin(a) * p.radius);
      ctx.lineTo(Math.cos(a + Math.PI / 4) * p.radius * 0.3, Math.sin(a + Math.PI / 4) * p.radius * 0.3);
    }
    ctx.closePath();
    ctx.fill();
  } else if (p.kind === "tung") {
    ctx.rotate(p.rot);
    ctx.fillStyle = "#ff3ea5";
    ctx.font = "bold 14px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TUNG", 0, 0);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeText("TUNG", 0, 0);
    ctx.fillText("TUNG", 0, 0);
  } else if (p.kind === "streak") {
    const vang = Math.atan2(p.vy, p.vx) - Math.PI / 2;
    ctx.rotate(vang);
    const flick = 1 + 0.25 * Math.sin(t * 28 + p.x);
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff4d1a";
    // outer flame
    ctx.fillStyle = "#ff4d1a";
    ctx.beginPath();
    ctx.moveTo(0, -p.radius * 1.6 * flick);
    ctx.bezierCurveTo(p.radius * 1.1, -p.radius * 0.3, p.radius * 0.8, p.radius, 0, p.radius);
    ctx.bezierCurveTo(-p.radius * 0.8, p.radius, -p.radius * 1.1, -p.radius * 0.3, 0, -p.radius * 1.6 * flick);
    ctx.closePath();
    ctx.fill();
    // inner flame (yellow)
    ctx.fillStyle = "#ffe55c";
    ctx.beginPath();
    ctx.moveTo(0, -p.radius * 1.1 * flick);
    ctx.bezierCurveTo(p.radius * 0.6, -p.radius * 0.2, p.radius * 0.45, p.radius * 0.6, 0, p.radius * 0.7);
    ctx.bezierCurveTo(-p.radius * 0.45, p.radius * 0.6, -p.radius * 0.6, -p.radius * 0.2, 0, -p.radius * 1.1 * flick);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  } else if (p.kind === "tear") {
    // Orient point-up against velocity direction so tears look like tears.
    const vang = Math.atan2(p.vy, p.vx) - Math.PI / 2;
    ctx.rotate(vang);
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -p.radius * 1.4);
    ctx.bezierCurveTo(p.radius, -p.radius * 0.3, p.radius, p.radius, 0, p.radius);
    ctx.bezierCurveTo(-p.radius, p.radius, -p.radius, -p.radius * 0.3, 0, -p.radius * 1.4);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // little glint
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.ellipse(-p.radius * 0.3, -p.radius * 0.2, 1.2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ----- Melee arc telegraph + slash -----
export function drawMeleeArc(ctx, arc) {
  const k = arc.life / arc.maxLife; // 1..0
  ctx.save();
  ctx.translate(arc.x, arc.y);
  ctx.rotate(arc.angle);
  ctx.globalAlpha = Math.max(0, k);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, arc.radius);
  grad.addColorStop(0, "rgba(255, 62, 165, 0.4)");
  grad.addColorStop(1, "rgba(255, 62, 165, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, arc.radius, -arc.arc / 2, arc.arc / 2);
  ctx.closePath();
  ctx.fill();
  // slash line
  ctx.strokeStyle = arc.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, arc.radius * 0.95, -arc.arc / 2, arc.arc / 2);
  ctx.stroke();
  ctx.restore();
}

// ----- Pickups -----
export function drawPickup(ctx, pu, t) {
  ctx.save();
  ctx.translate(pu.x, pu.y);
  const bob = Math.sin(t * 5 + pu.x * 0.01) * 2;
  ctx.translate(0, bob);
  if (pu.kind === "xp") {
    ctx.rotate(t * 3);
    ctx.fillStyle = "#3ef0ff";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#3ef0ff";
    ctx.beginPath();
    ctx.moveTo(0, -pu.radius);
    ctx.lineTo(pu.radius * 0.7, 0);
    ctx.lineTo(0, pu.radius);
    ctx.lineTo(-pu.radius * 0.7, 0);
    ctx.closePath();
    ctx.fill();
  } else if (pu.kind === "heart") {
    ctx.fillStyle = "#ff3ea5";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff3ea5";
    ctx.beginPath();
    ctx.moveTo(0, pu.radius * 0.7);
    ctx.bezierCurveTo(pu.radius * 1.5, -pu.radius * 0.3, pu.radius * 0.5, -pu.radius * 1.5, 0, -pu.radius * 0.5);
    ctx.bezierCurveTo(-pu.radius * 0.5, -pu.radius * 1.5, -pu.radius * 1.5, -pu.radius * 0.3, 0, pu.radius * 0.7);
    ctx.fill();
  } else {
    ctx.fillStyle = "#ffe55c";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ffe55c";
    ctx.font = "bold 16px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🧲", 0, 0);
  }
  ctx.restore();
}

// ----- Damage numbers -----
export function drawFloater(ctx, f) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, f.life / f.max);
  ctx.fillStyle = f.color;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.font = `bold ${f.size}px Trebuchet MS`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText(f.text, f.x, f.y);
  ctx.fillText(f.text, f.x, f.y);
  ctx.restore();
}

// ----- Glitter trail dots -----
export function drawTrailDot(ctx, d) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, d.life / d.max);
  ctx.fillStyle = d.color;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ----- Utility -----
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ----- Vignette overlay (low HP) -----
export function drawVignette(ctx, W, H, hpPct) {
  if (hpPct > 0.4) return;
  const a = (0.4 - hpPct) * 1.4;
  const g = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.7);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(255, 0, 40, ${Math.min(0.6, a).toFixed(3)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// Small helper used by preview canvases on the title screen.
export function drawGirlPreview(ctx, girl) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2 + 14);
  ctx.scale(3, 3);
  drawSceneGirl(ctx, 0, 0, girl, 0, performance.now() / 1000);
  ctx.restore();
}

// Entry point — wires DOM, loop, and Game together.

import { Game, MODE } from "./game.js";
import { GIRLS } from "./entities/player.js";
import { bindInput, endFrame, justPressed } from "./input.js";
import {
  drawBackground, drawSceneGirl, drawTungTung, drawBoss,
  drawProjectile, drawMeleeArc, drawPickup, drawFloater,
  drawTrailDot, drawVignette, drawGirlPreview,
} from "./draw.js";
import { Projectile, MeleeArc } from "./entities/projectile.js";
import { rollUpgrades, applyUpgrade } from "./upgrades.js";
import { sfx, startMusic, stopMusic, toggleMuted, isMuted, unlockAudio } from "./audio.js";
import { createRng } from "./rng.js";

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");
const titleEl = document.getElementById("title");
const pauseEl = document.getElementById("pause");
const levelupEl = document.getElementById("levelup");
const deathEl = document.getElementById("death");
const victoryEl = document.getElementById("victory");
const toastEl = document.getElementById("toast");

const hpFill = document.getElementById("hp-fill");
const xpFill = document.getElementById("xp-fill");
const lvlEl = document.getElementById("lvl");
const waveNum = document.getElementById("wave-num");
const waveFill = document.getElementById("wave-fill");
const clockEl = document.getElementById("clock");
const killsEl = document.getElementById("kills");
const rosterEl = document.getElementById("roster");
const cdDodge = document.getElementById("cd-dodge");
const cdUlt = document.getElementById("cd-ult");
const cdSwap = document.getElementById("cd-swap");

const game = new Game(canvas.width, canvas.height);
bindInput(canvas);

// ---- Title screen setup ----
let selectedGirl = 0;
const picker = document.getElementById("picker");
GIRLS.forEach((g, i) => {
  const card = document.createElement("div");
  card.className = "pick-card" + (i === 0 ? " selected" : "");
  card.dataset.idx = i;
  const canv = document.createElement("canvas");
  canv.width = 120; canv.height = 140;
  card.appendChild(canv);
  const name = document.createElement("div");
  name.className = "pname";
  name.textContent = g.name;
  card.appendChild(name);
  const desc = document.createElement("div");
  desc.className = "pdesc";
  desc.textContent = g.desc;
  card.appendChild(desc);
  card.addEventListener("click", () => {
    selectedGirl = i;
    document.querySelectorAll(".pick-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    sfx.click();
  });
  picker.appendChild(card);
  card._canvas = canv;
});

// Preview animation loop for title cards
function animatePreviews() {
  document.querySelectorAll(".pick-card").forEach(card => {
    const idx = parseInt(card.dataset.idx, 10);
    const c2d = card._canvas.getContext("2d");
    drawGirlPreview(c2d, GIRLS[idx]);
  });
}

// ---- Start buttons ----
document.getElementById("start-btn").addEventListener("click", () => {
  unlockAudio();
  sfx.click();
  startRun();
});
document.getElementById("restart-btn").addEventListener("click", () => {
  sfx.click();
  startRun();
});
document.getElementById("victory-btn").addEventListener("click", () => {
  sfx.click();
  startRun();
});
document.getElementById("title-btn").addEventListener("click", () => {
  sfx.click();
  showTitle();
});

// Roster chips (click to swap girl in-game)
rosterEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".girl-chip");
  if (!btn) return;
  const idx = parseInt(btn.dataset.girl, 10);
  if (game.mode === MODE.PLAYING && game.player.swapCd <= 0 && game.player.setGirl(idx)) {
    game.player.swapCd = game.player.swapMax * game.player.stats.swapCdMul;
    sfx.swap();
  }
});

function startRun() {
  game.start(selectedGirl);
  titleEl.classList.add("hidden");
  deathEl.classList.add("hidden");
  victoryEl.classList.add("hidden");
  pauseEl.classList.add("hidden");
  levelupEl.classList.add("hidden");
  hud.classList.remove("hidden");
}

function showTitle() {
  game.mode = MODE.TITLE;
  titleEl.classList.remove("hidden");
  deathEl.classList.add("hidden");
  victoryEl.classList.add("hidden");
  pauseEl.classList.add("hidden");
  levelupEl.classList.add("hidden");
  hud.classList.add("hidden");
  stopMusic();
  renderHighScore();
}

// ---- Level-up menu ----
let lastOffered = null;
function openLevelUp() {
  const rand = createRng(Date.now() ^ (game.runTime * 1000) | 0);
  const picks = rollUpgrades(rand, game.player, 3);
  lastOffered = picks;
  const container = document.getElementById("upgrade-cards");
  container.innerHTML = "";
  picks.forEach((u, i) => {
    const card = document.createElement("div");
    card.className = "up-card";
    card.innerHTML = `
      <div class="up-icon">${u.icon}</div>
      <div class="up-name">${u.name}</div>
      <div class="up-desc">${u.desc}</div>
      <div style="font-size:10px;color:#3ef0ff;letter-spacing:0.2em">press ${i + 1}</div>
    `;
    card.addEventListener("click", () => pickUpgrade(u));
    container.appendChild(card);
  });
  levelupEl.classList.remove("hidden");
  game.mode = MODE.LEVELUP;
}

function pickUpgrade(u) {
  applyUpgrade(game.player, u);
  sfx.click();
  levelupEl.classList.add("hidden");
  game.pendingLevelUps = Math.max(0, game.pendingLevelUps - 1);
  if (game.pendingLevelUps > 0) openLevelUp();
  else game.mode = MODE.PLAYING;
}

// ---- Toast ----
let toastT = 0;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  toastT = 1.5;
}

// ---- High score persistence ----
const HS_KEY = "ettsg.highscore";
function loadHighScore() {
  try { return JSON.parse(localStorage.getItem(HS_KEY) || "null"); } catch { return null; }
}
function saveHighScore(entry) {
  try { localStorage.setItem(HS_KEY, JSON.stringify(entry)); } catch {}
}
function renderHighScore() {
  const hs = loadHighScore();
  const txt = hs
    ? `best :: wave ${hs.wave} · ${hs.kills} banished · ${hs.time}s${hs.victory ? " · sunrise" : ""}`
    : "no high score yet — be the first";
  document.getElementById("hiscore-title").textContent = txt;
  document.getElementById("hiscore-death").textContent = txt;
}

function finalizeRun(victory) {
  const p = game.player;
  const result = {
    wave: Math.min(game.waveIndex + 1, 15),
    kills: game.kills,
    time: Math.round(game.runTime),
    victory,
  };
  const prev = loadHighScore();
  const better = !prev || result.kills > prev.kills
    || (result.kills === prev.kills && result.wave > prev.wave)
    || (victory && !prev.victory);
  if (better) saveHighScore(result);

  const statsHtml = `
    wave :: ${result.wave}<br>
    banished :: ${result.kills}<br>
    girl :: ${p.girl.name}<br>
    time :: ${result.time}s<br>
    level :: ${p.level}
  `;
  if (victory) {
    document.getElementById("victory-stats").innerHTML = statsHtml;
    victoryEl.classList.remove("hidden");
  } else {
    document.getElementById("death-stats").innerHTML = statsHtml;
    deathEl.classList.remove("hidden");
  }
  hud.classList.add("hidden");
  renderHighScore();
}

// ---- Main loop ----
let last = performance.now();
let accum = 0;
const FIXED = 1 / 60;

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // Global hotkeys
  if (justPressed("m")) {
    const m = toggleMuted();
    toast(m ? "muted" : "audio on");
  }
  if (justPressed("p") && (game.mode === MODE.PLAYING || game.mode === MODE.PAUSE)) {
    if (game.mode === MODE.PLAYING) { game.mode = MODE.PAUSE; pauseEl.classList.remove("hidden"); stopMusic(); }
    else { game.mode = MODE.PLAYING; pauseEl.classList.add("hidden"); startMusic(); }
  }
  if (justPressed("r") && game.mode === MODE.DEATH) {
    startRun();
  }
  if (game.mode === MODE.LEVELUP) {
    if (justPressed("1") && lastOffered[0]) pickUpgrade(lastOffered[0]);
    else if (justPressed("2") && lastOffered[1]) pickUpgrade(lastOffered[1]);
    else if (justPressed("3") && lastOffered[2]) pickUpgrade(lastOffered[2]);
  }

  // Fixed-timestep update
  accum += dt;
  while (accum >= FIXED) {
    if (game.mode === MODE.PLAYING) {
      game.update(FIXED);
      // Open level up after update finishes the frame
      if (game.mode === MODE.PLAYING && game.pendingLevelUps > 0) openLevelUp();
    }
    accum -= FIXED;
  }

  if (game.mode === MODE.DEATH && !deathEl._shown) {
    deathEl._shown = true;
    finalizeRun(false);
  }
  if (game.mode === MODE.VICTORY && !victoryEl._shown) {
    victoryEl._shown = true;
    finalizeRun(true);
  }
  if (game.mode === MODE.PLAYING) {
    deathEl._shown = false;
    victoryEl._shown = false;
  }

  // Toast fade
  if (toastT > 0) {
    toastT -= dt;
    if (toastT <= 0) toastEl.classList.remove("show");
  }

  render(now / 1000);
  updateHud();
  endFrame();
}

// ---- Render ----
function render(t) {
  ctx.save();

  // screen shake
  if (game.shake > 0) {
    ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  }

  drawBackground(ctx, canvas.width, canvas.height, t);

  if (game.mode === MODE.TITLE) {
    animatePreviews();
    ctx.restore();
    return;
  }

  // Trail dots (under)
  for (const d of game.trailDots) drawTrailDot(ctx, d);
  // Pickups
  for (const pu of game.pickups) drawPickup(ctx, pu, t);
  // Enemies
  for (const e of game.enemies) drawTungTung(ctx, e, t);
  if (game.boss) drawBoss(ctx, game.boss, t);

  // Enemy projectiles
  for (const p of game.enemyProjectiles) drawProjectile(ctx, p, t);

  // Player attacks (arcs first for layering)
  for (const a of game.playerAttacks) {
    if (a instanceof MeleeArc) drawMeleeArc(ctx, a);
  }
  for (const a of game.playerAttacks) {
    if (a instanceof Projectile) drawProjectile(ctx, a, t);
  }

  // Player
  drawSceneGirl(ctx, game.player.x, game.player.y, game.player.girl,
    game.player.facing, t, { iframes: game.player.iFrames, flash: game.player.flash });

  // Floaters
  for (const f of game.floaters) drawFloater(ctx, f);

  // Boss HP bar (top)
  if (game.boss) {
    const bw = 600, bh = 14;
    const x = (canvas.width - bw) / 2;
    const y = 18;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - 2, y - 2, bw + 4, bh + 4);
    ctx.fillStyle = "#3a0a1c";
    ctx.fillRect(x, y, bw, bh);
    const grd = ctx.createLinearGradient(x, 0, x + bw, 0);
    grd.addColorStop(0, "#ff3ea5");
    grd.addColorStop(1, "#ffe55c");
    ctx.fillStyle = grd;
    ctx.fillRect(x, y, bw * (game.boss.hp / game.boss.maxHp), bh);
    ctx.fillStyle = "#ffe7f5";
    ctx.font = "bold 11px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(`TUNG TUNG SUPREME — phase ${game.boss.phase}`, canvas.width / 2, y + bh + 14);
  }

  // Vignette when low
  drawVignette(ctx, canvas.width, canvas.height, game.player.hp / game.player.maxHp);

  ctx.restore();
}

// ---- HUD updating ----
function updateHud() {
  const p = game.player;
  hpFill.style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;
  xpFill.style.width = `${(p.xp / p.xpNext) * 100}%`;
  lvlEl.textContent = `lv ${p.level}`;
  waveNum.textContent = game.waveLabel();
  const wave = game.mode === MODE.PLAYING ? game.waveIndex : 0;
  const dur = Math.max(1, (game.mode === MODE.PLAYING ? (game.runTime > 0 ? (game.waveTimer / (getWaveDuration(wave))) : 0) : 0));
  waveFill.style.width = `${Math.min(100, dur * 100)}%`;
  clockEl.textContent = game.clockText();
  killsEl.textContent = `${game.kills} banished`;

  // Roster active state
  document.querySelectorAll(".girl-chip").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.girl, 10) === p.girlIndex);
  });

  // Cooldown fills
  setCd(cdDodge, p.dodgeCd, p.dodgeMax);
  setCd(cdUlt, p.ultCd, p.ultMax * p.stats.ultCdMul);
  setCd(cdSwap, p.swapCd, p.swapMax * p.stats.swapCdMul);
}

function setCd(el, remaining, max) {
  const ready = remaining <= 0;
  el.classList.toggle("ready", ready);
  const em = el.querySelector("em");
  if (em) em.style.width = ready ? "100%" : `${(1 - remaining / max) * 100}%`;
}

function getWaveDuration(idx) {
  // mirror the waves.js schedule roughly
  const specials = { 4: 40, 9: 40, 14: 999 };
  return specials[idx] || 32;
}

// ---- Boot ----
renderHighScore();
requestAnimationFrame(loop);

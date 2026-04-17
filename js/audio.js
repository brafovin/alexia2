// Web Audio API synth cues. Entirely procedural — no asset files.
// Silent / no-op if Web Audio unavailable.

let ctx = null;
let master = null;
let musicGain = null;
let sfxGain = null;
let muted = false;
let musicTimer = null;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.55;
    sfxGain.connect(master);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.18;
    musicGain.connect(master);
  } catch (err) {
    ctx = null;
  }
  return ctx;
}

export function unlockAudio() {
  // Must be called from a user gesture.
  ensureCtx();
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.5;
}
export function toggleMuted() { setMuted(!muted); return muted; }
export function isMuted() { return muted; }

function env(node, t, attack, hold, release, peak = 1) {
  const g = node.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(0, t);
  g.linearRampToValueAtTime(peak, t + attack);
  g.linearRampToValueAtTime(peak, t + attack + hold);
  g.linearRampToValueAtTime(0, t + attack + hold + release);
}

function tone(freq, dur = 0.08, type = "square", vol = 0.5, slide = 0) {
  if (!ensureCtx() || muted) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, t0 + dur);
  osc.connect(g);
  g.connect(sfxGain);
  env(g, t0, 0.005, Math.max(0.005, dur * 0.4), Math.max(0.02, dur * 0.6), vol);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur = 0.1, vol = 0.5, hp = 1500) {
  if (!ensureCtx() || muted) return;
  const t0 = ctx.currentTime;
  const len = Math.max(1, (ctx.sampleRate * dur) | 0);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hp;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(filter);
  filter.connect(g);
  g.connect(sfxGain);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

// ---- Exposed SFX ----
export const sfx = {
  swing: () => noiseBurst(0.08, 0.5, 800),
  shoot: () => tone(880, 0.06, "square", 0.35, -400),
  spread: () => { tone(720, 0.05, "square", 0.25, -300); tone(980, 0.05, "triangle", 0.2, -300); },
  hit: () => tone(220, 0.06, "square", 0.35, -120),
  kill: () => { tone(340, 0.05, "square", 0.4, -200); setTimeout(() => tone(180, 0.06, "square", 0.35, -80), 40); },
  xp: () => tone(1200, 0.05, "triangle", 0.3, 300),
  levelUp: () => {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, i) => setTimeout(() => tone(n, 0.09, "square", 0.35, 0), i * 70));
  },
  damage: () => { tone(120, 0.15, "sawtooth", 0.5, -40); noiseBurst(0.08, 0.3, 200); },
  dodge: () => tone(660, 0.05, "sine", 0.25, 400),
  swap: () => { tone(520, 0.04, "triangle", 0.3, 200); setTimeout(() => tone(780, 0.06, "triangle", 0.3, 100), 30); },
  ult: () => {
    noiseBurst(0.2, 0.5, 400);
    setTimeout(() => tone(330, 0.2, "sawtooth", 0.4, -80), 40);
  },
  bossRoar: () => {
    if (!ensureCtx() || muted) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, t0);
    osc.frequency.linearRampToValueAtTime(40, t0 + 0.8);
    osc.connect(g);
    g.connect(sfxGain);
    env(g, t0, 0.02, 0.6, 0.3, 0.6);
    osc.start(t0);
    osc.stop(t0 + 1);
  },
  death: () => {
    const notes = [440, 330, 220, 140];
    notes.forEach((n, i) => setTimeout(() => tone(n, 0.2, "sawtooth", 0.35, -60), i * 120));
  },
  victory: () => {
    const notes = [523, 659, 784, 1046, 1319];
    notes.forEach((n, i) => setTimeout(() => tone(n, 0.15, "triangle", 0.35, 0), i * 90));
  },
  click: () => tone(1100, 0.03, "square", 0.25, 0),
};

// ---- Background chiptune loop (very loose bass+arp) ----
const BASS = [110, 130.8, 146.8, 110, 98, 110, 130.8, 146.8];   // A minor-ish
const ARP = [440, 523, 659, 523, 587, 698, 880, 698];
let musicStep = 0;

export function startMusic() {
  ensureCtx();
  if (!ctx || musicTimer) return;
  const step = () => {
    if (!ctx || muted === false) playMusicStep();
    musicStep++;
  };
  musicTimer = setInterval(step, 230);
}
export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
}

function playMusicStep() {
  if (!ensureCtx()) return;
  const t0 = ctx.currentTime;
  // Bass
  const bassOsc = ctx.createOscillator();
  const bassG = ctx.createGain();
  bassOsc.type = "triangle";
  bassOsc.frequency.value = BASS[musicStep % BASS.length];
  bassOsc.connect(bassG);
  bassG.connect(musicGain);
  env(bassG, t0, 0.01, 0.1, 0.1, 0.35);
  bassOsc.start(t0);
  bassOsc.stop(t0 + 0.25);

  // Arp (on odd steps)
  if (musicStep % 2 === 0) {
    const arpOsc = ctx.createOscillator();
    const arpG = ctx.createGain();
    arpOsc.type = "square";
    arpOsc.frequency.value = ARP[musicStep % ARP.length];
    arpOsc.connect(arpG);
    arpG.connect(musicGain);
    env(arpG, t0, 0.005, 0.03, 0.08, 0.18);
    arpOsc.start(t0);
    arpOsc.stop(t0 + 0.15);
  }
}

// Wave schedule: spawn tables, mini-boss/boss triggers, ramping difficulty.

const WAVE_DURATION = 32;  // seconds per wave (keeps runs snappy)

// Each wave defines a weighted enemy pool and a spawn rate.
// Rate is spawns-per-second (total across pool), scaled up over the wave.
const WAVES = [
  // 1
  { duration: WAVE_DURATION, rate: 0.9, tier: 1.0, pool: [{ type: "shambler", w: 1 }] },
  // 2
  { duration: WAVE_DURATION, rate: 1.1, tier: 1.05, pool: [{ type: "shambler", w: 3 }, { type: "sprinter", w: 1 }] },
  // 3 — emo tung debuts
  { duration: WAVE_DURATION, rate: 1.3, tier: 1.1, pool: [{ type: "shambler", w: 3 }, { type: "sprinter", w: 1 }, { type: "shrieker", w: 1 }, { type: "emoTung", w: 1 }] },
  // 4 — evil duo debuts as rare elite
  { duration: WAVE_DURATION, rate: 1.5, tier: 1.15, pool: [{ type: "shambler", w: 2 }, { type: "sprinter", w: 2 }, { type: "shrieker", w: 1 }, { type: "emoTung", w: 2 }, { type: "duo", w: 1 }] },
  // 5 — mini-boss (mallet king) + adds
  { duration: WAVE_DURATION + 8, rate: 0.8, tier: 1.0, miniBoss: true, pool: [{ type: "shambler", w: 3 }, { type: "mallet", w: 1 }, { type: "emoTung", w: 1 }] },
  // 6
  { duration: WAVE_DURATION, rate: 1.6, tier: 1.2, pool: [{ type: "shambler", w: 2 }, { type: "sprinter", w: 2 }, { type: "shrieker", w: 2 }, { type: "mallet", w: 1 }, { type: "emoTung", w: 2 }, { type: "duo", w: 1 }] },
  // 7
  { duration: WAVE_DURATION, rate: 1.8, tier: 1.25, pool: [{ type: "sprinter", w: 3 }, { type: "shrieker", w: 2 }, { type: "mallet", w: 1 }, { type: "emoTung", w: 2 }, { type: "duo", w: 1 }] },
  // 8
  { duration: WAVE_DURATION, rate: 2.0, tier: 1.3, pool: [{ type: "shambler", w: 2 }, { type: "sprinter", w: 3 }, { type: "shrieker", w: 2 }, { type: "mallet", w: 2 }, { type: "emoTung", w: 3 }, { type: "duo", w: 1 }] },
  // 9
  { duration: WAVE_DURATION, rate: 2.2, tier: 1.4, pool: [{ type: "shambler", w: 2 }, { type: "sprinter", w: 3 }, { type: "shrieker", w: 3 }, { type: "mallet", w: 2 }, { type: "emoTung", w: 3 }, { type: "duo", w: 2 }] },
  // 10 — second mini-boss
  { duration: WAVE_DURATION + 8, rate: 1.0, tier: 1.3, miniBoss: true, pool: [{ type: "shambler", w: 2 }, { type: "sprinter", w: 2 }, { type: "mallet", w: 2 }, { type: "emoTung", w: 2 }, { type: "duo", w: 1 }] },
  // 11
  { duration: WAVE_DURATION, rate: 2.3, tier: 1.5, pool: [{ type: "shambler", w: 2 }, { type: "sprinter", w: 3 }, { type: "shrieker", w: 3 }, { type: "mallet", w: 3 }, { type: "emoTung", w: 3 }, { type: "duo", w: 2 }] },
  // 12
  { duration: WAVE_DURATION, rate: 2.6, tier: 1.6, pool: [{ type: "sprinter", w: 4 }, { type: "shrieker", w: 3 }, { type: "mallet", w: 3 }, { type: "emoTung", w: 3 }, { type: "duo", w: 2 }] },
  // 13
  { duration: WAVE_DURATION, rate: 2.9, tier: 1.75, pool: [{ type: "shambler", w: 3 }, { type: "sprinter", w: 4 }, { type: "shrieker", w: 3 }, { type: "mallet", w: 3 }, { type: "emoTung", w: 4 }, { type: "duo", w: 2 }] },
  // 14 — calm before boss
  { duration: WAVE_DURATION - 6, rate: 2.2, tier: 1.6, pool: [{ type: "shambler", w: 3 }, { type: "sprinter", w: 3 }, { type: "mallet", w: 2 }, { type: "emoTung", w: 3 }, { type: "duo", w: 2 }] },
  // 15 — FINAL BOSS
  { duration: 9999, rate: 0.35, tier: 1.5, bossWave: true, pool: [{ type: "shambler", w: 2 }, { type: "sprinter", w: 1 }] },
];

export function getWave(index) {
  if (index < WAVES.length) return WAVES[index];
  // Past wave 15 (boss defeated in main flow; but return escalating fallback)
  const extra = index - (WAVES.length - 1);
  return {
    duration: WAVE_DURATION,
    rate: 3 + extra * 0.3,
    tier: 1.8 + extra * 0.2,
    pool: [
      { type: "shambler", w: 2 }, { type: "sprinter", w: 3 },
      { type: "shrieker", w: 3 }, { type: "mallet", w: 3 },
      { type: "emoTung", w: 3 }, { type: "duo", w: 2 },
    ],
  };
}

export function totalWaves() { return WAVES.length; }

export function pickEnemy(wave, rand = Math.random) {
  let total = 0;
  for (const e of wave.pool) total += e.w;
  let r = rand() * total;
  for (const e of wave.pool) {
    r -= e.w;
    if (r <= 0) return e.type;
  }
  return wave.pool[0].type;
}

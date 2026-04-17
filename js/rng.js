// Small mulberry32 PRNG + helpers. Not cryptographic.

export function createRng(seed = Date.now() >>> 0) {
  let s = seed >>> 0;
  return function rand() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rand, arr) { return arr[(rand() * arr.length) | 0]; }
export function range(rand, min, max) { return min + rand() * (max - min); }
export function chance(rand, p) { return rand() < p; }

// Pick N distinct items from arr using weights[i] (optional).
export function weightedPickN(rand, items, n, getWeight = () => 1) {
  const pool = items.slice();
  const out = [];
  while (out.length < n && pool.length) {
    let total = 0;
    for (const it of pool) total += getWeight(it);
    let r = rand() * total;
    let idx = 0;
    for (; idx < pool.length; idx++) {
      r -= getWeight(pool[idx]);
      if (r <= 0) break;
    }
    if (idx >= pool.length) idx = pool.length - 1;
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

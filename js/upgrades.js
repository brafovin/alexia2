// Level-up upgrade pool + choose-3 UI.

import { weightedPickN } from "./rng.js";

export const UPGRADES = [
  {
    id: "dmg",
    icon: "💥",
    name: "heavier swings",
    desc: "+20% damage",
    apply(p) { p.stats.damage *= 1.2; },
    repeatable: true,
  },
  {
    id: "atkspeed",
    icon: "⚡",
    name: "caffeine",
    desc: "+18% attack speed",
    apply(p) { p.stats.atkSpeed *= 1.18; },
    repeatable: true,
  },
  {
    id: "speed",
    icon: "🛼",
    name: "scene girl kick-flip",
    desc: "+12% move speed",
    apply(p) { p.stats.moveSpeed *= 1.12; },
    repeatable: true,
  },
  {
    id: "hp",
    icon: "💖",
    name: "emo resolve",
    desc: "+20 max hp (and heal)",
    apply(p) { p.maxHp += 20; p.hp += 20; },
    repeatable: true,
  },
  {
    id: "magnet",
    icon: "🧲",
    name: "xp magnet",
    desc: "+60 magnet radius",
    apply(p) { p.stats.magnet += 60; },
    repeatable: true,
  },
  {
    id: "pierce",
    icon: "🗡️",
    name: "sharper scissors",
    desc: "projectiles pierce +1 enemy",
    apply(p) { p.stats.pierce += 1; },
    repeatable: true,
  },
  {
    id: "multishot",
    icon: "✨",
    name: "extra sparkle",
    desc: "+1 projectile / pellet",
    apply(p) { p.stats.projectiles += 1; },
    repeatable: true,
    max: 3,
  },
  {
    id: "lifesteal",
    icon: "🩸",
    name: "vampire phase",
    desc: "heal 4% of damage dealt",
    apply(p) { p.stats.lifesteal += 0.04; },
    repeatable: true,
    max: 5,
  },
  {
    id: "thorns",
    icon: "🌹",
    name: "spikes all over",
    desc: "reflect 6 damage on contact",
    apply(p) { p.stats.thorns += 6; },
    repeatable: true,
  },
  {
    id: "trail",
    icon: "🌟",
    name: "glitter trail",
    desc: "leave a damaging trail",
    apply(p) { p.stats.glitterTrail += 3; },
    repeatable: true,
    max: 4,
  },
  {
    id: "swap",
    icon: "💫",
    name: "quick change",
    desc: "−50% swap cooldown",
    apply(p) { p.stats.swapCdMul *= 0.5; },
    repeatable: false,
  },
  {
    id: "ult",
    icon: "💅",
    name: "main-character energy",
    desc: "−25% ultimate cooldown",
    apply(p) { p.stats.ultCdMul *= 0.75; },
    repeatable: true,
    max: 3,
  },
  {
    id: "range",
    icon: "🦇",
    name: "longer reach",
    desc: "raven's arc +15 radius",
    apply(p) { p.stats.range += 1; },
    repeatable: true,
    max: 4,
  },
];

export function rollUpgrades(rand, player, count = 3) {
  const seen = player.upgradeCounts || {};
  const pool = UPGRADES.filter(u => {
    const c = seen[u.id] || 0;
    return !u.max || c < u.max;
  });
  return weightedPickN(rand, pool, Math.min(count, pool.length));
}

export function applyUpgrade(player, up) {
  up.apply(player);
  player.upgradeCounts = player.upgradeCounts || {};
  player.upgradeCounts[up.id] = (player.upgradeCounts[up.id] || 0) + 1;
}

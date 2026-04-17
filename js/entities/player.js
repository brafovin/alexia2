// Scene-girl player. Three girls share one HP/XP pool; swapping changes
// weapon, stats, and ultimate.

import { Projectile, MeleeArc } from "./projectile.js";

// ---- Scene-girl configs ----
// Each girl has a weapon function(player, game, targetX, targetY) that spawns
// projectiles/melee arcs into game.playerAttacks. Stats are multiplicative
// against base values so upgrades apply uniformly.
export const GIRLS = [
  {
    id: 0,
    name: "raven",
    hairColor: "#1a1720",
    hairStreak: "#3ef0ff",
    shirt: "#2a1836",
    stripe: "#ff3ea5",
    pupil: "x",
    pupilColor: "#ff3ea5",
    baseSpeed: 175,
    atkCooldown: 0.45,
    desc: "teal-black teased bangs. studded bat. big wide melee arcs.",
    weapon(player, game, tx, ty) {
      const dx = tx - player.x, dy = ty - player.y;
      const ang = Math.atan2(dy, dx);
      const dmg = 22 * player.stats.damage;
      game.playerAttacks.push(new MeleeArc({
        x: player.x, y: player.y,
        angle: ang,
        arc: Math.PI * 0.95,
        radius: 95 + player.stats.range * 15,
        dmg,
        life: 0.22,
        color: "#ff3ea5",
        knockback: 260,
      }));
    },
    ult(player, game) {
      // 360 spin for 0.9s
      const t = 0.9;
      const dmg = 16 * player.stats.damage;
      player.spinUntil = player.spinTime = t;
      player.spinDmg = dmg;
    },
  },
  {
    id: 1,
    name: "scarlet",
    hairColor: "#1a1720",
    hairStreak: "#ff7ab6",
    shirt: "#4a0f24",
    stripe: "#ffe55c",
    pupil: "heart",
    pupilColor: "#ff4d6d",
    baseSpeed: 195,
    atkCooldown: 0.38,
    desc: "red choppy layers. thrown scissors. pierce through 2 logs.",
    weapon(player, game, tx, ty) {
      const dx = tx - player.x, dy = ty - player.y;
      const d = Math.hypot(dx, dy) || 1;
      const ang = Math.atan2(dy, dx);
      const base = 13 * player.stats.damage;
      const count = 1 + Math.max(0, player.stats.projectiles - 1);
      const spread = (count - 1) * 0.12;
      for (let i = 0; i < count; i++) {
        const a = ang + (i - (count - 1) / 2) * 0.12;
        game.playerAttacks.push(new Projectile({
          x: player.x, y: player.y,
          vx: Math.cos(a) * 620, vy: Math.sin(a) * 620,
          dmg: base, radius: 10, life: 1.0,
          color: "#ff7ab6", trailColor: "#ffe55c",
          friendly: true,
          pierce: 2 + player.stats.pierce,
          spin: 18,
          kind: "scissor",
        }));
      }
    },
    ult(player, game) {
      // Blade rain over 1.2s
      player.rainTime = 1.2;
      player.rainCooldown = 0;
    },
  },
  {
    id: 2,
    name: "violet",
    hairColor: "#2c1744",
    hairStreak: "#c89cff",
    shirt: "#1a1038",
    stripe: "#c89cff",
    pupil: "star",
    pupilColor: "#c89cff",
    baseSpeed: 165,
    atkCooldown: 0.55,
    desc: "purple-pink mohawk. glitter shotgun. 5-pellet spread, short range.",
    weapon(player, game, tx, ty) {
      const dx = tx - player.x, dy = ty - player.y;
      const ang = Math.atan2(dy, dx);
      const base = 7 * player.stats.damage;
      const pellets = 5 + Math.max(0, player.stats.projectiles - 1);
      const spread = 0.55;
      for (let i = 0; i < pellets; i++) {
        const t = pellets === 1 ? 0 : i / (pellets - 1) - 0.5;
        const a = ang + t * spread + (Math.random() - 0.5) * 0.06;
        const spd = 460 + Math.random() * 80;
        game.playerAttacks.push(new Projectile({
          x: player.x, y: player.y,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          dmg: base, radius: 6, life: 0.55,
          color: ["#c89cff", "#ff8ed0", "#ffe55c", "#3ef0ff"][i % 4],
          friendly: true,
          pierce: 0 + player.stats.pierce,
          kind: "glitter",
        }));
      }
    },
    ult(player, game) {
      // Glitter nova — radial burst
      const n = 28;
      const dmg = 10 * player.stats.damage;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        game.playerAttacks.push(new Projectile({
          x: player.x, y: player.y,
          vx: Math.cos(a) * 420, vy: Math.sin(a) * 420,
          dmg, radius: 8, life: 0.7,
          color: i % 2 ? "#c89cff" : "#ff8ed0",
          friendly: true,
          pierce: 3,
          kind: "glitter",
        }));
      }
    },
  },
];

export class Player {
  constructor() {
    this.x = 480; this.y = 300;
    this.radius = 16;
    this.girlIndex = 0;
    this.girl = GIRLS[0];
    this.hp = 100;
    this.maxHp = 100;
    this.xp = 0;
    this.level = 1;
    this.xpNext = 6;
    this.stats = {
      damage: 1.0,
      atkSpeed: 1.0,
      moveSpeed: 1.0,
      range: 0,         // raven arc extra radius
      pierce: 0,
      projectiles: 1,   // extra shots modifier
      magnet: 120,
      lifesteal: 0,
      thorns: 0,
      glitterTrail: 0,
      swapCdMul: 1.0,
      ultCdMul: 1.0,
    };
    this.attackCd = 0;
    this.ultCd = 0;
    this.ultMax = 20;
    this.dodgeCd = 0;
    this.dodgeMax = 3;
    this.swapCd = 0;
    this.swapMax = 0.6;
    this.iFrames = 0;
    this.flash = 0;

    // ability state
    this.spinTime = 0;
    this.spinDmg = 0;
    this.spinUntil = 0;
    this.rainTime = 0;
    this.rainCooldown = 0;

    this.facing = 0;
    this.lastMoveX = 1; this.lastMoveY = 0;
    this.dead = false;
  }

  setGirl(i) {
    if (i < 0 || i >= GIRLS.length || i === this.girlIndex) return false;
    this.girlIndex = i;
    this.girl = GIRLS[i];
    return true;
  }

  takeDamage(amount) {
    if (this.iFrames > 0) return false;
    this.hp -= amount;
    this.iFrames = 0.6;
    this.flash = 0.25;
    if (this.hp <= 0) { this.hp = 0; this.dead = true; }
    return true;
  }

  gainXp(n) {
    this.xp += n;
    const levels = [];
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = Math.floor(this.xpNext * 1.38 + 2);
      levels.push(this.level);
    }
    return levels;
  }

  heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); }
}

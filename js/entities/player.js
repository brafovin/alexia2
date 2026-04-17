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
  {
    id: 3,
    name: "duo",
    owl: true,
    bodyColor: "#58cc02",
    bodyDark: "#2b6605",
    belly: "#e7ffc2",
    beak: "#ff8a1a",
    hairColor: "#2b6605",
    hairStreak: "#ff2b2b",
    shirt: "#58cc02",
    stripe: "#ff2b2b",
    pupil: "notif",
    pupilColor: "#ff4d1a",
    baseSpeed: 180,
    atkCooldown: 0.42,
    desc: "duolingo drop-out. throws flashcards. streak-fire ultimate.",
    weapon(player, game, tx, ty) {
      const dx = tx - player.x, dy = ty - player.y;
      const ang = Math.atan2(dy, dx);
      const base = 11 * player.stats.damage;
      const cards = 3 + Math.max(0, player.stats.projectiles - 1);
      const spread = 0.34;
      const letters = ["A", "B", "C", "¡", "ñ", "¿", "!"];
      for (let i = 0; i < cards; i++) {
        const f = cards === 1 ? 0 : i / (cards - 1) - 0.5;
        const a = ang + f * spread;
        const spd = 500;
        game.playerAttacks.push(new Projectile({
          x: player.x, y: player.y,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          dmg: base, radius: 9, life: 0.9,
          color: "#ffffff", trailColor: "#58cc02",
          friendly: true,
          pierce: 1 + player.stats.pierce,
          spin: 10,
          kind: "flashcard",
          glyph: letters[(i + ((Math.random() * 7) | 0)) % letters.length],
        }));
      }
    },
    ult(player, game) {
      // Streak storm — radial burst of streak-flames
      const n = 24;
      const dmg = 13 * player.stats.damage;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        game.playerAttacks.push(new Projectile({
          x: player.x, y: player.y,
          vx: Math.cos(a) * 400, vy: Math.sin(a) * 400,
          dmg, radius: 10, life: 0.85,
          color: "#ff4d1a", trailColor: "#ffe55c",
          friendly: true,
          pierce: 4,
          kind: "streak",
        }));
      }
    },
  },
  {
    id: 4,
    name: "daron",
    emoGuy: true,
    hairColor: "#f6d870",      // blond mullet
    hairDark: "#a88b1e",
    hairStreak: "#1a0e1e",
    shirt: "#0a0410",
    stripe: "#ff3ea5",
    pupil: "x",
    pupilColor: "#000000",
    baseSpeed: 178,
    atkCooldown: 0.38,
    desc: "blond mullet. eyeliner. rips sound-wave riffs at midrange.",
    weapon(player, game, tx, ty) {
      const dx = tx - player.x, dy = ty - player.y;
      const ang = Math.atan2(dy, dx);
      const base = 10 * player.stats.damage;
      const notes = 3 + Math.max(0, player.stats.projectiles - 1);
      const spread = 0.45;
      const glyphs = ["♪", "♫", "♩", "♬"];
      for (let i = 0; i < notes; i++) {
        const f = notes === 1 ? 0 : i / (notes - 1) - 0.5;
        const a = ang + f * spread;
        const spd = 520 + (Math.abs(f) * 30);
        game.playerAttacks.push(new Projectile({
          x: player.x, y: player.y,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          dmg: base, radius: 9, life: 0.85,
          color: "#ff3ea5", trailColor: "#3ef0ff",
          friendly: true,
          pierce: 1 + player.stats.pierce,
          spin: 6,
          kind: "note",
          glyph: glyphs[i % glyphs.length],
        }));
      }
    },
    ult(player, game) {
      // Mosh pit — three expanding shockwave rings around the player.
      const dmg = 18 * player.stats.damage;
      for (let i = 0; i < 3; i++) {
        game.playerAttacks.push(new MeleeArc({
          x: player.x, y: player.y,
          angle: 0,
          arc: Math.PI * 2,
          radius: 90 + i * 55,
          dmg,
          life: 0.25 + i * 0.12,
          color: i === 0 ? "#ff3ea5" : (i === 1 ? "#c89cff" : "#3ef0ff"),
          knockback: 260,
        }));
      }
    },
  },
  {
    id: 5,
    name: "chad",
    chad: true,
    skin: "#e8c08a",
    skinDark: "#a07040",
    hair: "#3a2414",
    shirt: "#1a1a24",
    pupil: "dot",
    pupilColor: "#1a0a0a",
    baseSpeed: 158,
    atkCooldown: 0.52,
    desc: "jacked jawline. chad punches up close. big alpha aura ult.",
    weapon(player, game, tx, ty) {
      const dx = tx - player.x, dy = ty - player.y;
      const ang = Math.atan2(dy, dx);
      const dmg = 26 * player.stats.damage;
      game.playerAttacks.push(new MeleeArc({
        x: player.x, y: player.y,
        angle: ang,
        arc: Math.PI * 0.55,
        radius: 80 + player.stats.range * 12,
        dmg,
        life: 0.2,
        color: "#ffe55c",
        knockback: 340,
      }));
    },
    ult(player, game) {
      // Alpha aura — huge 360 AoE pulse
      game.playerAttacks.push(new MeleeArc({
        x: player.x, y: player.y,
        angle: 0,
        arc: Math.PI * 2,
        radius: 200,
        dmg: 40 * player.stats.damage,
        life: 0.35,
        color: "#ffe55c",
        knockback: 420,
      }));
    },
  },
  {
    id: 6,
    name: "shrek",
    shrek: true,
    skin: "#7aa84d",
    skinDark: "#3f5e22",
    belly: "#a7c97a",
    shirt: "#8a5a2b",
    stripe: "#d4a06a",
    pupil: "dot",
    pupilColor: "#1a0a0a",
    baseSpeed: 150,
    atkCooldown: 0.7,
    desc: "swamp ogre. lobs onion bombs that burst on impact.",
    weapon(player, game, tx, ty) {
      const dx = tx - player.x, dy = ty - player.y;
      const ang = Math.atan2(dy, dx);
      const dmg = 16 * player.stats.damage;
      // Big slow onion bomb; on first hit/lifeout it bursts (game handles via kind "onion")
      game.playerAttacks.push(new Projectile({
        x: player.x, y: player.y,
        vx: Math.cos(ang) * 340, vy: Math.sin(ang) * 340,
        dmg, radius: 13, life: 0.85,
        color: "#7aa84d", trailColor: "#d4a06a",
        friendly: true,
        pierce: 0 + player.stats.pierce,
        spin: 5,
        kind: "onion",
        burstDmg: dmg * 0.8,
        burstRadius: 90,
      }));
    },
    ult(player, game) {
      // Swamp slam — expanding green shockwave
      game.playerAttacks.push(new MeleeArc({
        x: player.x, y: player.y,
        angle: 0,
        arc: Math.PI * 2,
        radius: 220,
        dmg: 34 * player.stats.damage,
        life: 0.5,
        color: "#7aa84d",
        knockback: 460,
      }));
      // plus 12 onion fragments
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        game.playerAttacks.push(new Projectile({
          x: player.x, y: player.y,
          vx: Math.cos(a) * 380, vy: Math.sin(a) * 380,
          dmg: 16 * player.stats.damage, radius: 10, life: 0.7,
          color: "#7aa84d", trailColor: "#d4a06a",
          friendly: true, pierce: 2,
          spin: 10, kind: "onion",
        }));
      }
    },
  },
  {
    id: 7,
    name: "doge",
    doge: true,
    fur: "#d7a867",
    furDark: "#8d6a32",
    belly: "#fff1d6",
    shirt: "#d7a867",
    stripe: "#ffffff",
    pupil: "dot",
    pupilColor: "#1a0a0a",
    baseSpeed: 200,
    atkCooldown: 0.36,
    desc: "such shiba. flings comic-sans words. much damage. very speed.",
    weapon(player, game, tx, ty) {
      const dx = tx - player.x, dy = ty - player.y;
      const ang = Math.atan2(dy, dx);
      const base = 9 * player.stats.damage;
      const count = 2 + Math.max(0, player.stats.projectiles - 1);
      const words = ["wow", "such", "much", "very", "so"];
      const spread = 0.28;
      for (let i = 0; i < count; i++) {
        const f = count === 1 ? 0 : i / (count - 1) - 0.5;
        const a = ang + f * spread;
        game.playerAttacks.push(new Projectile({
          x: player.x, y: player.y,
          vx: Math.cos(a) * 540, vy: Math.sin(a) * 540,
          dmg: base, radius: 11, life: 0.8,
          color: "#ffe55c", trailColor: "#d7a867",
          friendly: true,
          pierce: 1 + player.stats.pierce,
          spin: 0,
          kind: "doge",
          glyph: words[(Math.random() * words.length) | 0],
        }));
      }
    },
    ult(player, game) {
      // much bark — radial word storm
      const n = 20;
      const dmg = 11 * player.stats.damage;
      const words = ["wow", "such", "bark", "many", "very", "so"];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        game.playerAttacks.push(new Projectile({
          x: player.x, y: player.y,
          vx: Math.cos(a) * 420, vy: Math.sin(a) * 420,
          dmg, radius: 11, life: 0.8,
          color: i % 2 ? "#ffe55c" : "#3ef0ff",
          trailColor: "#d7a867",
          friendly: true, pierce: 3,
          kind: "doge",
          glyph: words[i % words.length],
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

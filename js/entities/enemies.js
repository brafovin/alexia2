// Evil Tung Tung enemy roster + AI.

import { Projectile } from "./projectile.js";

export const ENEMY_TYPES = {
  shambler: {
    name: "shambler",
    hp: 18, speed: 55, radius: 16, dmg: 10, xp: 1,
    color: "#8b5a2b", dark: "#4b2e13", tint: "#ff3ea5",
    bob: 5.5, faceScale: 1,
  },
  shrieker: {
    name: "shrieker",
    hp: 22, speed: 28, radius: 18, dmg: 8, xp: 2,
    color: "#a87443", dark: "#5b3517", tint: "#ffe55c",
    bob: 3.5, faceScale: 1.2,
    ranged: true,
    fireInterval: 1.7,
    preferredDist: 260,
  },
  sprinter: {
    name: "sprinter",
    hp: 10, speed: 140, radius: 11, dmg: 8, xp: 1,
    color: "#6f4120", dark: "#3a2010", tint: "#3ef0ff",
    bob: 8, faceScale: 0.9,
  },
  mallet: {
    name: "mallet",
    hp: 85, speed: 38, radius: 26, dmg: 22, xp: 5,
    color: "#6b3e17", dark: "#3a210c", tint: "#ff4d6d",
    bob: 3, faceScale: 1.4,
    heavy: true,
    knockback: 320,
  },
  miniboss: {
    name: "mallet king",
    hp: 360, speed: 48, radius: 34, dmg: 28, xp: 15,
    color: "#7a461b", dark: "#3a210c", tint: "#ffe55c",
    bob: 3, faceScale: 1.6,
    heavy: true,
    knockback: 400,
    crown: true,
  },
  emoTung: {
    name: "emo tung",
    hp: 40, speed: 62, radius: 17, dmg: 12, xp: 3,
    color: "#2a1c36", dark: "#140a20", tint: "#ff3ea5",
    bob: 4, faceScale: 1.1,
    emo: true,
    fireInterval: 2.4,
    preferredDist: 200,
  },
  duo: {
    name: "evil duo",
    hp: 70, speed: 0, radius: 20, dmg: 14, xp: 6,
    // Duolingo-green body, fiery-red eyes, orange beak
    color: "#58cc02", dark: "#2b6605", tint: "#ff4d1a",
    bob: 0, faceScale: 1,
    duo: true,
    teleportInterval: 2.6,
    fanInterval: 0.55,      // delay between teleport snap and fan shot
    preferredDist: 200,
  },
};

export class Enemy {
  constructor(type, x, y, tier = 1) {
    const base = ENEMY_TYPES[type];
    this.type = type;
    this.def = base;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.hp = base.hp * tier;
    this.maxHp = this.hp;
    this.speed = base.speed;
    this.radius = base.radius;
    this.dmg = base.dmg;
    this.xp = base.xp * Math.ceil(tier);
    this.tier = tier;
    this.alive = true;
    this.flash = 0;
    this.wobble = Math.random() * Math.PI * 2;
    this.fireTimer = 0.6 + Math.random() * 1.2;
    this.knockbackX = 0;
    this.knockbackY = 0;
    this.stun = 0;
    this.angry = Math.random() * 0.4;
    this.hitCooldown = 0;  // prevent multi-hit on same frame from single arc
    // Duo teleport state (only used when def.duo)
    this.tpCharge = 0;   // >0 = telegraphing / fading out
    this.tpArrive = 0;   // >0 = just arrived (brief anim)
    this.fireDelay = 0;  // >0 = counting down to fan shot
  }

  update(dt, game) {
    this.wobble += dt * 4;
    this.flash = Math.max(0, this.flash - dt);
    this.hitCooldown = Math.max(0, this.hitCooldown - dt);

    const player = game.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    // Knockback decay
    if (this.knockbackX || this.knockbackY) {
      this.x += this.knockbackX * dt;
      this.y += this.knockbackY * dt;
      this.knockbackX *= 0.86;
      this.knockbackY *= 0.86;
      if (Math.abs(this.knockbackX) < 2) this.knockbackX = 0;
      if (Math.abs(this.knockbackY) < 2) this.knockbackY = 0;
    }

    if (this.stun > 0) {
      this.stun -= dt;
    } else if (this.def.ranged) {
      // Shrieker — maintain preferred distance, fire
      const pref = this.def.preferredDist;
      const dir = dist > pref ? 1 : dist < pref - 50 ? -1 : 0;
      this.vx = (dx / dist) * this.speed * dir;
      this.vy = (dy / dist) * this.speed * dir;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      this.fireTimer -= dt;
      if (this.fireTimer <= 0 && dist < pref + 120) {
        const a = Math.atan2(dy, dx);
        const spd = 220;
        game.enemyProjectiles.push(new Projectile({
          x: this.x, y: this.y,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          dmg: this.dmg,
          radius: 9,
          life: 2.0,
          color: "#ffe55c",
          trailColor: "#ff4d6d",
          friendly: false,
          kind: "tung",
        }));
        this.fireTimer = this.def.fireInterval + Math.random() * 0.5;
      }
    } else if (this.def.duo) {
      // Evil Duo — teleports near the player, then fans streak fire at them.
      if (this.tpCharge > 0) {
        // fading out, no movement
        this.tpCharge -= dt;
        if (this.tpCharge <= 0) {
          // Snap to a spot at preferredDist from player at a random angle
          const pang = Math.random() * Math.PI * 2;
          this.x = player.x + Math.cos(pang) * this.def.preferredDist;
          this.y = player.y + Math.sin(pang) * this.def.preferredDist;
          this.tpArrive = 0.25;
          this.fireDelay = this.def.fanInterval;
        }
      } else if (this.tpArrive > 0) {
        this.tpArrive -= dt;
      } else if (this.fireDelay > 0) {
        this.fireDelay -= dt;
        if (this.fireDelay <= 0) {
          // Recompute aim toward current player position.
          const adx = player.x - this.x, ady = player.y - this.y;
          const baseA = Math.atan2(ady, adx);
          const count = 5;
          const spread = 0.75;
          for (let i = 0; i < count; i++) {
            const f = count === 1 ? 0 : i / (count - 1) - 0.5;
            const a = baseA + f * spread;
            game.enemyProjectiles.push(new Projectile({
              x: this.x, y: this.y - 6,
              vx: Math.cos(a) * 235, vy: Math.sin(a) * 235,
              dmg: this.dmg * 0.7,
              radius: 9,
              life: 2.2,
              color: "#ff4d1a",
              trailColor: "#ffe55c",
              friendly: false,
              kind: "streak",
              spin: 6,
            }));
          }
          this.fireTimer = this.def.teleportInterval + (Math.random() - 0.5) * 0.6;
        }
      } else {
        this.fireTimer -= dt;
        if (this.fireTimer <= 0) this.tpCharge = 0.4;
      }
    } else if (this.def.emo) {
      // Emo tung — medium-distance melancholy shuffle + heartbreak fan of tears.
      const pref = this.def.preferredDist;
      const dir = dist > pref + 20 ? 1 : dist < pref - 60 ? -1 : 0;
      // drift sideways a little so they don't clump
      const perp = this.wobble * 0.5;
      const sx = -dy / dist, sy = dx / dist;
      this.vx = (dx / dist) * this.speed * dir + sx * Math.sin(perp) * 30;
      this.vy = (dy / dist) * this.speed * dir + sy * Math.sin(perp) * 30;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      this.fireTimer -= dt;
      if (this.fireTimer <= 0 && dist < pref + 180) {
        const baseA = Math.atan2(dy, dx);
        const spd = 175;
        for (let i = -1; i <= 1; i++) {
          const a = baseA + i * 0.22;
          game.enemyProjectiles.push(new Projectile({
            x: this.x, y: this.y - 4,
            vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
            dmg: this.dmg * 0.75,
            radius: 8,
            life: 2.4,
            color: "#ff3ea5",
            trailColor: "#c89cff",
            friendly: false,
            kind: "tear",
            spin: 0,
          }));
        }
        this.fireTimer = this.def.fireInterval + Math.random() * 0.6;
      }
    } else {
      // Melee seek
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    // Soft arena clamp
    if (this.x < 20) this.x = 20;
    if (this.y < 20) this.y = 20;
    if (this.x > game.width - 20) this.x = game.width - 20;
    if (this.y > game.height - 20) this.y = game.height - 20;
  }

  damage(amount, srcX, srcY, knockback = 0) {
    this.hp -= amount;
    this.flash = 0.12;
    if (knockback && srcX != null) {
      const dx = this.x - srcX, dy = this.y - srcY;
      const d = Math.hypot(dx, dy) || 1;
      const factor = this.def.heavy ? 0.35 : 1;
      this.knockbackX += (dx / d) * knockback * factor;
      this.knockbackY += (dy / d) * knockback * factor;
      this.stun = this.def.heavy ? 0.08 : 0.18;
    }
    if (this.hp <= 0) this.alive = false;
  }
}

// ---- Boss: Tung Tung Supreme ----
// Three phases. Uses its own AI rather than shared Enemy behavior.
export class Boss {
  constructor(x, y) {
    this.type = "boss";
    this.def = { name: "tung tung supreme", tint: "#ff3ea5", color: "#5a3415",
                 dark: "#2a1609", bob: 3, faceScale: 2.4 };
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.radius = 60;
    this.maxHp = 2600;
    this.hp = this.maxHp;
    this.dmg = 34;
    this.xp = 0;
    this.alive = true;
    this.flash = 0;
    this.phase = 1;
    this.phaseTimer = 0;
    this.actionTimer = 1.2;
    this.action = "idle";
    this.actionPhase = 0;
    this.telegraphAngle = 0;
    this.hitCooldown = 0;
    this.summonBudget = 0;
    this.wobble = 0;
    this.knockbackX = 0; this.knockbackY = 0;
    this.stun = 0;
    this.tier = 1;
  }

  update(dt, game) {
    this.wobble += dt * 2.5;
    this.flash = Math.max(0, this.flash - dt);
    this.phaseTimer += dt;
    this.hitCooldown = Math.max(0, this.hitCooldown - dt);

    // Phase transitions
    const pct = this.hp / this.maxHp;
    if (this.phase === 1 && pct < 0.66) { this.phase = 2; this.action = "idle"; this.actionTimer = 0.6; game.onBossPhase(2); }
    else if (this.phase === 2 && pct < 0.3) { this.phase = 3; this.action = "idle"; this.actionTimer = 0.4; game.onBossPhase(3); }

    // Very slow drift toward player
    const player = game.player;
    const dx = player.x - this.x, dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const drift = 28 + this.phase * 8;
    this.vx = (dx / d) * drift;
    this.vy = (dy / d) * drift;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.knockbackX || this.knockbackY) {
      this.x += this.knockbackX * dt;
      this.y += this.knockbackY * dt;
      this.knockbackX *= 0.9;
      this.knockbackY *= 0.9;
    }

    // Clamp
    const m = 70;
    if (this.x < m) this.x = m;
    if (this.y < m) this.y = m;
    if (this.x > game.width - m) this.x = game.width - m;
    if (this.y > game.height - m) this.y = game.height - m;

    this.actionTimer -= dt;
    if (this.actionTimer <= 0) this.pickAction(game);

    this.runAction(dt, game);
  }

  pickAction(game) {
    const choices = this.phase === 1
      ? ["slam", "summon", "slam"]
      : this.phase === 2
      ? ["ring", "slam", "ring", "summon"]
      : ["ring", "slam", "summon", "charge", "ring"];
    this.action = choices[(Math.random() * choices.length) | 0];
    this.actionPhase = 0;
    if (this.action === "slam") this.actionTimer = 0.9;
    else if (this.action === "ring") this.actionTimer = 1.0;
    else if (this.action === "summon") this.actionTimer = 0.8;
    else if (this.action === "charge") this.actionTimer = 1.4;
  }

  runAction(dt, game) {
    const player = game.player;
    if (this.action === "slam") {
      // Telegraphs then emits a radial shockwave of tung projectiles.
      if (this.actionPhase === 0 && this.actionTimer < 0.25) {
        this.actionPhase = 1;
        const count = 18 + this.phase * 4;
        const spd = 240;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          game.enemyProjectiles.push(new Projectile({
            x: this.x, y: this.y,
            vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
            dmg: this.dmg, radius: 10, life: 2.4,
            color: "#ff3ea5", trailColor: "#ffe55c",
            friendly: false, kind: "tung",
          }));
        }
        game.shake = 14;
        game.audio?.bossRoar?.();
      }
    } else if (this.action === "ring") {
      // Two concentric delayed rings.
      if (this.actionPhase < 2 && this.actionTimer < 0.7 - this.actionPhase * 0.35) {
        const count = 22;
        const base = Math.random() * Math.PI * 2;
        const spd = 200 + this.actionPhase * 60;
        for (let i = 0; i < count; i++) {
          const a = base + (i / count) * Math.PI * 2;
          game.enemyProjectiles.push(new Projectile({
            x: this.x, y: this.y,
            vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
            dmg: this.dmg * 0.7, radius: 9, life: 2.6,
            color: "#ffe55c", trailColor: "#ff4d6d",
            friendly: false, kind: "tung",
          }));
        }
        this.actionPhase++;
      }
    } else if (this.action === "summon") {
      if (this.actionPhase === 0 && this.actionTimer < 0.35) {
        this.actionPhase = 1;
        const n = this.phase === 3 ? 6 : 4;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = 80 + Math.random() * 60;
          const ex = this.x + Math.cos(a) * r;
          const ey = this.y + Math.sin(a) * r;
          game.spawnEnemy(this.phase === 3 ? "sprinter" : "shambler", ex, ey, 1 + this.phase * 0.1);
        }
      }
    } else if (this.action === "charge") {
      // Phase-3 rapid lunge toward player.
      if (this.actionPhase === 0) {
        const dx = player.x - this.x, dy = player.y - this.y;
        const d = Math.hypot(dx, dy) || 1;
        this.chargeVx = (dx / d) * 520;
        this.chargeVy = (dy / d) * 520;
        this.actionPhase = 1;
      }
      if (this.actionPhase === 1) {
        this.x += this.chargeVx * dt;
        this.y += this.chargeVy * dt;
      }
    }
  }

  damage(amount, srcX, srcY, knockback = 0) {
    this.hp -= amount;
    this.flash = 0.1;
    if (knockback) {
      const dx = this.x - srcX, dy = this.y - srcY;
      const d = Math.hypot(dx, dy) || 1;
      this.knockbackX += (dx / d) * knockback * 0.15;
      this.knockbackY += (dy / d) * knockback * 0.15;
    }
    if (this.hp <= 0) this.alive = false;
  }
}

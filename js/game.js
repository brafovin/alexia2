// Core game state + systems (update + collisions).

import { input, held, justPressed } from "./input.js";
import { Player, GIRLS } from "./entities/player.js";
import { Enemy, Boss, ENEMY_TYPES } from "./entities/enemies.js";
import { Projectile, MeleeArc } from "./entities/projectile.js";
import { Pickup } from "./entities/pickup.js";
import { getWave, pickEnemy, totalWaves } from "./waves.js";
import { sfx, startMusic, stopMusic, toggleMuted, isMuted } from "./audio.js";
import { createRng } from "./rng.js";
import { rollUpgrades, applyUpgrade } from "./upgrades.js";

export const MODE = {
  TITLE: "title",
  PLAYING: "playing",
  LEVELUP: "levelup",
  PAUSE: "pause",
  DEATH: "death",
  VICTORY: "victory",
};

export class Game {
  constructor(width = 960, height = 600) {
    this.width = width;
    this.height = height;
    this.mode = MODE.TITLE;
    this.audio = sfx;
    this.reset();
  }

  reset(girlIdx = 0) {
    this.player = new Player();
    this.player.setGirl(girlIdx);
    this.enemies = [];
    this.playerAttacks = [];    // Projectiles + MeleeArcs from player
    this.enemyProjectiles = [];
    this.pickups = [];
    this.floaters = [];
    this.trailDots = [];
    this.boss = null;

    this.waveIndex = 0;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.pendingLevelUps = 0;
    this.kills = 0;
    this.runTime = 0;
    this.shake = 0;
    this.miniBossSpawned = false;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.rng = createRng();
  }

  start(girlIdx) {
    this.reset(girlIdx);
    this.mode = MODE.PLAYING;
    startMusic();
  }

  update(dt) {
    // Pause & mute are handled in main.js for cleaner UI syncing.
    if (this.mode !== MODE.PLAYING) return;

    this.runTime += dt;
    this.shake = Math.max(0, this.shake - dt * 28);

    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateBoss(dt);
    this.updateProjectiles(dt);
    this.updatePickups(dt);
    this.updateFloaters(dt);
    this.updateTrail(dt);
    this.updateWave(dt);
    this.handleCollisions();

    // Cleanup dead
    this.enemies = this.enemies.filter(e => e.alive);
    this.playerAttacks = this.playerAttacks.filter(a => a.alive !== false);
    this.enemyProjectiles = this.enemyProjectiles.filter(p => p.alive);
    this.pickups = this.pickups.filter(p => p.alive);
    this.floaters = this.floaters.filter(f => f.life > 0);
    this.trailDots = this.trailDots.filter(d => d.life > 0);

    if (this.player.dead) {
      this.mode = MODE.DEATH;
      stopMusic();
      sfx.death();
    }

    if (this.bossDefeated && !this.boss) {
      this.mode = MODE.VICTORY;
      stopMusic();
      sfx.victory();
    }
  }

  // ---- Player ----
  updatePlayer(dt) {
    const p = this.player;

    // Cooldowns
    p.attackCd = Math.max(0, p.attackCd - dt);
    p.ultCd = Math.max(0, p.ultCd - dt);
    p.dodgeCd = Math.max(0, p.dodgeCd - dt);
    p.swapCd = Math.max(0, p.swapCd - dt);
    p.iFrames = Math.max(0, p.iFrames - dt);
    p.flash = Math.max(0, p.flash - dt);

    // Girl swap
    if (p.swapCd <= 0) {
      let target = -1;
      if (justPressed("1")) target = 0;
      else if (justPressed("2")) target = 1;
      else if (justPressed("3")) target = 2;
      else if (justPressed("4")) target = 3;
      else if (justPressed("q")) target = (p.girlIndex + GIRLS.length - 1) % GIRLS.length;
      else if (justPressed("e")) target = (p.girlIndex + 1) % GIRLS.length;
      if (target >= 0 && p.setGirl(target)) {
        p.swapCd = p.swapMax * p.stats.swapCdMul;
        sfx.swap();
        this.floater(p.x, p.y - 30, GIRLS[target].name, GIRLS[target].pupilColor, 14);
      }
    }

    // Movement
    let dx = 0, dy = 0;
    if (held("w") || held("arrowup")) dy -= 1;
    if (held("s") || held("arrowdown")) dy += 1;
    if (held("a") || held("arrowleft")) dx -= 1;
    if (held("d") || held("arrowright")) dx += 1;
    const mag = Math.hypot(dx, dy) || 1;
    dx /= mag; dy /= mag;

    let speed = p.girl.baseSpeed * p.stats.moveSpeed;
    if (p.iFrames > 0.3) speed *= 1.35;  // dodge boost window

    p.x += dx * speed * dt;
    p.y += dy * speed * dt;
    if (dx || dy) { p.lastMoveX = dx; p.lastMoveY = dy; }

    // Clamp to arena
    p.x = Math.max(p.radius + 4, Math.min(this.width - p.radius - 4, p.x));
    p.y = Math.max(p.radius + 4, Math.min(this.height - p.radius - 4, p.y));

    // Facing toward mouse
    p.facing = Math.atan2(input.mouseY - p.y, input.mouseX - p.x);

    // Dodge
    if (justPressed(" ") && p.dodgeCd <= 0) {
      p.dodgeCd = p.dodgeMax;
      p.iFrames = Math.max(p.iFrames, 0.5);
      // snap move
      p.x += (dx || p.lastMoveX) * 90;
      p.y += (dy || p.lastMoveY) * 90;
      sfx.dodge();
    }

    // Attack
    const wantAttack = input.mouseDown || held("f");
    if (wantAttack && p.attackCd <= 0) {
      p.attackCd = p.girl.atkCooldown / p.stats.atkSpeed;
      p.girl.weapon(p, this, input.mouseX, input.mouseY);
      if (p.girl.id === 0) sfx.swing();
      else if (p.girl.id === 1) sfx.shoot();
      else sfx.spread();
    }

    // Ultimate
    if (justPressed("shift") && p.ultCd <= 0) {
      p.ultCd = p.ultMax * p.stats.ultCdMul;
      p.girl.ult(p, this);
      sfx.ult();
      this.shake = Math.max(this.shake, 10);
    }

    // Raven spin AoE
    if (p.spinTime > 0) {
      p.spinTime -= dt;
      this.playerAttacks.push(new MeleeArc({
        x: p.x, y: p.y,
        angle: Math.random() * Math.PI * 2,
        arc: Math.PI * 2,
        radius: 110,
        dmg: p.spinDmg,
        life: 0.12,
        friendly: true,
        color: "#ff3ea5",
        knockback: 180,
      }));
    }

    // Scarlet blade rain
    if (p.rainTime > 0) {
      p.rainTime -= dt;
      p.rainCooldown -= dt;
      if (p.rainCooldown <= 0) {
        p.rainCooldown = 0.08;
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2;
          const d = Math.random() * 200 + 40;
          const tx = p.x + Math.cos(a) * d;
          const ty = p.y + Math.sin(a) * d;
          // projectile that "drops" from above
          this.playerAttacks.push(new Projectile({
            x: tx, y: ty - 200,
            vx: 0, vy: 700,
            dmg: 18 * p.stats.damage,
            radius: 10, life: 0.3,
            color: "#ff7ab6", friendly: true,
            pierce: 3, spin: 30, kind: "scissor",
          }));
        }
      }
    }

    // Glitter trail
    if (p.stats.glitterTrail > 0) {
      this.trailDots.push({
        x: p.x + (Math.random() - 0.5) * 10,
        y: p.y + 6 + (Math.random() - 0.5) * 6,
        radius: 4 + Math.random() * 3,
        color: ["#ff8ed0", "#c89cff", "#ffe55c", "#3ef0ff"][(Math.random() * 4) | 0],
        dmg: p.stats.glitterTrail * 0.4,
        life: 1.2, max: 1.2,
        hit: new Set(),
      });
    }
  }

  // ---- Enemies ----
  updateEnemies(dt) {
    for (const e of this.enemies) e.update(dt, this);
  }

  updateBoss(dt) {
    if (this.boss) {
      this.boss.update(dt, this);
      if (!this.boss.alive) {
        this.bossDefeated = true;
        for (let i = 0; i < 40; i++) {
          const a = Math.random() * Math.PI * 2;
          const d = Math.random() * 60 + 10;
          this.pickups.push(new Pickup({
            x: this.boss.x + Math.cos(a) * d,
            y: this.boss.y + Math.sin(a) * d,
            kind: "xp", value: 5,
          }));
        }
        this.pickups.push(new Pickup({ x: this.boss.x, y: this.boss.y, kind: "heart", value: 50 }));
        this.shake = 28;
        this.boss = null;
      }
    }
  }

  updateProjectiles(dt) {
    for (const a of this.playerAttacks) {
      if (a.update) a.update(dt);
    }
    for (const p of this.enemyProjectiles) p.update(dt);

    // cull off-screen player projectiles
    const pad = 60;
    for (const a of this.playerAttacks) {
      if (a instanceof Projectile) {
        if (a.x < -pad || a.x > this.width + pad || a.y < -pad || a.y > this.height + pad) {
          a.alive = false;
        }
      }
    }
    for (const p of this.enemyProjectiles) {
      if (p.x < -pad || p.x > this.width + pad || p.y < -pad || p.y > this.height + pad) p.alive = false;
    }
  }

  updatePickups(dt) {
    for (const pu of this.pickups) pu.update(dt, this.player, this.player.stats.magnet);
  }
  updateFloaters(dt) {
    for (const f of this.floaters) { f.x += f.vx * dt; f.y += f.vy * dt; f.life -= dt; f.vy -= dt * 40; }
  }
  updateTrail(dt) {
    for (const d of this.trailDots) d.life -= dt;
  }

  // ---- Wave pacing ----
  updateWave(dt) {
    const wave = getWave(this.waveIndex);
    this.waveTimer += dt;

    if (wave.bossWave && !this.bossSpawned) {
      this.bossSpawned = true;
      this.boss = new Boss(this.width / 2, 120);
      this.floater(this.width / 2, 200, "TUNG TUNG SUPREME", "#ff3ea5", 26);
      sfx.bossRoar();
      this.shake = 22;
    }

    if (wave.miniBoss && !this.miniBossSpawned) {
      this.miniBossSpawned = true;
      const a = Math.random() * Math.PI * 2;
      const x = this.width / 2 + Math.cos(a) * 300;
      const y = this.height / 2 + Math.sin(a) * 220;
      this.spawnEnemy("miniboss", x, y, 1);
      this.floater(x, y - 50, "MALLET KING", "#ffe55c", 18);
      sfx.bossRoar();
    }

    // Normal spawns
    this.spawnTimer -= dt;
    const ramp = Math.min(1.6, 1 + this.waveTimer / wave.duration);
    const rate = wave.rate * ramp;
    const interval = 1 / Math.max(0.2, rate);
    while (this.spawnTimer <= 0) {
      this.spawnTimer += interval;
      const type = pickEnemy(wave, this.rng);
      const { x, y } = this.randomSpawn();
      this.spawnEnemy(type, x, y, wave.tier);
    }

    // Advance wave
    if (!wave.bossWave && this.waveTimer >= wave.duration) {
      this.waveTimer = 0;
      this.spawnTimer = 0;
      this.miniBossSpawned = false;
      this.waveIndex++;
      this.floater(this.width / 2, 160, `wave ${this.waveIndex + 1}`, "#3ef0ff", 22);
    }
  }

  // ---- Collisions ----
  handleCollisions() {
    const p = this.player;

    // Player attacks vs enemies (and boss)
    const allHostiles = this.boss ? [...this.enemies, this.boss] : this.enemies;

    for (const atk of this.playerAttacks) {
      if (atk instanceof MeleeArc) {
        for (const en of allHostiles) {
          if (!en.alive) continue;
          if (atk.hit.has(en)) continue;
          if (!atk.contains(en.x, en.y, en.radius)) continue;
          atk.hit.add(en);
          this.damageEnemy(en, atk.dmg, atk.x, atk.y, atk.knockback);
        }
      } else if (atk instanceof Projectile) {
        for (const en of allHostiles) {
          if (!en.alive) continue;
          if (atk.hit.has(en)) continue;
          const dx = en.x - atk.x, dy = en.y - atk.y;
          if (dx * dx + dy * dy < (en.radius + atk.radius) * (en.radius + atk.radius)) {
            atk.hit.add(en);
            this.damageEnemy(en, atk.dmg, atk.x, atk.y, 80);
            if (atk.pierce > 0) atk.pierce--;
            else atk.alive = false;
          }
        }
      }
    }

    // Glitter trail damage
    for (const d of this.trailDots) {
      for (const en of allHostiles) {
        if (!en.alive) continue;
        if (d.hit.has(en)) continue;
        const dx = en.x - d.x, dy = en.y - d.y;
        if (dx * dx + dy * dy < (en.radius + d.radius) * (en.radius + d.radius)) {
          d.hit.add(en);
          this.damageEnemy(en, d.dmg, d.x, d.y, 10);
        }
      }
    }

    // Enemy contact damage
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = e.x - p.x, dy = e.y - p.y;
      const rr = (e.radius + p.radius);
      if (dx * dx + dy * dy < rr * rr) {
        if (p.takeDamage(e.dmg)) {
          sfx.damage();
          if (p.stats.thorns > 0) this.damageEnemy(e, p.stats.thorns, p.x, p.y, 60);
          // knockback
          const d = Math.hypot(dx, dy) || 1;
          p.x += (dx / d) * 12;
          p.y += (dy / d) * 12;
        }
      }
    }

    // Boss contact
    if (this.boss) {
      const dx = this.boss.x - p.x, dy = this.boss.y - p.y;
      const rr = this.boss.radius + p.radius;
      if (dx * dx + dy * dy < rr * rr) {
        if (p.takeDamage(this.boss.dmg)) {
          sfx.damage();
          if (p.stats.thorns > 0) this.damageEnemy(this.boss, p.stats.thorns, p.x, p.y, 40);
          const d = Math.hypot(dx, dy) || 1;
          p.x += (dx / d) * 18;
          p.y += (dy / d) * 18;
        }
      }
    }

    // Enemy projectiles vs player
    for (const proj of this.enemyProjectiles) {
      const dx = proj.x - p.x, dy = proj.y - p.y;
      const rr = proj.radius + p.radius;
      if (dx * dx + dy * dy < rr * rr) {
        if (p.takeDamage(proj.dmg)) sfx.damage();
        proj.alive = false;
      }
    }

    // Pickups
    for (const pu of this.pickups) {
      const dx = pu.x - p.x, dy = pu.y - p.y;
      if (dx * dx + dy * dy < (pu.radius + p.radius) * (pu.radius + p.radius)) {
        pu.alive = false;
        this.collect(pu);
      }
    }
  }

  collect(pu) {
    const p = this.player;
    if (pu.kind === "xp") {
      const gained = this.player.gainXp(pu.value);
      sfx.xp();
      this.pendingLevelUps += gained.length;
      if (gained.length) sfx.levelUp();
    } else if (pu.kind === "heart") {
      p.heal(pu.value);
      this.floater(p.x, p.y - 30, "+" + pu.value, "#ff3ea5", 14);
    } else if (pu.kind === "magnet") {
      for (const o of this.pickups) o.magnetized = true;
    }
  }

  damageEnemy(en, amount, srcX, srcY, knockback) {
    en.damage(amount, srcX, srcY, knockback);
    // lifesteal
    if (this.player.stats.lifesteal > 0) {
      this.player.heal(amount * this.player.stats.lifesteal);
    }
    if (!en.alive) {
      this.kills++;
      sfx.kill();
      // XP shards
      const xp = en.xp || 1;
      const drops = Math.max(1, Math.min(5, Math.ceil(xp / 2)));
      for (let i = 0; i < drops; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * 14;
        this.pickups.push(new Pickup({
          x: en.x + Math.cos(a) * d,
          y: en.y + Math.sin(a) * d,
          kind: "xp",
          value: Math.max(1, Math.ceil(xp / drops)),
        }));
      }
      // Occasional heart
      if (Math.random() < 0.02 || (en.def && en.def.heavy && Math.random() < 0.2)) {
        this.pickups.push(new Pickup({ x: en.x, y: en.y, kind: "heart", value: 15 }));
      }
      if (en.def && en.def.crown) {
        // mini-boss drop
        this.pickups.push(new Pickup({ x: en.x, y: en.y, kind: "heart", value: 30 }));
        this.pickups.push(new Pickup({ x: en.x + 20, y: en.y, kind: "magnet", value: 1 }));
      }
      if (en.def && en.def.emo) {
        // Parting heartbreak — 6 slow tears outward
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + Math.random() * 0.2;
          const spd = 130;
          this.enemyProjectiles.push(new Projectile({
            x: en.x, y: en.y,
            vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
            dmg: en.dmg * 0.5,
            radius: 7,
            life: 1.6,
            color: "#c89cff",
            trailColor: "#ff3ea5",
            friendly: false,
            kind: "tear",
          }));
        }
      }
      this.floater(en.x, en.y - 10, "-" + Math.round(amount), "#ffe55c", 12);
    } else {
      this.floater(en.x, en.y - 10, "-" + Math.round(amount), "#ff8ed0", 11);
    }
  }

  // ---- Helpers ----
  spawnEnemy(type, x, y, tier = 1) {
    this.enemies.push(new Enemy(type, x, y, tier));
  }

  randomSpawn() {
    // Outside arena edge
    const side = (Math.random() * 4) | 0;
    if (side === 0) return { x: Math.random() * this.width, y: -20 };
    if (side === 1) return { x: this.width + 20, y: Math.random() * this.height };
    if (side === 2) return { x: Math.random() * this.width, y: this.height + 20 };
    return { x: -20, y: Math.random() * this.height };
  }

  floater(x, y, text, color, size) {
    this.floaters.push({
      x, y, text, color, size,
      vx: (Math.random() - 0.5) * 20,
      vy: -40 - Math.random() * 30,
      life: 0.9, max: 0.9,
    });
  }

  onBossPhase(phase) {
    this.floater(this.boss.x, this.boss.y - 90, `phase ${phase}`, "#ffe55c", 18);
    this.shake = Math.max(this.shake, 14);
    sfx.bossRoar();
  }

  // Display helpers
  clockText() {
    // 3:00 AM -> 3:30 AM across a full victory run
    const minutes = Math.min(59, Math.floor(this.runTime * 0.12));
    return `3:${minutes.toString().padStart(2, "0")} AM`;
  }

  waveLabel() {
    return `${Math.min(this.waveIndex + 1, totalWaves())}/${totalWaves()}`;
  }
}

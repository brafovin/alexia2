// Generic projectile (scene-girl shots and enemy shots share this shape).

export class Projectile {
  constructor({ x, y, vx, vy, dmg, life = 1.2, radius = 6,
                color = "#3ef0ff", trailColor = null, friendly = true,
                pierce = 0, knockback = 0, spin = 0, kind = "glitter" }) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.dmg = dmg;
    this.life = life;
    this.maxLife = life;
    this.radius = radius;
    this.color = color;
    this.trailColor = trailColor || color;
    this.friendly = friendly;
    this.pierce = pierce;
    this.knockback = knockback;
    this.hit = new Set();          // enemy refs already hit (piercing)
    this.alive = true;
    this.spin = spin;
    this.rot = Math.random() * Math.PI * 2;
    this.kind = kind;              // "glitter" | "scissor" | "bat" | "tung" | "heart"
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rot += this.spin * dt;
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }
}

// Short-lived melee hit arc (used by Raven bat swings and boss slams)
export class MeleeArc {
  constructor({ x, y, angle, arc = Math.PI * 0.9, radius = 80,
                dmg, life = 0.18, friendly = true, color = "#ff3ea5", knockback = 220 }) {
    this.x = x; this.y = y;
    this.angle = angle;
    this.arc = arc;
    this.radius = radius;
    this.dmg = dmg;
    this.life = life;
    this.maxLife = life;
    this.friendly = friendly;
    this.color = color;
    this.knockback = knockback;
    this.hit = new Set();
    this.alive = true;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }

  // Returns true if a point (px,py) with radius pr is inside the arc hitbox.
  contains(px, py, pr = 0) {
    const dx = px - this.x, dy = py - this.y;
    const d = Math.hypot(dx, dy);
    if (d > this.radius + pr) return false;
    if (d < 4) return true;
    const a = Math.atan2(dy, dx);
    let da = a - this.angle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    return Math.abs(da) <= this.arc * 0.5;
  }
}

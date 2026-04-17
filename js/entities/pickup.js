// Pickups: XP shards (most common), hearts (rare), magnet bursts (ultra rare).

export class Pickup {
  constructor({ x, y, kind = "xp", value = 1 }) {
    this.x = x; this.y = y;
    this.kind = kind;    // "xp" | "heart" | "magnet"
    this.value = value;
    this.radius = kind === "heart" ? 10 : kind === "magnet" ? 12 : 7;
    this.alive = true;
    this.age = 0;
    this.vx = 0; this.vy = 0;
    this.magnetized = false;
  }

  update(dt, player, magnetRadius) {
    this.age += dt;
    const dx = player.x - this.x, dy = player.y - this.y;
    const d = Math.hypot(dx, dy);
    if (!this.magnetized && d < magnetRadius) this.magnetized = true;
    if (this.magnetized) {
      const speed = Math.min(620, 180 + (magnetRadius - d) * 3);
      if (d > 0.001) {
        this.vx = (dx / d) * speed;
        this.vy = (dy / d) * speed;
      }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
  }
}

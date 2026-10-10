'use strict';

// ── Recogibles: rayo Velocidad, chevrones Triple y orbe de escudo ─────────────
const PICKUP_DROP_CHANCE = 0.10;  // probabilidad de soltar un recogible al destruir un asteroide
const POWERUP_DURATION   = 5;     // segundos de empuje duplicado (Velocidad)
const TRIPLE_DURATION    = 5;     // segundos de ráfaga triple (Triple)

class PowerUp {
  constructor(x, y, type) {
    this.type = type;   // 'speed' | 'triple'
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.ttl  = 10;
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 60);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo cuando está por desaparecer
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    if (this.type === 'triple') {
      // Tres chevrones: ráfaga de 3 balas en abanico
      ctx.strokeStyle = '#53ff73';
      ctx.beginPath();
      for (let i = -1; i <= 1; i++) {
        const x = i * 8;
        ctx.moveTo(x - 4,  5);
        ctx.lineTo(x,     -5);
        ctx.lineTo(x + 4,  5);
      }
      ctx.stroke();
    } else {
      // Rayo clásico: Velocidad
      ctx.strokeStyle = '#ffd21e';
      ctx.fillStyle   = 'rgba(255, 210, 30, 0.25)';
      ctx.beginPath();
      ctx.moveTo( 3, -10);
      ctx.lineTo(-4,   1);
      ctx.lineTo(-1,   1);
      ctx.lineTo(-3,  10);
      ctx.lineTo( 4,  -1);
      ctx.lineTo( 1,  -1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

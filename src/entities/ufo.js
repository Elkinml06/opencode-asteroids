'use strict';

// ── OVNI artillero ────────────────────────────────────────────────────────────
const UFO_POINTS        = 200;  // puntos por destruirlo
const UFO_FIRE_INTERVAL = 1.3;  // segundos entre disparos

class Ufo {
  constructor() {
    // Entra por un borde lateral y cruza la pantalla
    const fromLeft = Math.random() < 0.5;
    this.x = fromLeft ? 0 : W;
    this.y = rand(H * 0.15, H * 0.85);
    this.vx = (fromLeft ? 1 : -1) * rand(80, 100);
    this.wobble     = rand(0, Math.PI * 2);  // fase del vaivén vertical
    this.radius     = 16;
    this.ttl        = 12;
    this.shootTimer = UFO_FIRE_INTERVAL;
    this.dead       = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.wobble += 2 * dt;
    this.y += Math.sin(this.wobble) * 30 * dt;  // vaivén vertical suave
    this.ttl -= dt;
    if (this.ttl <= 0) {
      this.dead = true;
      explode(this.x, this.y, 6);  // pequeño destello al marcharse
    }
    if (this.shootTimer > 0) this.shootTimer -= dt;
  }

  tryShoot(target) {
    this.shootTimer = UFO_FIRE_INTERVAL;
    // Apunta a la nave con un pequeño error de puntería
    const angle = Math.atan2(target.y - this.y, target.x - this.x) + rand(-0.12, 0.12);
    const ox = this.x + Math.cos(angle) * this.radius;
    const oy = this.y + Math.sin(angle) * this.radius;
    return new EnemyBullet(ox, oy, angle);
  }

  draw() {
    // Parpadeo antes de marcharse
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#ff5a5a';
    ctx.fillStyle   = 'rgba(255, 90, 90, 0.2)';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Platillo: casco hexagonal + cúpula
    ctx.beginPath();
    ctx.moveTo(-16,  0);
    ctx.lineTo( -6, -6);
    ctx.lineTo(  6, -6);
    ctx.lineTo( 16,  0);
    ctx.lineTo(  6,  6);
    ctx.lineTo( -6,  6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.arc(0, -6, 5, Math.PI, 0);
    ctx.stroke();

    ctx.restore();
  }
}

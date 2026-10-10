'use strict';

// ── Orbe de escudo ────────────────────────────────────────────────────────────
class ShieldOrb {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.ttl   = 10;
    this.pulse = rand(0, Math.PI * 2);  // fase del anillo pulsante
    this.dead  = false;

    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 60);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl   -= dt;
    this.pulse += 6 * dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo cuando está por desaparecer
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#7df9ff';
    ctx.fillStyle   = 'rgba(125, 249, 255, 0.25)';
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';

    // Anillo exterior pulsante: mismo cian que la burbuja del escudo de la nave
    ctx.beginPath();
    ctx.arc(0, 0, 15 + Math.sin(this.pulse) * 1.5, 0, Math.PI * 2);
    ctx.stroke();

    // Silueta de escudo: tapa plana y punta inferior
    ctx.beginPath();
    ctx.moveTo(-7, -8);
    ctx.lineTo( 7, -8);
    ctx.lineTo( 7,  1);
    ctx.quadraticCurveTo( 6, 7, 0, 9);
    ctx.quadraticCurveTo(-6, 7, -7, 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

'use strict';

// ── Estrella fugaz ────────────────────────────────────────────────────────────
const STAR_POINTS = 200;  // puntos por destruirla

class ShootingStar {
  constructor() {
    // Nace en un borde y apunta hacia la zona central
    if (Math.random() < 0.5) {
      this.x = rand(0, W);
      this.y = Math.random() < 0.5 ? 0 : H;
    } else {
      this.x = Math.random() < 0.5 ? 0 : W;
      this.y = rand(0, H);
    }
    const tx = rand(W * 0.25, W * 0.75);
    const ty = rand(H * 0.25, H * 0.75);
    const angle = Math.atan2(ty - this.y, tx - this.x);
    const speed = rand(300, 400);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.rot      = rand(0, Math.PI * 2);
    this.rotSpeed = rand(-2, 2);
    this.radius   = 12;
    this.ttl      = 8;
    this.dead     = false;

    // Estrella de 4 puntas (radios alternados)
    this.verts = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = i % 2 === 0 ? 12 : 4;
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) {
      this.dead = true;
      explode(this.x, this.y, 6);  // pequeño destello al desvanecerse
    }
  }

  draw() {
    // Parpadeo antes de desvanecerse
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;

    // Estela desvanecida
    ctx.strokeStyle = 'rgba(125, 249, 255, 0.4)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.09, this.y - this.vy * 0.09);
    ctx.stroke();

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#7df9ff';
    ctx.fillStyle   = 'rgba(125, 249, 255, 0.3)';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

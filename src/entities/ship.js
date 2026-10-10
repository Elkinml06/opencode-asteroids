'use strict';

// ── Ship ──────────────────────────────────────────────────────────────────────
const SHOT_COOLDOWN = 0.2;   // s entre disparos
const BURST_DELAY   = 0.08;  // s entre balas de una ráfaga triple
const BURST_SPREAD  = 0.25;  // rad de desvío lateral de las balas laterales
const SHIELD_MAX    = 100;   // energía máxima del escudo
const SHIELD_DRAIN  = 50;    // energía por segundo activo (carga llena = 2 s)
const SHIELD_REGEN  = 1;     // goteo mínimo: 100 s para llenar; los orbes son la vía real
const SHIELD_RADIUS = 24;    // radio de bloqueo, mayor que la nave

class Ship {
  constructor() {
    // La energía solo arranca llena en partida nueva: persiste entre
    // vidas y niveles como un recurso de toda la corrida
    this.shieldEnergy = SHIELD_MAX;
    this.reset();
  }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoost    = 0;
    this.tripleShot    = 0;
    this.burstLeft     = 0;   // balas pendientes de la ráfaga
    this.dead          = false;

    this.shieldActive   = false;
    this.shieldDepleted = false;
    this.shieldPhase    = 0;
  }

  update(dt) {
    if (this.dead) return [];
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoost    > 0) this.speedBoost    -= dt;
    if (this.tripleShot    > 0) this.tripleShot    -= dt;

    this.updateShield(dt);

    const ROT   = 3.5;   // rad/s
    const DRAG   = 0.987;
    // Empuje duplicado mientras dura el power-up Velocidad
    const THRUST = this.speedBoost > 0 ? 520 : 260;  // px/s²

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);

    // Ráfaga triple: balas laterales desviadas según el apuntado actual
    if (this.burstLeft > 0 && this.shootCooldown <= 0) {
      const offset = (this.burstLeft === 2 ? -1 : 1) * BURST_SPREAD;
      this.burstLeft--;
      this.shootCooldown = this.burstLeft > 0 ? BURST_DELAY : SHOT_COOLDOWN;
      return [this.makeBullet(this.angle + offset)];
    }
    return [];
  }

  makeBullet(angle) {
    const NOSE = 21;
    const x = this.x + Math.cos(angle) * NOSE;
    const y = this.y + Math.sin(angle) * NOSE;
    return new Bullet(x, y, angle);
  }

  // Escudo de energía: activo mientras se mantiene Shift y quede energía
  updateShield(dt) {
    const holding = keys['ShiftLeft'] || keys['ShiftRight'];
    // Agotado, no se re-engancha hasta soltar la tecla (evita parpadeo)
    if (this.shieldDepleted && !holding) this.shieldDepleted = false;

    this.shieldActive = holding && !this.shieldDepleted && this.shieldEnergy > 0;
    this.shieldPhase += 8 * dt;

    if (this.shieldActive) {
      this.shieldEnergy -= SHIELD_DRAIN * dt;
      if (this.shieldEnergy <= 0) {
        this.shieldEnergy   = 0;
        this.shieldActive   = false;
        this.shieldDepleted = true;
      }
    } else {
      this.shieldEnergy = Math.min(SHIELD_MAX, this.shieldEnergy + SHIELD_REGEN * dt);
    }
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    if (this.tripleShot > 0) {
      // Ráfaga: bala central ahora, las laterales salen desde update()
      this.burstLeft  = 2;
      this.shootCooldown = BURST_DELAY;
    } else {
      this.shootCooldown = SHOT_COOLDOWN;
    }
    return [this.makeBullet(this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[skinIndex];

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = skin.stroke;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    tracePoly(skin.verts);
    if (skin.fill) {
      ctx.fillStyle = skin.fill;
      ctx.fill();
    }
    ctx.stroke();

    // Llama del propulsor (más larga con Velocidad activo)
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, this.speedBoost > 0 ? 20 : 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = skin.flame;
      ctx.stroke();
    }

    ctx.restore();

    // Escudo activo: burbuja cian pulsante alrededor de la nave
    if (this.shieldActive) {
      const r = SHIELD_RADIUS + Math.sin(this.shieldPhase) * 2;
      ctx.strokeStyle = 'rgba(125, 249, 255, 0.9)';
      ctx.fillStyle   = 'rgba(125, 249, 255, 0.12)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

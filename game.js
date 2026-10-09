'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

function tracePoly(verts) {
  ctx.beginPath();
  ctx.moveTo(verts[0][0], verts[0][1]);
  for (let i = 1; i < verts.length; i++)
    ctx.lineTo(verts[i][0], verts[i][1]);
  ctx.closePath();
}

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Proyectil enemigo ─────────────────────────────────────────────────────────
class EnemyBullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 300;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl     = 1.6;
    this.radius  = 3;
    this.dead    = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#ff5a5a';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

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

// ── Skins de la nave ──────────────────────────────────────────────────────────
// Todas comparten nariz en x≈20 y alcance ≤ 14: el hitbox y el cañón no cambian.
const SKINS = [
  {
    name:   'Clásica',
    verts:  [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    stroke: '#fff',
    fill:    null,
    flame:  'rgba(255, 130, 0, 0.85)',
  },
  {
    name:   'Cian',
    verts:  [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    stroke: '#7df9ff',
    fill:    'rgba(125, 249, 255, 0.25)',
    flame:  'rgba(125, 249, 255, 0.8)',
  },
  {
    name:   'Dorada',
    verts:  [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    stroke: '#ffd21e',
    fill:    'rgba(255, 210, 30, 0.2)',
    flame:  'rgba(255, 210, 30, 0.9)',
  },
  {
    name:   'Delta',
    verts:  [[20, 0], [2, -8], [-10, -13], [-8, -3], [-8, 3], [-10, 13], [2, 8]],
    stroke: '#ff5c8a',
    fill:    'rgba(255, 92, 138, 0.2)',
    flame:  'rgba(255, 92, 138, 0.85)',
  },
];

const SKIN_STORAGE_KEY = 'asteroids-skin';

let skinIndex      = loadSkin();
let skinLabelTimer = 0;  // seg restantes para mostrar el nombre en el HUD

function loadSkin() {
  try {
    const saved = Number(localStorage.getItem(SKIN_STORAGE_KEY));
    return Number.isInteger(saved) && saved >= 0 && saved < SKINS.length ? saved : 0;
  } catch {
    return 0;  // storage bloqueado o vacío
  }
}

function cycleSkin() {
  skinIndex = (skinIndex + 1) % SKINS.length;
  try { localStorage.setItem(SKIN_STORAGE_KEY, String(skinIndex)); } catch {}
  skinLabelTimer = 2;
}

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

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

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

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, enemyBullets, asteroids, particles, powerups, orbs, stars, ufos;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let starTimer;  // cuenta regresiva para la próxima estrella fugaz
let ufoTimer;   // cuenta regresiva para el próximo OVNI

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship         = new Ship();
  bullets      = [];
  enemyBullets = [];
  asteroids    = [];
  particles    = [];
  powerups     = [];
  orbs         = [];
  stars        = [];
  ufos         = [];
  starTimer    = rand(10, 20);
  ufoTimer     = rand(15, 25);
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets      = [];
  enemyBullets = [];
  particles    = [];
  powerups     = [];
  orbs         = [];
  stars        = [];
  ufos         = [];
  starTimer    = rand(10, 20);
  ufoTimer     = rand(15, 25);
  ship.reset();
  ship.shieldEnergy = SHIELD_MAX;  // cada nivel arranca con el escudo a full
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

// Destruye un asteroide: explosión + fragmentos; con reward da puntos y drop
function destroyAsteroid(a, reward) {
  a.dead = true;
  explode(a.x, a.y, a.size * 5);
  if (reward) {
    score += POINTS[a.size];
    // Drop repartido 1/3 entre rayo Velocidad, chevrones Triple y orbe de escudo
    if (Math.random() < PICKUP_DROP_CHANCE) {
      const roll = Math.random();
      if (roll < 1 / 3)      powerups.push(new PowerUp(a.x, a.y, 'speed'));
      else if (roll < 2 / 3) powerups.push(new PowerUp(a.x, a.y, 'triple'));
      else                   orbs.push(new ShieldOrb(a.x, a.y));
    }
  }
  return a.split();
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Cambio de skin disponible en cualquier estado
  if (pressed('KeyC')) cycleSkin();
  if (skinLabelTimer > 0) skinLabelTimer -= dt;

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    orbs.forEach(o => o.update(dt));
    orbs = orbs.filter(o => !o.dead);
    stars.forEach(s => s.update(dt));
    stars = stars.filter(s => !s.dead);
    ufos.forEach(u => u.update(dt));
    ufos = ufos.filter(u => !u.dead);
    enemyBullets.forEach(b => b.update(dt));
    enemyBullets = enemyBullets.filter(b => !b.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    orbs.forEach(o => o.update(dt));
    orbs = orbs.filter(o => !o.dead);
    stars.forEach(s => s.update(dt));
    stars = stars.filter(s => !s.dead);
    ufos.forEach(u => u.update(dt));
    ufos = ufos.filter(u => !u.dead);
    enemyBullets.forEach(b => b.update(dt));
    enemyBullets = enemyBullets.filter(b => !b.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  // Aparición de la estrella fugaz
  starTimer -= dt;
  if (starTimer <= 0) {
    stars.push(new ShootingStar());
    starTimer = rand(10, 20);
  }

  // Aparición del OVNI (máximo uno a la vez)
  ufoTimer -= dt;
  if (ufoTimer <= 0 && ufos.length === 0) {
    ufos.push(new Ufo());
    ufoTimer = rand(15, 25);
  }

  bullets.push(...ship.update(dt));
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  powerups.forEach(p => p.update(dt));
  orbs.forEach(o => o.update(dt));
  stars.forEach(s => s.update(dt));
  ufos.forEach(u => u.update(dt));
  particles.forEach(p => p.update(dt));

  // El OVNI dispara a la nave (solo mientras esté viva)
  for (const u of ufos) {
    if (!u.dead && !ship.dead && u.shootTimer <= 0) enemyBullets.push(u.tryShoot(ship));
  }
  enemyBullets.forEach(b => b.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);

  // Bala del jugador vs asteroide (puntos y posible power-up)
  const fragments = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        fragments.push(...destroyAsteroid(a, true));
      }
    }
  }

  // Proyectil enemigo vs asteroide (lo destruye sin puntos)
  for (const b of enemyBullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        fragments.push(...destroyAsteroid(a, false));
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(fragments);
  bullets   = bullets.filter(b => !b.dead);

  // Bala vs estrella fugaz
  for (const b of bullets) {
    for (const s of stars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        score += STAR_POINTS;
        explode(s.x, s.y, 10);
      }
    }
  }
  stars   = stars.filter(s => !s.dead);
  bullets = bullets.filter(b => !b.dead);

  // Bala vs OVNI
  for (const b of bullets) {
    for (const u of ufos) {
      if (!u.dead && !b.dead && dist(b, u) < u.radius) {
        b.dead = true;
        u.dead = true;
        score += UFO_POINTS;
        explode(u.x, u.y, 10);
        orbs.push(new ShieldOrb(u.x, u.y));  // orbe garantizado al derribarlo
      }
    }
  }
  ufos   = ufos.filter(u => !u.dead);
  bullets = bullets.filter(b => !b.dead);

  // Nave vs power-up (recoge Velocidad o Triple)
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      if (p.type === 'triple') ship.tripleShot = TRIPLE_DURATION;
      else                     ship.speedBoost = POWERUP_DURATION;
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Nave vs orbe (recarga el escudo por completo)
  for (const o of orbs) {
    if (!o.dead && !ship.dead && dist(ship, o) < ship.radius + o.radius) {
      o.dead = true;
      ship.shieldEnergy   = SHIELD_MAX;
      ship.shieldDepleted = false;
    }
  }
  orbs = orbs.filter(o => !o.dead);

  // Proyectil enemigo vs nave (el escudo lo bloquea con una chispa)
  for (const b of enemyBullets) {
    if (ship.dead) break;
    if (b.dead) continue;
    if (ship.shieldActive && dist(b, ship) < SHIELD_RADIUS + b.radius) {
      b.dead = true;
      explode(b.x, b.y, 4);
    } else if (ship.invincible <= 0 && dist(b, ship) < ship.radius + b.radius) {
      b.dead = true;
      killShip();
      break;
    }
  }
  enemyBullets = enemyBullets.filter(b => !b.dead);

  // Nave vs asteroide (el escudo lo destruye; si no, mata)
  for (const a of asteroids) {
    if (ship.dead) break;
    if (a.dead) continue;
    if (ship.shieldActive && dist(ship, a) < SHIELD_RADIUS + a.radius) {
      a.dead = true;
      explode(a.x, a.y, a.size * 5);
    } else if (ship.invincible <= 0 && dist(ship, a) < ship.radius + a.radius * 0.82) {
      killShip();
      break;
    }
  }

  // Nave vs estrella fugaz (el escudo la destruye; si no, mata)
  for (const s of stars) {
    if (ship.dead) break;
    if (s.dead) continue;
    if (ship.shieldActive && dist(ship, s) < SHIELD_RADIUS + s.radius) {
      s.dead = true;
      explode(s.x, s.y, 10);
    } else if (ship.invincible <= 0 && dist(ship, s) < ship.radius + s.radius) {
      killShip();
      break;
    }
  }

  // Nave vs OVNI (el escudo lo destruye; si no, mata)
  for (const u of ufos) {
    if (ship.dead) break;
    if (u.dead) continue;
    if (ship.shieldActive && dist(ship, u) < SHIELD_RADIUS + u.radius) {
      u.dead = true;
      explode(u.x, u.y, 10);
    } else if (ship.invincible <= 0 && dist(ship, u) < ship.radius + u.radius) {
      killShip();
      break;
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
const ICON_SCALE = 0.55;

function drawLifeIcon(x, y) {
  const skin = SKINS[skinIndex];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(ICON_SCALE, ICON_SCALE);
  ctx.strokeStyle = skin.stroke;
  ctx.lineWidth   = 1.2 / ICON_SCALE;  // compensa el escalado
  ctx.lineJoin    = 'round';
  tracePoly(skin.verts);
  if (skin.fill) {
    ctx.fillStyle = skin.fill;
    ctx.fill();
  }
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Nombre de la nave tras cambiar de skin
  if (skinLabelTimer > 0) {
    const skin = SKINS[skinIndex];
    ctx.fillStyle = skin.stroke;
    ctx.textAlign = 'center';
    ctx.fillText(`NAVE: ${skin.name}`, W / 2, 48);
  }

  // Tiempo restante de cada power-up activo
  ctx.textAlign = 'left';
  let hudY = 48;
  if (!ship.dead && ship.speedBoost > 0) {
    ctx.fillStyle = '#ffd21e';
    ctx.fillText(`VELOCIDAD ${ship.speedBoost.toFixed(1)}s`, 14, hudY);
    hudY += 22;
  }
  if (!ship.dead && ship.tripleShot > 0) {
    ctx.fillStyle = '#53ff73';
    ctx.fillText(`TRIPLE ${ship.tripleShot.toFixed(1)}s`, 14, hudY);
  }

  if (!ship.dead) drawShieldBar();
}

function drawShieldBar() {
  const x = 14, y = H - 26, w = 110, h = 8;
  const frac = ship.shieldEnergy / SHIELD_MAX;

  ctx.font      = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('ESCUDO', x, y - 6);

  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth   = 1;
  ctx.strokeRect(x, y, w, h);

  // Cian brillante activo; rojo si se agotó (soltar Shift para reactivar)
  ctx.fillStyle = ship.shieldActive    ? '#7df9ff'
                : ship.shieldDepleted  ? 'rgba(255, 90, 90, 0.5)'
                : 'rgba(125, 249, 255, 0.35)';
  ctx.fillRect(x + 1, y + 1, (w - 2) * frac, h - 2);
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  stars.forEach(s => s.draw());
  powerups.forEach(p => p.draw());
  orbs.forEach(o => o.draw());
  ufos.forEach(u => u.draw());
  bullets.forEach(b => b.draw());
  enemyBullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO REINICIA · C CAMBIA NAVE`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);

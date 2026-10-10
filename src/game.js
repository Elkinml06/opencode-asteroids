'use strict';

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

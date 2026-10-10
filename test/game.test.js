'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./harness');

const { game, pressKey, releaseKey, reset, nearly, ctxCalls } = createHarness();

// Prepara un campo controlado para llamar a update(): nave invulnerable y
// un asteroide "señuelo" aparcado lejos. El señuelo evita tanto muertes
// accidentales como el nextLevel() que dispara un campo vacío.
function prepareField() {
  reset();
  const ship = game.getShip();
  ship.invincible = 999;
  const asteroids = game.getAsteroids();
  asteroids.length = 0;
  const decoy = new game.Asteroid(700, 550, 3);
  decoy.vx = 0;
  decoy.vy = 0;
  asteroids.push(decoy);
  return { ship, decoy };
}

describe('initGame', () => {
  it('arranca una partida limpia', () => {
    reset();
    assert.equal(game.getState(), 'playing');
    assert.equal(game.getScore(), 0);
    assert.equal(game.getLives(), 3);
    assert.equal(game.getLevel(), 1);
    assert.equal(game.getBullets().length, 0);
    assert.equal(game.getEnemyBullets().length, 0);
    assert.equal(game.getStars().length, 0);
    assert.equal(game.getUfos().length, 0);
  });

  it('spawnea 4 asteroides de tamaño 3 lejos del centro', () => {
    reset();
    const asteroids = game.getAsteroids();
    assert.equal(asteroids.length, 4);
    for (const a of asteroids) {
      assert.equal(a.size, 3);
      assert.ok(
        game.dist(a, { x: 400, y: 300 }) >= 130,
        `asteroide demasiado cerca del centro: (${a.x}, ${a.y})`
      );
    }
  });

  it('los temporizadores de estrella y OVNI arrancan en su rango', () => {
    reset();
    assert.ok(game.getStarTimer() >= 10 && game.getStarTimer() <= 20);
    assert.ok(game.getUfoTimer() >= 15 && game.getUfoTimer() <= 25);
  });
});

describe('colisiones y puntuación', () => {
  it('una bala destruye el asteroide: puntos, fragmentos y explosión', () => {
    const { ship, decoy } = prepareField();
    ship.angle = 0;
    const rock = new game.Asteroid(500, 300, 3);
    rock.vx = 0;
    rock.vy = 0;
    game.getAsteroids().push(rock);

    pressKey('Space');
    game.update(0.05);  // la bala nace en 421 y avanza a 447
    assert.equal(game.getBullets().length, 1);
    game.update(0.05);  // 473 → impacto (radio 50)

    assert.equal(game.getScore(), game.POINTS[3]);
    assert.equal(game.getBullets().length, 0);          // la bala murió
    assert.equal(game.getParticles().length, 15);       // size * 5
    const asteroids = game.getAsteroids();
    assert.equal(asteroids.length, 3);                  // señuelo + 2 fragmentos
    const frags = asteroids.filter(a => a !== decoy);
    assert.equal(frags.length, 2);
    for (const frag of frags) assert.equal(frag.size, 2);
  });

  it('la estrella fugaz vale 200 puntos al derribarla', () => {
    const { ship } = prepareField();
    ship.angle = 0;
    const star = new game.ShootingStar();
    star.x = 480;
    star.y = 300;
    star.vx = 0;
    star.vy = 0;
    star.ttl = 99;
    game.getStars().push(star);

    pressKey('Space');
    game.update(0.05);
    game.update(0.05);  // bala en 473 → a 7 px de la estrella

    assert.equal(game.getScore(), game.STAR_POINTS);
    assert.equal(game.getStars().length, 0);
    assert.equal(game.getParticles().length, 10);
  });

  it('el OVNI vale 200 puntos y suelta un orbe garantizado', () => {
    const { ship } = prepareField();
    ship.angle = 0;
    const ufo = new game.Ufo();
    ufo.x = 480;
    ufo.y = 300;
    ufo.vx = 0;
    ufo.wobble = 0;
    ufo.ttl = 99;
    ufo.shootTimer = 99;
    game.getUfos().push(ufo);

    pressKey('Space');
    game.update(0.05);
    game.update(0.05);

    assert.equal(game.getScore(), game.UFO_POINTS);
    assert.equal(game.getUfos().length, 0);
    assert.equal(game.getOrbs().length, 1);   // orbe garantizado
    assert.ok(nearly(game.getOrbs()[0].x, 480));
    assert.ok(Math.abs(game.getOrbs()[0].y - 300) < 0.5);  // vaivén de ±0.15/frame
    assert.equal(game.getParticles().length, 10);
  });

  it('el proyectil enemigo destruye asteroides sin dar puntos', () => {
    reset();
    const rock = new game.Asteroid(400, 300, 2);
    const frags = game.destroyAsteroid(rock, false);
    assert.equal(rock.dead, true);
    assert.equal(frags.length, 2);
    assert.equal(game.getScore(), 0);
  });
});

describe('recogibles', () => {
  it('Velocidad duplica el empuje durante 5 s', () => {
    prepareField();
    const powerup = new game.PowerUp(400, 300, 'speed');  // sobre la nave
    powerup.vx = 0;
    powerup.vy = 0;
    game.getPowerups().push(powerup);
    game.update(0.05);
    assert.equal(game.getShip().speedBoost, game.POWERUP_DURATION);
    assert.equal(game.getPowerups().length, 0);
  });

  it('Triple activa la ráfaga en abanico durante 5 s', () => {
    prepareField();
    const powerup = new game.PowerUp(400, 300, 'triple');
    powerup.vx = 0;
    powerup.vy = 0;
    game.getPowerups().push(powerup);
    game.update(0.05);
    assert.equal(game.getShip().tripleShot, game.TRIPLE_DURATION);
    assert.equal(game.getPowerups().length, 0);
  });

  it('el orbe de escudo recarga a tope y libera el latch', () => {
    const { ship } = prepareField();
    ship.shieldEnergy = 10;
    ship.shieldDepleted = true;
    const orb = new game.ShieldOrb(400, 300);
    orb.vx = 0;
    orb.vy = 0;
    game.getOrbs().push(orb);
    game.update(0.05);
    assert.equal(game.getOrbs().length, 0);
    assert.equal(ship.shieldEnergy, game.SHIELD_MAX);
    assert.equal(ship.shieldDepleted, false);
  });
});

describe('escudo contra enemigos', () => {
  it('el escudo activo destruye asteroides al contacto, sin puntos', () => {
    const { ship, decoy } = prepareField();
    pressKey('ShiftLeft');
    const rock = new game.Asteroid(430, 300, 2);  // a 30 px: dentro del radio
    rock.vx = 0;
    rock.vy = 0;
    game.getAsteroids().push(rock);

    game.update(0.05);
    assert.equal(rock.dead, true);
    assert.equal(game.getScore(), 0);            // el escudo no premia
    assert.equal(game.getParticles().length, 10);
    assert.ok(nearly(ship.shieldEnergy, game.SHIELD_MAX - game.SHIELD_DRAIN * 0.05));
    // La roca muerta por escudo se retira del campo al frame siguiente
    // (el filtro de asteroides corre antes del chequeo nave ↔ asteroide)
    assert.equal(game.getAsteroids().length, 2);
    releaseKey('ShiftLeft');

    game.update(0.05);
    const asteroids = game.getAsteroids();
    assert.equal(asteroids.length, 1);           // solo queda el señuelo
    assert.equal(asteroids[0], decoy);
  });
});

describe('muerte, vidas y reinicio', () => {
  it('un proyectil enemigo mata a la nave', () => {
    const { ship } = prepareField();
    ship.invincible = 0;  // vulnerable para la prueba
    const enemyBullet = new game.EnemyBullet(400, 300, 0);
    enemyBullet.vx = 0;
    enemyBullet.vy = 0;
    game.getEnemyBullets().push(enemyBullet);

    game.update(0.05);
    assert.equal(game.getState(), 'dead');
    assert.equal(game.getLives(), 2);
    assert.equal(ship.dead, true);
    assert.equal(game.getParticles().length, 14);
    assert.equal(game.getEnemyBullets().length, 0);
  });

  it('tras 2 s reaparece en el centro con invencibilidad', () => {
    prepareField();
    game.killShip();
    assert.equal(game.getState(), 'dead');
    game.update(2.1);
    assert.equal(game.getState(), 'playing');
    const ship = game.getShip();
    assert.equal(ship.dead, false);
    assert.equal(ship.x, 400);
    assert.equal(ship.y, 300);
    assert.equal(ship.invincible, 3);
  });

  it('perder las 3 vidas acaba en gameover y Espacio reinicia', () => {
    prepareField();
    game.destroyAsteroid(new game.Asteroid(0, 0, 1), true);  // algo de score
    assert.equal(game.getScore(), game.POINTS[1]);

    game.killShip();
    game.killShip();
    game.killShip();
    assert.equal(game.getState(), 'gameover');
    assert.equal(game.getLives(), 0);

    pressKey('Space');
    game.update(0.016);
    assert.equal(game.getState(), 'playing');
    assert.equal(game.getScore(), 0);
    assert.equal(game.getLives(), 3);
    assert.equal(game.getLevel(), 1);
  });
});

describe('niveles', () => {
  it('vaciar el campo sube de nivel con más rocas y escudo a tope', () => {
    const { ship } = prepareField();
    ship.shieldEnergy = 10;
    game.getAsteroids().length = 0;
    game.update(0.016);

    assert.equal(game.getLevel(), 2);
    assert.equal(game.getAsteroids().length, 5);  // 3 + nivel
    assert.equal(ship.shieldEnergy, game.SHIELD_MAX);
    assert.equal(ship.invincible, 3);             // reset de reaparición
    assert.equal(ship.x, 400);
    for (const a of game.getAsteroids()) {
      assert.equal(a.size, 3);
      assert.ok(game.dist(a, { x: 400, y: 300 }) >= 130);
    }
  });

  it('el cambio de nivel limpia balas, proyectiles y efectos', () => {
    prepareField();
    game.getBullets().push(new game.Bullet(0, 0, 0));
    game.getEnemyBullets().push(new game.EnemyBullet(0, 0, 0));
    game.getAsteroids().length = 0;
    game.update(0.016);

    assert.equal(game.getLevel(), 2);
    assert.equal(game.getBullets().length, 0);
    assert.equal(game.getEnemyBullets().length, 0);
    assert.equal(game.getParticles().length, 0);
    assert.equal(game.getPowerups().length, 0);
    assert.equal(game.getOrbs().length, 0);
  });
});

describe('loop principal', () => {
  it('el dt entre frames se acota a 0.05 s', () => {
    prepareField();
    const bullet = new game.Bullet(400, 300, 0);
    game.getBullets().push(bullet);

    game.loop(0);  // primer frame: dt = 0
    assert.equal(bullet.dead, false);
    assert.ok(nearly(bullet.ttl, 1.1));

    game.loop(5000);  // hueco de 5 s → dt clampado a 0.05
    assert.ok(nearly(bullet.x, 426));    // 400 + 520 * 0.05
    assert.ok(nearly(bullet.ttl, 1.05)); // 1.1 - 0.05
    assert.equal(bullet.dead, false);
  });
});

describe('render (smoke)', () => {
  it('draw() pinta sin errores jugando y en game over', () => {
    reset();
    game.draw();  // jugando

    game.killShip();
    game.killShip();
    game.killShip();
    game.draw();  // game over con overlay

    assert.ok(ctxCalls.some(call => call.name === 'fillRect'));  // fondo
    assert.ok(ctxCalls.some(call => call.name === 'fillText'));  // HUD / overlay
  });
});

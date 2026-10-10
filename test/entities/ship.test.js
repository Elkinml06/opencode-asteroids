'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../harness');

const { game, pressKey, releaseKey, reset, nearly } = createHarness();

const ROT = 3.5;    // rad/s (valor del juego)
const DRAG = 0.987; // frenado por frame (valor del juego)

describe('Ship', () => {
  let ship;

  beforeEach(() => {
    reset();
    ship = game.getShip();
  });

  it('reset la coloca en el centro apuntando hacia arriba', () => {
    ship.reset();
    assert.equal(ship.x, 400);
    assert.equal(ship.y, 300);
    assert.ok(nearly(ship.angle, -Math.PI / 2));
    assert.equal(ship.vx, 0);
    assert.equal(ship.vy, 0);
    assert.equal(ship.radius, 12);
    assert.equal(ship.invincible, 3);
  });

  it('gira con las flechas izquierda y derecha', () => {
    pressKey('ArrowLeft');
    ship.update(1);
    assert.ok(nearly(ship.angle, -Math.PI / 2 - ROT));
    releaseKey('ArrowLeft');

    pressKey('ArrowRight');
    ship.update(1);
    assert.ok(nearly(ship.angle, -Math.PI / 2));
    releaseKey('ArrowRight');
  });

  it('el empuje acelera en la dirección del ángulo', () => {
    ship.angle = 0;  // apunta a la derecha
    pressKey('ArrowUp');
    ship.update(1);
    assert.ok(nearly(ship.vx, 260 * DRAG), `vx esperado ~${260 * DRAG}, fue ${ship.vx}`);
    assert.ok(nearly(ship.vy, 0));
    assert.equal(ship.thrusting, true);
    releaseKey('ArrowUp');
  });

  it('Velocidad duplica el empuje mientras dura el power-up', () => {
    ship.angle = 0;
    ship.speedBoost = 5;
    pressKey('ArrowUp');
    ship.update(1);
    assert.ok(nearly(ship.vx, 520 * DRAG), `vx esperado ~${520 * DRAG}, fue ${ship.vx}`);
    assert.ok(nearly(ship.speedBoost, 4));
    releaseKey('ArrowUp');
  });

  it('el drag frena la velocidad en cada frame', () => {
    ship.vx = 100;
    ship.update(1);
    assert.ok(nearly(ship.vx, 100 * DRAG));
  });

  it('envuelve al salir de pantalla (el drag se aplica antes de mover)', () => {
    ship.x = 795;
    ship.vx = 100;
    ship.update(0.5);  // 795 + 98.7*0.5 = 844.35 → wrap 44.35
    assert.ok(nearly(ship.x, 44.35));
  });

  it('la nave muerta no se actualiza ni se mueve', () => {
    ship.dead = true;
    // Nota: el array viene del realm de `vm`, no se puede comparar con deepEqual
    assert.equal(ship.update(1).length, 0);
    assert.equal(ship.x, 400);
  });

  it('la invencibilidad de reaparición cuenta atrás', () => {
    ship.invincible = 0.5;
    ship.update(0.6);
    assert.ok(ship.invincible <= 0);
  });

  it('tryShoot dispara desde la nariz y respeta el cooldown', () => {
    ship.angle = 0;
    const [bullet] = ship.tryShoot();
    assert.equal(bullet.x, 421);  // 400 + cos(0) * 21 (nariz)
    assert.ok(nearly(bullet.y, 300));
    assert.equal(bullet.vx, 520);
    assert.ok(nearly(ship.shootCooldown, game.SHOT_COOLDOWN));

    assert.equal(ship.tryShoot().length, 0);  // en cooldown

    ship.update(game.SHOT_COOLDOWN + 0.01);
    assert.equal(ship.tryShoot().length, 1);
  });

  it('Triple dispara una ráfaga de 3 balas en abanico', () => {
    ship.angle = 0;
    ship.tripleShot = 5;

    const central = ship.tryShoot();
    assert.equal(central.length, 1);
    assert.ok(nearly(central[0].y, 300));
    assert.equal(ship.burstLeft, 2);
    assert.ok(nearly(ship.shootCooldown, game.BURST_DELAY));

    // Las laterales salen desde update() con BURST_SPREAD de desvío
    const left = ship.update(0.1);
    assert.equal(left.length, 1);
    assert.ok(nearly(left[0].y, 300 + Math.sin(-game.BURST_SPREAD) * 21));
    assert.equal(ship.burstLeft, 1);

    const right = ship.update(0.1);
    assert.equal(right.length, 1);
    assert.ok(nearly(right[0].y, 300 + Math.sin(game.BURST_SPREAD) * 21));
    assert.equal(ship.burstLeft, 0);
    assert.ok(nearly(ship.shootCooldown, game.SHOT_COOLDOWN));

    assert.equal(ship.update(0.001).length, 0);  // ráfaga completa
  });
});

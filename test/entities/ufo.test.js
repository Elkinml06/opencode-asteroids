'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../harness');

const { game, stubRandom, restoreRandom, reset, nearly } = createHarness();

describe('Ufo (OVNI artillero)', () => {
  beforeEach(() => reset());

  it('nace en un borde lateral y cruza hacia el otro', () => {
    stubRandom(0.4);  // fromLeft → entra por la izquierda
    const left = new game.Ufo();
    assert.equal(left.x, 0);
    assert.ok(left.vx > 0);
    restoreRandom();

    stubRandom(0.6);  // !fromLeft → entra por la derecha
    const right = new game.Ufo();
    assert.equal(right.x, game.W);
    assert.ok(right.vx < 0);
    restoreRandom();
  });

  it('vuela a una altura del 15%–85% de la pantalla', () => {
    const ufo = new game.Ufo();
    assert.ok(ufo.y >= game.H * 0.15 && ufo.y <= game.H * 0.85, `y fuera de rango: ${ufo.y}`);
  });

  it('se marcha a los 12 s con un pequeño destello', () => {
    const ufo = new game.Ufo();
    ufo.ttl = 0.5;
    ufo.update(1);
    assert.equal(ufo.dead, true);
    assert.equal(game.getParticles().length, 6);
  });

  it('vaivén vertical suave mientras avanza', () => {
    const ufo = new game.Ufo();
    ufo.y = 300;
    ufo.wobble = 0;
    ufo.ttl = 99;
    ufo.shootTimer = 99;
    ufo.update(0.5);  // wobble = 1 → y += sin(1) * 30 * 0.5
    assert.ok(nearly(ufo.y, 300 + Math.sin(1) * 15));
  });

  it('tryShoot apunta a la nave y resetea el temporizador', () => {
    const ufo = new game.Ufo();
    ufo.x = 100;
    ufo.y = 100;
    stubRandom(0.5);  // error de puntería rand(-0.12, 0.12) → 0
    const bullet = ufo.tryShoot({ x: 100, y: 300 });  // blanco justo debajo
    restoreRandom();

    assert.ok(bullet instanceof game.EnemyBullet);
    assert.ok(nearly(bullet.x, 100));      // nace en el borde del platillo
    assert.ok(nearly(bullet.y, 116));      // 100 + sin(π/2) * 16
    assert.ok(nearly(bullet.vx, 0));
    assert.ok(nearly(bullet.vy, 300));
    assert.ok(nearly(ufo.shootTimer, game.UFO_FIRE_INTERVAL));
  });

  it('el temporizador de disparo cuenta atrás', () => {
    const ufo = new game.Ufo();
    ufo.shootTimer = 0.5;
    ufo.update(1);
    assert.ok(ufo.shootTimer <= 0);
  });
});

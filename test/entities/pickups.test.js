'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../harness');

const { game, stubRandom, restoreRandom, reset, nearly } = createHarness();

// explode() crea size*5 partículas (3 randoms cada una) ANTES del chequeo
// de drop de destroyAsteroid: para una roca pequeña son 15 randoms de ruido.
const PARTICLE_RANDOMS = 15;

describe('PowerUp (rayo Velocidad / chevrones Triple)', () => {
  it('vive 10 s y luego muere', () => {
    const p = new game.PowerUp(400, 300, 'speed');
    p.update(9.9);
    assert.equal(p.dead, false);
    p.update(0.2);
    assert.equal(p.dead, true);
  });

  it('deriva y envuelve en los bordes', () => {
    const p = new game.PowerUp(790, 300, 'triple');
    p.vx = 100;
    p.vy = 0;
    p.update(0.5);  // 790 + 50 = 840 → wrap 40
    assert.equal(p.x, 40);
  });
});

describe('ShieldOrb (orbe de escudo)', () => {
  it('vive 10 s y luego muere', () => {
    const orb = new game.ShieldOrb(400, 300);
    orb.update(9.9);
    assert.equal(orb.dead, false);
    orb.update(0.2);
    assert.equal(orb.dead, true);
  });

  it('su anillo pulsa con el tiempo', () => {
    const orb = new game.ShieldOrb(0, 0);
    const pulse = orb.pulse;
    orb.update(1);
    assert.ok(nearly(orb.pulse, pulse + 6));
  });
});

describe('destroyAsteroid (puntos y drops)', () => {
  beforeEach(() => reset());

  it('sin reward no da puntos ni drops, pero sí fragmentos', () => {
    const rock = new game.Asteroid(400, 300, 1);
    const frags = game.destroyAsteroid(rock, false);
    assert.equal(rock.dead, true);
    assert.equal(frags.length, 0);               // tamaño 1: sin fragmentos
    assert.equal(game.getScore(), 0);
    assert.equal(game.getPowerups().length, 0);
    assert.equal(game.getOrbs().length, 0);
    assert.equal(game.getParticles().length, 5); // size*5
  });

  it('con reward suma POINTS según el tamaño', () => {
    for (const size of [1, 2, 3]) {
      reset();
      const rock = new game.Asteroid(0, 0, size);
      const frags = game.destroyAsteroid(rock, true);
      assert.equal(game.getScore(), game.POINTS[size]);
      assert.equal(frags.length, size > 1 ? 2 : 0);
    }
  });

  it('el 90% de las veces no suelta recogible', () => {
    stubRandom(0.5);  // 0.5 > PICKUP_DROP_CHANCE
    const rock = new game.Asteroid(400, 300, 1);
    game.destroyAsteroid(rock, true);
    assert.equal(game.getPowerups().length, 0);
    assert.equal(game.getOrbs().length, 0);
    restoreRandom();
  });

  it('el drop del 10% se reparte en tercios: speed / triple / orbe', () => {
    const cases = [
      [0.2, 'speed'],   // roll < 1/3
      [0.5, 'triple'],  // 1/3 ≤ roll < 2/3
      [0.9, 'orb'],     // roll ≥ 2/3
    ];
    for (const [roll, expected] of cases) {
      reset();
      const rock = new game.Asteroid(400, 300, 1);  // construido con azar real
      // 15 randoms de las partículas, luego el chequeo de drop y el roll
      stubRandom(...Array(PARTICLE_RANDOMS).fill(0.5), 0.05, roll);
      game.destroyAsteroid(rock, true);
      assert.equal(game.getScore(), game.POINTS[1]);

      if (expected === 'orb') {
        assert.equal(game.getOrbs().length, 1);
        assert.equal(game.getOrbs()[0].x, 400);
        assert.equal(game.getPowerups().length, 0);
      } else {
        assert.equal(game.getPowerups().length, 1);
        assert.equal(game.getPowerups()[0].type, expected);
        assert.equal(game.getPowerups()[0].x, 400);
        assert.equal(game.getOrbs().length, 0);
      }
      restoreRandom();
    }
  });
});

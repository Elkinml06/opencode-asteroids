'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./harness');

const { game, stubRandom, restoreRandom, reset, nearly } = createHarness();

describe('ShootingStar (estrella fugaz)', () => {
  beforeEach(() => reset());

  it('nace en un borde de la pantalla', () => {
    for (const value of [0.2, 0.4, 0.5, 0.6, 0.8]) {
      stubRandom(value);
      const star = new game.ShootingStar();
      const onEdge = star.x === 0 || star.x === game.W || star.y === 0 || star.y === game.H;
      assert.ok(onEdge, `nació dentro de la pantalla: (${star.x}, ${star.y})`);
    }
    restoreRandom();
  });

  it('apunta hacia la zona central de la pantalla', () => {
    stubRandom(0.2);  // nace arriba: (160, 0)
    const star = new game.ShootingStar();
    restoreRandom();
    assert.ok(star.vx > 0);
    assert.ok(star.vy > 0);  // baja hacia el centro
  });

  it('vive 8 s y al desvanecerse muere con un destello', () => {
    const star = new game.ShootingStar();
    star.ttl = 0.2;
    star.update(0.5);
    assert.equal(star.dead, true);
    assert.equal(game.getParticles().length, 6);
  });

  it('es una estrella de 4 puntas: 8 vértices alternando radio 12/4', () => {
    const star = new game.ShootingStar();
    assert.equal(star.verts.length, 8);
    assert.equal(star.radius, 12);
    for (let i = 0; i < star.verts.length; i++) {
      const r = Math.hypot(star.verts[i][0], star.verts[i][1]);
      const expected = i % 2 === 0 ? 12 : 4;
      assert.ok(nearly(r, expected), `vértice ${i}: radio ${r}, esperado ${expected}`);
    }
  });

  it('deriva a gran velocidad y envuelve en los bordes', () => {
    const star = new game.ShootingStar();
    star.x = 790;
    star.vx = 400;
    star.vy = 0;
    star.ttl = 99;
    star.update(0.1);  // 790 + 40 = 830 → wrap 30
    assert.equal(star.x, 30);
  });
});

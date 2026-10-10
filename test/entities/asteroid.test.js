'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../harness');

const { game } = createHarness();

describe('Asteroid', () => {
  it('el radio sale de RADII según el tamaño', () => {
    assert.equal(new game.Asteroid(0, 0, 1).radius, game.RADII[1]);
    assert.equal(new game.Asteroid(0, 0, 2).radius, game.RADII[2]);
    assert.equal(new game.Asteroid(0, 0, 3).radius, game.RADII[3]);
  });

  it('por defecto nace de tamaño 3', () => {
    assert.equal(new game.Asteroid(0, 0).size, 3);
  });

  it('se mueve con su velocidad, rota y envuelve en los bordes', () => {
    const a = new game.Asteroid(100, 100, 3);
    a.vx = 100;
    a.vy = -50;
    a.rotSpeed = 2;
    a.rot = 0;
    a.update(1);
    assert.equal(a.x, 200);
    assert.equal(a.y, 50);
    assert.equal(a.rot, 2);

    const wrapping = new game.Asteroid(790, 10, 1);
    wrapping.vx = 100;
    wrapping.vy = 0;
    wrapping.update(0.5);  // 790 + 50 = 840 → wrap 40
    assert.equal(wrapping.x, 40);
  });

  it('split: tamaños 3 y 2 dan dos fragmentos de un tamaño menos', () => {
    const parent = new game.Asteroid(123, 456, 3);
    const frags = parent.split();
    assert.equal(frags.length, 2);
    for (const frag of frags) {
      assert.equal(frag.size, 2);
      assert.equal(frag.radius, game.RADII[2]);
      assert.equal(frag.x, 123);
      assert.equal(frag.y, 456);
    }
  });

  it('split: el tamaño 1 no da fragmentos', () => {
    assert.equal(new game.Asteroid(0, 0, 1).split().length, 0);
  });

  it('una roca grande genera 6 fragmentos en total (2 + 4)', () => {
    let alive = [new game.Asteroid(400, 300, 3)];
    let total = 0;
    while (alive.length) {
      const next = [];
      for (const a of alive) next.push(...a.split());
      total += next.length;
      alive = next;
    }
    assert.equal(total, 6);
  });

  it('construye un polígono irregular de 8 a 13 vértices', () => {
    const a = new game.Asteroid(0, 0, 2);
    assert.ok(a.verts.length >= 8 && a.verts.length <= 13);
    for (const [x, y] of a.verts) {
      const r = Math.hypot(x, y);
      assert.ok(r <= a.radius, `vértice fuera del radio: ${r}`);
      assert.ok(r >= a.radius * 0.6 - 1e-9, `vértice demasiado interno: ${r}`);
    }
  });
});

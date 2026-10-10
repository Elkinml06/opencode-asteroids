'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./harness');

const { game, stubRandom, restoreRandom } = createHarness();

describe('wrap (espacio toroidal)', () => {
  it('mantiene los valores dentro del rango', () => {
    assert.equal(game.wrap(5, 800), 5);
    assert.equal(game.wrap(0, 800), 0);
    assert.equal(game.wrap(799.5, 800), 799.5);
  });

  it('envuelve al cruzar el borde superior', () => {
    assert.equal(game.wrap(805, 800), 5);
    assert.equal(game.wrap(1600, 800), 0);
  });

  it('envuelve los negativos al borde inferior', () => {
    assert.equal(game.wrap(-5, 800), 795);
    assert.equal(game.wrap(-800, 800), 0);
  });
});

describe('dist', () => {
  it('calcula la distancia euclídea', () => {
    assert.equal(game.dist({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
    assert.equal(game.dist({ x: 10, y: 10 }, { x: 10, y: 10 }), 0);
  });
});

describe('rand / randInt', () => {
  it('rand mapea [0,1) al rango pedido', () => {
    stubRandom(0);
    assert.equal(game.rand(10, 20), 10);
    stubRandom(0.5);
    assert.equal(game.rand(10, 20), 15);
    stubRandom(1);
    assert.equal(game.rand(10, 20), 20);
    restoreRandom();
  });

  it('randInt devuelve enteros dentro del rango', () => {
    stubRandom(0);
    assert.equal(game.randInt(3, 7), 3);
    stubRandom(0.999999);
    assert.equal(game.randInt(3, 7), 7);
    restoreRandom();
  });

  it('con azar real los valores caen dentro del rango', () => {
    for (let i = 0; i < 100; i++) {
      const value = game.randInt(3, 7);
      assert.ok(Number.isInteger(value) && value >= 3 && value <= 7, `valor fuera de rango: ${value}`);
    }
  });
});

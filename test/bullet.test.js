'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./harness');

const { game, nearly } = createHarness();

describe('Bullet (bala del jugador)', () => {
  it('sale a 520 px/s en la dirección del ángulo', () => {
    const b = new game.Bullet(0, 0, 0);
    assert.equal(b.vx, 520);
    assert.equal(b.vy, 0);

    const diagonal = new game.Bullet(0, 0, Math.PI / 2);
    assert.ok(nearly(diagonal.vx, 0), `vx esperado ~0, fue ${diagonal.vx}`);
    assert.ok(nearly(diagonal.vy, 520), `vy esperado ~520, fue ${diagonal.vy}`);
  });

  it('ttl de 1.1 s y radio 2', () => {
    const b = new game.Bullet(0, 0, 0);
    assert.ok(nearly(b.ttl, 1.1));
    assert.equal(b.radius, 2);
    assert.equal(b.dead, false);
  });

  it('avanza según dt y no muere antes de tiempo', () => {
    const b = new game.Bullet(400, 300, 0);
    b.update(0.5);
    assert.ok(nearly(b.x, 660));
    assert.ok(nearly(b.y, 300));
    assert.ok(nearly(b.ttl, 0.6));
    assert.equal(b.dead, false);
  });

  it('envuelve al cruzar el borde (horizontal y vertical)', () => {
    const horizontal = new game.Bullet(790, 300, 0);
    horizontal.update(0.1);  // 790 + 52 = 842 → wrap 42
    assert.ok(nearly(horizontal.x, 42));

    const vertical = new game.Bullet(400, 590, Math.PI / 2);
    vertical.update(0.1);    // 590 + 52 = 642 → wrap 42
    assert.ok(nearly(vertical.y, 42));
  });

  it('muere al agotarse el ttl', () => {
    const b = new game.Bullet(0, 0, 0);
    b.update(1.2);
    assert.equal(b.dead, true);
  });
});

describe('EnemyBullet (proyectil del OVNI)', () => {
  it('sale a 300 px/s, ttl 1.6 s y radio 3', () => {
    const b = new game.EnemyBullet(0, 0, 0);
    assert.equal(b.vx, 300);
    assert.equal(b.vy, 0);
    assert.ok(nearly(b.ttl, 1.6));
    assert.equal(b.radius, 3);
  });

  it('avanza y muere al agotarse el ttl', () => {
    const b = new game.EnemyBullet(0, 0, 0);
    b.update(0.5);
    assert.ok(nearly(b.x, 150));
    assert.equal(b.dead, false);
    b.update(1.2);
    assert.equal(b.dead, true);
  });
});

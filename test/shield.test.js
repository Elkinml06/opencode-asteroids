'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./harness');

const { game, pressKey, releaseKey, reset, nearly } = createHarness();

describe('Escudo de energía', () => {
  let ship;

  beforeEach(() => {
    reset();
    ship = game.getShip();
  });

  it('se activa con Shift y drena 50/s', () => {
    pressKey('ShiftLeft');
    ship.update(1);
    assert.equal(ship.shieldActive, true);
    assert.ok(nearly(ship.shieldEnergy, game.SHIELD_MAX - game.SHIELD_DRAIN));
    releaseKey('ShiftLeft');
  });

  it('al agotarse queda desactivado y en latch', () => {
    pressKey('ShiftLeft');
    ship.update(2);  // 100 - 50*2 = 0
    assert.equal(ship.shieldEnergy, 0);
    assert.equal(ship.shieldActive, false);
    assert.equal(ship.shieldDepleted, true);

    // Sin soltar Shift no se re-engancha: solo gotea la regeneración
    ship.update(1);
    assert.equal(ship.shieldActive, false);
    assert.equal(ship.shieldDepleted, true);
    assert.ok(nearly(ship.shieldEnergy, game.SHIELD_REGEN));
    releaseKey('ShiftLeft');
  });

  it('soltar Shift libera el latch y se puede reactivar', () => {
    pressKey('ShiftLeft');
    ship.update(2);
    releaseKey('ShiftLeft');
    ship.update(0.01);
    assert.equal(ship.shieldDepleted, false);

    ship.shieldEnergy = 50;
    pressKey('ShiftLeft');
    ship.update(0.01);
    assert.equal(ship.shieldActive, true);
    assert.ok(nearly(ship.shieldEnergy, 50 - game.SHIELD_DRAIN * 0.01));
    releaseKey('ShiftLeft');
  });

  it('sin Shift regenera un goteo de 1/s', () => {
    ship.shieldEnergy = 50;
    ship.update(1);
    assert.ok(nearly(ship.shieldEnergy, 50 + game.SHIELD_REGEN));
  });

  it('ShiftRight también activa el escudo', () => {
    pressKey('ShiftRight');
    ship.update(0.1);
    assert.equal(ship.shieldActive, true);
    releaseKey('ShiftRight');
  });
});

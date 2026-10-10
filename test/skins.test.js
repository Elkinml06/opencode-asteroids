'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./harness');

const h = createHarness();
const { game, localStorage, pressKey, reset, nearly } = h;

describe('Skins de la nave', () => {
  beforeEach(() => reset());

  it('hay 4 skins con nombre, polígono y colores', () => {
    assert.equal(game.SKINS.length, 4);
    for (const skin of game.SKINS) {
      assert.equal(typeof skin.name, 'string');
      assert.ok(Array.isArray(skin.verts) && skin.verts.length >= 4);
      assert.equal(typeof skin.stroke, 'string');
      assert.equal(typeof skin.flame, 'string');
    }
  });

  it('comparten nariz en x=20 y alcance ≤ 14 (hitbox y cañón iguales)', () => {
    for (const skin of game.SKINS) {
      assert.equal(skin.verts[0][0], 20, `${skin.name}: la nariz no está en x=20`);
      assert.equal(skin.verts[0][1], 0);
      for (let i = 1; i < skin.verts.length; i++) {
        const [x, y] = skin.verts[i];
        assert.ok(
          Math.abs(x) <= 14 && Math.abs(y) <= 14,
          `${skin.name}: excede el alcance con (${x}, ${y})`
        );
      }
    }
  });

  it('loadSkin lee el índice guardado', () => {
    localStorage.setItem(game.SKIN_STORAGE_KEY, '2');
    assert.equal(game.loadSkin(), 2);
  });

  it('loadSkin cae a la skin clásica con datos inválidos', () => {
    localStorage.setItem(game.SKIN_STORAGE_KEY, '99');
    assert.equal(game.loadSkin(), 0);
    localStorage.setItem(game.SKIN_STORAGE_KEY, 'abc');
    assert.equal(game.loadSkin(), 0);
    localStorage.removeItem(game.SKIN_STORAGE_KEY);
    assert.equal(game.loadSkin(), 0);
  });

  it('cycleSkin avanza en ciclo, persiste y anuncia la nave', () => {
    const start = game.getSkinIndex();
    game.cycleSkin();
    const expected = (start + 1) % game.SKINS.length;
    assert.equal(game.getSkinIndex(), expected);
    assert.equal(localStorage.getItem(game.SKIN_STORAGE_KEY), String(expected));
    assert.ok(nearly(game.getSkinLabelTimer(), 2));

    for (let i = 0; i < game.SKINS.length - 1; i++) game.cycleSkin();
    assert.equal(game.getSkinIndex(), start);  // da la vuelta completa
  });

  it('la tecla C cambia de nave durante la partida', () => {
    const before = game.getSkinIndex();
    pressKey('KeyC');
    game.update(0.016);
    assert.equal(game.getSkinIndex(), (before + 1) % game.SKINS.length);
    assert.ok(nearly(game.getSkinLabelTimer(), 2 - 0.016));
  });
});

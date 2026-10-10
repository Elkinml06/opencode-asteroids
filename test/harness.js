'use strict';

// Harness de tests: carga los scripts de `src/` en un sandbox de `vm` SIN
// modificarlos, con mocks mínimos de DOM/canvas/localStorage y un Math
// inyectado que permite fijar Math.random para pruebas deterministas.
// El orden de carga se lee de index.html (fuente única de verdad, igual
// que en el navegador) y los ficheros se concatenan en UN solo script.

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

// Concatena los scripts que index.html declara, en su mismo orden de carga
function loadGameSource() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  if (srcs.length === 0) throw new Error('index.html no declara ningún <script src>');
  return srcs.map(src => fs.readFileSync(path.join(ROOT, src), 'utf8')).join('\n');
}

// Shim que se añade SOLO en memoria (los ficheros de src/ no se tocan):
// expone entidades, constantes y accesores del juego. Los `let` del estado
// se reasignan dentro de update(), así que deben leerse con getters;
// los objetos estables (keys, justPressed) van por referencia directa.
const SHIM = `
;globalThis.__game = {
  Bullet, EnemyBullet, Asteroid, ShootingStar, Ufo, Ship, Particle, PowerUp, ShieldOrb,
  W, H, RADII, POINTS, STAR_POINTS, UFO_POINTS, UFO_FIRE_INTERVAL,
  SHOT_COOLDOWN, BURST_DELAY, BURST_SPREAD,
  SHIELD_MAX, SHIELD_DRAIN, SHIELD_REGEN, SHIELD_RADIUS,
  PICKUP_DROP_CHANCE, POWERUP_DURATION, TRIPLE_DURATION,
  SKINS, SKIN_STORAGE_KEY,
  wrap, dist, rand, randInt,
  keys, justPressed,
  loadSkin, cycleSkin, initGame, destroyAsteroid, killShip, update, draw, loop,
  getShip: () => ship, getBullets: () => bullets, getEnemyBullets: () => enemyBullets,
  getAsteroids: () => asteroids, getParticles: () => particles,
  getPowerups: () => powerups, getOrbs: () => orbs,
  getStars: () => stars, getUfos: () => ufos,
  getScore: () => score, getLives: () => lives, getLevel: () => level, getState: () => state,
  getStarTimer: () => starTimer, getUfoTimer: () => ufoTimer,
  getSkinIndex: () => skinIndex, getSkinLabelTimer: () => skinLabelTimer,
};
globalThis.__game;
`;

function createHarness() {
  const source = loadGameSource();

  // ctx de canvas falso: cualquier llamada queda registrada y no hace nada;
  // cualquier asignación de estilo se acepta. Robusto ante llamadas nuevas.
  const ctxCalls = [];
  const ctx = new Proxy({}, {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined;
      return (...args) => { ctxCalls.push({ name: prop, args }); };
    },
    set(_target, _prop, _value) {
      return true;
    },
  });

  const canvas = { width: 800, height: 600, getContext: () => ctx };

  // window falso: captura los listeners de teclado para simular pulsaciones
  const listeners = new Map();
  const window = {
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener() {},
  };

  const document = { getElementById: (id) => (id === 'canvas' ? canvas : null) };

  const storage = new Map();
  const localStorage = {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => { storage.set(key, String(value)); },
    removeItem: (key) => { storage.delete(key); },
  };

  // El loop nunca arranca solo: los tests llaman a update()/loop() a mano
  const requestAnimationFrame = () => 0;

  // Math inyectado: los tests fijan Math.random para resultados deterministas
  const math = Object.create(Math);
  let randomQueue = null;  // null = azar real
  math.random = () => {
    if (randomQueue === null) return Math.random();
    if (randomQueue.length > 1) return randomQueue.shift();
    return randomQueue[0];  // cola agotada: repite el último valor
  };

  const sandbox = { document, window, localStorage, requestAnimationFrame, Math: math, console };
  const game = vm.runInContext(source + SHIM, vm.createContext(sandbox), { filename: 'src' });

  const dispatch = (type, code) => {
    const event = { code, preventDefault() {} };
    for (const handler of listeners.get(type) || []) handler(event);
  };

  const pressKey = (code) => dispatch('keydown', code);
  const releaseKey = (code) => dispatch('keyup', code);
  const stubRandom = (...values) => { randomQueue = values.length > 0 ? values : null; };
  const restoreRandom = () => { randomQueue = null; };

  // Estado limpio entre tests: azar real, storage vacío y teclas sueltas
  const reset = () => {
    restoreRandom();
    storage.clear();
    for (const code of Object.keys(game.keys)) delete game.keys[code];
    for (const code of Object.keys(game.justPressed)) delete game.justPressed[code];
    game.initGame();
  };

  const nearly = (actual, expected, epsilon = 1e-6) => Math.abs(actual - expected) <= epsilon;

  return { game, ctxCalls, localStorage, pressKey, releaseKey, stubRandom, restoreRandom, reset, nearly };
}

module.exports = { createHarness };

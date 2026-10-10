'use strict';

// ── Skins de la nave ──────────────────────────────────────────────────────────
// Todas comparten nariz en x≈20 y alcance ≤ 14: el hitbox y el cañón no cambian.
const SKINS = [
  {
    name:   'Clásica',
    verts:  [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    stroke: '#fff',
    fill:    null,
    flame:  'rgba(255, 130, 0, 0.85)',
  },
  {
    name:   'Cian',
    verts:  [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    stroke: '#7df9ff',
    fill:    'rgba(125, 249, 255, 0.25)',
    flame:  'rgba(125, 249, 255, 0.8)',
  },
  {
    name:   'Dorada',
    verts:  [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    stroke: '#ffd21e',
    fill:    'rgba(255, 210, 30, 0.2)',
    flame:  'rgba(255, 210, 30, 0.9)',
  },
  {
    name:   'Delta',
    verts:  [[20, 0], [2, -8], [-10, -13], [-8, -3], [-8, 3], [-10, 13], [2, 8]],
    stroke: '#ff5c8a',
    fill:    'rgba(255, 92, 138, 0.2)',
    flame:  'rgba(255, 92, 138, 0.85)',
  },
];

const SKIN_STORAGE_KEY = 'asteroids-skin';

let skinIndex      = loadSkin();
let skinLabelTimer = 0;  // seg restantes para mostrar el nombre en el HUD

function loadSkin() {
  try {
    const saved = Number(localStorage.getItem(SKIN_STORAGE_KEY));
    return Number.isInteger(saved) && saved >= 0 && saved < SKINS.length ? saved : 0;
  } catch {
    return 0;  // storage bloqueado o vacío
  }
}

function cycleSkin() {
  skinIndex = (skinIndex + 1) % SKINS.length;
  try { localStorage.setItem(SKIN_STORAGE_KEY, String(skinIndex)); } catch {}
  skinLabelTimer = 2;
}

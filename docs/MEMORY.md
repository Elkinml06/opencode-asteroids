# MEMORY.md — Asteroids

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina
lo que ya no aporte.

## Estado actual

- Juego completo y jugable: asteroides en 3 tamaños, estrella fugaz, OVNI
  artillero, recogibles (rayo de velocidad, chevrones triple, orbe de
  escudo), escudo de energía (`Shift`), 4 skins (`C`, persisten en
  `localStorage`), 3 vidas y niveles.
- Todo en `game.js` (~1100 líneas, 9 clases), intacto: los tests no lo tocan.
- Suite automática en `test/` (10 ficheros, 79 tests, ~0.1 s) + CI en
  GitHub Actions (push a `main` y pull requests).
- `union` integra `test` (merge sin conflictos); `main` quedó atrás, sin suite.

## Decisiones (y por qué)

- Un solo `game.js` como script global (sin módulos ni toolchain):
  simplicidad ante todo en un proyecto sin dependencias.
- `.md` auxiliares en `docs/` y estáticos en `assets/`; en raíz solo README,
  AGENTS, index y game.js: raíz limpia (README y AGENTS deben ir en raíz por
  convención de GitHub y auto-carga de OpenCode).
- Tests con `node:test` nativo (cero dependencias) y harness que carga
  `game.js` en `vm` con mocks de DOM/canvas/localStorage: el juego queda
  intacto y el ctx falso es robusto ante llamadas nuevas.
- Math inyectado en el sandbox: `stubRandom()` fija `Math.random` y los
  tests de drops/spawns son deterministas.
- Gate "no construir con tests rojos" = GitHub Actions; el bloqueo real
  requiere activar branch protection con el check requerido (manual).

## Aprendizajes y errores a evitar

- `node --test test/` NO acepta directorio como argumento en Node 24:
  usar el glob `node --test "test/*.test.js"` (evita además que el runner
  ejecute `harness.js` como test).
- Los arrays del juego viven en otro realm de `vm`: `deepEqual` contra `[]`
  local falla aunque estén vacíos; comparar `.length` o campos primitivos.
- `destroyAsteroid` llama a `explode()` ANTES del chequeo de drop: una roca
  pequeña quema 15 randoms de partículas; la cola de `stubRandom` debe
  saltárselos para fijar el roll del drop.
- Las rocas muertas por escudo se retiran del array al frame siguiente (el
  filtro de asteroides corre antes del chequeo nave ↔ asteroide).
- En tests de `update()` usar nave invulnerable + asteroide señuelo aparcado:
  un campo vacío dispara `nextLevel()` al final del frame.

## Próximos pasos

- Fusionar `union` en `main` y pushear (CI correrá la suite por primera vez).
- Activar branch protection en GitHub con el check "Tests" como requerido.

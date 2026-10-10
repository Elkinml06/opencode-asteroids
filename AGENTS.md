# AGENTS.md — Asteroids

Clon de Asteroids en canvas HTML5 puro. El juego vive en `src/` como scripts
globales que `index.html` carga en orden. Sin módulos ES, dependencias,
bundler ni toolchain.

## Stack y estructura

- HTML5 Canvas + JavaScript (ES6+), sin frameworks ni dependencias.
- `index.html` — `<canvas>` y los `<script>` de `src/` en orden de carga.
- `src/` — scripts planos que comparten globales: `config.js` (canvas,
  `ctx`, `W`, `H`), `input.js`, `utils.js`, `skins.js`, `game.js` (estado,
  update, draw y loop) y `entities/` (una clase por fichero).
- `test/` — espeja las carpetas de `src/` (`entities/` incluida); corre con
  `node --test`. `harness.js` carga los scripts de `src/` leyendo el orden
  de `index.html`.
- `docs/` — `.md` auxiliares: `MEMORY.md` y los `.md` futuros del proyecto.
- `assets/` — recursos estáticos (favicon).

## Comandos

No hay build ni lint. Tests y servidor local:

```bash
node --test "test/**/*.test.js"   # suite de tests (el mismo comando corre en CI)
npx serve .                       # http://localhost:3000
```

(o abrir `index.html` directamente en el navegador)

## Convenciones

- Identificadores en inglés; comentarios y textos del HUD en español.
- Física basada en `dt` (segundos), clamp a 0.05 s en `loop()`.
- Una clase por entidad con `update(dt)` y `draw()`, en `src/entities/`.

## Reglas de dominio / trampas conocidas

- **Scripts globales con orden de carga.** Los ficheros de `src/` son scripts
  planos sin `import`/`export`: comparten globales (`ctx`, `W`, `H`, `keys`,
  estado en `src/game.js`). El orden lo define `index.html` y no es alfabético.
- **Un fichero nuevo en `src/` no corre solo.** Hay que añadir su `<script>`
  a `index.html` (el orden importa: `config` → `input` → `utils` → entidades
  → `game`). El `test/harness.js` lee el orden de ahí.
- **El tamaño del canvas está duplicado.** `W`/`H` en `src/config.js` (800×600)
  y los atributos del `<canvas>` en `index.html`. Cámbialos siempre en conjunto.
- **`RADII`/`SPEEDS`/`POINTS`** (en `src/entities/asteroid.js`) se indexan por
  tamaño de asteroide (1–3); el índice 0 es placeholder.
- **Las skins comparten nariz y alcance** para no alterar hitbox ni cañón.
- **Los tests acceden al juego vía el SHIM de `test/harness.js`.** Al añadir
  entidades, constantes o estado nuevo en `src/`, expóñelo ahí (getters para
  los `let` que `update()` reasigna).

## Forma de trabajar

- Cambios pequeños y enfocados; planifica antes solo para features completas
  (entidad o mecánica nueva).
- Al terminar, explica qué cambió y cómo verificarlo jugando.

## Límites

- ✅ Siempre: cambios en `src/`/`index.html` siguiendo el estilo existente;
  mantener `node --test` en verde al tocar `src/`; actualizar
  `docs/MEMORY.md` al terminar cada tarea.
- ⚠ Pregunta antes: dependencias nuevas, archivos nuevos, toolchain,
  cambios de balance o controles.
- 🚫 Nunca: `import`/`export` o bundler, reordenar los `<script>` de
  `index.html`, cambiar el tamaño del canvas por un solo lado, borrar
  `docs/MEMORY.md` sin resumir.

## Verificación

- Automática: `node --test "test/**/*.test.js"` en verde (local y en CI).
- Manual, jugando (`npx serve .` o doble clic en `index.html`): sin errores
  en consola, la feature nueva funciona y nada existente se rompe.

## Memoria

- Al empezar, lee `docs/MEMORY.md`; al terminar cada tarea, actualízalo (estado,
  decisiones con porqué, errores a evitar). Máximo ~50 líneas.
- Lo que se vuelva regla permanente va a `AGENTS.md`; nunca datos sensibles.

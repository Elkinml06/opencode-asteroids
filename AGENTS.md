# AGENTS.md — Asteroids

Clon de Asteroids en canvas HTML5 puro. Todo el juego vive en `game.js`
(un solo archivo), cargado por `index.html` con un `<script>` plano.
Sin dependencias, bundler ni toolchain.

## Stack y estructura

- HTML5 Canvas + JavaScript (ES6+), sin frameworks ni dependencias.
- `game.js` — todo el juego: input, utils, clases por entidad y el loop.
- `index.html` — `<canvas>` y el `<script>` plano.
- `MEMORY.md` — memoria entre sesiones (ver sección Memoria).

## Comandos

No hay build, lint ni tests. Solo se ejecuta:

```bash
npx serve .   # http://localhost:3000
```

(o abrir `index.html` directamente en el navegador)

## Convenciones

- Identificadores en inglés; comentarios y textos del HUD en español.
- Física basada en `dt` (segundos), clamp a 0.05 s en `loop()`.
- Una clase por entidad con `update(dt)` y `draw()`.

## Reglas de dominio / trampas conocidas

- **Sin módulos ES.** `game.js` corre como script global y comparte globales
  (`ctx`, `W`, `H`, `keys`, `state`). No uses `import`/`export` ni dividas
  en archivos sin cambiar `index.html`.
- **El tamaño del canvas está duplicado.** `W`/`H` en `game.js` (800×600) y
  los atributos del `<canvas>` en `index.html`. Cámbialos siempre en conjunto.
- **`RADII`/`SPEEDS`/`POINTS` se indexan por tamaño de asteroide (1–3);
  el índice 0 es placeholder.**
- **Las skins comparten nariz y alcance** para no alterar hitbox ni cañón.

## Forma de trabajar

- Cambios pequeños y enfocados; planifica antes solo para features completas
  (entidad o mecánica nueva).
- Al terminar, explica qué cambió y cómo verificarlo jugando.

## Límites

- ✅ Siempre: cambios en `game.js`/`index.html` siguiendo el estilo existente;
  actualizar `MEMORY.md` al terminar cada tarea.
- ⚠ Pregunta antes: dependencias nuevas, archivos nuevos, toolchain,
  cambios de balance o controles.
- 🚫 Nunca: dividir `game.js` en módulos, cambiar el tamaño del canvas por un
  solo lado, borrar `MEMORY.md` sin resumir.

## Verificación

- Manual, jugando (`npx serve .`): sin errores en consola, la feature nueva
  funciona y nada existente se rompe.

## Memoria

- Al empezar, lee `MEMORY.md`; al terminar cada tarea, actualízalo (estado,
  decisiones con porqué, errores a evitar). Máximo ~50 líneas.
- Lo que se vuelva regla permanente va a `AGENTS.md`; nunca datos sensibles.

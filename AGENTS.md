# AGENTS.md

Clon de Asteroids en canvas HTML5 puro. Todo el juego vive en `game.js` (un solo archivo), cargado por `index.html` con un `<script>` plano. Sin dependencias, bundler ni toolchain.

## Correr

No hay build. Abre `index.html` directamente en el navegador, o:

```bash
npx serve .   # http://localhost:3000
```

## Gotchas

- **Sin módulos ES.** `game.js` corre como script global y comparte globales (`ctx`, `W`, `H`, `keys`, `state`). No uses `import`/`export` ni dividas en archivos sin cambiar `index.html`.
- **El tamaño del canvas está duplicado.** `W`/`H` en `game.js` (800×600) y los atributos `width`/`height` del `<canvas>` en `index.html`. Cámbialos siempre en conjunto.
- **Sin tests, lint ni CI.** La única verificación es manual: abre el juego y juega. No agregues toolchain salvo pedido explícito.
- **El README promete features no implementadas** (power-ups, estrella fugaz). `game.js` es la fuente de verdad.

## Convenciones

- Identificadores en inglés; comentarios y textos del HUD en español.
- Física basada en `dt` (segundos), clamp a 0.05 s en `loop()`. Los arrays `RADII`/`SPEEDS`/`POINTS` se indexan por tamaño de asteroide (1–3; índice 0 es placeholder).

# MEMORY.md — Asteroids

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina
lo que ya no aporte.

## Estado actual

- Juego completo y jugable: asteroides en 3 tamaños, estrella fugaz, OVNI
  artillero, recogibles (rayo de velocidad, chevrones triple, orbe de
  escudo), escudo de energía (`Shift`), 4 skins (`C`, persisten en
  `localStorage`), 3 vidas y niveles.
- Todo en `game.js` (~1100 líneas, 9 clases).
- Sin tests, lint ni CI; verificación manual jugando.

## Decisiones (y por qué)

- Un solo `game.js` como script global (sin módulos ni toolchain):
  simplicidad ante todo en un proyecto sin dependencias.

## Aprendizajes y errores a evitar

- (vacío por ahora)

## Próximos pasos

- (vacío por ahora)

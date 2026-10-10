# MEMORY.md — Asteroids

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina
lo que ya no aporte.

## Estado actual

- Juego completo y jugable: asteroides en 3 tamaños, estrella fugaz, OVNI
  artillero, recogibles (rayo, chevrones, orbe), escudo de energía (`Shift`),
  4 skins (`C`, persisten en `localStorage`), 3 vidas y niveles.
- Modularizado en `src/` (scripts globales por sección + `entities/` con
  una clase por fichero); el orden de carga vive en `index.html`.
- `test/` espeja las carpetas de `src/` (`entities/` incluida): 79 tests.
- CI en `.github/workflows/tests.yml` corre la suite en Node 24.

## Decisiones (y por qué)

- Scripts planos sin `import`/`export`: el doble clic en `index.html`
  funciona igual (los módulos ES rompen `file://` por CORS).
- El orden de carga vive SOLO en `index.html` y `test/harness.js` lo lee
  de ahí: sin lista duplicada, juego y tests no pueden desincronizarse.
- `test/` espeja las carpetas de `src/`: los cambios futuros aterrizan en
  el sitio obvio (test de una entidad, en `test/entities/`).
- Split verbatim por secciones del `game.js` original: la concatenación de
  `src/` resultó idéntica (diff vacío), refactor con riesgo cero.

## Aprendizajes y errores a evitar

- En Node 24 `node --test test/` (directorio como argumento) NO funciona;
  usar el glob `"test/**/*.test.js"`.
- Para ver solo el resumen de la suite (tests/pass/fail):
  `node --test "test/**/*.test.js" | tail -n 12`.
- Los tests movidos a `test/entities/` requieren `'../harness'`, no
  `'./harness'`.

## Próximos pasos

- (vacío por ahora)

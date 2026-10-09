# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Los asteroides destruidos pueden soltar al azar un recogible: el **rayo de Velocidad** (amarillo, duplica el empuje de la nave durante 5 segundos) o el **orbe de escudo** (cian, recarga el escudo por completo). Ocasionalmente una **estrella fugaz** cruza la pantalla a gran velocidad: destruirla vale 200 puntos, pero chocar con ella destruye la nave. Un **OVNI artillero** aparece cada 15–25 segundos y dispara contra la nave: destruirlo vale 200 puntos y suelta un orbe de escudo garantizado. Mantén `Shift` para activar el **escudo de energía**, que bloquea cualquier peligro: con la carga llena dura 2 s, su regeneración es un mero goteo y cada nivel arranca con la carga llena — a mitad de nivel, la forma real de recargarlo es agarrando **orbes de escudo** (cian, en forma de escudo).

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla              | Acción                    |
| ------------------ | ------------------------- |
| `←` `→`            | Rotar nave                |
| `↑`                | Propulsar                 |
| `Espacio`          | Disparar                  |
| `Shift` (mantener) | Activar escudo de energía |

## Puntuación

| Objeto            | Puntos |
| ----------------- | ------ |
| Asteroide grande  | 20     |
| Asteroide mediano | 50     |
| Asteroide pequeño | 100    |
| Estrella fugaz    | 200    |
| OVNI              | 200    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- **Recogibles**: al destruir un asteroide hay 10% de probabilidad de drop, repartido al azar 50/50 entre el **rayo de Velocidad** (amarillo; duplica el empuje de la nave durante 5 segundos) y el **orbe de escudo** (cian, en forma de escudo con anillo pulsante)
- **Estrella fugaz**: aparece cada 10–20 s y cruza la pantalla a gran velocidad; vale 200 puntos, mata la nave al chocar y desaparece a los 8 s
- **OVNI artillero**: aparece cada 15–25 s (máximo uno a la vez), cruza la pantalla disparando a la nave cada 1.3 s; vale 200 puntos, sus proyectiles también destruyen asteroides (sin puntos) y al derribarlo suelta un orbe de escudo garantizado
- **Escudo de energía**: se activa manteniendo `Shift` y bloquea todo peligro (proyectiles enemigos, asteroides, estrella fugaz y OVNI, destruyéndolos sin puntos); consume 50 de energía por segundo (2 s con la carga llena), se regenera a un goteo de 1 por segundo (100 s para llenar: los orbes son la vía real de recarga), la carga persiste entre vidas y cada nivel arranca con la carga llena
- **Orbes de escudo**: recargan el escudo por completo; los sueltan las rocas destruidas (compartiendo el drop 50/50 con el rayo) y derribar el OVNI suelta una garantizada

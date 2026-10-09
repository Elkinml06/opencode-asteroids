# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Los asteroides destruidos pueden soltar power-ups: **Velocidad**, que duplica el empuje de la nave durante 5 segundos, o **Triple**, que dispara ráfagas de 3 balas en abanico hacia adelante (±14°) durante 5 segundos. Ocasionalmente una **estrella fugaz** cruza la pantalla a gran velocidad: destruirla vale 200 puntos, pero chocar con ella destruye la nave.

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

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |

## Puntuación

| Objeto            | Puntos |
| ----------------- | ------ |
| Asteroide grande  | 20     |
| Asteroide mediano | 50     |
| Asteroide pequeño | 100    |
| Estrella fugaz    | 200    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-ups: 10% de probabilidad de drop al destruir un asteroide, sorteado 50/50 entre **Velocidad** (empuje duplicado durante 5 s) y **Triple** (ráfagas de 3 balas en abanico de ±14° durante 5 s)
- **Estrella fugaz**: aparece cada 10–20 s y cruza la pantalla a gran velocidad; vale 200 puntos, mata la nave al chocar y desaparece a los 8 s

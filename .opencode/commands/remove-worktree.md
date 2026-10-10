---
description: Elimina un git worktree de .worktrees/ y su rama local; pide confirmación si el nombre no coincide literalmente.
agent: build
---

El usuario invocó `/remove-worktree` con el siguiente argumento:

$ARGUMENTS

Instrucciones:

1. Ejecuta `git worktree list` con la tool bash, sin cambiar de directorio.
2. Deriva del argumento un nombre corto en kebab-case (minúsculas, sin espacios ni acentos), con la misma lógica que `/add-new-worktree`.
3. Compara contra los worktrees existentes:
   a. Coincidencia exacta: continúa con el paso 4 sin confirmar.
   b. Sin coincidencia exacta pero existe uno claramente similar (el más parecido): NO elimines nada. Pregunta al usuario "¿Deseas eliminar el worktree <nombre> (rama <nombre>)?" y espera su respuesta. Solo si confirma, continúa con el paso 4.
   c. Ninguna coincidencia razonable: reporta que no se encontró y lista los worktrees disponibles. No ejecutes nada más.
4. Ejecuta exactamente estos comandos con la tool bash, sin cambiar de directorio y sin pasos adicionales:
   git worktree remove .worktrees/<nombre>
   git branch -d <nombre>
5. No hagas nada más: no uses `cd`, no corras otros comandos, no edites archivos, no hagas commit ni push.
6. Reporta únicamente el resultado de cada comando (stdout/stderr y código de salida). Si un comando falla, reporta el error y ejecuta el siguiente de todas formas.

---
description: Crea un worktree en .worktrees/nombre-de-rama
---
El comando ya se ejecutó. Reporta brevemente el resultado. No ejecutes ningún otro comando, no cambies de directorio, no hagas nada más.

!`name="$(echo "$1" | tr ' ' '-' | cut -c1-40 | sed 's/-*$//')"; git worktree add ".worktrees/$name" -b "$name"`

# Flujos/versiones — versiones publicadas (inmutables)

Aquí vive cada versión publicada de cada flujo, tal como se veía y funcionaba ese día.

- `<id-flujo>/v<x.y.z>/archivos/…` solo los archivos propios del flujo.
- `<id-flujo>/v<x.y.z>/manifest.json` commit, sistema de diseño usado, notas, huellas (SHA-256) y hash de recursos.
- `_recursos/<hash>/archivos/…` recursos comunes (`shared/`, vendor del DS, recursos de la plataforma) exactos de esa versión. Versiones con los mismos recursos comparten la misma carpeta.

Reglas
1. **No se edita ni se borra nada de aquí.** El build verifica las huellas y se cancela si algo cambió.
2. Una versión se crea solo con `npm run version-flujo -- <id> <x.y.z> --notas "…"` (desde `Flujos/portal/`). Un commit de desarrollo no crea versión.
3. Se congela desde un commit, no desde el disco; exige `Flujos/prototipos/` sin cambios pendientes.
4. `sitio/` y `dist/` se regeneran; este almacén no. El build nunca escribe aquí.
5. Verificar: `npm run versiones:verificar`.

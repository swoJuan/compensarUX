# Flujos/versiones — versiones publicadas (inmutables)

Aquí vive cada versión publicada de cada flujo, tal como se veía y funcionaba ese día.

- `<id-flujo>/v<x.y.z>/archivos/…` solo los archivos propios del flujo.
- `<id-flujo>/v<x.y.z>/manifest.json` commit, sistema de diseño usado, notas, huellas (SHA-256) y hash de recursos.
- `_recursos/<hash>/archivos/…` recursos comunes (`shared/`, vendor del DS, recursos de la plataforma) exactos de esa versión. Versiones con los mismos recursos comparten la misma carpeta.

Reglas
1. **No se edita ni se borra nada de aquí.** El build verifica las huellas y se cancela si algo cambió. Nunca se eliminan versiones de forma automática.
2. Una versión solo existe si el director UX la **aprobó**: `npm run version-flujo -- <id> <x.y.z> --notas "…" --aprobado-por "Nombre" --actualizar-catalogo` (desde `Flujos/portal/`). Un commit de desarrollo no crea versión; no hay una copia por commit.
3. Se congela desde un commit, no desde el disco; exige `Flujos/prototipos/` sin cambios pendientes.
4. `sitio/` y `dist/` se regeneran; este almacén no. El build nunca escribe aquí.
5. Los recursos comunes se deduplican por hash (`_recursos/`): versiones con los mismos recursos no los repiten.
6. Cada flujo nuevo se registra en `catalogo.json` (`npm run registrar-flujo`) y su historial nace con su primera versión aprobada.
7. Verificar: `npm run versiones:verificar` (integridad) y `npm run version-verificar -- <id> <x.y.z>` (aparece en el portal y abre).

Flujo habitual (lo conduce el orquestador): `npm run guardar -- estado` → `commit <flujo>` → `npm run version-propuesta -- <id>` → aprobación → `version-flujo` → `guardar commit-version <id>` → `npm run publicar` → `guardar commit sitio` → `version-verificar`. Push y despliegue son siempre aparte y requieren autorización.

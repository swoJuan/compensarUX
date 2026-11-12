# Kiro Context — Compensar (flujos)

Contexto y reglas obligatorias para trabajar en este repositorio de prototipos.

> **Antes de crear o modificar cualquier flujo, lee `AGENTS.md`** (en la raíz de este repo). Es la guía operativa obligatoria y tiene prioridad sobre este resumen.

## Sobre el proyecto

- Este proyecto corresponde a **Compensar**.
- Hay **dos repositorios separados**:
  - `Core-Design-System/` → el **Design System**, fuente de verdad visual (repo aparte).
  - `Flujos/prototipos/` → **este** repo, con los prototipos publicables.
- Este repo NO contiene el Design System: consume su distribución en `shared/vendor` y `shared/icons`.

## Reglas generales

- Antes de crear o modificar interfaces, revisar el Design System (`../../Core-Design-System/`).
- Reutilizar componentes existentes antes de crear nuevos.
- Todos los prototipos viven dentro de este repo (`flujos/`), en `zt/` o `drupal/`.
- Separar claramente ZT y Drupal.
- ZT y Drupal comparten estilos y Design System.
- Sus diferencias se mantienen en `zt/shared/` y `drupal/shared/`.
- No duplicar CSS o JS sin necesidad.
- Los estilos particulares de un flujo permanecen dentro del flujo.
- Si algo se reutiliza en varios flujos, evaluar moverlo a `shared`.
- No modificar el Design System para resolver una necesidad específica de un flujo.
- Antes de crear algo nuevo, revisar implementaciones existentes.

## Orden de precedencia visual (cascada)

```
Design System → shared global → ZT / Drupal shared → custom del flujo
```

Cada capa solo sobrescribe lo estrictamente necesario, sin duplicar código.

## Antes de crear cualquier componente, CSS o JS

Revisar en este orden y crear algo nuevo **solo** si no existe una solución reutilizable:

1. Revisar Design System (`../../Core-Design-System/`).
2. Revisar shared global (`shared/`).
3. Revisar shared de ZT o Drupal (`zt/shared/` o `drupal/shared/`).
4. Revisar otros flujos similares.
5. Crear algo nuevo únicamente si no existe una solución reutilizable.

## Recursos del Design System (regla estricta)

- Los archivos en `shared/vendor/` (`core.css`, `portal.css`) y `shared/icons/` (`icons.css`, `fonts/`) son una **copia de distribución** del Design System.
- **No deben editarse manualmente.** Se regeneran con `npm run sync-flows`.
- La fuente de verdad siempre es el repo `Core-Design-System/`.
- **Nunca** copiar `core.css`, `portal.css`, iconos o fuentes manualmente dentro de un flujo. Se consumen desde `shared`.

## Sincronización

Para actualizar la copia de distribución tras cambios en el Design System:

```bash
# si cambió el CSS del DS, compilar en su repo
cd ../../Core-Design-System && npm run build && cd -
# desde este repo (flujos/)
npm run sync-flows
```

`sync-flows` copia únicamente: `core.css`, `portal.css`, `icons.css` y `fonts/`. Busca el DS en `../../Core-Design-System` (o usa `DS_PATH=` para otra ruta).

## Hosting

- Se publica únicamente el contenido de este repo (`flujos/`).
- No subir el repo del Design System ni `node_modules/`.
- Correr `npm run sync-flows` antes de publicar.

## Cómo crear un flujo nuevo

> Requisito previo: leer `AGENTS.md` (guía operativa obligatoria).

1. Crear carpeta en `zt/<flujo>/` o `drupal/<flujo>/`.
2. Enlazar recursos con rutas relativas: `../../shared/vendor/core.css`, `../../shared/icons/icons.css`, `../../shared/css/compensar.css`, `../shared/<zt|drupal>.css` y, si aplica, `css/custom.css`.
3. Poner estilos/JS propios en `css/custom.css` y `js/custom.js` (solo si son necesarios).
4. Poner assets propios en `assets/`.
5. Reutilizar Design System + shared antes de crear nada nuevo.

## Historial

- Este repo (`flujos/`) es nuevo. Su historial arranca con "Estructura inicial de prototipos Compensar".
- El historial de los prototipos anteriores (`pruebasCompensar`, 15 commits) se conserva en la branch `history/pruebas-compensar` para consulta.
